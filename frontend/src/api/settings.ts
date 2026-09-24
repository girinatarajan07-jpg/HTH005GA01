import { APP_CONFIG } from '../config/constants';
import { apiClient } from './client';
import { mockAdapter } from './mock/adapter';
import type { SystemHealth, SystemConfig } from '../types';

export async function getHealth(): Promise<SystemHealth> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getHealth();
  }
  return apiClient<SystemHealth>('/health');
}

export async function getConfig(): Promise<SystemConfig> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getConfig();
  }
  return apiClient<SystemConfig>('/config');
}
