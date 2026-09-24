import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { CitationStatus } from '../badges/CitationStatus';
import type { PolicyEvidence } from '../../types';

interface EvidenceCardProps {
  evidence: PolicyEvidence;
  onViewSource: (evidence: PolicyEvidence) => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  onViewSource,
}) => {
  // Render text with highlight range if highlight_start & highlight_end are provided
  const renderHighlightedText = () => {
    const text = evidence.text;
    const start = evidence.highlight_start;
    const end = evidence.highlight_end;

    if (
      typeof start === 'number' &&
      typeof end === 'number' &&
      start >= 0 &&
      end <= text.length &&
      start < end
    ) {
      const before = text.slice(0, start);
      const highlighted = text.slice(start, end);
      const after = text.slice(end);

      return (
        <span>
          {before}
          <mark className="bg-amber-100 text-slate-950 font-semibold px-1 py-0.5 rounded">
            {highlighted}
          </mark>
          {after}
        </span>
      );
    }

    return <span>{text}</span>;
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-sky-700 shrink-0" aria-hidden="true" />
          <div>
            <h5 className="text-xs font-bold text-slate-900 leading-tight">
              {evidence.document}
            </h5>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
              <span>Page {evidence.page}</span>
              {evidence.section && (
                <>
                  <span>•</span>
                  <span>{evidence.section}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <CitationStatus citation={evidence.citation} />
          <button
            type="button"
            onClick={() => onViewSource(evidence)}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-sky-700"
          >
            <span>View Source</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Verbatim quote box */}
      <div className="rounded border-l-2 border-l-sky-600 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 font-mono">
        {renderHighlightedText()}
      </div>

      {evidence.citation.note && (
        <p className="text-[11px] text-slate-500 italic">
          Verification citation: {evidence.citation.note}
        </p>
      )}
    </div>
  );
};
