import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Server,
  Sliders,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getHealth, getConfig } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { APP_CONFIG } from '../config/constants';
import { formatBytes } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  const isLoading = healthQuery.isLoading || configQuery.isLoading;
  const isError = healthQuery.isError || configQuery.isError;
  const error = healthQuery.error || configQuery.error;

  const handleRetry = () => {
    healthQuery.refetch();
    configQuery.refetch();
  };

  const health = healthQuery.data;
  const config = configQuery.data;

  // Format values strictly without inventing: fallback to "Unavailable"
  const backendStatus = health?.backend ?? 'Unavailable';
  const modelStatus = health?.model_status ?? 'Unavailable';
  const embeddingStatus = health?.embedding_status ?? 'Unavailable';
  const retrievalCount =
    config?.retrieval_count !== undefined && config?.retrieval_count !== null
      ? `${config.retrieval_count} passages per clause`
      : 'Unavailable';
  const confidenceDisplay =
    config?.confidence_display !== undefined && config?.confidence_display !== null
      ? config.confidence_display
        ? 'Enabled'
        : 'Disabled'
      : 'Unavailable';
  const citationVerification =
    config?.citation_verification !== undefined && config?.citation_verification !== null
      ? config.citation_verification
        ? 'Strict (Authoritative Grounding)'
        : 'Disabled'
      : 'Unavailable';

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="System Settings & Service Architecture"
        subtitle="Read-only diagnostic telemetry from the FastAPI compliance engine and RAG pipeline."
        actions={
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-sky-700"
          >
            <RefreshCw size={13} className="text-slate-500" />
            <span>Refresh Diagnostics</span>
          </button>
        }
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {isLoading && <LoadingState label="Querying backend health & configuration endpoints..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Backend Service Diagnostic Unavailable"
            onRetry={handleRetry}
          />
        )}

        {!isLoading && (
          <div className="space-y-6">
            {/* Service Environment Card */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Server size={18} className="text-sky-700" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Client Connection & Mode
                  </h2>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    APP_CONFIG.useMock
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {APP_CONFIG.useMock ? 'Mock Adapter Mode' : 'Live API Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Configured API Base URL</span>
                  <span className="font-mono text-slate-800 break-all">
                    {APP_CONFIG.apiBaseUrl || '(Empty — requests made to origin)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Mock Data Toggle (VITE_USE_MOCK)</span>
                  <span className="font-mono text-slate-800">
                    {APP_CONFIG.useMock ? 'true' : 'false'}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Telemetry Section */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck size={18} className="text-emerald-700" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Service Health (GET /health)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Real-time operational status of core compliance engine components
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-700">Backend Status</span>
                  <span
                    className={`font-mono font-medium ${
                      backendStatus === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-emerald-700 font-semibold'
                    }`}
                  >
                    {backendStatus}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-700">Model Status</span>
                  <span
                    className={`font-mono font-medium ${
                      modelStatus === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-slate-800'
                    }`}
                  >
                    {modelStatus}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-700">Embedding Status</span>
                  <span
                    className={`font-mono font-medium ${
                      embeddingStatus === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-slate-800'
                    }`}
                  >
                    {embeddingStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Configuration Parameters Section */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders size={18} className="text-sky-700" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    RAG & Analysis Configuration (GET /config)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Runtime parameters controlling retrieval depth and verification criteria
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">Retrieval Count</span>
                    <span className="text-[11px] text-slate-400">
                      Top-k policy fragments retrieved per contractual clause
                    </span>
                  </div>
                  <span
                    className={`font-mono font-medium ${
                      retrievalCount === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-slate-800'
                    }`}
                  >
                    {retrievalCount}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">Confidence Display</span>
                    <span className="text-[11px] text-slate-400">
                      Surfacing confidence classification badges to reviewers
                    </span>
                  </div>
                  <span
                    className={`font-mono font-medium ${
                      confidenceDisplay === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-slate-800'
                    }`}
                  >
                    {confidenceDisplay}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      Citation Verification
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mandatory secondary string-span verification against indexed documents
                    </span>
                  </div>
                  <span
                    className={`font-mono font-medium ${
                      citationVerification === 'Unavailable'
                        ? 'text-slate-400 italic'
                        : 'text-slate-800'
                    }`}
                  >
                    {citationVerification}
                  </span>
                </div>

                {config?.max_file_size_bytes && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-slate-700">Max Document Size</span>
                    <span className="font-mono text-slate-800">
                      {formatBytes(config.max_file_size_bytes)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
