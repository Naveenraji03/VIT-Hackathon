export interface Target {
  id: string;
  name: string;
  description: string;
  target_type: string;
  model_provider: string;
  document_count: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  version: string;
  effective_date: string;
  content_length: number;
  content_snippet: string;
}

export interface TestRun {
  id: string;
  target_id: string;
  status: 'PENDING' | 'GENERATING' | 'EXECUTING' | 'EVALUATING' | 'ADAPTIVE_TESTING' | 'CLUSTERING' | 'COMPLETED' | 'FAILED';
  total_tests: number;
  passed_count: number;
  warning_count: number;
  failure_count: number;
  reliability_score: number;
  created_at: string;
  finished_at?: string;
}

export interface RetrievedChunk {
  chunk_id: string;
  doc_id: string;
  doc_title: string;
  version: string;
  category: string;
  text: string;
  score?: number;
}

export interface TestResult {
  id: string;
  test_case_id: string;
  category: string;
  difficulty: number;
  prompt: string;
  expected_behavior: string;
  retrieved_chunks: RetrievedChunk[];
  source_docs: string[];
  model_response: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  failure_type?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  reason: string;
  evidence: string[];
  trigger: string;
  cluster_id?: string;
  timestamp: string;
}

export interface AdaptiveTest {
  id: string;
  prompt: string;
  model_response: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  failure_reproduced: boolean;
  reason: string;
}

export interface FailureDetail extends TestResult {
  target_failure?: string;
  reproduction_rate: number;
  total_variants: number;
  reproduced_count: number;
  adaptive_tests: AdaptiveTest[];
}

export interface FailureCluster {
  id: string;
  run_id: string;
  name: string;
  trigger: string;
  description: string;
  category: string;
  severity: string;
  failure_count: number;
  total_variants: number;
  reproduced_count: number;
  reproduction_rate: number;
  failures: {
    id: string;
    prompt: string;
    failure_type: string;
    severity: string;
  }[];
}

export interface ReliabilityReport {
  run_id: string;
  reliability_score: number;
  total_tests: number;
  passed: number;
  warnings: number;
  failures: number;
  critical_failures: number;
  high_failures: number;
  adaptive_tests_executed: number;
  adaptive_reproductions: number;
  category_breakdown: Record<string, { pass: number; warn: number; fail: number }>;
  failure_clusters: FailureCluster[];
  recommendations: string[];
  formula_explanation: string;
}
