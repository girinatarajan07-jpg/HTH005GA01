import React from 'react';
import { FileText, Trash2, Calendar, Layers } from 'lucide-react';
import type { Document } from '../../types';
import { formatBytes, formatShortDate } from '../../utils/formatters';

interface DocumentCardProps {
  document: Document;
  badgeLabel?: string;
  onDelete?: (id: string, name: string) => void;
  isContract?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  badgeLabel,
  onDelete,
  isContract = false,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
              isContract
                ? 'bg-sky-100 text-sky-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <FileText size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4
              className="text-xs font-semibold text-slate-900 truncate"
              title={document.name}
            >
              {document.name}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>{formatBytes(document.size_bytes)}</span>
              {document.pages !== undefined && (
                <span className="flex items-center gap-1">
                  <Layers size={11} className="text-slate-400" aria-hidden="true" />
                  <span>{document.pages} pages</span>
                </span>
              )}
              {document.uploaded_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" aria-hidden="true" />
                  <span>{formatShortDate(document.uploaded_at)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(document.id, document.name)}
            className="shrink-0 p-1 text-slate-400 hover:text-red-600 rounded transition-colors focus-visible:outline-red-600"
            aria-label={`Remove ${document.name}`}
            title="Remove document"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              document.status === 'READY'
                ? 'bg-emerald-500'
                : document.status === 'PROCESSING'
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
          <span className="capitalize">{document.status.toLowerCase()}</span>
        </span>

        {badgeLabel && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 text-[10px]">
            {badgeLabel}
          </span>
        )}
      </div>
    </div>
  );
};
