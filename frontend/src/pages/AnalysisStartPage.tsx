import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FileText,
  PlaySquare,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { getDocuments, startAnalysis } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { AnalysisPipeline } from '../components/analysis/AnalysisPipeline';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { APP_CONFIG } from '../config/constants';
import { formatBytes } from '../utils/formatters';

export const AnalysisStartPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const policies = data?.policies || [];
  const contract = data?.contract || null;

  const startAnalysisMutation = useMutation({
    mutationFn: startAnalysis,
    onSuccess: (res) => {
      navigate(`/analysis/${res.job_id}`);
    },
  });

  const hasValidPolicyCount =
    policies.length >= APP_CONFIG.minPolicies &&
    policies.length <= APP_CONFIG.maxPolicies;
  const hasContract = contract !== null;
  const isReady = hasValidPolicyCount && hasContract;

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Start Compliance Review"
        subtitle="Review staged documents and initiate evidence-backed clause analysis."
        actions={
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-sky-700"
          >
            <ArrowLeft size={14} className="text-slate-500" />
            <span>Manage Documents</span>
          </button>
        }
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {isLoading && <LoadingState label="Checking document prerequisites..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Failed to retrieve staged documents"
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (
          <>
            {/* Pipeline Architecture Preview */}
            <AnalysisPipeline />

            {/* Document Checklist Card */}
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Documents Staged for Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Contract */}
                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <span>Target Contract</span>
                    {hasContract ? (
                      <span className="flex items-center gap-1 text-emerald-700 text-[11px]">
                        <CheckCircle2 size={13} />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 text-[11px]">
                        <AlertTriangle size={13} />
                        <span>Missing</span>
                      </span>
                    )}
                  </div>
                  {contract ? (
                    <div className="mt-3 flex items-start gap-2.5">
                      <FileText size={18} className="text-sky-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {contract.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatBytes(contract.size_bytes)}
                          {contract.pages ? ` • ${contract.pages} pages` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400 italic">
                      No contract selected. Please upload a contract in Document Library.
                    </p>
                  )}
                </div>

                {/* Policies Checklist */}
                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <span>Policy Corpus ({policies.length})</span>
                    {hasValidPolicyCount ? (
                      <span className="flex items-center gap-1 text-emerald-700 text-[11px]">
                        <CheckCircle2 size={13} />
                        <span>3–5 Policies Staged</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 text-[11px]">
                        <AlertTriangle size={13} />
                        <span>Need 3–5 policies</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {policies.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[10px] text-slate-400 w-4">
                          0{idx + 1}.
                        </span>
                        <span className="font-medium text-slate-800 truncate" title={p.name}>
                          {p.name}
                        </span>
                      </div>
                    ))}
                    {policies.length === 0 && (
                      <p className="text-xs text-slate-400 italic">
                        No policies uploaded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {!isReady && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Prerequisites incomplete: </span>
                    Analysis requires exactly one contract and between 3 and 5 policies.
                    Please visit the Document Library to configure your documents.
                  </div>
                </div>
              )}

              {startAnalysisMutation.isError && (
                <ErrorState
                  error={startAnalysisMutation.error}
                  title="Failed to initiate analysis job"
                  onRetry={() => startAnalysisMutation.mutate()}
                />
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => startAnalysisMutation.mutate()}
                  disabled={!isReady || startAnalysisMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed focus-visible:outline-sky-700 transition-colors"
                >
                  {startAnalysisMutation.isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting Analysis Job...</span>
                    </>
                  ) : (
                    <>
                      <PlaySquare size={15} />
                      <span>Analyze Contract</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
