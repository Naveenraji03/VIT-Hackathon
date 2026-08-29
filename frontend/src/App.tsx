import React, { useState, useEffect } from 'react';
import { Target, DocumentItem, TestRun, TestResult, FailureCluster, ReliabilityReport, FailureDetail } from './types';
import { ApiService } from './services/api';
import { TargetSetup } from './components/TargetSetup';
import { TestRunProgress } from './components/TestRunProgress';
import { FailureMap } from './components/FailureMap';
import { FailureDetailModal } from './components/FailureDetailModal';
import { ReliabilityReportView } from './components/ReliabilityReportView';

import { Shield, Play, Layers, FileCheck, Cpu, Sparkles, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'SETUP' | 'RUN' | 'MAP' | 'REPORT'>('SETUP');
  
  const [target, setTarget] = useState<Target | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [apiHealth, setApiHealth] = useState<{ gemini_api_key_set: boolean; gemini_model: string } | null>(null);
  
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [allResults, setAllResults] = useState<TestResult[]>([]);
  const [failures, setFailures] = useState<TestResult[]>([]);
  const [clusters, setClusters] = useState<FailureCluster[]>([]);
  const [report, setReport] = useState<ReliabilityReport | null>(null);
  
  const [selectedFailure, setSelectedFailure] = useState<FailureDetail | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial targets and health status
  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll active test run status
  useEffect(() => {
    if (!currentRun) return;
    if (currentRun.status === 'COMPLETED' || currentRun.status === 'FAILED') {
      setIsRunning(false);
      fetchRunDetails(currentRun.id);
      return;
    }

    const interval = setInterval(() => {
      fetchRunStatus(currentRun.id);
    }, 2500);

    return () => clearInterval(interval);
  }, [currentRun]);

  const loadInitialData = async () => {
    try {
      setErrorMessage(null);
      const [healthData, targetsData, docsData, runsData] = await Promise.all([
        ApiService.getHealth(),
        ApiService.getTargets(),
        ApiService.getDocuments(),
        ApiService.getTestRuns()
      ]);

      setApiHealth(healthData);
      if (targetsData.length > 0) setTarget(targetsData[0]);
      setDocuments(docsData);

      if (runsData.length > 0) {
        const latest = runsData[0];
        setCurrentRun(latest);
        await fetchRunDetails(latest.id);
      }
    } catch (e: any) {
      console.error("Initial data load error:", e);
      setErrorMessage("Failed to connect to FailForge Backend. Ensure server is running on http://127.0.0.1:8000");
    }
  };

  const fetchRunStatus = async (runId: string) => {
    try {
      const data = await ApiService.getTestRun(runId);
      setCurrentRun(data);
      if (data.status === 'COMPLETED') {
        fetchRunDetails(runId);
      }
    } catch (e) {
      console.error("Fetch run status error:", e);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    try {
      const [resultsData, clustersData, reportData] = await Promise.all([
        ApiService.getTestResults(runId),
        ApiService.getClusters(runId),
        ApiService.getReliabilityReport(runId)
      ]);

      setAllResults(resultsData);
      setFailures(resultsData.filter(r => r.status === 'FAIL'));
      setClusters(clustersData);
      setReport(reportData);
    } catch (e) {
      console.error("Fetch run details error:", e);
    }
  };

  const handleStartTestRun = async () => {
    setErrorMessage(null);
    setIsRunning(true);
    setActiveTab('RUN');
    try {
      const data = await ApiService.startTestRun();
      setCurrentRun({
        id: data.test_run_id,
        target_id: 'target-enterprise-rag',
        status: 'PENDING',
        total_tests: 20,
        passed_count: 0,
        warning_count: 0,
        failure_count: 0,
        reliability_score: 100,
        created_at: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("Start test run error:", e);
      setErrorMessage(e.message || "Failed to start test run.");
      setIsRunning(false);
    }
  };

  const handleSeedDemo = async () => {
    setErrorMessage(null);
    setLoadingDemo(true);
    setIsRunning(true);
    setActiveTab('RUN');
    try {
      const data = await ApiService.runSeedDemo();
      const runId = data.test_run_id;
      await fetchRunStatus(runId);
      await fetchRunDetails(runId);
      setActiveTab('MAP');
    } catch (e: any) {
      console.error("Demo run error:", e);
      setErrorMessage(e.message || "Failed to execute seed demo mode.");
    } finally {
      setLoadingDemo(false);
      setIsRunning(false);
    }
  };

  const handleSelectFailure = async (failureId: string) => {
    try {
      const detail = await ApiService.getFailureDetail(failureId);
      setSelectedFailure(detail);
    } catch (e: any) {
      console.error("Fetch failure detail error:", e);
      setErrorMessage(e.message || "Failed to load failure details.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Minimal Header Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                FAILFORGE <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">V1</span>
              </h1>
              <p className="text-[11px] text-slate-500">Autonomous AI Reliability Testing</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSeedDemo}
              disabled={loadingDemo || isRunning}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingDemo ? "RUNNING DEMO..." : "DEMO MODE (1-CLICK RUN)"}
            </button>
          </div>
        </div>
      </header>

      {/* Minimal Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex space-x-2">
          {[
            { id: 'SETUP', label: 'Target Setup', icon: Cpu },
            { id: 'RUN', label: 'Test Run', icon: Play },
            { id: 'MAP', label: `Failure Map (${clusters.length})`, icon: Layers },
            { id: 'REPORT', label: 'Reliability Report', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-slate-900 text-slate-900 bg-slate-50'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Error Notice Bar */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 py-2 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-rose-800 font-medium">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" /> {errorMessage}
            </span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Main Workspace View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'SETUP' && (
          <TargetSetup
            target={target}
            documents={documents}
            apiHealth={apiHealth}
            onStartTestRun={handleStartTestRun}
            isRunning={isRunning}
          />
        )}

        {activeTab === 'RUN' && (
          <TestRunProgress
            testRun={currentRun}
            onRefresh={() => currentRun && fetchRunStatus(currentRun.id)}
          />
        )}

        {activeTab === 'MAP' && (
          <FailureMap
            clusters={clusters}
            allFailures={failures}
            onSelectFailure={handleSelectFailure}
          />
        )}

        {activeTab === 'REPORT' && (
          <ReliabilityReportView report={report} />
        )}
      </main>

      {/* Failure Inspection Modal */}
      {selectedFailure && (
        <FailureDetailModal
          failure={selectedFailure}
          onClose={() => setSelectedFailure(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        FailForge V1 • Model: {apiHealth?.gemini_model || "Gemini"}
      </footer>
    </div>
  );
}

export default App;
