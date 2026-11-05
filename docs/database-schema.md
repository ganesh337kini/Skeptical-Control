# Database Schema

## Overview

Skeptical Control uses PostgreSQL as its primary database. The schema is designed to support user authentication, project management, environment orchestration, and activity tracking.

## Tables

### users

Stores user account information for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique user identifier |
| email | varchar(255) | UNIQUE, NOT NULL | User email address |
| password_hash | varchar(255) | NOT NULL | Bcrypt hashed password |
| name | varchar(255) | NOT NULL | User display name |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

### projects

Stores uploaded microservices project metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique project identifier |
| user_id | uuid | FOREIGN KEY (users), NOT NULL | Project owner |
| name | varchar(255) | NOT NULL | Project name |
| description | text | | Project description |
| status | varchar(50) | NOT NULL, DEFAULT 'uploaded' | Project status (uploaded, inspected, error) |
| upload_path | varchar(255) | NOT NULL | Path to uploaded ZIP file |
| file_size | bigint | NOT NULL | Size of uploaded file in bytes |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Upload timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

### project_versions

Stores versioned inspection results for projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique version identifier |
| project_id | uuid | FOREIGN KEY (projects), NOT NULL | Parent project |
| version_number | integer | NOT NULL | Sequential version number |
| inspection_data | jsonb | | Full inspection results |
| docker_compose_content | text | | Raw docker-compose file content |
| detected_services | jsonb | | Extracted service information |
| dependencies | jsonb | | Service dependency graph |
| is_valid | boolean | NOT NULL, DEFAULT false | Whether configuration is valid |
| validation_errors | jsonb | | Validation error messages |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Version creation timestamp |

### environments

Stores Docker environment instances for projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique environment identifier |
| project_id | uuid | FOREIGN KEY (projects), NOT NULL | Parent project |
| project_version_id | uuid | FOREIGN KEY (project_versions) | Project version used |
| status | varchar(50) | NOT NULL, DEFAULT 'stopped' | Environment status (running, stopped, error) |
| workspace_path | varchar(255) | | Path to extracted workspace |
| docker_compose_project | varchar(255) | | Docker Compose project name |
| container_ids | jsonb | | Mapping of service names to container IDs |
| resource_limits | jsonb | | Applied resource limits |
| started_at | timestamp | | Environment start timestamp |
| stopped_at | timestamp | | Environment stop timestamp |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Environment creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

### service_metadata

Stores runtime metadata for services in environments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique metadata identifier |
| environment_id | uuid | FOREIGN KEY (environments), NOT NULL | Parent environment |
| service_name | varchar(255) | NOT NULL | Service name |
| service_type | varchar(50) | NOT NULL | Service type (application, database, cache, proxy) |
| image | varchar(255) | | Docker image used |
| ports | jsonb | | Exposed ports |
| networks | jsonb | | Network configuration |
| volumes | jsonb | | Volume mounts |
| depends_on | jsonb | | Service dependencies |
| status | varchar(50) | NOT NULL, DEFAULT 'unknown' | Runtime status |
| container_id | varchar(255) | | Docker container ID |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Metadata creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

### activity_history

Audit log for user actions and system events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique activity identifier |
| user_id | uuid | FOREIGN KEY (users), NOT NULL | User who performed action |
| project_id | uuid | FOREIGN KEY (projects) | Related project |
| environment_id | uuid | FOREIGN KEY (environments) | Related environment |
| action_type | varchar(100) | NOT NULL | Type of action (upload, start, stop, etc.) |
| action_details | jsonb | | Additional action context |
| status | varchar(50) | NOT NULL, DEFAULT 'completed' | Action result status |
| error_message | text | | Error message if failed |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Action timestamp |

## Indexes

- `users.email` - UNIQUE index for email lookups
- `projects.user_id` - Index for user's projects
- `projects.status` - Index for status filtering
- `project_versions.project_id` - Index for project versions
- `project_versions.(project_id, version_number)` - UNIQUE composite index
- `environments.project_id` - Index for project environments
- `environments.status` - Index for status filtering
- `service_metadata.environment_id` - Index for environment services
- `service_metadata.(environment_id, service_name)` - UNIQUE composite index
- `activity_history.user_id` - Index for user activities
- `activity_history.project_id` - Index for project activities
- `activity_history.created_at` - Index for chronological queries

## Migrations

Database migrations are managed using `node-pg-migrate`. Migration files are located in `backend/src/migrations/`.

To run migrations:
```bash
cd backend
npm run migrate:up
```

To rollback:
```bash
npm run migrate:down
```
