from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os
import asyncio
from pathlib import Path
from typing import Optional

from src.services.inspector import ProjectInspector
from prometheus_client import make_asgi_app
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from src.services.orchestrator import DockerOrchestrator
from src.services.experiment_store import ExperimentStore
from src.services.rca import ExplainableRCA
from src.services.service_priority import ServicePriority
from src.services.experimentation import WorkloadRunner, ToxiproxyController


class InspectRequest(BaseModel):
    project_id: str
    upload_path: str


class StartEnvironmentRequest(BaseModel):
    project_id: str
    upload_path: str


class CreateExperimentRequest(BaseModel):
    project_id: str
    project_version: Optional[str] = None
    environment_id: Optional[str] = None
    name: str = "Untitled experiment"


class WorkloadRequest(BaseModel):
    users: int = 10
    spawn_rate: int = 10
    duration: str = "60s"
    duration_seconds: int = 60
    host: str = "http://web:80"
    endpoint_selection: list[str] = ["/"]
    profile: str = "baseline"
    locustfile: str = "/app/locust/locustfile.py"


class FaultRequest(BaseModel):
    target_service: str
    fault_type: str
    intensity: int
    duration_seconds: int = 60
    jitter_ms: int = 0


class RCARequest(BaseModel):
    metrics: dict = {}
    logs: list = []
    traces: list = []
    services: list = []
    dependencies: list = []


class PriorityRequest(BaseModel):
    affected_services: list
    business_criticality: dict = {}
    dependency_impact: dict = {}
    failure_severity: dict = {}
    urgency: dict = {}

WORKSPACE_DIR = Path(os.getenv('WORKSPACE_DIR', '/app/workspaces'))
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', '/app/uploads'))

# Create directories if they don't exist
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

inspector = ProjectInspector(UPLOAD_DIR, WORKSPACE_DIR)
orchestrator = DockerOrchestrator(WORKSPACE_DIR)
experiment_store = ExperimentStore()
rca_engine = ExplainableRCA()
priority_engine = ServicePriority()
workload_runner = WorkloadRunner()
toxiproxy = ToxiproxyController()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Research engine starting up...")
    yield
    # Shutdown
    print("Research engine shutting down...")


app = FastAPI(
    title="Skeptical Control Research Engine",
    description="Project inspection and Docker orchestration service",
    version="1.0.0",
    lifespan=lifespan
)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
FastAPIInstrumentor.instrument_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "research-engine"}


@app.post("/api/projects/inspect")
async def inspect_project(request: InspectRequest):
    try:
        result = await inspector.inspect(request.project_id, request.upload_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/environments/start")
async def start_environment(request: StartEnvironmentRequest):
    try:
        result = await orchestrator.start_environment(request.project_id, request.upload_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/environments/{environment_id}/status")
async def get_environment_status(environment_id: str):
    try:
        status = await orchestrator.get_status(environment_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/environments/{environment_id}/stop")
async def stop_environment(environment_id: str):
    try:
        result = await orchestrator.stop_environment(environment_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/environments/{environment_id}/logs")
async def get_environment_logs(environment_id: str, service_name: Optional[str] = None):
    try:
        logs = await orchestrator.get_logs(environment_id, service_name)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/experiments")
async def create_experiment(request: CreateExperimentRequest):
    return experiment_store.create(request.model_dump())


@app.get("/api/experiments")
async def list_experiments():
    return {"experiments": experiment_store.list()}


@app.get("/api/experiments/{experiment_id}")
async def get_experiment(experiment_id: str):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@app.post("/api/experiments/{experiment_id}/workloads")
async def start_workload(experiment_id: str, request: WorkloadRequest):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    result = await workload_runner.start(request.model_dump())

    def mutate(exp):
        exp["workloads"].append(result)
        exp["timeline"].append({"at": result["completed_at"], "event": "workload_completed", "details": result["config"]})
        exp["status"] = "running"
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/faults")
async def inject_fault(experiment_id: str, request: FaultRequest):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    from datetime import datetime, timedelta
    started = datetime.utcnow()
    ended = started + timedelta(seconds=request.duration_seconds)
    ground_truth = {
        "target_service": request.target_service,
        "fault_type": request.fault_type,
        "intensity": request.intensity,
        "duration_seconds": request.duration_seconds,
        "start_time": started.isoformat() + "Z",
        "end_time": ended.isoformat() + "Z",
        "ground_truth": "injected",
    }

    try:
        proxy_result = await toxiproxy.apply(request.model_dump() | {"ground_truth": ground_truth})
        status = "active"
        error = None
    except Exception as exc:
        proxy_result = None
        status = "failed"
        error = str(exc)

    async def auto_cleanup():
        await asyncio.sleep(request.duration_seconds)
        if status != "active":
            return
        try:
            await toxiproxy.remove(request.target_service, request.fault_type)

            def finish(exp):
                for fault in exp["faults"]:
                    if fault.get("start_time") == ground_truth["start_time"]:
                        fault["status"] = "cleaned"
                        fault["actual_end_time"] = datetime.utcnow().isoformat() + "Z"
                        fault["cleanup"] = {"source": "automatic_duration_cleanup"}
                exp["status"] = "reset"
                exp["timeline"].append({"at": datetime.utcnow().isoformat() + "Z", "event": "fault_auto_cleaned"})
                return exp

            experiment_store.update(experiment_id, finish)
        except Exception:
            pass

    if status == "active":
        asyncio.create_task(auto_cleanup())

    ground_truth["status"] = status
    ground_truth["toxiproxy_response"] = proxy_result
    ground_truth["error"] = error

    def mutate(exp):
        exp["faults"].append(ground_truth)
        exp["timeline"].append({"at": ground_truth["start_time"], "event": "fault_injected", "details": ground_truth})
        exp["status"] = "fault_active" if status == "active" else "fault_failed"
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/faults/{fault_index}/cleanup")
async def cleanup_fault(experiment_id: str, fault_index: int):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if fault_index < 0 or fault_index >= len(experiment["faults"]):
        raise HTTPException(status_code=404, detail="Fault not found")

    fault = experiment["faults"][fault_index]
    cleanup = await toxiproxy.remove(fault["target_service"], fault["fault_type"])

    def mutate(exp):
        exp["faults"][fault_index]["status"] = "cleaned"
        exp["faults"][fault_index]["cleanup"] = cleanup
        exp["faults"][fault_index]["actual_end_time"] = datetime.utcnow().isoformat() + "Z"
        exp["timeline"].append({"at": datetime.utcnow().isoformat() + "Z", "event": "fault_cleaned", "details": cleanup})
        exp["status"] = "recovering"
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/telemetry")
async def record_telemetry(experiment_id: str, payload: dict):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    def mutate(exp):
        reference = payload.get("reference")
        exp["telemetry_references"].append(reference) if reference else None
        exp["telemetry"].append(payload)
        exp["timeline"].append({"at": payload.get("captured_at", datetime.utcnow().isoformat() + "Z"), "event": "telemetry_recorded"})
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/baseline")
async def record_baseline(experiment_id: str, payload: dict):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    def mutate(exp):
        exp["baseline"] = payload
        exp["timeline"].append({"at": payload.get("captured_at", datetime.utcnow().isoformat() + "Z"), "event": "baseline_recorded"})
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/logs")
async def record_execution_log(experiment_id: str, payload: dict):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    def mutate(exp):
        exp["logs"].append(payload)
        exp["timeline"].append({"at": payload.get("timestamp", datetime.utcnow().isoformat() + "Z"), "event": "execution_log", "details": payload})
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/rca")
async def run_rca(experiment_id: str, request: RCARequest):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    result = rca_engine.analyze(request.model_dump())

    def mutate(exp):
        exp["rca"] = result
        exp["timeline"].append({"at": datetime.utcnow().isoformat() + "Z", "event": "rca_completed", "details": {"top_suspect": result["top_suspect"]}})
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/priorities")
async def rank_priorities(experiment_id: str, request: PriorityRequest):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    result = priority_engine.rank(request.model_dump())

    def mutate(exp):
        exp["service_rankings"] = result
        exp["timeline"].append({"at": datetime.utcnow().isoformat() + "Z", "event": "service_priorities_completed"})
        return exp

    return experiment_store.update(experiment_id, mutate)


@app.post("/api/experiments/{experiment_id}/reset")
async def reset_experiment(experiment_id: str):
    experiment = experiment_store.get(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    cleanup = []
    for fault in experiment.get("faults", []):
        if fault.get("status") == "active":
            cleanup.append(await toxiproxy.remove(fault["target_service"], fault["fault_type"]))

    def mutate(exp):
        for fault in exp["faults"]:
            fault["status"] = "cleaned"
        exp["status"] = "reset"
        exp["timeline"].append({"at": datetime.utcnow().isoformat() + "Z", "event": "environment_reset", "details": {"cleanup": cleanup}})
        return exp

    return experiment_store.update(experiment_id, mutate)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
