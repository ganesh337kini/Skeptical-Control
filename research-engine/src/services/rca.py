from typing import Any, Dict, List


class ExplainableRCA:
    """Transparent baseline: ranks observed symptoms and dependency propagation.

    This produces an evidence-based hypothesis ranking, not a calibrated probability.
    Ground-truth fault records are never used as prediction inputs.
    """

    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        metrics = payload.get("metrics", {})
        logs = payload.get("logs", [])
        traces = payload.get("traces", [])
        services = payload.get("services", [])
        dependencies = payload.get("dependencies", [])

        candidates = {s if isinstance(s, str) else s.get("name", "unknown"): 0.0 for s in services}
        evidence: Dict[str, List[Dict[str, Any]]] = {name: [] for name in candidates}

        by_service = metrics.get("by_service", {})
        for name, values in by_service.items():
            if name not in candidates:
                candidates[name] = 0.0
                evidence[name] = []
            score = 0.0
            error_rate = float(values.get("error_rate", 0) or 0)
            p95 = float(values.get("p95_latency_ms", 0) or 0)
            availability = float(values.get("availability", 1) or 1)
            dependency_failures = float(values.get("dependency_failures", 0) or 0)
            if error_rate >= 0.05:
                score += min(error_rate * 1.5, 0.35)
                evidence[name].append({"type": "metric", "observation": f"Error rate is {error_rate:.1%}", "weight": 0.35})
            if p95 >= 500:
                score += min(p95 / 3000, 0.25)
                evidence[name].append({"type": "metric", "observation": f"p95 latency is {p95:.0f} ms", "weight": 0.25})
            if availability < 0.99:
                score += (0.99 - availability) * 2
                evidence[name].append({"type": "metric", "observation": f"Availability is {availability:.1%}", "weight": 0.20})
            if dependency_failures > 0:
                score += min(dependency_failures / 10, 0.20)
                evidence[name].append({"type": "metric", "observation": f"Observed {dependency_failures:.0f} dependency communication failures", "weight": 0.20})
            candidates[name] += score

        for log in logs:
            name = log.get("service")
            text = str(log.get("message", "")).lower()
            if name in candidates and any(token in text for token in ("timeout", "error", "failed", "unavailable", "connection refused")):
                candidates[name] += 0.15
                evidence[name].append({"type": "log", "observation": text[:500], "weight": 0.15})

        slow_traces = [t for t in traces if float(t.get("duration_ms", 0) or 0) >= 500]
        for trace in slow_traces:
            name = trace.get("service")
            if name in candidates:
                candidates[name] += 0.10
                evidence[name].append({"type": "trace", "observation": f"Slow trace {trace.get('trace_id', 'unknown')} ({float(trace.get('duration_ms', 0)):.0f} ms)", "trace_id": trace.get("trace_id")})

        downstream = {}
        for dep in dependencies:
            source = dep.get("from")
            target = dep.get("to")
            downstream.setdefault(source, []).append(target)

        ranked = []
        for name, raw in candidates.items():
            uncertainty = round(max(0.20, 1 - min(raw, 0.95)), 2)
            ranked.append({
                "service": name,
                "rank": 0,
                "hypothesis_score": round(min(raw, 1.0), 3),
                "uncertainty": uncertainty,
                "evidence": evidence[name],
                "contributing_symptoms": list(dict.fromkeys(e["observation"] for e in evidence[name])),
                "impacted_services": downstream.get(name, []),
                "supporting_traces": [e.get("trace_id") for e in evidence[name] if e.get("trace_id")],
            })

        ranked.sort(key=lambda item: (-item["hypothesis_score"], -len(item["evidence"]), item["service"]))
        for index, item in enumerate(ranked, 1):
            item["rank"] = index

        top = ranked[0]["service"] if ranked else None
        alternatives = ranked[1:4]
        return {
            "method": "transparent symptom-and-dependency baseline",
            "score_disclaimer": "Scores are relative hypothesis weights, not calibrated probabilities.",
            "suspects": ranked,
            "top_suspect": top,
            "alternative_hypotheses": [{"service": a["service"], "reason": "Lower observed symptom evidence than the top-ranked suspect"} for a in alternatives],
            "ground_truth_used_for_prediction": False,
        }
