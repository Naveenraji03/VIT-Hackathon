import React, { useState } from 'react';
import { FailureCluster, TestResult } from '../types';
import { ShieldAlert, ArrowRight, GitBranch, Layers, ChevronRight, Activity } from 'lucide-react';

interface Props {
  clusters: FailureCluster[];
  allFailures: TestResult[];
  onSelectFailure: (failureId: string) => void;
}

export const FailureMap: React.FC<Props> = ({ clusters, allFailures, onSelectFailure }) => {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    clusters.length > 0 ? clusters[0].id : null
  );

  const activeCluster = clusters.find(c => c.id === selectedClusterId) || clusters[0];

  const clusterFailures = activeCluster
    ? allFailures.filter(f => f.cluster_id === activeCluster.id || activeCluster.failures.some(af => af.id === f.id))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-700" />
              Failure Map & Vulnerability Clusters
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Discovered failure modes grouped by underlying trigger and semantic category.
            </p>
          </div>
          <span className="px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
            {clusters.length} Failure Clusters
          </span>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cluster Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Vulnerability Clusters
          </h3>
          {clusters.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
              No failure clusters discovered yet. Run FailForge test suite.
            </div>
          ) : (
            clusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      cluster.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {cluster.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cluster.failure_count} Failures
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                    {cluster.name}
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                  </h4>

                  <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{cluster.description}</p>

                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                      Variants: {cluster.total_variants}
                    </span>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Reproduction: {cluster.reproduction_rate}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Cluster Visualization & Failure Cards */}
        <div className="lg:col-span-8 space-y-4">
          {activeCluster ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              {/* Cluster Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">CLUSTER DRILLDOWN</span>
                    <h3 className="text-xl font-bold text-slate-900">{activeCluster.name}</h3>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs text-slate-500">Detected Trigger</div>
                    <div className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block mt-1">
                      {activeCluster.trigger}
                    </div>
                  </div>
                </div>
              </div>

              {/* Relationship Flow diagram */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-500 mb-3 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-700" /> Propagation Flow
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">FAILURE TRIGGER</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">{activeCluster.trigger}</div>
                  </div>

                  <div className="hidden md:flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">ADAPTIVE RETESTING</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">{activeCluster.total_variants} Targeted Variants</div>
                  </div>
                </div>
              </div>

              {/* Failures List in Cluster */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  Discovered Failures ({clusterFailures.length})
                </h4>

                <div className="space-y-3">
                  {clusterFailures.map((failure) => (
                    <div
                      key={failure.id}
                      onClick={() => onSelectFailure(failure.id)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-4 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {failure.failure_type || "CONTRADICTION"}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1">
                          Inspect Detail <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 mb-2">
                        Prompt: "{failure.prompt}"
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono leading-relaxed">
                        AI Output: "{failure.model_response}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              Select a cluster to view vulnerability breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
