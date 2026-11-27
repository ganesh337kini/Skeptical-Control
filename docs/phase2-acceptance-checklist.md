# Phase 2 Acceptance Checklist

| # | Criterion | Implementation evidence | Verification state |
|---|---|---|---|
| 1 | Generate repeatable workload | Locust service and `POST /api/research/experiments/:id/workloads` with users, spawn rate, duration, host, endpoints, and profile | Implemented; live run blocked because Docker is unavailable on this host |
| 2 | Record healthy baseline | `POST /api/research/experiments/:id/baseline` and baseline field in experiment JSON | Implemented |
| 3 | Inject controlled fault | Toxiproxy service and fault endpoint | Implemented; requires running Docker/Toxiproxy |
| 4 | Detect degradation | Prometheus/Grafana and live monitoring telemetry views | Stack implemented; no live sample stack available |
| 5 | Collect metrics and traces | Prometheus, OTLP collector, and telemetry reference endpoint | Instrumentation and collector integrated |
| 6 | Produce ranked RCA hypotheses | Explainable RCA module and `POST /api/research/experiments/:id/rca` | Unit implementation complete |
| 7 | Explain suspect ranking | Evidence, symptom, impact, uncertainty, traces, and alternative hypotheses | Implemented |
| 8 | Record known ground truth separately | Fault record stores target, type, intensity, start/end time, status, independently of RCA | Implemented |
| 9 | Visualize incident and affected services | RCA cards, health page, topology page, timeline, interactive charts | Implemented |
| 10 | Reset environment | Fault cleanup and experiment reset endpoints | Implemented |

No acceptance result is presented as observed evidence where Docker or external services were unavailable.
