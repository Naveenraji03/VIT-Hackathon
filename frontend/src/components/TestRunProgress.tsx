import React from 'react';
import { TestRun } from '../types';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Terminal, RefreshCw } from 'lucide-react';

interface Props {
  testRun: TestRun | null;
  onRefresh: () => void;
}

export const TestRunProgress: React.FC<Props> = ({ testRun, onRefresh }) => {
  if (!testRun) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Terminal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Active Audit Run</h3>
        <p className="text-slate-500 text-xs mt-1">Start a new FailForge test run or click 1-Click Demo Mode.</p>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Initiated' },
    { key: 'GENERATING', label: 'Test Generation' },
    { key: 'EXECUTING', label: 'RAG Execution' },
    { key: 'EVALUATING', label: 'Failure Evaluation' },
    { key: 'ADAPTIVE_TESTING', label: 'Adaptive Retesting' },
    { key: 'CLUSTERING', label: 'Failure Clustering' },
    { key: 'COMPLETED', label: 'Audit Complete' },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === testRun.status);

  return (
    <div className="space-y-6">
      {/* Execution Status Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mb-1">
              RUN ID: {testRun.id}
            </div>
            <h3 className="text-xl font-bold text-slate-900">Autonomous Pipeline Execution</h3>
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        {/* Timeline Progress Step Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 border-y border-slate-100 py-4 my-4">
          {steps.map((step, idx) => {
            const isDone = currentStepIdx > idx || testRun.status === 'COMPLETED';
            const isCurrent = currentStepIdx === idx && testRun.status !== 'COMPLETED';

            return (
              <div
                key={step.key}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : isCurrent
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-[10px] font-bold flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-semibold leading-tight">{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Tests</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{testRun.total_tests || 20}</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-center">
            <div className="text-xs font-semibold text-emerald-700 uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Passed
            </div>
            <div className="text-xl font-bold text-emerald-800 mt-0.5">{testRun.passed_count}</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-center">
            <div className="text-xs font-semibold text-amber-700 uppercase flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Warnings
            </div>
            <div className="text-xl font-bold text-amber-800 mt-0.5">{testRun.warning_count}</div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-center">
            <div className="text-xs font-semibold text-rose-700 uppercase flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Failures
            </div>
            <div className="text-xl font-bold text-rose-800 mt-0.5">{testRun.failure_count}</div>
          </div>

          <div className="bg-slate-900 border border-slate-900 rounded-lg p-3.5 text-center text-white col-span-2 sm:col-span-1">
            <div className="text-xs font-semibold text-slate-300 uppercase">Reliability</div>
            <div className="text-xl font-bold mt-0.5">{testRun.reliability_score}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
