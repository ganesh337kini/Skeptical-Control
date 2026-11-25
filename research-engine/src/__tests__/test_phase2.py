import pytest

from src.services.rca import ExplainableRCA
from src.services.service_priority import ServicePriority


def test_rca_is_explainable_and_does_not_use_fault_ground_truth():
    payload = {
        "metrics": {"by_service": {
            "web": {"error_rate": 0.08, "p95_latency_ms": 820, "availability": 0.96, "dependency_failures": 12},
            "db": {"error_rate": 0.01, "p95_latency_ms": 180, "availability": 1.0, "dependency_failures": 0},
        }},
        "logs": [{"service": "web", "message": "upstream timeout"}],
        "traces": [{"service": "web", "trace_id": "trace-1", "duration_ms": 900}],
        "services": [{"name": "web"}, {"name": "db"}],
        "dependencies": [{"from": "web", "to": "db"}],
    }
    result = ExplainableRCA().analyze(payload)
    assert result["top_suspect"] == "web"
    assert result["ground_truth_used_for_prediction"] is False
    assert result["suspects"][0]["evidence"]
    assert "not calibrated probabilities" in result["score_disclaimer"]


def test_service_priority_is_separate_from_rca():
    result = ServicePriority().rank({
        "affected_services": ["db", "web"],
        "business_criticality": {"db": 0.9, "web": 0.7},
        "dependency_impact": {"db": 0.8, "web": 0.5},
        "failure_severity": {"db": 0.9, "web": 0.7},
        "urgency": {"db": 0.8, "web": 0.9},
    })
    assert result[0]["service"] == "db"
    assert result[0]["reasons"]
