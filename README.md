# Skeptical Control

A research-oriented platform for analyzing microservices applications, reproducing failures in isolated environments, identifying possible root causes, and experimentally testing bounded, reversible mitigations.

## Core Principle

"Never blindly trust an RCA prediction. Treat it as a hypothesis, test it through a safe intervention, observe the result, update the evidence, and decide whether to continue, rollback, investigate another hypothesis, or abstain."

## Technology Stack

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Flow
- Recharts

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication

### Research Engine
- Python
- FastAPI
- NumPy
- Pandas
- SciPy

### Infrastructure
- Docker
- Docker Compose
- OpenTelemetry

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Running the Platform

1. Clone the repository:
```bash
git clone <repository-url>
cd Skeptical-Control
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Research Engine: http://localhost:8000

### Local Development

For individual service development, you can run services locally:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Research Engine:**
```bash
cd research-engine
pip install -r requirements.txt
uvicorn src.main:app --reload
```

## Project Structure

```
Skeptical-Control/
├── frontend/           # React TypeScript frontend
├── backend/            # Node.js Express backend
├── research-engine/   # Python FastAPI research engine
├── infrastructure/     # Docker and infrastructure configs
├── docs/              # Documentation
├── docker-compose.yml # Service orchestration
└── .env.example       # Environment variables template
```

## Current Status

Phase 1: Foundation and Isolated Microservice Testbed - In Progress

See [PHASE_STATUS.md](./PHASE_STATUS.md) for detailed progress.

## Documentation

- [Database Schema](./docs/database-schema.md)
- [API Documentation](./docs/api-documentation.md)
- [Design System](./docs/design-system.md)
- [Security Considerations](./docs/security-considerations.md)

## License

MIT
