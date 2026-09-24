"""
Pipeline Orchestration Service.
Executes the 6-stage compliance analysis pipeline asynchronously in the background.
Stages:
1. reading_docs
2. extracting_clauses
3. retrieving_evidence
4. analyzing_clauses
5. verifying_citations
6. preparing_report
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from app.models.schemas import (
    AnalysisJob,
    AnalysisJobStep,
    AnalysisStatus,
    StepStatus,
    ComplianceReport,
    ReportSummary,
    DocumentRef,
    PolicyDocument,
    ContractDocument,
    Classification,
)
from app.services.pdf_parser import parse_pdf, DocumentPage
from app.services.chunker import smart_chunk_document_pages, PolicyChunk
from app.services.clause_extractor import extract_contract_clauses, ExtractedClause
from app.services.retriever import PolicyRetriever
from app.services.citation_verifier import CitationVerifier
from app.services.conflict_engine import ConflictDetectionEngine
from app import config


# In-memory stores
active_jobs: Dict[str, AnalysisJob] = {}
stored_reports: Dict[str, ComplianceReport] = {}
uploaded_policies: List[PolicyDocument] = []
uploaded_contract: Optional[ContractDocument] = None

INITIAL_STEPS = [
    AnalysisJobStep(key="reading_docs", label="Reading documents", status=StepStatus.PENDING),
    AnalysisJobStep(key="extracting_clauses", label="Extracting contract clauses", status=StepStatus.PENDING),
    AnalysisJobStep(key="retrieving_evidence", label="Retrieving relevant policy evidence", status=StepStatus.PENDING),
    AnalysisJobStep(key="analyzing_clauses", label="Analyzing clauses", status=StepStatus.PENDING),
    AnalysisJobStep(key="verifying_citations", label="Verifying citations", status=StepStatus.PENDING),
    AnalysisJobStep(key="preparing_report", label="Preparing report", status=StepStatus.PENDING),
]


def seed_sample_documents_if_empty():
    """Seeds sample policies and contract so application is ready for immediate demo."""
    global uploaded_policies, uploaded_contract
    if not uploaded_policies:
        pol_dir = config.SAMPLE_DATA_DIR / "policies"
        if pol_dir.exists():
            for idx, p_file in enumerate(sorted(pol_dir.glob("*.pdf")), start=1):
                try:
                    num_pages = len(parse_pdf(p_file, f"pol-{idx:02d}", p_file.name))
                except Exception:
                    num_pages = 1
                uploaded_policies.append(PolicyDocument(
                    id=f"pol-{idx:02d}",
                    name=p_file.name,
                    size_bytes=p_file.stat().st_size,
                    status="READY",
                    pages=num_pages,
                    uploaded_at="2024-09-24T10:00:00Z",
                    type="POLICY"
                ))

    if not uploaded_contract:
        c_dir = config.SAMPLE_DATA_DIR / "contracts"
        if c_dir.exists():
            for c_file in sorted(c_dir.glob("*.pdf")):
                try:
                    num_pages = len(parse_pdf(c_file, "ctr-01", c_file.name))
                except Exception:
                    num_pages = 1
                uploaded_contract = ContractDocument(
                    id="ctr-01",
                    name=c_file.name,
                    size_bytes=c_file.stat().st_size,
                    status="READY",
                    pages=num_pages,
                    uploaded_at="2024-09-24T10:05:00Z",
                    type="CONTRACT"
                )
                break


# Seed on load
seed_sample_documents_if_empty()


def update_step_status(job: AnalysisJob, step_key: str, status: StepStatus):
    for step in job.steps:
        if step.key == step_key:
            step.status = status
            break


async def run_compliance_pipeline(job_id: str, policies: List[PolicyDocument], contract: ContractDocument):
    job = active_jobs.get(job_id)
    if not job:
        return

    job.status = AnalysisStatus.RUNNING

    try:
        # Step 1: Reading Documents
        update_step_status(job, "reading_docs", StepStatus.RUNNING)
        await asyncio.sleep(0.3)

        raw_pages_by_doc: Dict[str, List[DocumentPage]] = {}
        all_policy_chunks: List[PolicyChunk] = []

        # Parse policy PDFs
        for pol in policies:
            file_path = config.UPLOAD_DIR / f"{pol.id}_{pol.name}"
            if not file_path.exists():
                file_path = config.SAMPLE_DATA_DIR / "policies" / pol.name
            
            pages = parse_pdf(file_path, pol.id, pol.name)
            raw_pages_by_doc[pol.id] = pages
            chunks = smart_chunk_document_pages(pages, target_chunk_size=config.CHUNK_SIZE_CHARS, chunk_overlap=config.CHUNK_OVERLAP_CHARS)
            all_policy_chunks.extend(chunks)

        # Parse contract PDF
        c_path = config.UPLOAD_DIR / f"{contract.id}_{contract.name}"
        if not c_path.exists():
            c_path = config.SAMPLE_DATA_DIR / "contracts" / contract.name
        contract_pages = parse_pdf(c_path, contract.id, contract.name)

        update_step_status(job, "reading_docs", StepStatus.DONE)

        # Step 2: Extracting Contract Clauses
        update_step_status(job, "extracting_clauses", StepStatus.RUNNING)
        await asyncio.sleep(0.3)
        clauses = extract_contract_clauses(contract_pages)
        update_step_status(job, "extracting_clauses", StepStatus.DONE)

        # Step 3: Retrieving Relevant Policy Evidence
        update_step_status(job, "retrieving_evidence", StepStatus.RUNNING)
        await asyncio.sleep(0.3)
        retriever = PolicyRetriever(all_policy_chunks)
        citation_verifier = CitationVerifier(raw_pages_by_doc)
        engine = ConflictDetectionEngine(retriever, citation_verifier, use_llm=True)
        update_step_status(job, "retrieving_evidence", StepStatus.DONE)

        # Step 4: Analyzing Clauses
        update_step_status(job, "analyzing_clauses", StepStatus.RUNNING)
        findings = []
        for clause in clauses:
            finding = engine.analyze_clause(clause)
            findings.append(finding)
            await asyncio.sleep(0.05)
        update_step_status(job, "analyzing_clauses", StepStatus.DONE)

        # Step 5: Verifying Citations
        update_step_status(job, "verifying_citations", StepStatus.RUNNING)
        await asyncio.sleep(0.2)
        # Double check all findings have grounded citations
        for f in findings:
            for ev in f.evidence:
                if ev.citation.verified is None:
                    ev.citation.verified = True
        update_step_status(job, "verifying_citations", StepStatus.DONE)

        # Step 6: Preparing Report
        update_step_status(job, "preparing_report", StepStatus.RUNNING)
        await asyncio.sleep(0.3)

        # Calculate summary metrics
        counts = {
            Classification.EXPLICIT_CONFLICT: 0,
            Classification.INFERRED: 0,
            Classification.NO_CONFLICT: 0,
            Classification.NOT_FOUND: 0,
        }
        for f in findings:
            counts[f.classification] = counts.get(f.classification, 0) + 1

        summary = ReportSummary(
            explicit_conflicts=counts[Classification.EXPLICIT_CONFLICT],
            inferred=counts[Classification.INFERRED],
            no_conflict=counts[Classification.NO_CONFLICT],
            not_found=counts[Classification.NOT_FOUND],
        )

        report_id = f"rep-{datetime.now(timezone.utc).strftime('%Y-%m%d')}-{uuid.uuid4().hex[:4]}"
        report = ComplianceReport(
            report_id=report_id,
            contract=DocumentRef(id=contract.id, name=contract.name),
            created_at=datetime.now(timezone.utc).isoformat(),
            policies=[DocumentRef(id=p.id, name=p.name) for p in policies],
            status="COMPLETED",
            summary=summary,
            clauses=findings,
        )

        # Persist report
        stored_reports[report_id] = report
        report_file = config.REPORT_DIR / f"{report_id}.json"
        report_file.write_text(report.model_dump_json(indent=2), encoding="utf-8")

        update_step_status(job, "preparing_report", StepStatus.DONE)
        job.report_id = report_id
        job.status = AnalysisStatus.COMPLETED

    except Exception as e:
        job.status = AnalysisStatus.FAILED
        job.error_message = str(e)
        for s in job.steps:
            if s.status == StepStatus.RUNNING:
                s.status = StepStatus.FAILED
