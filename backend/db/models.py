from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.db.database import Base

class TargetModel(Base):
    __tablename__ = "targets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    target_type = Column(String, default="RAG")
    model_provider = Column(String, default="Gemini")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    documents = relationship("DocumentModel", back_populates="target", cascade="all, delete-orphan")
    test_runs = relationship("TestRunModel", back_populates="target", cascade="all, delete-orphan")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    target_id = Column(String, ForeignKey("targets.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="General")
    version = Column(String, default="1.0")
    effective_date = Column(String, nullable=True)
    content = Column(Text, nullable=False)

    target = relationship("TargetModel", back_populates="documents")


class TestRunModel(Base):
    __tablename__ = "test_runs"

    id = Column(String, primary_key=True, index=True)
    target_id = Column(String, ForeignKey("targets.id"), nullable=False, index=True)
    status = Column(String, default="PENDING", index=True) # PENDING, GENERATING, EXECUTING, EVALUATING, ADAPTIVE_TESTING, CLUSTERING, COMPLETED, FAILED
    total_tests = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    reliability_score = Column(Float, default=100.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime, nullable=True)

    target = relationship("TargetModel", back_populates="test_runs")
    test_cases = relationship("TestCaseModel", back_populates="test_run", cascade="all, delete-orphan")
    test_results = relationship("TestResultModel", back_populates="test_run", cascade="all, delete-orphan")
    failure_clusters = relationship("FailureClusterModel", back_populates="test_run", cascade="all, delete-orphan")


class TestCaseModel(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("test_runs.id"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True) # EDGE_CASE, CONTEXT_SHIFT, CONTRADICTION, OUT_OF_SCOPE, PROMPT_INJECTION, AMBIGUITY
    difficulty = Column(Integer, default=1)
    prompt = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    target_failure = Column(Text, nullable=False)

    test_run = relationship("TestRunModel", back_populates="test_cases")
    result = relationship("TestResultModel", back_populates="test_case", uselist=False, cascade="all, delete-orphan")


class TestResultModel(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("test_runs.id"), nullable=False, index=True)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    retrieved_chunks = Column(Text, nullable=True)
    source_docs = Column(Text, nullable=True)
    model_response = Column(Text, nullable=False)
    status = Column(String, nullable=False, index=True) # PASS, WARN, FAIL
    failure_type = Column(String, nullable=True, index=True)
    severity = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    reason = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    trigger = Column(Text, nullable=True)
    cluster_id = Column(String, ForeignKey("failure_clusters.id"), nullable=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    test_run = relationship("TestRunModel", back_populates="test_results")
    test_case = relationship("TestCaseModel", back_populates="result")
    cluster = relationship("FailureClusterModel", back_populates="failures")
    adaptive_tests = relationship("AdaptiveTestModel", back_populates="parent_result", cascade="all, delete-orphan")


class AdaptiveTestModel(Base):
    __tablename__ = "adaptive_tests"

    id = Column(String, primary_key=True, index=True)
    parent_result_id = Column(String, ForeignKey("test_results.id"), nullable=False, index=True)
    run_id = Column(String, nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    model_response = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    failure_reproduced = Column(Boolean, default=False)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent_result = relationship("TestResultModel", back_populates="adaptive_tests")


class FailureClusterModel(Base):
    __tablename__ = "failure_clusters"

    id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("test_runs.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    trigger = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_variants = Column(Integer, default=0)
    reproduced_count = Column(Integer, default=0)
    category = Column(String, nullable=False)
    severity = Column(String, default="HIGH")

    test_run = relationship("TestRunModel", back_populates="failure_clusters")
    failures = relationship("TestResultModel", back_populates="cluster")
