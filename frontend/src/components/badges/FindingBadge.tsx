import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { Classification } from '../../types';

interface FindingBadgeProps {
  classification: Classification;
  size?: 'sm' | 'md';
}

export const FindingBadge: React.FC<FindingBadgeProps> = ({
  classification,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 13 : 15;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

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
