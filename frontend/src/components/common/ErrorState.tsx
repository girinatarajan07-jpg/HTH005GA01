import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { AppError } from '../../types';

interface ErrorStateProps {
  error?: AppError | Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Service Temporarily Unavailable',
  message,
  onRetry,
  className = '',
}) => {
  let displayMessage =
    message ||
    (error && 'message' in error ? error.message : null) ||
    'Unable to connect to the compliance analysis service. Please check your network or verify the backend service is running.';

  // Ensure friendly messages, never expose stack traces or raw JSON
  if (displayMessage.toLowerCase().includes('failed to fetch') || displayMessage.includes('NetworkError')) {
    displayMessage = 'Unable to connect to the compliance analysis service. Please verify that the backend API is running and reachable.';
  }

  return (
    <div
      role="alert"
      className={`rounded-md border border-red-200 bg-red-50/60 p-6 text-center shadow-sm ${className}`}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <RefreshCw size={13} className="text-slate-500" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};
