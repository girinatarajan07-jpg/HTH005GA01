import React from 'react';
import { CheckCircle2, AlertTriangle, Minus } from 'lucide-react';
import type { Citation } from '../../types';

interface CitationStatusProps {
  citation: Citation;
  prominent?: boolean;
}

export const CitationStatus: React.FC<CitationStatusProps> = ({
  citation,
  prominent = false,
}) => {
  if (citation.verified === true) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${
          prominent
            ? 'px-3 py-1.5 text-xs bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
            : 'px-2 py-0.5 text-xs bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}
      >
        <CheckCircle2 size={prominent ? 15 : 13} className="text-emerald-700 shrink-0" aria-hidden="true" />
        <span>Citation Verified</span>
      </span>
    );
  }

  if (citation.verified === false) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${
          prominent
            ? 'px-3 py-1.5 text-xs bg-amber-50 text-amber-900 border-amber-300 font-semibold'
            : 'px-2 py-0.5 text-xs bg-amber-50 text-amber-800 border-amber-200'
        }`}
      >
        <AlertTriangle size={prominent ? 15 : 13} className="text-amber-700 shrink-0" aria-hidden="true" />
        <span>Citation Not Verified</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${
        prominent
          ? 'px-3 py-1.5 text-xs bg-slate-100 text-slate-700 border-slate-300'
          : 'px-2 py-0.5 text-xs bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      <Minus size={prominent ? 15 : 13} className="text-slate-500 shrink-0" aria-hidden="true" />
      <span>Not Applicable</span>
    </span>
  );
};
