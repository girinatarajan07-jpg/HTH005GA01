import React from 'react';
import { CheckCircle2, AlertTriangle, Minus, HelpCircle } from 'lucide-react';
import type { Citation } from '../../types';

interface CitationStatusProps {
  citation: Citation;
  prominent?: boolean;
}

export const CitationStatus: React.FC<CitationStatusProps> = ({
  citation,
  prominent = false,
}) => {
  const iconSize = prominent ? 15 : 13;
  const padding = prominent
    ? 'px-3 py-1.5 text-xs font-semibold'
    : 'px-2 py-0.5 text-xs font-medium';

  // Handle explicit VerificationStatus or boolean verified
  if (citation.status === 'VERIFIED' || citation.verified === true) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border bg-emerald-50 text-emerald-900 border-emerald-300 ${padding}`}
      >
        <CheckCircle2 size={iconSize} className="text-emerald-700 shrink-0" aria-hidden="true" />
        <span>Exact Match (Verified)</span>
      </span>
    );
  }

  if (citation.status === 'SIMILARITY_MATCH') {
    const scorePct = citation.similarity_score != null
      ? `${Math.round(citation.similarity_score * 100)}%`
      : 'Fuzzy';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border bg-amber-50 text-amber-900 border-amber-300 ${padding}`}
      >
        <AlertTriangle size={iconSize} className="text-amber-700 shrink-0" aria-hidden="true" />
        <span>Fuzzy Match ({scorePct} - Unverified)</span>
      </span>
    );
  }

  if (citation.status === 'NEEDS_REVIEW') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border bg-sky-50 text-sky-900 border-sky-300 ${padding}`}
      >
        <HelpCircle size={iconSize} className="text-sky-700 shrink-0" aria-hidden="true" />
        <span>Needs Review</span>
      </span>
    );
  }

  if (citation.status === 'NOT_FOUND' || citation.verified === false) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border bg-rose-50 text-rose-900 border-rose-300 ${padding}`}
      >
        <AlertTriangle size={iconSize} className="text-rose-700 shrink-0" aria-hidden="true" />
        <span>Citation Not Found</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border bg-slate-100 text-slate-700 border-slate-300 ${padding}`}
    >
      <Minus size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
      <span>Policy Silent</span>
    </span>
  );
};
