export const APP_CONFIG = {
  appName: 'ClauseGuard',
  code: 'HTH-GA-01',
  tagline: "Every flag is backed by a verbatim quote we verify in code, so if the policy is silent, we say 'not found.'",
  pitch: 'Contract review where every claim has a receipt.',
  minPolicies: 1,
  maxPolicies: 5,
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
  allowedMimeTypes: ['application/pdf'],
  allowedExtensions: ['.pdf'],
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
};

export const PIPELINE_STEPS = [
  { key: 'reading_docs', label: 'Reading documents' },
  { key: 'extracting_clauses', label: 'Extracting contract clauses' },
  { key: 'retrieving_evidence', label: 'Retrieving relevant policy evidence' },
  { key: 'analyzing_clauses', label: 'Analyzing clauses' },
  { key: 'verifying_citations', label: 'Verifying citations' },
  { key: 'preparing_report', label: 'Preparing report' },
] as const;
