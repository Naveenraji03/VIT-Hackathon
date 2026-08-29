import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.db.models import TestRunModel, TestResultModel, FailureClusterModel, AdaptiveTestModel

class ClusteringEngine:
    """Groups discovered failures into clusters and computes transparent reliability metrics."""

    @staticmethod
    def cluster_failures(db: Session, run_id: str) -> List[Dict[str, Any]]:
        """Cluster failure results by trigger and semantic similarity."""
        failures = db.query(TestResultModel).filter(
            TestResultModel.run_id == run_id,
            TestResultModel.status == "FAIL"
        ).all()

        if not failures:
            return []

        # Group by trigger
        groups: Dict[str, List[TestResultModel]] = {}
        for f in failures:
            trig = f.trigger or "Unclassified Vulnerability"
            if trig not in groups:
                groups[trig] = []
            groups[trig].append(f)

        clusters = []
        for trig_name, group_failures in groups.items():
            cluster_id = f"cluster-{uuid.uuid4().hex[:8]}"
            first_fail = group_failures[0]
            cat = first_fail.failure_type or "CONTRADICTION"
            sev = first_fail.severity or "HIGH"

            # Count adaptive variants and reproduced failures
            total_vars = 0
            reproduced = 0
            for fail_rec in group_failures:
                adapt_tests = db.query(AdaptiveTestModel).filter(
                    AdaptiveTestModel.parent_result_id == fail_rec.id
                ).all()
                total_vars += len(adapt_tests)
                reproduced += sum(1 for a in adapt_tests if a.failure_reproduced)

            # Create cluster model
            c_model = FailureClusterModel(
                id=cluster_id,
                run_id=run_id,
                name=ClusteringEngine._format_cluster_name(trig_name, cat),
                trigger=trig_name,
                description=f"Cluster of {len(group_failures)} failures caused by {trig_name.lower()}.",
                total_variants=total_vars,
                reproduced_count=reproduced,
                category=cat,
                severity=sev
            )
            db.add(c_model)
            db.commit()

            # Associate failures to cluster
            for fail_rec in group_failures:
                fail_rec.cluster_id = cluster_id
            db.commit()

            clusters.append({
                "id": cluster_id,
                "name": c_model.name,
                "trigger": trig_name,
                "category": cat,
                "severity": sev,
                "failure_count": len(group_failures),
                "total_variants": total_vars,
                "reproduced_count": reproduced,
                "reproduction_rate": round((reproduced / total_vars * 100), 1) if total_vars > 0 else 100.0
            })

        return clusters

    @staticmethod
    def _format_cluster_name(trigger: str, category: str) -> str:
        trig_lower = trigger.lower()
        if "version" in trig_lower or "2025" in trig_lower or "2026" in trig_lower:
            return "Policy Version Confusion"
        elif "injection" in trig_lower or "override" in trig_lower or "doc-010" in trig_lower:
            return "Prompt Injection Vulnerability"
        elif "per-diem" in trig_lower or "meal" in trig_lower or "ambigu" in trig_lower:
            return "Ambiguous Allowance / Per-Diem Cap Conflict"
        elif "tenure" in trig_lower or "context" in trig_lower or "remote" in trig_lower:
            return "Context Shift Boundary Failure"
        else:
            return f"{category.replace('_', ' ').title()} Cluster"

    @staticmethod
    def generate_reliability_report(db: Session, run_id: str) -> Dict[str, Any]:
        """Compute transparent reliability score and breakdown."""
        test_run = db.query(TestRunModel).filter(TestRunModel.id == run_id).first()
        if not test_run:
            raise ValueError(f"TestRun {run_id} not found.")

        all_results = db.query(TestResultModel).filter(TestResultModel.run_id == run_id).all()
        all_adaptive = db.query(AdaptiveTestModel).filter(AdaptiveTestModel.run_id == run_id).all()

        total_initial = len(all_results)
        passed = sum(1 for r in all_results if r.status == "PASS")
        warnings = sum(1 for r in all_results if r.status == "WARN")
        failures = sum(1 for r in all_results if r.status == "FAIL")

        critical_failures = sum(1 for r in all_results if r.status == "FAIL" and r.severity == "CRITICAL")
        high_failures = sum(1 for r in all_results if r.status == "FAIL" and r.severity == "HIGH")

        # Formula: (Passed + 0.5 * Warnings) / Total * 100
        reliability_score = round(((passed + (0.5 * warnings)) / total_initial * 100), 1) if total_initial > 0 else 100.0

        test_run.reliability_score = reliability_score
        db.commit()

        # Breakdown by category
        category_breakdown = {}
        for r in all_results:
            cat = r.failure_type or "OTHER"
            if cat not in category_breakdown:
                category_breakdown[cat] = {"pass": 0, "warn": 0, "fail": 0}
            if r.status == "PASS":
                category_breakdown[cat]["pass"] += 1
            elif r.status == "WARN":
                category_breakdown[cat]["warn"] += 1
            else:
                category_breakdown[cat]["fail"] += 1

        clusters = db.query(FailureClusterModel).filter(FailureClusterModel.run_id == run_id).all()
        cluster_data = [{
            "id": c.id,
            "name": c.name,
            "trigger": c.trigger,
            "category": c.category,
            "severity": c.severity,
            "total_variants": c.total_variants,
            "reproduced_count": c.reproduced_count
        } for c in clusters]

        # Actionable recommendations
        recommendations = []
        if any(c.category == "PROMPT_INJECTION" or "injection" in c.trigger.lower() for c in clusters):
            recommendations.append("Implement strict input/retrieved context sanitization before feeding document excerpts to Gemini LLM to prevent prompt injection exploitation.")
        if any("version" in c.trigger.lower() for c in clusters):
            recommendations.append("Incorporate document version metadata and effective date filters into vector search retrieval to prioritize active 2026 policies over superseded 2025 files.")
        if any("per-diem" in c.trigger.lower() for c in clusters):
            recommendations.append("Resolve ambiguous per-diem clauses between Corporate Travel Policy ($75/day) and Expense Reimbursement Appendix ($60/day).")

        if not recommendations:
            recommendations.append("Target RAG passed boundary tests cleanly. Continuously expand red-teaming test suites as new policies are uploaded.")

        return {
            "run_id": run_id,
            "reliability_score": reliability_score,
            "total_tests": total_initial,
            "passed": passed,
            "warnings": warnings,
            "failures": failures,
            "critical_failures": critical_failures,
            "high_failures": high_failures,
            "adaptive_tests_executed": len(all_adaptive),
            "adaptive_reproductions": sum(1 for a in all_adaptive if a.failure_reproduced),
            "category_breakdown": category_breakdown,
            "failure_clusters": cluster_data,
            "recommendations": recommendations,
            "formula_explanation": "Reliability % = [(Passed Tests + 0.5 × Warnings) / Total Tests] × 100"
        }
