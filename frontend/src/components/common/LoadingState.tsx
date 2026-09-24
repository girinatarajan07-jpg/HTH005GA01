import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading compliance data...',
  sublabel,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      <Loader2
        size={24}
        className="animate-spin text-sky-700 shrink-0"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      {sublabel && (
        <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};
