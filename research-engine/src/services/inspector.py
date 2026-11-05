import zipfile
import yaml
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import shutil


class ProjectInspector:
    def __init__(self, upload_dir: Path, workspace_dir: Path):
        self.upload_dir = upload_dir
        self.workspace_dir = workspace_dir
        self.max_upload_size = int(os.getenv('MAX_UPLOAD_SIZE', '104857600'))  # 100MB
        self.max_extracted_size = int(os.getenv('MAX_EXTRACTED_SIZE', '524288000'))  # 500MB

    async def inspect(self, project_id: str, upload_path: str) -> Dict[str, Any]:
        """
        Inspect a project ZIP file and extract service topology.
        """
        # Validate upload path
        full_upload_path = self.upload_dir / upload_path
        if not full_upload_path.exists():
            raise ValueError(f"Upload file not found: {upload_path}")

        # Validate file size
        file_size = full_upload_path.stat().st_size
        if file_size > self.max_upload_size:
            raise ValueError(f"File too large: {file_size} bytes (max {self.max_upload_size})")

        # Extract to workspace
        workspace_path = self.workspace_dir / project_id
        if workspace_path.exists():
            shutil.rmtree(workspace_path)
        workspace_path.mkdir(parents=True, exist_ok=True)

        try:
            self._extract_zip_safe(full_upload_path, workspace_path)
        except Exception as e:
            shutil.rmtree(workspace_path, ignore_errors=True)
            raise ValueError(f"Failed to extract ZIP: {str(e)}")

        # Find docker-compose files
        compose_files = self._find_docker_compose_files(workspace_path)
        if not compose_files:
            shutil.rmtree(workspace_path, ignore_errors=True)
            raise ValueError("No docker-compose.yml or docker-compose.yaml file found")

        # Parse docker-compose files
        compose_data = self._parse_docker_compose(compose_files[0])

        # Extract service topology
        services = self._extract_services(compose_data)
        dependencies = self._extract_dependencies(compose_data)

        result = {
            "project_id": project_id,
            "workspace_path": str(workspace_path),
            "is_valid": True,
            "detected_services": services,
            "dependencies": dependencies,
            "docker_compose_content": compose_data,
            "validation_errors": None
        }

        return result

    def _extract_zip_safe(self, zip_path: Path, extract_dir: Path):
        """
        Safely extract ZIP file with path traversal and ZIP bomb protection.
        """
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for ZIP bomb
            total_size = sum(file.file_size for file in zip_ref.filelist)
            if total_size > self.max_extracted_size:
                raise ValueError(f"Extracted size too large: {total_size} bytes")

            # Extract with path traversal protection
            for member in zip_ref.filelist:
                # Check for path traversal
                member_path = Path(member.filename)
                if member_path.is_absolute() or '..' in member_path.parts:
                    raise ValueError(f"Path traversal attempt detected: {member.filename}")

                # Extract
                zip_ref.extract(member, extract_dir)

    def _find_docker_compose_files(self, workspace_path: Path) -> List[Path]:
        """
        Find docker-compose files in the workspace.
        """
        compose_files = []
        for name in ['docker-compose.yml', 'docker-compose.yaml']:
            path = workspace_path / name
            if path.exists():
                compose_files.append(path)
        return compose_files

    def _parse_docker_compose(self, compose_file: Path) -> Dict[str, Any]:
        """
        Parse docker-compose file (supports v2, v3, v3.8+).
        """
        with open(compose_file, 'r') as f:
            data = yaml.safe_load(f)
        return data

    def _extract_services(self, compose_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract service information from docker-compose data.
        """
        services = []
        if 'services' not in compose_data:
            return services

        for service_name, service_config in compose_data['services'].items():
            service = {
                "name": service_name,
                "image": service_config.get('image'),
                "ports": service_config.get('ports', []),
                "networks": service_config.get('networks', []),
                "volumes": service_config.get('volumes', []),
                "environment": service_config.get('environment', {}),
                "depends_on": service_config.get('depends_on', []),
                "service_type": self._determine_service_type(service_config)
            }
            services.append(service)

        return services

    def _determine_service_type(self, service_config: Dict[str, Any]) -> str:
        """
        Determine the type of service (web, database, cache, etc.).
        """
        image = service_config.get('image', '').lower()
        service_name = service_config.get('container_name', '').lower()

        if any(db in image for db in ['postgres', 'mysql', 'mongodb', 'redis', 'sqlite']):
            if 'postgres' in image or 'mysql' in image or 'mongodb' in image or 'sqlite' in image:
                return 'database'
            elif 'redis' in image:
                return 'cache'
        if 'nginx' in image or 'apache' in image or 'caddy' in image:
            return 'proxy'
        if 'rabbitmq' in image or 'kafka' in image:
            return 'message_queue'

        return 'application'

    def _extract_dependencies(self, compose_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Extract dependency relationships between services.
        """
        dependencies = []
        if 'services' not in compose_data:
            return dependencies

        for service_name, service_config in compose_data['services'].items():
            depends_on = service_config.get('depends_on', [])
            if isinstance(depends_on, str):
                depends_on = [depends_on]

            for dep in depends_on:
                dependencies.append({
                    "from": service_name,
                    "to": dep,
                    "type": "depends_on"
                })

        return dependencies
