import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 min-h-[70vh]">
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-500 mb-4 border border-slate-200">
        <FileQuestion size={28} />
      </div>
      <span className="font-mono text-xs font-bold text-sky-800 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
        404 — Not Found
      </span>
      <h1 className="mt-3 text-lg font-bold text-slate-900">
        The requested compliance resource could not be found
      </h1>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The URL path you entered does not exist or the underlying report/job has expired.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline-sky-700"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
