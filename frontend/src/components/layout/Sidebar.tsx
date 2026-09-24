import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  PlaySquare,
  FileCheck2,
  Settings,
  ShieldCheck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/constants';

interface NavItem {
  name: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Document Library', to: '/documents', icon: Files },
  { name: 'Start Review', to: '/analysis', icon: PlaySquare },
  { name: 'Reports', to: '/reports', icon: FileCheck2 },
  { name: 'Evaluation & Benchmark', to: '/evaluation', icon: BarChart3, badge: '100%' },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between select-none h-screen print-hide"
      aria-label="Sidebar navigation"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-900 text-sky-200 font-bold shadow-sm">
              <ShieldCheck size={20} className="text-sky-300" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                {APP_CONFIG.appName}
              </h1>
              <p className="text-[10px] font-mono font-semibold text-sky-700 leading-none mt-0.5">
                HTH-GA-01 Assistant
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-500 italic leading-snug">
            "{APP_CONFIG.tagline}"
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1" aria-label="Main menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 border-l-4 border-sky-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className="shrink-0 text-slate-500" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Verbatim Citation Guard</span>
          <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>100% Code Verified Active</span>
        </div>
      </div>
    </aside>
  );
};
