import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { getAnalysisStatus } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { ProcessingStatus } from '../components/analysis/ProcessingStatus';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';

export const AnalysisStatusPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analysis', jobId],
    queryFn: () => getAnalysisStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false;
      }
      return 1000; // Poll every 1s while active
    },
  });

  // Navigate to report upon completion
  useEffect(() => {
    if (data?.status === 'COMPLETED' && data.report_id) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        navigate(`/report/${data.report_id}`, { replace: true });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [data?.status, data?.report_id, navigate]);

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Processing Compliance Review"
        subtitle="Executing evidence grounding, semantic clause analysis, and citation verification."
        actions={
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-sky-700"
          >
            <XCircle size={14} className="text-slate-400" />
            <span>Cancel / Return</span>
          </button>
        }
      />

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        {isLoading && <LoadingState label="Connecting to analysis job monitor..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Analysis Monitoring Interrupted"
            onRetry={() => refetch()}
          />
        )}

        {data && data.status === 'FAILED' && (
          <ErrorState
            title="Compliance Analysis Pipeline Failed"
            message={
              data.error_message ||
              'The automated review pipeline encountered an error during clause citation verification. Please retry.'
            }
            onRetry={() => refetch()}
          />
        )}

        {data && data.status !== 'FAILED' && (
          <ProcessingStatus steps={data.steps} jobId={jobId!} />
        )}
      </div>
    </div>
  );
};
