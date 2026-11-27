from typing import Any, Dict, List


class ServicePriority:
    """Ranks investigation priority independently from RCA confidence."""

    def rank(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        affected = payload.get("affected_services", [])
        criticality = payload.get("business_criticality", {})
        dependency_impact = payload.get("dependency_impact", {})
        severity = payload.get("failure_severity", {})
        urgency = payload.get("urgency", {})

        ranked = []
        for name in affected:
            c = float(criticality.get(name, 0.5))
            d = float(dependency_impact.get(name, 0.0))
            s = float(severity.get(name, 0.5))
            u = float(urgency.get(name, 0.5))
            score = 0.30 * s + 0.25 * c + 0.25 * d + 0.20 * u
            reasons = [
                f"failure severity={s:.2f}",
                f"business criticality={c:.2f}",
                f"dependency impact={d:.2f}",
                f"urgency={u:.2f}",
            ]
            ranked.append({"service": name, "priority_score": round(score, 3), "reasons": reasons})

        ranked.sort(key=lambda item: (-item["priority_score"], item["service"]))
        for index, item in enumerate(ranked, 1):
            item["rank"] = index
        return ranked
