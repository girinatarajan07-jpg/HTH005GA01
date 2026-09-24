import React from 'react';
import { ClauseListItem } from './ClauseListItem';
import type { ClauseFinding, ReviewerDecision } from '../../types';
import { SearchX } from 'lucide-react';

interface ClauseListProps {
  clauses: ClauseFinding[];
  selectedClauseId: string | null;
  decisions: Record<string, ReviewerDecision>;
  onSelectClause: (clauseId: string) => void;
  onClearFilters?: () => void;
}

export const ClauseList: React.FC<ClauseListProps> = ({
  clauses,
  selectedClauseId,
  decisions,
  onSelectClause,
  onClearFilters,
}) => {
  if (clauses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-md border border-slate-200 h-64">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-400 mb-2">
          <SearchX size={20} />
        </div>
        <h4 className="text-xs font-semibold text-slate-800">No matching clauses found</h4>
        <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
          Try adjusting your search query, finding filters, or risk severity filters.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-slate-200 border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm max-h-[calc(100vh-22rem)] overflow-y-auto"
      role="region"
      aria-label="Clauses list"
    >
      {clauses.map((clause) => (
        <ClauseListItem
          key={clause.clause_id}
          clause={clause}
          isSelected={clause.clause_id === selectedClauseId}
          decision={decisions[clause.clause_id]}
          onSelect={onSelectClause}
        />
      ))}
    </div>
  );
};
