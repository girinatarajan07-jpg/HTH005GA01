import React, { useState } from 'react';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { ExecutiveSummary, ClauseFinding, RiskLevel } from '../../types';

interface ExecutiveSummaryBannerProps {
  summary: ExecutiveSummary | null | undefined;
  clauses?: ClauseFinding[];
  onSelectClause?: (clauseNumber: string) => void;
}

export const ExecutiveSummaryBanner: React.FC<ExecutiveSummaryBannerProps> = ({
  summary,
  clauses: _clauses,
  onSelectClause,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!summary) {
    return null;
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'HIGH':
        return 'text-rose-700 bg-rose-100 border-rose-300';
      case 'MEDIUM':
        return 'text-amber-800 bg-amber-100 border-amber-300';
      default:
        return 'text-emerald-800 bg-emerald-100 border-emerald-300';
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Top Compact KPI Row */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-bold text-sm border ${getRiskColor(
              summary.overall_risk
            )}`}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold">
                Executive Compliance Summary
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(
                  summary.overall_risk
                )}`}
              >
                Overall: {summary.overall_risk} RISK
              </span>
            </div>
            <h2 className="text-sm font-bold text-white mt-0.5">
              {summary.conflict_count} Policy Conflicts Detected Across {summary.total_clauses_analyzed} Audited Clauses
            </h2>
          </div>
        </div>

        {/* Counts Matrix Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 font-mono">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            <span className="text-white font-bold">{summary.critical_count}</span>
            <span className="text-slate-400 text-[11px]">Critical</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 font-mono">
            <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
            <span className="text-white font-bold">{summary.high_count}</span>
            <span className="text-slate-400 text-[11px]">High</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-white font-bold">{summary.medium_count}</span>
            <span className="text-slate-400 text-[11px]">Med</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-white font-bold">{summary.compliant_count}</span>
            <span className="text-slate-400 text-[11px]">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 font-mono">
            <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
            <span className="text-white font-bold">{summary.policy_silent_count}</span>
            <span className="text-slate-400 text-[11px]">Silent</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-white transition-colors"
          >
            <span>{isExpanded ? 'Hide Top Issues' : 'Show Top Issues'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Top 3 Issues Table */}
      {isExpanded && summary.top_issues && summary.top_issues.length > 0 && (
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <TrendingUp size={13} className="text-rose-600" />
              <span>Top 3 Critical Escalation Issues (Requires Immediate Amendment)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Ranked by risk severity & audit exposure
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.top_issues.map((issue) => (
              <div
                key={issue.clause_number}
                onClick={() => onSelectClause && onSelectClause(issue.clause_number)}
                className="rounded-md border border-slate-200 bg-white p-3 space-y-2 shadow-2xs hover:border-sky-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-800 font-mono font-bold text-[10px]">
                      #{issue.recommended_review_priority}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-sky-700">
                      {issue.clause_number}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${getRiskColor(
                      issue.severity
                    )}`}
                  >
                    {issue.severity}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 line-clamp-1" title={issue.issue_title}>
                  {issue.issue_title}
                </h4>

                <div className="space-y-1 text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100">
                  <div className="text-rose-900 truncate" title={`Contract: ${issue.contract_value}`}>
                    <span className="text-slate-400">Contract: </span>
                    <strong className="text-rose-700">{issue.contract_value}</strong>
                  </div>
                  <div className="text-emerald-950 truncate" title={`Policy: ${issue.policy_requirement}`}>
                    <span className="text-slate-400">Policy: </span>
                    <strong className="text-emerald-800">{issue.policy_requirement}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-sky-700 font-semibold flex items-center justify-between pt-1">
                  <span>View in Workspace</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
