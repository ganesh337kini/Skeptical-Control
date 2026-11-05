from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os
from pathlib import Path
from typing import Optional

from src.services.inspector import ProjectInspector
from src.services.orchestrator import DockerOrchestrator


class InspectRequest(BaseModel):
    project_id: str
    upload_path: str


class StartEnvironmentRequest(BaseModel):
    project_id: str
    upload_path: str

WORKSPACE_DIR = Path(os.getenv('WORKSPACE_DIR', '/app/workspaces'))
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', '/app/uploads'))

# Create directories if they don't exist
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

inspector = ProjectInspector(UPLOAD_DIR, WORKSPACE_DIR)
orchestrator = DockerOrchestrator(WORKSPACE_DIR)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
