import docker
import os
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid


class DockerOrchestrator:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir
        self._docker_client = None
        self.cpu_limit = os.getenv('DOCKER_CPU_LIMIT', '2')
        self.memory_limit = os.getenv('DOCKER_MEMORY_LIMIT', '2g')
        self.time_limit = int(os.getenv('DOCKER_TIME_LIMIT', '300'))  # 5 minutes

    @property
    def docker_client(self):
        """Connect to Docker lazily so inspection works without a Docker daemon."""
        if self._docker_client is None:
            self._docker_client = docker.from_env()
        return self._docker_client

    async def start_environment(self, project_id: str, upload_path: str) -> Dict[str, Any]:
        """
        Start a Docker environment for the project.
        """
        workspace_path = self.workspace_dir / project_id
        if not workspace_path.exists():
            raise ValueError(f"Workspace not found: {workspace_path}")

        # Generate unique compose project name
        compose_project = f"skeptical-{project_id[:8]}-{uuid.uuid4().hex[:8]}"

        # Find docker-compose file
        compose_file = self._find_docker_compose(workspace_path)
        if not compose_file:
            raise ValueError("No docker-compose file found")

        # Apply resource limits to docker-compose
        modified_compose = self._apply_resource_limits(compose_file, compose_project)

        # Start containers
        try:
            result = subprocess.run(
                ['docker-compose', '-f', str(modified_compose), '-p', compose_project, 'up', '-d'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=self.time_limit
            )

            if result.returncode != 0:
                raise RuntimeError(f"Failed to start containers: {result.stderr}")

            # Get container IDs
            containers = self._get_containers(compose_project)

            return {
                "environment_id": compose_project,
                "workspace_path": str(workspace_path),
                "docker_compose_project": compose_project,
                "container_ids": containers,
                "resource_limits": {
                    "cpu": self.cpu_limit,
                    "memory": self.memory_limit,
                    "time_limit": self.time_limit
                },
                "status": "running"
            }

        except subprocess.TimeoutExpired:
            self._cleanup_compose_project(compose_project)
            raise RuntimeError(f"Environment start timed out after {self.time_limit} seconds")
        except Exception as e:
            self._cleanup_compose_project(compose_project)
            raise RuntimeError(f"Failed to start environment: {str(e)}")

    async def get_status(self, environment_id: str) -> Dict[str, Any]:
        """
        Get the status of an environment.
        """
        try:
            containers = self._get_containers(environment_id)
            container_statuses = []

            for container_name, container_id in containers.items():
                try:
                    container = self.docker_client.containers.get(container_id)
                    container_statuses.append({
                        "name": container_name,
                        "id": container_id,
                        "status": container.status,
                        "state": container.attrs['State']
                    })
                except docker.errors.NotFound:
                    container_statuses.append({
                        "name": container_name,
                        "id": container_id,
                        "status": "not_found",
                        "state": None
                    })

            return {
                "environment_id": environment_id,
                "status": "running" if container_statuses else "stopped",
                "containers": container_statuses
            }

        except Exception as e:
            return {
                "environment_id": environment_id,
                "status": "error",
                "error": str(e)
            }

    async def stop_environment(self, environment_id: str) -> Dict[str, Any]:
        """
        Stop an environment.
        """
        try:
            result = subprocess.run(
                ['docker-compose', '-p', environment_id, 'down'],
                cwd=self.workspace_dir,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                raise RuntimeError(f"Failed to stop containers: {result.stderr}")

            return {
                "environment_id": environment_id,
                "status": "stopped"
            }

        except Exception as e:
            raise RuntimeError(f"Failed to stop environment: {str(e)}")

    async def get_logs(self, environment_id: str, service_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get logs from an environment.
        """
        try:
            containers = self._get_containers(environment_id)
            logs = {}

            for container_name, container_id in containers.items():
                if service_name and container_name != service_name:
                    continue

                try:
                    container = self.docker_client.containers.get(container_id)
                    log_output = container.logs(tail=100, timestamps=True).decode('utf-8')
                    logs[container_name] = log_output
                except docker.errors.NotFound:
                    logs[container_name] = "Container not found"

            return {
                "environment_id": environment_id,
                "logs": logs
            }

        except Exception as e:
            raise RuntimeError(f"Failed to get logs: {str(e)}")

    def _find_docker_compose(self, workspace_path: Path) -> Optional[Path]:
        """
        Find docker-compose file in workspace.
        """
        for name in ['docker-compose.yml', 'docker-compose.yaml']:
            path = workspace_path / name
            if path.exists():
                return path
        return None

    def _apply_resource_limits(self, compose_file: Path, project_name: str) -> Path:
        """
        Apply resource limits to docker-compose file.
        Note: For Docker Compose v2/v3, resource limits are set via deploy.resources.
        These work in Docker Swarm mode or with Docker Compose v2+.
        """
        import yaml

        with open(compose_file, 'r') as f:
            compose_data = yaml.safe_load(f)

        if 'services' in compose_data:
            for service_name, service_config in compose_data['services'].items():
                # Add deploy resources for resource limiting
                if 'deploy' not in service_config:
                    service_config['deploy'] = {}
                service_config['deploy']['resources'] = {
                    'limits': {
                        'cpus': self.cpu_limit,
                        'memory': self.memory_limit
                    }
                }
                # Also add mem_limit for older Docker Compose versions
                service_config['mem_limit'] = self.memory_limit
                service_config['cpus'] = float(self.cpu_limit)

        # Write modified compose file
        modified_file = compose_file.parent / f'docker-compose-{project_name}.yml'
        with open(modified_file, 'w') as f:
            yaml.dump(compose_data, f, default_flow_style=False)

        return modified_file

    def _get_containers(self, compose_project: str) -> Dict[str, str]:
        """
        Get container IDs for a compose project.
        """
        containers = {}
        try:
            result = subprocess.run(
                ['docker-compose', '-p', compose_project, 'ps', '-q'],
                cwd=self.workspace_dir,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                container_ids = result.stdout.strip().split('\n')
                for i, container_id in enumerate(container_ids):
                    if container_id:
                        try:
                            container = self.docker_client.containers.get(container_id)
                            name = container.name.replace(f'{compose_project}_', '').replace('_1', '')
                            containers[name] = container_id
                        except docker.errors.NotFound:
                            pass

        except Exception as e:
            print(f"Error getting containers: {e}")

        return containers

    def _cleanup_compose_project(self, compose_project: str):
        """
        Cleanup a compose project if it fails to start.
        """
        try:
            subprocess.run(
                ['docker-compose', '-p', compose_project, 'down', '-v'],
                cwd=self.workspace_dir,
                capture_output=True,
                timeout=60
            )
        except Exception as e:
            print(f"Error during cleanup: {e}")
