# Sample Microservices Project

A simple microservices application for testing Skeptical Control.

## Architecture

This project consists of two services:

1. **Web Service** - A simple Node.js/Express application
2. **Database** - PostgreSQL database

## Services

### Web Service
- Exposes HTTP endpoints on port 3000
- Connects to PostgreSQL database
- Provides health check and data endpoints

### Database
- PostgreSQL 15
- Persists data in a Docker volume
- Accessible within the isolated network

## Expected Topology

```
┌─────────────┐
│   Web       │
│  (Node.js)  │
└──────┬──────┘
       │
       │ depends_on
       │
┌──────▼──────┐
│  Database   │
│ (PostgreSQL)│
└─────────────┘
```

## Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with database connectivity
- `GET /api/data` - Query database for current time

## Testing

After uploading to Skeptical Control and starting the environment:

1. Verify both containers are running
2. Check the service topology visualization
3. Access the web service logs
4. Verify resource limits are applied

## Resource Limits

- CPU: 2 cores per service
- Memory: 2GB per service
- Time limit: 5 minutes for environment startup
