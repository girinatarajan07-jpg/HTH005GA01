"""
Pydantic Schemas for Grounded Compliance Assistant API.
Matches frontend TypeScript interfaces strictly while providing deterministic
anti-hallucination verification statuses, structured obligation comparisons,
evidence chains, and executive summaries.
"""

from typing import List, Optional, Any, Dict
from enum import Enum
from pydantic import BaseModel, Field


class Classification(str, Enum):
    EXPLICIT_CONFLICT = "EXPLICIT_CONFLICT"
    INFERRED = "INFERRED"
    NO_CONFLICT = "NO_CONFLICT"
    NOT_FOUND = "NOT_FOUND"


class Confidence(str, Enum):
    EXPLICITLY_STATED = "EXPLICITLY_STATED"
    INFERRED = "INFERRED"
    NOT_FOUND = "NOT_FOUND"


class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NOT_ASSESSED = "NOT_ASSESSED"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    SIMILARITY_MATCH = "SIMILARITY_MATCH"
    NOT_FOUND = "NOT_FOUND"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ComplianceOutcome(str, Enum):
    CONFLICT = "CONFLICT"
    COMPLIANT = "COMPLIANT"
    POLICY_SILENT = "POLICY_SILENT"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class AnalysisStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"


class DocumentBase(BaseModel):
    id: str
    name: str
    size_bytes: int
    status: str = "READY"
    pages: Optional[int] = 1
    uploaded_at: Optional[str] = None


class PolicyDocument(DocumentBase):
    type: Optional[str] = "POLICY"
    version: Optional[str] = "1.0"


class ContractDocument(DocumentBase):
    type: Optional[str] = "CONTRACT"


class DocumentsResponse(BaseModel):
    policies: List[PolicyDocument]
    contract: Optional[ContractDocument] = None


class AnalysisJobStep(BaseModel):
    key: str
    label: str
    status: StepStatus = StepStatus.PENDING


class AnalysisJob(BaseModel):
    job_id: str
    status: AnalysisStatus
    steps: List[AnalysisJobStep]
    report_id: Optional[str] = None
    error_message: Optional[str] = None


class Citation(BaseModel):
    verified: bool = False
    status: VerificationStatus = VerificationStatus.NOT_FOUND
    similarity_score: Optional[float] = None
    note: Optional[str] = None


class PolicyEvidence(BaseModel):
    document_id: str
    document: str
    page: int
    section: Optional[str] = None
    text: str
    highlight_start: Optional[int] = None
    highlight_end: Optional[int] = None
    citation: Citation
    bboxes: Optional[List[List[float]]] = None  # [[x0, y0, x1, y1], ...]
    page_width: Optional[float] = None
    page_height: Optional[float] = None
    document_version: Optional[str] = None


# Evidence Chain Models (Priority 5)
class ContractStep(BaseModel):
    clause_number: str
    quotation: str
    page: int = 1


class RetrievalStep(BaseModel):
    document_name: str
    section: Optional[str] = None
    page: int = 1
    method: str = "Hybrid BM25 + TF-IDF RRF"


class VerificationStep(BaseModel):
    match_status: str  # "VERIFIED" | "SIMILARITY_MATCH" | "NOT_FOUND" | "NEEDS_REVIEW"
    page_confirmed: bool = True
    section_confirmed: bool = True
    document_version_confirmed: bool = True


class ObligationExtraction(BaseModel):
    contract_obligation: str
    policy_obligation: str


class ComparisonStep(BaseModel):
    contract_value: str
    policy_value: str
    operator: str
    comparison_result: str
    is_conflict: bool


class EvidenceChain(BaseModel):
    contract: ContractStep
    retrieval: Optional[RetrievalStep] = None
    verification: Optional[VerificationStep] = None
    extraction: Optional[ObligationExtraction] = None
    comparison: Optional[ComparisonStep] = None
    final_result: str  # "CONFLICT" | "COMPLIANT" | "POLICY_SILENT" | "NEEDS_REVIEW"


# Structured Obligation Models (Priority 7)
class PolicyObligation(BaseModel):
    policy_id: str
    document_name: str
    version: str = "1.0"
    section: str
    topic: str
    requirement: str
    value: Optional[Any] = None
    unit: Optional[str] = None
    operator: str = "<="
    severity: RiskLevel = RiskLevel.MEDIUM
    source_page: int = 1
    source_quote: str = ""


class ContractObligation(BaseModel):
    topic: str
    requirement: str
    value: Optional[Any] = None
    unit: Optional[str] = None
    raw_statement: str
    clause_number: str
    page: int = 1


class ClauseFinding(BaseModel):
    clause_id: str
    clause_number: str
    clause_text: str
    classification: Classification
    confidence: Confidence
    risk_level: RiskLevel
    explanation: str
    evidence: List[PolicyEvidence] = Field(default_factory=list)
    suggested_redline: Optional[str] = None
    risk_score: Optional[float] = None
    risk_rationale: Optional[str] = None
    outcome: Optional[ComplianceOutcome] = None
    evidence_chain: Optional[EvidenceChain] = None
    contract_obligation: Optional[ContractObligation] = None
    policy_obligation: Optional[PolicyObligation] = None


# Executive Summary Models (Priority 8)
class TopIssue(BaseModel):
    clause_number: str
    issue_title: str
    contract_value: str
    policy_requirement: str
    severity: RiskLevel
    recommended_review_priority: int  # 1, 2, 3
    rationale: str


class ExecutiveSummary(BaseModel):
    overall_risk: RiskLevel
    total_clauses_analyzed: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    compliant_count: int
    conflict_count: int
    policy_silent_count: int
    needs_review_count: int
    top_issues: List[TopIssue] = Field(default_factory=list)


class ReportSummary(BaseModel):
    explicit_conflicts: int
    inferred: int
    no_conflict: int
    not_found: int
    compliant: Optional[int] = None
    conflict: Optional[int] = None
    policy_silent: Optional[int] = None
    needs_review: Optional[int] = None


class DocumentRef(BaseModel):
    id: str
    name: str


class ComplianceReport(BaseModel):
    report_id: str
    contract: DocumentRef
    created_at: str
    policies: List[DocumentRef]
    status: str = "COMPLETED"
    summary: Optional[ReportSummary] = None
    executive_summary: Optional[ExecutiveSummary] = None
    clauses: List[ClauseFinding] = Field(default_factory=list)


class SystemHealth(BaseModel):
    backend: str = "operational"
    model_status: str = "connected"
    embedding_status: str = "ready"
    timestamp: Optional[str] = None


class SystemConfig(BaseModel):
    retrieval_count: int = 5
    confidence_display: bool = True
    citation_verification: bool = True
    min_policy_count: Optional[int] = 3
    max_policy_count: Optional[int] = 5
    max_file_size_bytes: Optional[int] = 26214400  # 25MB
    version: Optional[str] = "1.0.0"
