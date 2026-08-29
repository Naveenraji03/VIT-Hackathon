import { 
  Target, DocumentItem, TestRun, TestResult, 
  FailureCluster, ReliabilityReport, FailureDetail 
} from '../types';

export class ApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  static async getHealth(): Promise<{ status: string; gemini_api_key_set: boolean; gemini_model: string; timestamp: string }> {
    return this.request('/api/health');
  }

  static async getTargets(): Promise<Target[]> {
    return this.request('/api/targets');
  }

  static async getDocuments(targetId: string = 'target-enterprise-rag'): Promise<DocumentItem[]> {
    return this.request(`/api/documents?target_id=${targetId}`);
  }

  static async getTestRuns(): Promise<TestRun[]> {
    return this.request('/api/test-runs');
  }

  static async getTestRun(runId: string): Promise<TestRun> {
    return this.request(`/api/test-runs/${runId}`);
  }

  static async startTestRun(targetId: string = 'target-enterprise-rag'): Promise<{ test_run_id: string; status: string; message: string }> {
    return this.request('/api/test-runs', {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId }),
    });
  }

  static async runSeedDemo(): Promise<{ test_run_id: string; status: string; message: string }> {
    return this.request('/api/seed-demo', { method: 'POST' });
  }

  static async getTestResults(runId: string): Promise<TestResult[]> {
    return this.request(`/api/test-runs/${runId}/results`);
  }

  static async getFailureDetail(failureId: string): Promise<FailureDetail> {
    return this.request(`/api/failures/${failureId}`);
  }

  static async getClusters(runId?: string): Promise<FailureCluster[]> {
    const url = runId ? `/api/clusters?run_id=${runId}` : '/api/clusters';
    return this.request(url);
  }

  static async getReliabilityReport(runId: string): Promise<ReliabilityReport> {
    return this.request(`/api/reports/${runId}`);
  }
}
