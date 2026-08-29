import json
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.rag.target_rag import TargetRAG
from backend.engine.evaluator import FailureEvaluator
from backend.db.models import TestRunModel, TestCaseModel, TestResultModel

class TestExecutor:
    """Executes generated tests against Target RAG application and stores evaluated results."""

    def __init__(self, target_rag: TargetRAG, evaluator: FailureEvaluator):
        self.target_rag = target_rag
        self.evaluator = evaluator

    def execute_test_run(self, db: Session, test_run_id: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run all test cases sequentially or concurrently, saving DB records."""
        test_run = db.query(TestRunModel).filter(TestRunModel.id == test_run_id).first()
        if not test_run:
            raise ValueError(f"TestRun {test_run_id} not found in database.")

        test_run.status = "EXECUTING"
        test_run.total_tests = len(test_cases)
        db.commit()

        results = []
        passed_count = 0
        warning_count = 0
        failure_count = 0

        for idx, tc in enumerate(test_cases, 1):
            # Save TestCase record
            tc_model = TestCaseModel(
                id=tc["id"],
                run_id=test_run_id,
                category=tc["category"],
                difficulty=tc.get("difficulty", 3),
                prompt=tc["prompt"],
                expected_behavior=tc.get("expected_behavior", ""),
                target_failure=tc.get("target_failure", "")
            )
            db.add(tc_model)
            db.commit()

            # Execute RAG query
            rag_output = self.target_rag.query(tc["prompt"])
            model_response = rag_output["response"]
            retrieved_chunks = rag_output["retrieved_chunks"]
            source_docs = rag_output["source_docs"]

            # Evaluate response
            eval_result = self.evaluator.evaluate(
                prompt=tc["prompt"],
                expected_behavior=tc.get("expected_behavior", ""),
                target_failure=tc.get("target_failure", ""),
                model_response=model_response,
                retrieved_chunks=retrieved_chunks,
                source_docs=source_docs,
                category=tc["category"]
            )

            status = eval_result["status"]
            if status == "PASS":
                passed_count += 1
            elif status == "WARN":
                warning_count += 1
            else:
                failure_count += 1

            # Save TestResult record
            res_model = TestResultModel(
                id=f"res-{tc['id']}",
                run_id=test_run_id,
                test_case_id=tc["id"],
                prompt=tc["prompt"],
                retrieved_chunks=json.dumps(retrieved_chunks),
                source_docs=json.dumps(source_docs),
                model_response=model_response,
                status=status,
                failure_type=eval_result.get("failure_type"),
                severity=eval_result.get("severity"),
                confidence=eval_result.get("confidence", 0.90),
                reason=eval_result.get("reason"),
                evidence=json.dumps(eval_result.get("evidence", [])),
                trigger=eval_result.get("trigger"),
                timestamp=datetime.utcnow()
            )
            db.add(res_model)
            db.commit()

            results.append({
                "id": res_model.id,
                "test_case_id": tc["id"],
                "prompt": tc["prompt"],
                "category": tc["category"],
                "status": status,
                "failure_type": eval_result.get("failure_type"),
                "severity": eval_result.get("severity"),
                "reason": eval_result.get("reason"),
                "trigger": eval_result.get("trigger")
            })

        test_run.passed_count = passed_count
        test_run.warning_count = warning_count
        test_run.failure_count = failure_count
        test_run.status = "EVALUATING"
        db.commit()

        return {
            "run_id": test_run_id,
            "total_tests": len(test_cases),
            "passed": passed_count,
            "warnings": warning_count,
            "failures": failure_count,
            "results": results
        }
