import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import type { AnalysisJobStep } from '../../types';

interface ProcessingStatusProps {
  steps: AnalysisJobStep[];
  jobId: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps, jobId }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Analysis In Progress</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Job ID: {jobId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-sky-700" />
          <span className="text-xs font-semibold text-sky-900">Processing live</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step, idx) => {
          const isDone = step.status === 'DONE';
          const isRunning = step.status === 'RUNNING';
          const isFailed = step.status === 'FAILED';

          return (
            <div
              key={step.key || idx}
              className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                isRunning
                  ? 'border-sky-300 bg-sky-50/50'
                  : isDone
                  ? 'border-slate-200 bg-slate-50/40 text-slate-800'
                  : isFailed
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-slate-100 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {isDone && (
                    <CheckCircle2 size={18} className="text-emerald-600" aria-label="Completed" />
                  )}
                  {isRunning && (
                    <Loader2 size={18} className="animate-spin text-sky-700" aria-label="In progress" />
                  )}
                  {isFailed && (
                    <AlertTriangle size={18} className="text-red-600" aria-label="Failed" />
                  )}
                  {!isDone && !isRunning && !isFailed && (
                    <Circle size={16} className="text-slate-300" aria-label="Pending" />
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-semibold ${
                      isRunning
                        ? 'text-sky-950 font-bold'
                        : isDone
                        ? 'text-slate-800'
                        : isFailed
                        ? 'text-red-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                    isRunning
                      ? 'bg-sky-200 text-sky-900'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : isFailed
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
