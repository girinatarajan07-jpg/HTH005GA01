export type Classification = 'EXPLICIT_CONFLICT' | 'INFERRED' | 'NO_CONFLICT' | 'NOT_FOUND';
export type Confidence = 'EXPLICITLY_STATED' | 'INFERRED' | 'NOT_FOUND';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_ASSESSED';
export type AnalysisStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type StepStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export type VerificationStatus = 'VERIFIED' | 'SIMILARITY_MATCH' | 'NOT_FOUND' | 'NEEDS_REVIEW';
export type ComplianceOutcome = 'CONFLICT' | 'COMPLIANT' | 'POLICY_SILENT' | 'NEEDS_REVIEW';

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
  version?: string;
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
  status?: VerificationStatus;
  similarity_score?: number | null;
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
  bboxes?: number[][]; // [[x0, y0, x1, y1], ...]
  page_width?: number;
  page_height?: number;
  document_version?: string;
}

// Evidence Chain Interfaces (Priority 5)
export interface ContractStep {
  clause_number: string;
  quotation: string;
  page: number;
}

export interface RetrievalStep {
  document_name: string;
  section?: string;
  page: number;
  method: string;
}

export interface VerificationStep {
  match_status: string;
  page_confirmed: boolean;
  section_confirmed: boolean;
  document_version_confirmed: boolean;
}

export interface ObligationExtraction {
  contract_obligation: string;
  policy_obligation: string;
}

export interface ComparisonStep {
  contract_value: string;
  policy_value: string;
  operator: string;
  comparison_result: string;
  is_conflict: boolean;
}

export interface EvidenceChain {
  contract: ContractStep;
  retrieval?: RetrievalStep;
  verification?: VerificationStep;
  extraction?: ObligationExtraction;
  comparison?: ComparisonStep;
  final_result: string; // 'CONFLICT' | 'COMPLIANT' | 'POLICY_SILENT' | 'NEEDS_REVIEW'
}

export interface TopIssue {
  clause_number: string;
  issue_title: string;
  contract_value: string;
  policy_requirement: string;
  severity: RiskLevel;
  recommended_review_priority: number;
  rationale: string;
}

export interface ExecutiveSummary {
  overall_risk: RiskLevel;
  total_clauses_analyzed: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  compliant_count: number;
  conflict_count: number;
  policy_silent_count: number;
  needs_review_count: number;
  top_issues: TopIssue[];
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
  outcome?: ComplianceOutcome;
  evidence_chain?: EvidenceChain | null;
  contract_obligation?: any;
  policy_obligation?: any;
}

export interface ReportSummary {
  explicit_conflicts: number;
  inferred: number;
  no_conflict: number;
  not_found: number;
  compliant?: number;
  conflict?: number;
  policy_silent?: number;
  needs_review?: number;
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
  executive_summary?: ExecutiveSummary | null;
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

export interface ClauseEvalComparison {
  clause_number: string;
  title: string;
  ground_truth_classification: string;
  predicted_classification: string;
  outcome?: string;
  ground_truth_confidence: string;
  predicted_confidence: string;
  ground_truth_risk: string;
  predicted_risk: string;
  is_conflict: boolean;
  status: 'PASS' | 'DISCREPANCY';
  citation_verified: boolean;
  evidence_count: number;
  citations: {
    text: string;
    verified: boolean;
    status?: string;
    page: number;
    doc: string;
  }[];
  reasoning: string;
}

export interface EvaluationResponse {
  benchmark_name: string;
  target_contract: string;
  total_clauses: number;
  metrics: EvalMetrics;
  confusion_matrix: ConfusionMatrix;
  targets: Record<string, number>;
  clauses: ClauseEvalComparison[];
}

export type EvaluationResult = EvaluationResponse;
