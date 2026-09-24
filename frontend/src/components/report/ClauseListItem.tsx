import React from 'react';
import { FindingBadge } from '../badges/FindingBadge';
import { RiskBadge } from '../badges/RiskBadge';
import type { ClauseFinding, ReviewerDecision } from '../../types';
import { CheckCircle } from 'lucide-react';

interface ClauseListItemProps {
  clause: ClauseFinding;
  isSelected: boolean;
  decision?: ReviewerDecision;
  onSelect: (clauseId: string) => void;
}

export const ClauseListItem: React.FC<ClauseListItemProps> = ({
  clause,
  isSelected,
  decision,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(clause.clause_id)}
      className={`w-full text-left p-3.5 border-b border-slate-200 transition-all focus-visible:outline-none focus-visible:bg-sky-50/50 ${
        isSelected
          ? 'bg-sky-50/70 border-l-4 border-l-sky-700 shadow-inner'
          : 'bg-white hover:bg-slate-50'
      }`}
      aria-selected={isSelected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
          {clause.clause_number}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {decision && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
              title={`Reviewer decided: ${decision.decision}`}
            >
              <CheckCircle size={10} />
              <span>Decided</span>
            </span>
          )}
        </div>
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600 leading-relaxed font-normal">
        {clause.clause_text}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <FindingBadge classification={clause.classification} size="sm" />
        <RiskBadge level={clause.risk_level} size="sm" />
      </div>
    </button>
  );
};
