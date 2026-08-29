from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TargetCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    target_type: str = Field("RAG", max_length=50)

class TargetResponseSchema(BaseModel):
    id: str
    name: str
    description: Optional[str]
    target_type: str
    model_provider: str
    document_count: int
    created_at: Optional[str]

class DocumentResponseSchema(BaseModel):
    id: str
    title: str
    category: str
    version: str
    effective_date: Optional[str]
    content_length: int
    content_snippet: str

class TestRunCreateSchema(BaseModel):
    target_id: str = Field("target-enterprise-rag", max_length=100)

class TestRunResponseSchema(BaseModel):
    id: str
    target_id: str
    status: str
    total_tests: int
    passed_count: int
    warning_count: int
    failure_count: int
    reliability_score: float
    created_at: Optional[str]
    finished_at: Optional[str]

class AdaptiveTestResponseSchema(BaseModel):
    id: str
    prompt: str
    model_response: str
    status: str
    failure_reproduced: bool
    reason: Optional[str]

class TestResultResponseSchema(BaseModel):
    id: str
    test_case_id: str
    category: str
    difficulty: int
    prompt: str
    expected_behavior: str
    retrieved_chunks: List[Dict[str, Any]]
    source_docs: List[str]
    model_response: str
    status: str
    failure_type: Optional[str]
    severity: Optional[str]
    confidence: float
    reason: Optional[str]
    evidence: List[str]
    trigger: Optional[str]
    cluster_id: Optional[str]
    timestamp: Optional[str]

class FailureDetailSchema(TestResultResponseSchema):
    target_failure: Optional[str]
    reproduction_rate: float
    total_variants: int
    reproduced_count: int
    adaptive_tests: List[AdaptiveTestResponseSchema]

class FailureClusterResponseSchema(BaseModel):
    id: str
    run_id: str
    name: str
    trigger: str
    description: Optional[str]
    category: str
    severity: str
    failure_count: int
    total_variants: int
    reproduced_count: int
    reproduction_rate: float
    failures: List[Dict[str, Any]]

class ReliabilityReportSchema(BaseModel):
    run_id: str
    reliability_score: float
    total_tests: int
    passed: int
    warnings: int
    failures: int
    critical_failures: int
    high_failures: int
    adaptive_tests_executed: int
    adaptive_reproductions: int
    category_breakdown: Dict[str, Dict[str, int]]
    failure_clusters: List[Dict[str, Any]]
    recommendations: List[str]
    formula_explanation: str
