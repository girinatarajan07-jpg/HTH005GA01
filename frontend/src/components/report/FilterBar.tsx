import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { Classification, RiskLevel } from '../../types';

export interface FilterState {
  search: string;
  classification: Classification | 'ALL';
  risk: RiskLevel | 'ALL';
  sort: 'clause_number' | 'risk' | 'classification';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.classification !== 'ALL' ||
    filters.risk !== 'ALL' ||
    filters.sort !== 'clause_number';

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm space-y-3 print-hide">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search clause text, explanation, or citations..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label="Search clauses"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Classification Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="classification-select" className="text-[11px] font-medium text-slate-500">
              Finding:
            </label>
            <select
              id="classification-select"
              value={filters.classification}
              onChange={(e) =>
                onChange({
                  ...filters,
                  classification: e.target.value as FilterState['classification'],
                })
              }
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Findings</option>
              <option value="EXPLICIT_CONFLICT">Explicit Conflict</option>
              <option value="INFERRED">Inferred</option>
              <option value="NO_CONFLICT">No Conflict</option>
              <option value="NOT_FOUND">Not Found</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="risk-select" className="text-[11px] font-medium text-slate-500">
              Risk:
            </label>
            <select
              id="risk-select"
              value={filters.risk}
              onChange={(e) =>
                onChange({
                  ...filters,
                  risk: e.target.value as FilterState['risk'],
                })
              }
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Risks</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="NOT_ASSESSED">Not Assessed</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-select" className="text-[11px] font-medium text-slate-500">
              Sort:
            </label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) =>
                onChange({
                  ...filters,
                  sort: e.target.value as FilterState['sort'],
                })
              }
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="clause_number">Clause Order</option>
              <option value="risk">Risk Severity</option>
              <option value="classification">Finding Type</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <SlidersHorizontal size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span>
          Showing <span className="font-semibold text-slate-700">{filteredCount}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalCount}</span> clauses
        </span>
        {isFiltered && (
          <span className="text-sky-700 font-medium">Filters active</span>
        )}
      </div>
    </div>
  );
};
