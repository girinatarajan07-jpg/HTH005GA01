export type Classification = 'EXPLICIT_CONFLICT' | 'INFERRED' | 'NO_CONFLICT' | 'NOT_FOUND';
export type Confidence = 'EXPLICITLY_STATED' | 'INFERRED' | 'NOT_FOUND';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_ASSESSED';
export type AnalysisStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type StepStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export interface Document {
  id: string;
  name: string;
  size_bytes: number;
  status: 'READY' | 'PROCESSING' | 'ERROR';
  pages?: number;
  uploaded_at?: string;
}

export interface PolicyDocument extends Document {
  type?: 'POLICY';
}

export interface ContractDocument extends Document {
  type?: 'CONTRACT';
}

export interface DocumentsResponse {
  policies: PolicyDocument[];
  contract: ContractDocument | null;
}

export interface AnalysisJobStep {
  key: string;
  label: string;
  status: StepStatus;
}

export interface AnalysisJob {
  job_id: string;
  status: AnalysisStatus;
  steps: AnalysisJobStep[];
  report_id?: string;
  error_message?: string;
}

export interface Citation {
  verified: boolean | null;
  note?: string;
}

export interface PolicyEvidence {
  document_id: string;
  document: string;
  page: number;
  section?: string;
  text: string;
  highlight_start?: number;
  highlight_end?: number;
  citation: Citation;
}

export interface ClauseFinding {
  clause_id: string;
  clause_number: string;
  clause_text: string;
  classification: Classification;
  confidence: Confidence;
  risk_level: RiskLevel;
  explanation: string;
  evidence: PolicyEvidence[];
  suggested_redline?: string | null;
  risk_score?: number | null;
  risk_rationale?: string | null;
}

export interface ReportSummary {
  explicit_conflicts: number;
  inferred: number;
  no_conflict: number;
  not_found: number;
}

export interface ComplianceReport {
  report_id: string;
  contract: {
    id: string;
    name: string;
  };
  created_at: string;
  policies: {
    id: string;
    name: string;
  }[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  summary: ReportSummary | null;
  clauses: ClauseFinding[];
}

export interface SystemHealth {
  backend: string;
  model_status: string;
  embedding_status: string;
  timestamp?: string;
}

export interface SystemConfig {
  retrieval_count: number;
  confidence_display: boolean;
  citation_verification: boolean;
  min_policy_count?: number;
  max_policy_count?: number;
  max_file_size_bytes?: number;
  version?: string;
}

export type ReviewDecisionType = 'ACCEPT' | 'DISMISS' | 'NEEDS_LEGAL_REVIEW';

export interface ReviewerDecision {
  clause_id: string;
  decision: ReviewDecisionType;
  note?: string;
  updated_at: string;
}

export interface AppError {
  kind: 'network' | 'server' | 'validation' | 'not_found';
  message: string;
  status?: number;
}

export interface EvalMetrics {
  recall: number;
  recall_pct: number;
  precision: number;
  precision_pct: number;
  f1_score: number;
  accuracy_pct: number;
  citation_accuracy: number;
  citation_accuracy_pct: number;
  hallucination_rate: number;
  hallucination_rate_pct: number;
  not_found_correctness: number;
  not_found_correctness_pct: number;
  total_citations_checked: number;
  verified_citations: number;
  unverified_citations: number;
}

export interface ConfusionMatrix {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  total: number;
}

export interface EvalClauseComparison {
  clause_number: string;
  title: string;
  ground_truth_classification: Classification;
  predicted_classification: Classification;
  ground_truth_confidence: Confidence;
  predicted_confidence: Confidence;
  ground_truth_risk: RiskLevel;
  predicted_risk: RiskLevel;
  is_conflict: boolean;
  status: 'PASS' | 'DISCREPANCY';
  citation_verified: boolean;
  evidence_count: number;
  citations: { text: string; verified: boolean; page: number; doc: string }[];
  reasoning: string;
}

export interface EvaluationResult {
  benchmark_name: string;
  target_contract: string;
  total_clauses: number;
  metrics: EvalMetrics;
  confusion_matrix: ConfusionMatrix;
  targets: {
    min_recall: number;
    min_precision: number;
    min_not_found_correctness: number;
    target_citation_accuracy: number;
    target_hallucination_rate: number;
  };
  clauses: EvalClauseComparison[];
}
