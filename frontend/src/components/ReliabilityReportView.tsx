import React from 'react';
import { ReliabilityReport } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Layers, Lightbulb } from 'lucide-react';

interface Props {
  report: ReliabilityReport | null;
}

export const ReliabilityReportView: React.FC<Props> = ({ report }) => {
  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
        No reliability report generated yet. Run FailForge to generate a report.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Reliability Index</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                AUDITED RESULT
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-3">
              <span className="text-5xl font-black text-slate-900 tracking-tight">{report.reliability_score}%</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                report.reliability_score >= 85 ? 'text-emerald-800 bg-emerald-100 border border-emerald-200' : 'text-amber-800 bg-amber-100 border border-amber-200'
              }`}>
                {report.reliability_score >= 85 ? 'ACCEPTABLE' : 'NEEDS ATTENTION'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-2">
              Formula: <code className="text-slate-800 font-semibold">{report.formula_explanation}</code>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Adaptive Retested: <strong className="text-slate-900">{report.adaptive_tests_executed}</strong></span>
            <span>Reproduced Failures: <strong className="text-rose-700">{report.adaptive_reproductions}</strong></span>
          </div>
        </div>

        {/* Execution Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-900 mb-4">Execution Breakdown</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">TOTAL TESTS</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{report.total_tests}</div>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
              <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
              </div>
              <div className="text-xl font-bold text-emerald-800 mt-0.5">{report.passed}</div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200">
              <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> WARNINGS
              </div>
              <div className="text-xl font-bold text-amber-800 mt-0.5">{report.warnings}</div>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-lg border border-rose-200">
              <div className="text-[11px] text-rose-800 font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> FAILURES
              </div>
              <div className="text-xl font-bold text-rose-800 mt-0.5">{report.failures}</div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Critical Security Failures: <strong className="text-rose-700 font-bold">{report.critical_failures}</strong></span>
            <span className="text-slate-600 font-medium">High Severity Failures: <strong className="text-amber-800 font-bold">{report.high_failures}</strong></span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            Category Breakdown
          </h3>

          <div className="space-y-2.5">
            {Object.entries(report.category_breakdown).map(([cat, counts]) => (
              <div key={cat} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">{cat.replace('_', ' ')}</span>
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{counts.pass} Pass</span>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{counts.warn} Warn</span>
                  <span className="text-rose-800 bg-rose-100 px-2 py-0.5 rounded">{counts.fail} Fail</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Recommended Next Actions
          </h3>

          <div className="space-y-2.5">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <span className="font-bold text-amber-700 text-xs mt-0.5">{idx + 1}.</span>
                <span className="leading-relaxed font-medium">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
