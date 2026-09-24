import { APP_CONFIG } from '../config/constants';
import { apiClient, apiUpload } from './client';
import { mockAdapter } from './mock/adapter';
import type {
  DocumentsResponse,
  PolicyDocument,
  ContractDocument,
} from '../types';

export async function getDocuments(): Promise<DocumentsResponse> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getDocuments();
  }
  return apiClient<DocumentsResponse>('/documents');
}

export async function uploadPolicies(
  files: File[],
  onProgress?: (fileName: string, percent: number) => void
): Promise<PolicyDocument[]> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.uploadPolicies(files, onProgress);
  }

  // Upload policies via multipart/form-data
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return apiUpload<PolicyDocument[]>('/documents/policies', formData, (percent) => {
    if (onProgress && files[0]) {
      onProgress(files[0].name, percent);
    }
  });
}

export async function uploadContract(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ContractDocument> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.uploadContract(file, onProgress);
  }

  const formData = new FormData();
  formData.append('file', file);

  return apiUpload<ContractDocument>('/documents/contract', formData, onProgress);
}

export async function deleteDocument(id: string): Promise<void> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.deleteDocument(id);
  }
  return apiClient<void>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function seedDemoData(): Promise<DocumentsResponse> {
  if (APP_CONFIG.useMock) {
    return mockAdapter.getDocuments();
  }
  return apiClient<DocumentsResponse>('/documents/demo-seed', {
    method: 'POST',
  });
}
