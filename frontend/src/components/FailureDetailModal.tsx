import React from 'react';
import { FailureDetail } from '../types';
import { X, ShieldAlert, FileText, CheckCircle2, XCircle, Terminal, GitBranch } from 'lucide-react';

interface Props {
  failure: FailureDetail | null;
  onClose: () => void;
}

export const FailureDetailModal: React.FC<Props> = ({ failure, onClose }) => {
  if (!failure) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {failure.id}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                {failure.category}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                {failure.severity || 'HIGH'} SEVERITY
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Failure Inspection & Reproduction</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Prompt & Expected vs Actual */}
          <div className="space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Original Failed Prompt</div>
              <div className="text-sm font-bold text-slate-900">"{failure.prompt}"</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg">
                <div className="text-[11px] font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Expected Behavior
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium">{failure.expected_behavior || "System should state active policy."}</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg">
                <div className="text-[11px] font-bold text-rose-800 uppercase mb-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failure Reason
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium">{failure.reason}</div>
              </div>
            </div>
          </div>

          {/* Trigger */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Vulnerability Trigger</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">{failure.trigger || "Conflicting Policy Versions"}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">Evaluator Confidence</div>
              <div className="text-xs font-bold text-slate-900">{Math.round((failure.confidence || 0.92) * 100)}%</div>
            </div>
          </div>

          {/* AI Response Output */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-700" /> AI System Response
            </div>
            <pre className="text-xs text-slate-800 bg-white p-3 rounded-md border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
              {failure.model_response}
            </pre>
          </div>

          {/* Context Excerpts */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-700" /> Evidence Context ({failure.retrieved_chunks.length})
              </span>
              <span className="text-slate-500 font-mono text-[11px] font-normal">Sources: {failure.source_docs.join(", ")}</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {failure.retrieved_chunks.map((chunk, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900 mb-0.5">
                    {chunk.doc_title} (v{chunk.version})
                  </div>
                  <div className="text-slate-600 font-mono text-[11px] leading-relaxed">{chunk.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptive Retesting */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900">Adaptive Retesting</h4>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 font-medium">Variants: <strong className="text-slate-900">{failure.total_variants}</strong></span>
                <span className="text-slate-600 font-medium">Reproduced: <strong className="text-rose-700">{failure.reproduced_count}</strong></span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[11px]">
                  Reproduction: {failure.reproduction_rate}%
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {failure.adaptive_tests.map((adapt) => (
                <div
                  key={adapt.id}
                  className={`p-2.5 rounded-lg border text-xs ${
                    adapt.failure_reproduced
                      ? 'bg-rose-50 border-rose-200 text-slate-800'
                      : 'bg-emerald-50 border-emerald-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-900">Variant: "{adapt.prompt}"</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      adapt.failure_reproduced ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {adapt.failure_reproduced ? 'REPRODUCED' : 'PASSED'}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono mt-0.5">Output: "{adapt.model_response}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
