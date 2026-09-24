import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  AlertTriangle,
  PlaySquare,
} from 'lucide-react';
import { getReports } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

export const ReportsListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: reports, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
  });

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Compliance Reports"
        subtitle="Historical contract compliance reports and clause verification audits."
        actions={
          <button
            type="button"
            onClick={() => navigate('/analysis')}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline-sky-700"
          >
            <PlaySquare size={14} />
            <span>New Review</span>
          </button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {isLoading && <LoadingState label="Loading compliance reports..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Failed to load reports archive"
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && reports && (
          <>
            {reports.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="No compliance reports yet"
                description="Initiate your first contract compliance review to generate a verified, evidence-grounded report."
                action={{
                  label: 'Start New Review',
                  onClick: () => navigate('/analysis'),
                }}
              />
            ) : (
              <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200">
                  {reports.map((report) => (
                    <div
                      key={report.report_id}
                      onClick={() => navigate(`/report/${report.report_id}`)}
                      className="p-5 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {report.report_id}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {report.contract.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDate(report.created_at)}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Layers size={13} className="text-slate-400" />
                            <span>{report.policies.length} policies evaluated</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {report.summary && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2.5 py-1 text-red-800 font-semibold">
                              <AlertTriangle size={12} />
                              <span>{report.summary.explicit_conflicts} Conflicts</span>
                            </span>
                            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-slate-700 font-mono text-[11px]">
                              {report.clauses.length} Clauses
                            </span>
                          </div>
                        )}
                        <ArrowRight size={16} className="text-slate-400 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
