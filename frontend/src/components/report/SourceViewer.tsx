import React, { useEffect, useRef } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PolicyEvidence } from '../../types';

interface SourceViewerProps {
  evidence: PolicyEvidence | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  evidence,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !evidence) return null;

  const isVerified = evidence.citation?.verified === true;
  const isFailed = evidence.citation?.verified === false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-viewer-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-md bg-white p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800">
              <FileText size={20} aria-hidden="true" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Verified Document Source
              </span>
              <h2 id="source-viewer-title" className="text-sm font-bold text-slate-900 leading-snug">
                {evidence.document}
              </h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 focus-visible:outline-sky-700"
            aria-label="Close source viewer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-4 space-y-4 overflow-y-auto pr-1">
          {/* Metadata banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 font-medium">Page: </span>
                <span className="font-semibold text-slate-800">{evidence.page}</span>
              </div>
              {evidence.section && (
                <div>
                  <span className="text-slate-400 font-medium">Section: </span>
                  <span className="font-semibold text-slate-800">{evidence.section}</span>
                </div>
              )}
            </div>

            <div>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 size={12} className="text-emerald-700" />
                  <span>Exact Match Verified</span>
                </span>
              )}
              {isFailed && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <AlertTriangle size={12} className="text-amber-700" />
                  <span>Unverified Citation</span>
                </span>
              )}
            </div>
          </div>

          {/* Citation Note */}
          {evidence.citation?.note && (
            <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded border border-slate-200">
              <span className="font-semibold text-slate-800">Verification note: </span>
              {evidence.citation.note}
            </div>
          )}

          {/* Verbatim Source Passage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Verbatim Extracted Passage
            </h4>
            <div className="rounded-md border-l-4 border-l-sky-700 border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs leading-relaxed text-slate-900 selection:bg-amber-100">
              {evidence.text}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            Referenced in internal compliance policy vault
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-100 px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-sky-700"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
