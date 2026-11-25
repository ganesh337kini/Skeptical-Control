import asyncio
import os
import subprocess
import uuid
from datetime import datetime
from typing import Any, Dict, Optional


class WorkloadRunner:
    async def start(self, config: Dict[str, Any]) -> Dict[str, Any]:
        run_id = str(uuid.uuid4())
        process = None
        locust_path = config.get("locustfile", "/app/locust/locustfile.py")
        host = config.get("host", "http://web:80")
        users = int(config.get("users", 10))
        spawn_rate = int(config.get("spawn_rate", users))
        duration = str(config.get("duration", "60s"))

        command = ["locust", "-f", locust_path, "--headless", "-u", str(users), "-r", str(spawn_rate), "-t", duration, "--host", host, "--json"]
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            result = await asyncio.wait_for(process.communicate(), timeout=max(10, int(config.get("duration_seconds", 60)) + 30))
            output = result[0].decode("utf-8", "replace")
            error = result[1].decode("utf-8", "replace")
            status = "completed" if process.returncode == 0 else "failed"
        except (FileNotFoundError, asyncio.TimeoutError) as exc:
            status = "failed"
            output = ""
            error = str(exc)

        return {"id": run_id, "status": status, "config": config, "output": output[-5000:], "error": error[-2000:], "completed_at": datetime.utcnow().isoformat() + "Z"}


class ToxiproxyController:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("TOXIPROXY_URL", "http://toxiproxy:8474")

    async def apply(self, fault: Dict[str, Any]) -> Dict[str, Any]:
        import aiohttp
        proxy_name = fault["target_service"]
        fault_type = fault["fault_type"]
        intensity = int(fault.get("intensity", 100))
        toxics = {"latency": {"name": "latency", "type": "latency", "attributes": {"latency": intensity, "jitter": int(fault.get("jitter_ms", 0))}}, "timeout": {"name": "timeout", "type": "timeout", "attributes": {"timeout": intensity}}, "bandwidth": {"name": "bandwidth", "type": "bandwidth", "attributes": {"rate": max(1, intensity)}}, "reset_peer": {"name": "reset_peer", "type": "reset_peer", "attributes": {"timeout": intensity}}, "limit_data": {"name": "limit_data", "type": "limit_data", "attributes": {"bytes": intensity}}}
        toxic = toxics.get(fault_type, toxics["latency"])
        async with aiohttp.ClientSession() as session:
            upstream = fault.get("upstream") or f"{proxy_name}:80"
            proxy_payload = {"name": proxy_name, "listen": "0.0.0.0:22220", "upstream": upstream, "enabled": True}
            async with session.post(f"{self.base_url}/proxies", json=proxy_payload) as response:
                if response.status not in (200, 201, 409):
                    body = await response.text()
                    raise RuntimeError(f"Could not ensure Toxiproxy proxy {proxy_name}: {response.status}: {body}")
            async with session.post(f"{self.base_url}/proxies/{proxy_name}/toxics", json=toxic) as response:
                body = await response.text()
                if response.status not in (200, 201):
                    raise RuntimeError(f"Toxiproxy returned {response.status}: {body}")
                return await response.json()

    async def remove(self, target_service: str, fault_type: str) -> Dict[str, Any]:
        import aiohttp
        name = {"latency": "latency", "timeout": "timeout", "bandwidth": "bandwidth", "reset_peer": "reset_peer", "limit_data": "limit_data"}.get(fault_type, fault_type)
        async with aiohttp.ClientSession() as session:
            async with session.delete(f"{self.base_url}/proxies/{target_service}/toxics/{name}") as response:
                body = await response.text()
                return {"status": response.status, "target": target_service, "toxic": name, "response": body}
