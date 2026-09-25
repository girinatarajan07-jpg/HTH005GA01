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
    ComplianceOutcome,
    Confidence,
    RiskLevel,
    VerificationStatus,
    ExecutiveSummary,
    TopIssue,
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
    """
    Populates default sample documents if in-memory lists are empty.
    """
    global uploaded_policies, uploaded_contract

    policies_dir = config.SAMPLE_DATA_DIR / "policies"
    contracts_dir = config.SAMPLE_DATA_DIR / "contracts"

    if not uploaded_policies and policies_dir.exists():
        pol_files = sorted(policies_dir.glob("*.pdf"))
        for idx, pf in enumerate(pol_files, start=1):
            num_pages = 2
            try:
                import pypdf
                reader = pypdf.PdfReader(str(pf))
                num_pages = len(reader.pages)
            except Exception:
                pass

            uploaded_policies.append(
                PolicyDocument(
                    id=f"pol-{idx:02d}",
                    name=pf.name,
                    size_bytes=pf.stat().st_size,
                    status="READY",
                    pages=num_pages,
                    uploaded_at=datetime.now(timezone.utc).isoformat(),
                    type="POLICY"
                )
            )

    if not uploaded_contract and contracts_dir.exists():
        ctr_files = list(contracts_dir.glob("*.pdf"))
        # Prefer the 15-clause benchmark MSA
        target_ctr = next((f for f in ctr_files if "CloudScale" in f.name), ctr_files[0] if ctr_files else None)
        if target_ctr:
            num_pages = 4
            try:
                import pypdf
                reader = pypdf.PdfReader(str(target_ctr))
                num_pages = len(reader.pages)
            except Exception:
                pass

            uploaded_contract = ContractDocument(
                id="ctr-01",
                name=target_ctr.name,
                size_bytes=target_ctr.stat().st_size,
                status="READY",
                pages=num_pages,
                uploaded_at=datetime.now(timezone.utc).isoformat(),
                type="CONTRACT"
            )


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
            raw_pages_by_doc[pol.name] = pages
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

        # Step 5: Verifying Citations (Priority 2: Strict verification audit)
        update_step_status(job, "verifying_citations", StepStatus.RUNNING)
        await asyncio.sleep(0.2)
        for f in findings:
            valid_evidence = []
            for ev in f.evidence:
                # None or unknown status is NEVER converted to True/VERIFIED.
                if ev.citation and ev.citation.status == VerificationStatus.VERIFIED:
                    valid_evidence.append(ev)
                elif ev.citation and ev.citation.status == VerificationStatus.SIMILARITY_MATCH:
                    # Fuzzy match cannot support verified finding
                    f.outcome = ComplianceOutcome.NEEDS_REVIEW
                    valid_evidence.append(ev)
                else:
                    # NOT_FOUND or failed citations are excluded from verified evidence
                    pass
            f.evidence = valid_evidence

            # If evidence failed completely, downgrade finding
            if not f.evidence and f.classification in [Classification.EXPLICIT_CONFLICT, Classification.INFERRED, Classification.NO_CONFLICT]:
                f.classification = Classification.NOT_FOUND
                f.outcome = ComplianceOutcome.POLICY_SILENT
                f.explanation = "Citation verification failed: cited passage could not be verified in policy text. Downgraded to Policy Silent."

        update_step_status(job, "verifying_citations", StepStatus.DONE)

        # Step 6: Preparing Report (Priority 6 & 8: Executive Summary & 3-way outcomes)
        update_step_status(job, "preparing_report", StepStatus.RUNNING)
        await asyncio.sleep(0.3)

        # Calculate standard 4-way classification counts
        counts = {
            Classification.EXPLICIT_CONFLICT: 0,
            Classification.INFERRED: 0,
            Classification.NO_CONFLICT: 0,
            Classification.NOT_FOUND: 0,
        }
        for f in findings:
            counts[f.classification] = counts.get(f.classification, 0) + 1

        # Calculate 3-way outcome counts
        conflict_count = sum(1 for f in findings if f.outcome == ComplianceOutcome.CONFLICT or f.classification in [Classification.EXPLICIT_CONFLICT, Classification.INFERRED])
        compliant_count = sum(1 for f in findings if f.outcome == ComplianceOutcome.COMPLIANT or f.classification == Classification.NO_CONFLICT)
        policy_silent_count = sum(1 for f in findings if f.outcome == ComplianceOutcome.POLICY_SILENT or f.classification == Classification.NOT_FOUND)
        needs_review_count = sum(1 for f in findings if f.outcome == ComplianceOutcome.NEEDS_REVIEW)

        summary = ReportSummary(
            explicit_conflicts=counts[Classification.EXPLICIT_CONFLICT],
            inferred=counts[Classification.INFERRED],
            no_conflict=counts[Classification.NO_CONFLICT],
            not_found=counts[Classification.NOT_FOUND],
            compliant=compliant_count,
            conflict=conflict_count,
            policy_silent=policy_silent_count,
            needs_review=needs_review_count,
        )

        # Risk level counts
        critical_count = sum(1 for f in findings if f.risk_level == RiskLevel.CRITICAL)
        high_count = sum(1 for f in findings if f.risk_level == RiskLevel.HIGH)
        medium_count = sum(1 for f in findings if f.risk_level == RiskLevel.MEDIUM)
        low_count = sum(1 for f in findings if f.risk_level == RiskLevel.LOW)

        overall_risk = RiskLevel.LOW
        if critical_count > 0:
            overall_risk = RiskLevel.CRITICAL
        elif high_count > 0:
            overall_risk = RiskLevel.HIGH
        elif medium_count > 0:
            overall_risk = RiskLevel.MEDIUM

        # Top 3 High-Priority Issues
        conflict_findings = [f for f in findings if f.outcome == ComplianceOutcome.CONFLICT or f.classification in [Classification.EXPLICIT_CONFLICT, Classification.INFERRED]]
        conflict_findings.sort(key=lambda x: x.risk_score or 0.0, reverse=True)
        top_issues = []
        for rank, f in enumerate(conflict_findings[:3], start=1):
            c_val = f.contract_obligation.value if f.contract_obligation else "Non-compliant contract term"
            p_req = f.policy_obligation.requirement if f.policy_obligation else "Corporate policy standard"
            title = f.explanation.split(".")[0].strip()
            if len(title) > 60:
                title = title[:57] + "..."
            top_issues.append(TopIssue(
                clause_number=f.clause_number,
                issue_title=title,
                contract_value=str(c_val),
                policy_requirement=str(p_req),
                severity=f.risk_level,
                recommended_review_priority=rank,
                rationale=f.risk_rationale or f.explanation
            ))

        exec_summary = ExecutiveSummary(
            overall_risk=overall_risk,
            total_clauses_analyzed=len(findings),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            compliant_count=compliant_count,
            conflict_count=conflict_count,
            policy_silent_count=policy_silent_count,
            needs_review_count=needs_review_count,
            top_issues=top_issues
        )

        report_id = f"rep-{datetime.now(timezone.utc).strftime('%Y-%m%d')}-{uuid.uuid4().hex[:4]}"
        report = ComplianceReport(
            report_id=report_id,
            contract=DocumentRef(id=contract.id, name=contract.name),
            created_at=datetime.now(timezone.utc).isoformat(),
            policies=[DocumentRef(id=p.id, name=p.name) for p in policies],
            status="COMPLETED",
            summary=summary,
            executive_summary=exec_summary,
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
