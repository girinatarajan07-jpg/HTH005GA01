import React from 'react';
import { Flame } from 'lucide-react';
import type { ClauseFinding, RiskLevel } from '../../types';

interface RiskHeatmapProps {
  clauses: ClauseFinding[];
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  clauses,
  selectedClauseId,
  onSelectClause,
}) => {
  // Count by risk level
  const counts: Record<RiskLevel, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    NOT_ASSESSED: 0,
  };

  clauses.forEach((c) => {
    counts[c.risk_level] = (counts[c.risk_level] || 0) + 1;
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

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Flame size={14} className="text-rose-600" />
          <span>Contract Risk Heatmap</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="text-red-700 font-bold">{counts.CRITICAL} Critical</span>
          <span>•</span>
          <span className="text-rose-600 font-semibold">{counts.HIGH} High</span>
          <span>•</span>
          <span className="text-amber-700 font-semibold">{counts.MEDIUM} Med</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">{counts.LOW} Low</span>
        </div>
      </div>

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
        <span>Click block to jump to clause</span>
      </div>
    </div>
  );
};
