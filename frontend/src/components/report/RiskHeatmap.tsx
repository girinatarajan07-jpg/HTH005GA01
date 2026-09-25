import React from 'react';
import { Flame, Filter, X } from 'lucide-react';
import type { ClauseFinding, RiskLevel } from '../../types';

export type HeatmapFilterCategory =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'COMPLIANT'
  | 'CONFLICT'
  | 'POLICY_SILENT'
  | 'NEEDS_REVIEW'
  | null;

interface RiskHeatmapProps {
  clauses: ClauseFinding[];
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
  activeFilter?: HeatmapFilterCategory;
  onFilterChange?: (filter: HeatmapFilterCategory) => void;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  clauses,
  selectedClauseId,
  onSelectClause,
  activeFilter,
  onFilterChange,
}) => {
  // Count by risk level
  const counts: Record<RiskLevel, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    NOT_ASSESSED: 0,
  };

  let conflictCount = 0;
  let compliantCount = 0;
  let policySilentCount = 0;
  let needsReviewCount = 0;

  clauses.forEach((c) => {
    counts[c.risk_level] = (counts[c.risk_level] || 0) + 1;
    if (c.outcome === 'CONFLICT' || c.classification === 'EXPLICIT_CONFLICT' || c.classification === 'INFERRED') {
      conflictCount += 1;
    } else if (c.outcome === 'POLICY_SILENT' || c.classification === 'NOT_FOUND') {
      policySilentCount += 1;
    } else if (c.outcome === 'NEEDS_REVIEW') {
      needsReviewCount += 1;
    } else {
      compliantCount += 1;
    }
  });

  const getRiskBg = (level: RiskLevel, isSelected: boolean) => {
    switch (level) {
      case 'CRITICAL':
        return isSelected
          ? 'bg-red-700 text-white ring-2 ring-red-400 ring-offset-1'
          : 'bg-red-600 hover:bg-red-700 text-white';
      case 'HIGH':
        return isSelected
          ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-1'
          : 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'MEDIUM':
        return isSelected
          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 ring-offset-1'
          : 'bg-amber-400 hover:bg-amber-500 text-slate-900';
      case 'LOW':
        return isSelected
          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white';
      default:
        return 'bg-slate-300 text-slate-700';
    }
  };

  const handleFilterClick = (cat: HeatmapFilterCategory) => {
    if (!onFilterChange) return;
    if (activeFilter === cat) {
      onFilterChange(null);
    } else {
      onFilterChange(cat);
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-xs space-y-3">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Flame size={14} className="text-rose-600" />
          <span>Interactive Risk Heatmap</span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleFilterClick('CRITICAL')}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              activeFilter === 'CRITICAL'
                ? 'bg-red-700 text-white ring-1 ring-red-800'
                : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
            }`}
          >
            {counts.CRITICAL} Critical
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('HIGH')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'HIGH'
                ? 'bg-rose-600 text-white ring-1 ring-rose-700'
                : 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {counts.HIGH} High
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('MEDIUM')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white ring-1 ring-amber-700'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            {counts.MEDIUM} Med
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('LOW')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'LOW'
                ? 'bg-emerald-600 text-white ring-1 ring-emerald-700'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {counts.LOW} Low
          </button>

          {/* Outcome Filter Buttons (Priority 9) */}
          <button
            type="button"
            onClick={() => handleFilterClick('CONFLICT')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'CONFLICT'
                ? 'bg-rose-800 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {conflictCount} Conflict
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('COMPLIANT')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'COMPLIANT'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {compliantCount} Compliant
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('POLICY_SILENT')}
            className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              activeFilter === 'POLICY_SILENT'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {policySilentCount} Silent
          </button>
          {needsReviewCount > 0 && (
            <button
              type="button"
              onClick={() => handleFilterClick('NEEDS_REVIEW')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                activeFilter === 'NEEDS_REVIEW'
                  ? 'bg-amber-800 text-white'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              {needsReviewCount} Review
            </button>
          )}

          {activeFilter && (
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange(null)}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-sans font-semibold cursor-pointer"
              title="Clear Active Filter"
            >
              <X size={11} />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded px-2.5 py-1 text-xs text-sky-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Filter size={12} className="text-sky-700" />
            <span>
              Filtering findings by: <strong className="uppercase font-mono">{activeFilter}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onFilterChange && onFilterChange(null)}
            className="text-[11px] text-sky-700 hover:underline font-semibold"
          >
            Show All Clauses
          </button>
        </div>
      )}

      {/* Interactive Heatmap Matrix Cells */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1 pt-1">
        {clauses.map((clause) => {
          const isSelected = clause.clause_id === selectedClauseId;
          const shortNum = clause.clause_number.replace(/clause\s*/i, '');
          return (
            <button
              key={clause.clause_id}
              type="button"
              onClick={() => onSelectClause(clause.clause_id)}
              title={`${clause.clause_number}: ${clause.risk_level} Risk (${clause.risk_score || 0}/100)\n${clause.risk_rationale || clause.explanation}`}
              className={`h-8 rounded flex flex-col items-center justify-center text-[10px] font-bold font-mono transition-all transform active:scale-95 cursor-pointer ${getRiskBg(
                clause.risk_level,
                isSelected
              )}`}
            >
              <span>{shortNum}</span>
              <span className="text-[8px] opacity-80 leading-none">
                {clause.risk_score ? Math.round(clause.risk_score) : ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span>Sequential Contract Clause Order (1–15)</span>
        <span>Click block to jump • Click category pills to filter list</span>
      </div>
    </div>
  );
};
