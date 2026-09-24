import { APP_CONFIG } from '../config/constants';
import { apiClient } from './client';
import { mockAdapter } from './mock/adapter';
import type { EvaluationResult } from '../types';

export async function getEvaluationMetrics(reportId?: string): Promise<EvaluationResult> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getEvaluationMetrics();
  }
  const url = reportId ? `/evaluation?report_id=${encodeURIComponent(reportId)}` : '/evaluation';
  return apiClient<EvaluationResult>(url);
}

export async function getGroundTruthAnswerKey(): Promise<any> {
  if (APP_CONFIG.useMock) {
    const res = await mockAdapter.getEvaluationMetrics();
    return res;
  }
  return apiClient<any>('/evaluation/ground-truth');
}
