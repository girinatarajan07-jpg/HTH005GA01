import { APP_CONFIG } from '../config/constants';
import type { AppError } from '../types';

export class ApiError extends Error implements AppError {
  kind: AppError['kind'];
  status?: number;

  constructor(kind: AppError['kind'], message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError('network', 'The request timed out. Please try again.');
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return new ApiError(
      'network',
      'Unable to connect to the compliance analysis service. Please check your network or verify the backend service is running.'
    );
  }

  if (error instanceof Error) {
    return new ApiError('server', error.message);
  }

  return new ApiError('server', 'An unexpected error occurred while communicating with the server.');
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status} (${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson === 'object') {
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        }
      } catch {
        // Fall back to status text
      }

      if (response.status === 404) {
        throw new ApiError('not_found', errorMessage, 404);
      }
      if (response.status === 400 || response.status === 422) {
        throw new ApiError('validation', errorMessage, response.status);
      }
      if (response.status >= 500) {
        throw new ApiError('server', errorMessage, response.status);
      }
      throw new ApiError('server', errorMessage, response.status);
    }

    // Check for empty body / 204
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      return blob as unknown as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw normalizeError(error);
  }
}

/**
 * Upload helper with XHR to track real per-file progress events
 */
export function apiUpload<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  const baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json as T);
        } catch {
          resolve({} as T);
        }
      } else {
        let message = `Upload failed with status ${xhr.status} (${xhr.statusText})`;
        try {
          const json = JSON.parse(xhr.responseText);
          message = json.detail || json.message || message;
        } catch {
          // Fall back to status text
        }

        if (xhr.status === 400 || xhr.status === 422) {
          reject(new ApiError('validation', message, xhr.status));
        } else if (xhr.status === 404) {
          reject(new ApiError('not_found', message, xhr.status));
        } else {
          reject(new ApiError('server', message, xhr.status));
        }
      }
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          'network',
          'Unable to connect to the compliance analysis service. Please check your network or verify the backend service is running.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(new ApiError('network', 'Upload request timed out. Please try again.'));
    };

    xhr.timeout = 60000; // 60s for large files
    xhr.send(formData);
  });
}
