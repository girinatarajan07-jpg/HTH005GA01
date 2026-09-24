import React from 'react';
import { ArrowRight } from 'lucide-react';

const PREVIEW_STEPS = [
  'Document Processing',
  'Clause Extraction',
  'Policy Retrieval',
  'Conflict Analysis',
  'Citation Verification',
  'Compliance Report',
];

export const AnalysisPipeline: React.FC = () => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        Automated Analysis Pipeline
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {PREVIEW_STEPS.map((step, idx) => (
          <div
            key={step}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-700">
                {idx + 1}
              </span>
              <span className="font-medium text-slate-800 leading-tight">{step}</span>
            </div>
            {idx < PREVIEW_STEPS.length - 1 && (
              <ArrowRight size={13} className="text-slate-300 hidden lg:block shrink-0 ml-1" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Every clause is analyzed strictly against your uploaded internal policies. Every finding is verified against verbatim policy passages to eliminate hallucinations.
      </p>
    </div>
  );
};
