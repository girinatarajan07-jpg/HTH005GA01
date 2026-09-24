import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, MinusCircle } from 'lucide-react';
import type { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const iconSize = size === 'sm' ? 13 : 15;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (level) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-md border border-red-300 bg-red-100 text-red-900 ${padding}`}
        >
          <ShieldAlert size={iconSize} className="text-red-800 shrink-0" aria-hidden="true" />
          <span>CRITICAL RISK</span>
        </span>
      );

    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md border border-rose-200 bg-rose-50 text-rose-800 ${padding}`}
        >
          <ShieldAlert size={iconSize} className="text-rose-700 shrink-0" aria-hidden="true" />
          <span>HIGH RISK</span>
        </span>
      );

    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-amber-200 bg-amber-50 text-amber-800 ${padding}`}
        >
          <AlertTriangle size={iconSize} className="text-amber-700 shrink-0" aria-hidden="true" />
          <span>MEDIUM RISK</span>
        </span>
      );

    case 'LOW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 ${padding}`}
        >
          <ShieldCheck size={iconSize} className="text-emerald-700 shrink-0" aria-hidden="true" />
          <span>LOW RISK</span>
        </span>
      );

    case 'NOT_ASSESSED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-slate-200 bg-slate-100 text-slate-600 ${padding}`}
        >
          <MinusCircle size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
          <span>NOT ASSESSED</span>
        </span>
      );
  }
};
