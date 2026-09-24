import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface FileProgress {
  fileName: string;
  percent: number;
  status: 'uploading' | 'complete' | 'error';
  errorMessage?: string;
}

interface UploadProgressProps {
  progressList: FileProgress[];
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progressList }) => {
  if (progressList.length === 0) return null;

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Upload Progress
      </h5>
      <div className="space-y-2">
        {progressList.map((item) => (
          <div key={item.fileName} className="rounded bg-white p-2.5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800 truncate max-w-xs" title={item.fileName}>
                {item.fileName}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                {item.status === 'uploading' && (
                  <>
                    <Loader2 size={12} className="animate-spin text-sky-700" />
                    <span>{item.percent}%</span>
                  </>
                )}
                {item.status === 'complete' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-sans font-semibold">
                    <CheckCircle2 size={13} />
                    <span>Uploaded</span>
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="flex items-center gap-1 text-red-600 font-sans font-semibold">
                    <AlertTriangle size={13} />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-300 ${
                  item.status === 'error'
                    ? 'bg-red-500'
                    : item.status === 'complete'
                    ? 'bg-emerald-500'
                    : 'bg-sky-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
              />
            </div>
            {item.errorMessage && (
              <p className="mt-1 text-[11px] text-red-600">{item.errorMessage}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
