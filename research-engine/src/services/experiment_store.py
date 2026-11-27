import json
import os
import threading
import uuid
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


class ExperimentStore:
    def __init__(self, directory: Optional[Path] = None):
        self.directory = directory or Path(os.getenv("EXPERIMENT_STORE_DIR", "/tmp/skeptical-experiments"))
        self.directory.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def _utcnow(self) -> str:
        return datetime.utcnow().isoformat() + "Z"

    def _experiment_path(self, experiment_id: str) -> Path:
        return self.directory / f"{experiment_id}.json"

    def create(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        experiment_id = payload.get("id") or str(uuid.uuid4())
        experiment = {
            "id": experiment_id,
            "project_id": payload["project_id"],
            "project_version": payload.get("project_version"),
            "environment_id": payload.get("environment_id"),
            "name": payload.get("name", "Untitled experiment"),
            "status": "created",
            "created_at": self._utcnow(),
            "updated_at": self._utcnow(),
            "workloads": [],
            "faults": [],
            "telemetry": [],
            "telemetry_references": [],
            "logs": [],
            "timeline": [{"at": self._utcnow(), "event": "experiment_created"}],
            "baseline": None,
            "rca": None,
            "service_rankings": [],
        }
        with self._lock:
            self._experiment_path(experiment_id).write_text(json.dumps(experiment, indent=2), encoding="utf-8")
        return deepcopy(experiment)

    def get(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        path = self._experiment_path(experiment_id)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def update(self, experiment_id: str, mutator) -> Dict[str, Any]:
        with self._lock:
            experiment = self.get(experiment_id)
            if experiment is None:
                raise KeyError(experiment_id)
            experiment = mutator(experiment)
            experiment["updated_at"] = self._utcnow()
            self._experiment_path(experiment_id).write_text(json.dumps(experiment, indent=2), encoding="utf-8")
            return deepcopy(experiment)

    def list(self) -> list:
        experiments = []
        for path in sorted(self.directory.glob("*.json"), reverse=True):
            try:
                experiments.append(json.loads(path.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                continue
        return experiments
