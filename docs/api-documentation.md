# API Documentation

## Base URL

```
http://localhost:3001/api
```

## Phase 2 Experiment API

All Phase 2 routes are available through the backend proxy at `/api/research` and require authentication.

- `POST /api/research/experiments` — create an experiment linked to a project and optional project version/environment.
- `GET /api/research/experiments` — list experiment metadata.
- `GET /api/research/experiments/:id` — retrieve experiment state, timeline, telemetry references, faults, RCA, and rankings.
- `POST /api/research/experiments/:id/workloads` — start a repeatable Locust workload configuration.
- `POST /api/research/experiments/:id/faults` — inject a Toxiproxy fault; the response includes separate known ground truth with target, type, intensity, start/end time, and status.
- `POST /api/research/experiments/:id/faults/:faultIndex/cleanup` — remove a fault toxic immediately.
- `POST /api/research/experiments/:id/telemetry` — store telemetry and external telemetry references.
- `POST /api/research/experiments/:id/baseline` — store healthy baseline data.
- `POST /api/research/experiments/:id/logs` — append execution logs.
- `POST /api/research/experiments/:id/rca` — run the explainable baseline RCA engine.
- `POST /api/research/experiments/:id/priorities` — rank affected services separately from RCA confidence.
- `POST /api/research/experiments/:id/reset` — clean active faults and mark the environment reset.

RCA request fields: `metrics`, `logs`, `traces`, `services`, and `dependencies`. The RCA response provides ranked suspects, evidence, uncertainty, impacted services, supporting traces, and alternative hypotheses. The returned score is explicitly a relative hypothesis weight, not a calibrated probability.

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400` - Validation error (invalid email, short password)
- `409` - Email already registered

#### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

### Projects

#### GET /projects

List all projects for the authenticated user.

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "My Project",
      "description": "A microservices application",
      "status": "uploaded",
      "upload_path": "/uploads/file.zip",
      "file_size": 1048576,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /projects/:id

Get details of a specific project.

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Project",
    "description": "A microservices application",
    "status": "uploaded",
    "upload_path": "/uploads/file.zip",
    "file_size": 1048576,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - Access denied

#### POST /projects/upload

Upload a new project ZIP file.

**Request:** `multipart/form-data`
- `file`: ZIP file (max 100MB)
- `name`: Project name
- `description`: Project description (optional)

**Response (201):**
```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Project",
    "description": "A microservices application",
    "status": "uploaded",
    "upload_path": "/uploads/file.zip",
    "file_size": 1048576,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Validation error (invalid file, missing name)
- `403` - Access denied

#### DELETE /projects/:id

Delete a project.

**Response (204):** No content

**Errors:**
- `404` - Project not found
- `403` - Access denied

### Environments

#### POST /environments/:projectId/start

Start a Docker environment for a project.

**Response (201):**
```json
{
  "environment": {
    "id": "uuid",
    "project_id": "uuid",
    "project_version_id": null,
    "status": "running",
    "workspace_path": "/workspaces/project-id",
    "docker_compose_project": "skeptical-project-abc123",
    "container_ids": {
      "web": "container-id-1",
      "db": "container-id-2"
    },
    "resource_limits": {
      "cpu": "2",
      "memory": "2g",
      "time_limit": 300
    },
    "started_at": "2024-01-01T00:00:00Z",
    "stopped_at": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - Access denied
- `500` - Failed to start environment

#### GET /environments/:projectId/status

Get the status of a project's environment.

**Response (200):**
```json
{
  "environment": {
    "id": "uuid",
    "status": "running",
    ...
  },
  "liveStatus": {
    "environment_id": "skeptical-project-abc123",
    "status": "running",
    "containers": [
      {
        "name": "web",
        "id": "container-id-1",
        "status": "running",
        "state": { ... }
      },
      {
        "name": "db",
        "id": "container-id-2",
        "status": "running",
        "state": { ... }
      }
    ]
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - Access denied

#### POST /environments/:projectId/stop

Stop a running environment.

**Response (200):**
```json
{
  "environment": {
    "id": "uuid",
    "status": "stopped",
    "stopped_at": "2024-01-01T00:00:00Z",
    ...
  }
}
```

**Errors:**
- `404` - Project or environment not found
- `403` - Access denied
- `500` - Failed to stop environment

#### GET /environments/:projectId/logs

Get logs from an environment.

**Query Parameters:**
- `service_name` (optional): Filter logs by service name

**Response (200):**
```json
{
  "environment_id": "skeptical-project-abc123",
  "logs": {
    "web": "log line 1\nlog line 2\n...",
    "db": "log line 1\nlog line 2\n..."
  }
}
```

**Errors:**
- `404` - Project or environment not found
- `403` - Access denied

## Research Engine API

The research engine runs on port 8000 and provides internal APIs for project inspection and Docker orchestration.

### POST /api/projects/inspect

Inspect a project ZIP file.

**Request Body:**
```json
{
  "project_id": "uuid",
  "upload_path": "/uploads/file.zip"
}
```

**Response:**
```json
{
  "project_id": "uuid",
  "workspace_path": "/workspaces/project-id",
  "is_valid": true,
  "detected_services": [...],
  "dependencies": [...],
  "docker_compose_content": {...},
  "validation_errors": null
}
```

### POST /api/environments/start

Start a Docker environment.

**Request Body:**
```json
{
  "project_id": "uuid",
  "upload_path": "/uploads/file.zip"
}
```

**Response:**
```json
{
  "environment_id": "skeptical-project-abc123",
  "workspace_path": "/workspaces/project-id",
  "docker_compose_project": "skeptical-project-abc123",
  "container_ids": {...},
  "resource_limits": {...},
  "status": "running"
}
```

### GET /api/environments/:environmentId/status

Get environment status.

**Response:**
```json
{
  "environment_id": "skeptical-project-abc123",
  "status": "running",
  "containers": [...]
}
```

### POST /api/environments/:environmentId/stop

Stop an environment.

**Response:**
```json
{
  "environment_id": "skeptical-project-abc123",
  "status": "stopped"
}
```

### GET /api/environments/:environmentId/logs

Get environment logs.

**Query Parameters:**
- `service_name` (optional): Filter by service

**Response:**
```json
{
  "environment_id": "skeptical-project-abc123",
  "logs": {
    "service_name": "log output..."
  }
}
```
