import React from 'react';
import { Target, DocumentItem } from '../types';
import { Play, ShieldCheck, Cpu, FileText, CheckCircle2, Layers } from 'lucide-react';

interface Props {
  target: Target | null;
  documents: DocumentItem[];
  apiHealth: { gemini_api_key_set: boolean; gemini_model: string } | null;
  onStartTestRun: () => void;
  isRunning: boolean;
}

export const TargetSetup: React.FC<Props> = ({
  target,
  documents,
  apiHealth,
  onStartTestRun,
  isRunning,
}) => {
  return (
    <div className="space-y-6">
      {/* Target Hero Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                Target AI System
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Audit
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {target?.name || "Enterprise Policy Assistant"}
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              {target?.description || "Enterprise RAG assistant providing corporate policy answers."}
            </p>
          </div>

          <div>
            <button
              onClick={onStartTestRun}
              disabled={isRunning}
              className={`px-5 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors ${
                isRunning
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? "Testing in Progress..." : "START FAILFORGE AUDIT"}
            </button>
          </div>
        </div>

        {/* System Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="flex items-center text-slate-500 text-xs font-semibold gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-slate-700" /> Architecture
            </div>
            <div className="text-slate-900 font-bold text-xs">{target?.target_type || "RAG"} Vector Index</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="flex items-center text-slate-500 text-xs font-semibold gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-slate-700" /> Provider & Model
            </div>
            <div className="text-slate-900 font-bold text-xs">
              Gemini ({apiHealth?.gemini_model || "gemini-2.5-flash"})
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="flex items-center text-slate-500 text-xs font-semibold gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-700" /> Knowledge Base
            </div>
            <div className="text-slate-900 font-bold text-xs">{documents.length} Policy Documents</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="flex items-center text-slate-500 text-xs font-semibold gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" /> Key Status
            </div>
            <div className="text-slate-900 font-bold text-xs">
              {apiHealth?.gemini_api_key_set ? (
                <span className="text-emerald-700">GEMINI_API_KEY Configured</span>
              ) : (
                <span className="text-amber-700">Local Fallback</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Documents Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            Indexed Policy Documents ({documents.length})
          </h3>
          <span className="text-xs text-slate-500">Synthetic Benchmark Suite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {doc.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  v{doc.version}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{doc.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{doc.content_snippet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
