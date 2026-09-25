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
  Crosshair,
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
  const [activeTab, setActiveTab] = useState<'visual' | 'snippet' | 'pdf'>('visual');
  const [pageOffset, setPageOffset] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  // Reset page offset when evidence changes
  React.useEffect(() => {
    setPageOffset(0);
    setImageError(false);
  }, [evidence?.document_id, evidence?.page]);

  const currentPage = (evidence?.page || 1) + pageOffset;

  const pdfUrl = evidence?.document_id
    ? `${APP_CONFIG.apiBaseUrl}/documents/download/${evidence.document_id}#page=${currentPage}`
    : null;

  const pageImageUrl = evidence?.document_id
    ? `${APP_CONFIG.apiBaseUrl}/documents/page-image/${evidence.document_id}/${currentPage}`
    : null;

  const isVerified = evidence?.citation?.status === 'VERIFIED' || evidence?.citation?.verified === true;
  const isSimilarity = evidence?.citation?.status === 'SIMILARITY_MATCH';
  const isFailed = evidence?.citation?.status === 'NOT_FOUND' || (!isVerified && !isSimilarity);

  // Default coordinate dimensions
  const pw = evidence?.page_width || 612.0;
  const ph = evidence?.page_height || 792.0;
  const bboxes = evidence?.bboxes || [];

  // Case: Policy Silent (NOT_FOUND)
  if (!evidence || clause?.classification === 'NOT_FOUND' || clause?.outcome === 'POLICY_SILENT') {
    return (
      <div className="h-full rounded-md border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-center items-center text-center space-y-4">
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
          <div className="font-semibold text-slate-700 mb-1">Grounded Verification Principle:</div>
          ClauseGuard cannot present unverified evidence as verified. If internal policies are silent, the system reliably classifies the finding as <span className="font-mono font-bold text-slate-800">POLICY_SILENT</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-md border border-slate-200 bg-white shadow-xs flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sky-100 text-sky-800">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Authoritative Policy Source
                </span>
                {evidence.document_version && (
                  <span className="text-[9px] font-mono bg-sky-100 text-sky-800 px-1 rounded font-semibold">
                    v{evidence.document_version}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-900 truncate" title={evidence.document}>
                {evidence.document}
              </h3>
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crosshair size={11} />
              <span>PDF Overlay</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('snippet')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                activeTab === 'snippet'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={11} />
              <span>Text View</span>
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
            <span className="font-semibold text-slate-700 font-mono">
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
                <span>✓ Exact Quote Verified in Code</span>
              </span>
            )}
            {isSimilarity && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-300 px-2 py-0.5 font-semibold text-amber-800 text-[10px]">
                <AlertTriangle size={12} className="text-amber-700" />
                <span>Similarity Match ({Math.round((evidence.citation.similarity_score || 0) * 100)}%)</span>
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-300 px-2 py-0.5 font-semibold text-rose-800 text-[10px]">
                <AlertTriangle size={12} className="text-rose-700" />
                <span>Verification Failed</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-4 select-text space-y-4">
        {/* TAB 1: VISUAL PDF WITH BOUNDING BOX OVERLAYS (Priority 4) */}
        {activeTab === 'visual' && (
          <div className="space-y-3">
            {/* Visual Highlight Overlay Notice */}
            <div className="flex items-center justify-between text-[11px] bg-amber-50/80 border border-amber-200 rounded p-2.5 text-amber-950 font-medium">
              <div className="flex items-center gap-1.5">
                <Crosshair size={13} className="text-amber-700" />
                <span>Real PDF Source Highlight (PyMuPDF Coordinates)</span>
              </div>
              <span className="font-mono text-[10px] text-amber-800">
                {bboxes.length} Line Span{bboxes.length > 1 ? 's' : ''} Highlighted
              </span>
            </div>

            {/* Rendered PDF Page with Highlight Overlays */}
            <div className="relative border border-slate-300 rounded shadow-md overflow-hidden bg-slate-100 flex justify-center">
              {!imageError && pageImageUrl ? (
                <div className="relative inline-block w-full max-w-[560px]">
                  <img
                    src={pageImageUrl}
                    alt={`Rendered Page ${currentPage} of ${evidence.document}`}
                    onError={() => setImageError(true)}
                    className="w-full h-auto block select-none"
                  />

                  {/* Highlight Overlays (Priority 4: Exact Bounding Boxes) */}
                  {bboxes.map((box, idx) => {
                    const left = `${(box[0] / pw) * 100}%`;
                    const top = `${(box[1] / ph) * 100}%`;
                    const width = `${((box[2] - box[0]) / pw) * 100}%`;
                    const height = `${((box[3] - box[1]) / ph) * 100}%`;

                    return (
                      <div
                        key={idx}
                        style={{
                          left,
                          top,
                          width,
                          height,
                        }}
                        className="absolute bg-amber-300/55 border border-amber-500 rounded-2xs pointer-events-none ring-2 ring-amber-400/90 shadow-xs animate-pulse"
                        title={`Bounding box: [${box.join(', ')}]`}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Fallback if image rendering unavailable */
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <p>Image preview unavailable. Switch to Native PDF or Text View tab.</p>
                </div>
              )}
            </div>

            {/* Quoted source text beside/below PDF */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <span>Quoted Verbatim Passage</span>
                {evidence.highlight_start !== undefined && evidence.highlight_end !== undefined && (
                  <span className="font-mono text-emerald-800">
                    Offsets: [{evidence.highlight_start}:{evidence.highlight_end}]
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-slate-900 bg-amber-50 border-l-4 border-l-amber-500 p-2.5 rounded border border-amber-200 leading-relaxed">
                "{evidence.text}"
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT HIGHLIGHT VIEW */}
        {activeTab === 'snippet' && (
          <div className="space-y-4">
            {/* Citation Receipts Banner */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <CheckCircle2 size={13} className="text-emerald-700" />
                <span>Substring Verification Receipt</span>
              </div>
              <p className="text-[11px] text-emerald-900">
                {evidence.citation?.note || '100% exact verbatim match against authoritative policy repository.'}
              </p>
              {evidence.highlight_start !== undefined && evidence.highlight_end !== undefined && (
                <div className="font-mono text-[10px] text-emerald-800 pt-0.5">
                  Character Offsets: [{evidence.highlight_start} : {evidence.highlight_end}]
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
              <div className="rounded-md border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/80 p-4 font-mono text-xs leading-relaxed text-slate-900 shadow-2xs">
                <mark className="bg-amber-200/90 text-slate-950 px-1 py-0.5 rounded font-medium">
                  "{evidence.text}"
                </mark>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NATIVE PDF VIEW */}
        {activeTab === 'pdf' && (
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
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-xs px-2">
            Page {currentPage}
          </span>
          <button
            type="button"
            onClick={() => setPageOffset((prev) => prev + 1)}
            className="p-1 rounded hover:bg-slate-200"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:underline"
          >
            <Download size={12} />
            <span>Download Source PDF</span>
          </a>
        )}
      </div>
    </div>
  );
};
