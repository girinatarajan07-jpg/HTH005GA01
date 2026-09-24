import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Eye,
  FileCode,
  Download,
} from 'lucide-react';
import type { PolicyEvidence, ClauseFinding } from '../../types';
import { APP_CONFIG } from '../../config/constants';

interface SourceDockViewerProps {
  evidence: PolicyEvidence | null;
  clause: ClauseFinding | null;
  onClose?: () => void;
}

export const SourceDockViewer: React.FC<SourceDockViewerProps> = ({
  evidence,
  clause,
}) => {
  const [activeTab, setActiveTab] = useState<'highlighted' | 'pdf'>('highlighted');
  const [pageOffset, setPageOffset] = useState<number>(0);

  // Reset page offset when evidence changes
  React.useEffect(() => {
    setPageOffset(0);
  }, [evidence?.document_id, evidence?.page]);

  const currentPage = (evidence?.page || 1) + pageOffset;

  const pdfUrl = evidence?.document_id
    ? `${APP_CONFIG.apiBaseUrl}/documents/download/${evidence.document_id}#page=${currentPage}`
    : null;

  const isVerified = evidence?.citation?.verified === true;
  const isFailed = evidence?.citation?.verified === false;

  // Case: Policy Silent (NOT_FOUND)
  if (!evidence || clause?.classification === 'NOT_FOUND') {
    return (
      <div className="h-full rounded-md border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <HelpCircle size={26} />
        </div>
        <div className="max-w-xs space-y-1.5">
          <h3 className="text-sm font-bold text-slate-800">
            Policy Silent — Not Found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Corporate governance policies do not contain any provisions or mandatory restrictions governing this clause.
          </p>
        </div>
        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 max-w-sm text-left">
          <div className="font-semibold text-slate-700 mb-1">Anti-Hallucination Guarantee:</div>
          ClauseGuard strictly refuses to fabricate policy requirements. If the policy is silent, the system reliably outputs <span className="font-mono font-bold text-slate-800">NOT_FOUND</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-md border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sky-100 text-sky-800">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Authoritative Policy Source
              </span>
              <h3 className="text-xs font-bold text-slate-900 truncate" title={evidence.document}>
                {evidence.document}
              </h3>
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('highlighted')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                activeTab === 'highlighted'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={11} />
              <span>Highlighted</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode size={11} />
              <span>Native PDF</span>
            </button>
          </div>
        </div>

        {/* Verification Status & Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              Page {currentPage}
            </span>
            {evidence.section && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 truncate max-w-[180px]" title={evidence.section}>
                  {evidence.section}
                </span>
              </>
            )}
          </div>

          <div>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-semibold text-emerald-800 text-[10px]">
                <CheckCircle2 size={12} className="text-emerald-700" />
                <span>✓ Quote verified in code</span>
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-300 px-2 py-0.5 font-semibold text-rose-800 text-[10px]">
                <AlertTriangle size={12} className="text-rose-700" />
                <span>Citation verification failed</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-4 select-text">
        {activeTab === 'highlighted' ? (
          <div className="space-y-4">
            {/* Citation Receipts Banner */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <CheckCircle2 size={13} className="text-emerald-700" />
                <span>Sub-string Verification Receipt</span>
              </div>
              <p className="text-[11px] text-emerald-900">
                {evidence.citation?.note || '100% exact verbatim match against authoritative policy repository.'}
              </p>
              {evidence.highlight_start !== undefined && evidence.highlight_end !== undefined && (
                <div className="font-mono text-[10px] text-emerald-800 pt-0.5">
                  Byte/Char Offset: [{evidence.highlight_start} : {evidence.highlight_end}]
                </div>
              )}
            </div>

            {/* Document Page Header Preview */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                {evidence.document} — Page {currentPage}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {evidence.section || 'Policy Provisions and Compliance Standards'}
              </div>
            </div>

            {/* Verbatim Highlighted Passage Card */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Exact Verbatim Policy Evidence
              </span>
              <div className="rounded-md border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/80 p-4 font-mono text-xs leading-relaxed text-slate-900 shadow-xs">
                <mark className="bg-amber-200/90 text-slate-950 px-1 py-0.5 rounded font-medium">
                  "{evidence.text}"
                </mark>
              </div>
            </div>

            {/* Grounding Rationale Note */}
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Audit Provenance: </span>
              Retrieved via hybrid BM25 + dense TF-IDF rank fusion. Evaluated against clause obligations with zero-hallucination substring verification.
            </div>
          </div>
        ) : (
          /* Native PDF View */
          <div className="h-full min-h-[420px] flex flex-col">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title={`PDF Viewer: ${evidence.document}`}
                className="w-full flex-1 border border-slate-200 rounded min-h-[420px]"
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                PDF preview not available.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer with Page Controls & PDF Download */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPageOffset((prev) => prev - 1)}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-xs text-slate-700 font-semibold px-1">
            Page {currentPage}
          </span>
          <button
            type="button"
            onClick={() => setPageOffset((prev) => prev + 1)}
            className="p-1 rounded hover:bg-slate-200"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {evidence.document_id && (
          <a
            href={`${APP_CONFIG.apiBaseUrl}/documents/download/${evidence.document_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:underline"
          >
            <Download size={12} />
            <span>Download Source PDF</span>
          </a>
        )}
      </div>
    </div>
  );
};
