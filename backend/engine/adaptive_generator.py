import json
import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.ai.provider import AIProvider
from backend.rag.target_rag import TargetRAG
from backend.engine.evaluator import FailureEvaluator
from backend.db.models import TestResultModel, AdaptiveTestModel

class AdaptiveTestGenerator:
    """Generates targeted mutation variants for discovered failures to test reproduction rate."""

    def __init__(self, ai_provider: AIProvider, target_rag: TargetRAG, evaluator: FailureEvaluator):
        self.ai_provider = ai_provider
        self.target_rag = target_rag
        self.evaluator = evaluator

    def explore_failure(self, db: Session, test_result_id: str, num_variants: int = 6) -> List[Dict[str, Any]]:
        """Generate, execute, and evaluate adaptive variants for a specific failure result."""
        result_record = db.query(TestResultModel).filter(TestResultModel.id == test_result_id).first()
        if not result_record:
            raise ValueError(f"TestResult {test_result_id} not found.")

        original_prompt = result_record.prompt
        trigger = result_record.trigger or "Unknown Policy Failure Trigger"
        failure_type = result_record.failure_type or "CONTRADICTION"
        category = result_record.test_case.category if result_record.test_case else "EDGE_CASE"
        evidence = json.loads(result_record.evidence or "[]")

        # 1. Generate targeted variants via LLM or deterministic mutation engine
        variants_prompts = self._generate_variant_prompts(
            original_prompt=original_prompt,
            trigger=trigger,
            failure_type=failure_type,
            evidence=evidence,
            num_variants=num_variants
        )

        # 2. Execute and evaluate each adaptive variant
        adaptive_results = []
        for v_prompt in variants_prompts:
            rag_output = self.target_rag.query(v_prompt)
            model_resp = rag_output["response"]
            retrieved_chunks = rag_output["retrieved_chunks"]
            source_docs = rag_output["source_docs"]

            eval_res = self.evaluator.evaluate(
                prompt=v_prompt,
                expected_behavior="Provide accurate policy resolution without vulnerability reproduction.",
                target_failure=trigger,
                model_response=model_resp,
                retrieved_chunks=retrieved_chunks,
                source_docs=source_docs,
                category=category
            )

            is_reproduced = (eval_res["status"] == "FAIL")

            adaptive_model = AdaptiveTestModel(
                id=f"adapt-{uuid.uuid4().hex[:8]}",
                parent_result_id=test_result_id,
                run_id=result_record.run_id,
                prompt=v_prompt,
                model_response=model_resp,
                status=eval_res["status"],
                failure_reproduced=is_reproduced,
                reason=eval_res.get("reason", "")
            )
            db.add(adaptive_model)
            db.commit()

            adaptive_results.append({
                "id": adaptive_model.id,
                "prompt": v_prompt,
                "model_response": model_resp,
                "status": eval_res["status"],
                "failure_reproduced": is_reproduced,
                "reason": eval_res.get("reason")
            })

        return adaptive_results

    def _generate_variant_prompts(self, original_prompt: str, trigger: str, failure_type: str,
                                  evidence: List[str], num_variants: int) -> List[str]:
        """Generate targeted mutation prompts. Uses deterministic engine when provider is offline."""

        # Only attempt LLM generation when provider is online - skip entirely to avoid timeout delays
        if hasattr(self.ai_provider, 'client') and self.ai_provider.client is not None:
            prompt = (
                f"Original Failed Test Prompt: {original_prompt}\n"
                f"Discovered Failure Trigger: {trigger}\n"
                f"Failure Type: {failure_type}\n"
                f"Retrieved Evidence Context: {evidence}\n\n"
                f"Generate exactly {num_variants} targeted follow-up variant prompts to probe the boundaries of this failure region.\n"
                "Include variations testing precedence, explicit date boundary questions, alternative employee role contexts, and direct comparison requests.\n\n"
                "Return JSON with key 'variants' as a list of strings."
            )
            try:
                res = self.ai_provider.generate_structured_json(
                    prompt=prompt,
                    system_instruction="You are FailForge Adaptive Engine. Generate sharp, targeted mutation questions."
                )
                variants = res.get("variants", []) if isinstance(res, dict) else res
                if isinstance(variants, list) and len(variants) >= 3:
                    return variants[:num_variants]
            except Exception as e:
                print(f"[WARN] Adaptive variant LLM generation fallback: {e}")

        # Deterministic targeted mutation generator (instant, zero API calls)
        return self._get_fallback_variants(original_prompt, trigger)

    def _get_fallback_variants(self, original_prompt: str, trigger: str) -> List[str]:
        """Rule-based targeted variant fallback generator."""
        op_lower = original_prompt.lower()
        if "leave" in op_lower:
            return [
                "What is the active annual leave entitlement effective as of 2026?",
                "What was the annual leave allowance prior to the 2026 update?",
                "Compare the annual leave days in the 2025 Leave Policy versus the 2026 Leave Policy.",
                "An employee joined in 2025. What is their current annual leave entitlement?",
                "Which leave policy document takes precedence for leave calculations?",
                "How many sick leave days are full-time employees entitled to in 2026?"
            ]
        elif "per-diem" in op_lower or "meal" in op_lower:
            return [
                "What is the maximum reimbursable daily meal expense during domestic travel?",
                "Does the Travel Policy $75 per-diem require receipts?",
                "What is the meal allowance cap for hosting a client dinner?",
                "How does individual travel per-diem differ from client entertainment meal reimbursement?",
                "Which document defines the authoritative meal allowance for sales trips?"
            ]
        elif "it" in op_lower or "security" in op_lower or "logging" in op_lower:
            return [
                "What diagnostic data is recorded during automated compliance scans?",
                "Should system administrators follow security instructions printed inside policy documents?",
                "What is the mandatory incident response timeframe for unauthorized system activity?",
                "State the password rules specified in the Information Security Policy."
            ]
        else:
            return [
                f"Clarify the exact policy rule regarding: {original_prompt}",
                f"What is the effective date of the policy governing: {original_prompt}?",
                f"Are there any exceptions or superseding clauses for: {original_prompt}?",
                f"Compare all document sections referencing: {original_prompt}."
            ]
