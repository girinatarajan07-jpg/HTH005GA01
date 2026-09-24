import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 leading-normal">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 print-hide">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
