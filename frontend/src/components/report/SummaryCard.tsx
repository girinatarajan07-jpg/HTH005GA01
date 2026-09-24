import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface SummaryCardProps {
  type: 'conflicts' | 'inferred' | 'no_conflict' | 'not_found';
  count: number | null | undefined;
  isSelected?: boolean;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  type,
  count,
  isSelected = false,
  onClick,
}) => {
  const displayCount = count !== null && count !== undefined ? count : '—';

  const config = {
    conflicts: {
      title: 'Explicit Conflicts',
      icon: AlertTriangle,
      color: 'text-red-700',
      bgColor: 'bg-red-50/70',
      borderColor: isSelected ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200',
      textColor: 'text-red-900',
      desc: 'Direct policy violations requiring amendment',
    },
    inferred: {
      title: 'Inferred Relationships',
      icon: AlertCircle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/70',
      borderColor: isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200',
      textColor: 'text-amber-900',
      desc: 'Potential ambiguity needing human review',
    },
    no_conflict: {
      title: 'No Conflict',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70',
      borderColor: isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-200',
      textColor: 'text-emerald-900',
      desc: 'Compliant with internal corporate standards',
    },
    not_found: {
      title: 'Policy Not Found',
      icon: HelpCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: isSelected ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200',
      textColor: 'text-slate-800',
      desc: 'No matching policy guideline retrieved',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`rounded-md border p-4 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow' : ''
      } ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{config.title}</span>
        <Icon size={16} className={config.color} aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono tracking-tight ${config.textColor}`}>
          {displayCount}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{config.desc}</p>
    </div>
  );
};
