import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import type { Classification, ComplianceOutcome } from '../../types';

interface FindingBadgeProps {
  classification?: Classification;
  outcome?: ComplianceOutcome;
  size?: 'sm' | 'md';
}

export const FindingBadge: React.FC<FindingBadgeProps> = ({
  classification,
  outcome,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 13 : 15;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (outcome) {
    switch (outcome) {
      case 'CONFLICT':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-rose-300 bg-rose-50 text-rose-800 ${padding}`}
          >
            <AlertTriangle size={iconSize} className="text-rose-700 shrink-0" aria-hidden="true" />
            <span>CONFLICT</span>
          </span>
        );
      case 'COMPLIANT':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 ${padding}`}
          >
            <CheckCircle2 size={iconSize} className="text-emerald-700 shrink-0" aria-hidden="true" />
            <span>COMPLIANT</span>
          </span>
        );
      case 'POLICY_SILENT':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-slate-300 bg-slate-100 text-slate-700 ${padding}`}
          >
            <Info size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
            <span>POLICY SILENT</span>
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-amber-300 bg-amber-50 text-amber-800 ${padding}`}
          >
            <AlertCircle size={iconSize} className="text-amber-700 shrink-0" aria-hidden="true" />
            <span>NEEDS REVIEW</span>
          </span>
        );
    }
  }

  switch (classification) {
    case 'EXPLICIT_CONFLICT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-red-200 bg-red-50 text-red-800 ${padding}`}
        >
          <AlertTriangle size={iconSize} className="text-red-700 shrink-0" aria-hidden="true" />
          <span>EXPLICIT CONFLICT</span>
        </span>
      );

    case 'INFERRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-amber-200 bg-amber-50 text-amber-800 ${padding}`}
        >
          <AlertCircle size={iconSize} className="text-amber-700 shrink-0" aria-hidden="true" />
          <span>INFERRED</span>
        </span>
      );

    case 'NO_CONFLICT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 ${padding}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-700 shrink-0" aria-hidden="true" />
          <span>NO CONFLICT</span>
        </span>
      );

    case 'NOT_FOUND':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-slate-200 bg-slate-100 text-slate-700 ${padding}`}
        >
          <HelpCircle size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
          <span>NOT FOUND</span>
        </span>
      );
  }
};
