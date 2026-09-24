import React from 'react';
import { AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants';

export const MockBanner: React.FC = () => {
  if (!APP_CONFIG.useMock) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mock-banner sticky top-0 z-40 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold shadow-sm flex items-center justify-between border-b border-amber-600 print-hide"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <AlertCircle size={16} className="text-slate-950 shrink-0" aria-hidden="true" />
        <span>DEMO DATA – not a real analysis. Running with mock adapters (VITE_USE_MOCK=true).</span>
      </div>
    </div>
  );
};
