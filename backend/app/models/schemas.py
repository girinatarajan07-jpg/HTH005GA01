"""
Pydantic Schemas for Grounded Compliance Assistant API.
Matches frontend TypeScript interfaces strictly.
"""

from typing import List, Optional
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
    verified: Optional[bool] = True
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


class ReportSummary(BaseModel):
    explicit_conflicts: int
    inferred: int
    no_conflict: int
    not_found: int


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
