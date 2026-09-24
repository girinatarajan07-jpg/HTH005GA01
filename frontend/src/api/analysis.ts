import { APP_CONFIG } from '../config/constants';
import { apiClient } from './client';
import { mockAdapter } from './mock/adapter';
import type { AnalysisJob } from '../types';

export async function startAnalysis(): Promise<{ job_id: string }> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.startAnalysis();
  }
  return apiClient<{ job_id: string }>('/analysis', {
    method: 'POST',
  });
}

export async function getAnalysisStatus(jobId: string): Promise<AnalysisJob> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getAnalysisStatus(jobId);
  }
  return apiClient<AnalysisJob>(`/analysis/${jobId}`);
}
