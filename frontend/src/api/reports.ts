import { APP_CONFIG } from '../config/constants';
import { apiClient } from './client';
import { mockAdapter } from './mock/adapter';
import type { ComplianceReport, ClauseFinding } from '../types';

export async function getReports(): Promise<ComplianceReport[]> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getReports();
  }
  return apiClient<ComplianceReport[]>('/reports');
}

export async function getReport(reportId: string): Promise<ComplianceReport> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getReport(reportId);
  }
  return apiClient<ComplianceReport>(`/reports/${reportId}`);
}

export async function getClauseDetails(
  reportId: string,
  clauseId: string
): Promise<ClauseFinding> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getClauseDetails(reportId, clauseId);
  }
  return apiClient<ClauseFinding>(`/reports/${reportId}/clauses/${clauseId}`);
}

export async function exportReport(reportId: string): Promise<Blob> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.exportReport(reportId);
  }
  return apiClient<Blob>(`/reports/${reportId}/export?format=pdf`);
}
