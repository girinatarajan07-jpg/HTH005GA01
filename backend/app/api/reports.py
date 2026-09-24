"""
Reports API endpoints.
Provides retrieval of compliance reports, clause findings, and PDF export.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Response, status
from app.models.schemas import ComplianceReport, ClauseFinding
from app.services.pdf_exporter import generate_compliance_report_pdf
import app.services.pipeline as pl
from app import config

router = APIRouter(prefix="/reports", tags=["Reports"])


def load_all_persisted_reports():
    """Helper to ensure disk-persisted reports are populated in memory."""
    files = sorted(config.REPORT_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)[:10]
    for report_file in files:
        report_id = report_file.stem
        if report_id not in pl.stored_reports:
            try:
                data = report_file.read_text(encoding="utf-8")
                report = ComplianceReport.model_validate_json(data)
                pl.stored_reports[report_id] = report
            except Exception:
                pass


@router.get("", response_model=List[ComplianceReport])
async def get_reports():
    """
    Returns list of all available compliance audit reports.
    """
    load_all_persisted_reports()
    return list(pl.stored_reports.values())


@router.get("/{report_id}", response_model=ComplianceReport)
async def get_report(report_id: str):
    """
    Returns full structured compliance report including clause-by-clause findings and metrics.
    """
    load_all_persisted_reports()
    report = pl.stored_reports.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )
    return report


@router.get("/{report_id}/clauses/{clause_id}", response_model=ClauseFinding)
async def get_clause_details(report_id: str, clause_id: str):
    """
    Returns a specific clause finding from a compliance report.
    """
    load_all_persisted_reports()
    report = pl.stored_reports.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )

    clause = next((c for c in report.clauses if c.clause_id == clause_id), None)
    if not clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clause '{clause_id}' not found in report '{report_id}'."
        )
    return clause


@router.get("/{report_id}/export")
async def export_report(report_id: str, format: Optional[str] = "pdf"):
    """
    Exports compliance report as a downloadable binary PDF document.
    """
    load_all_persisted_reports()
    report = pl.stored_reports.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )

    pdf_bytes = generate_compliance_report_pdf(report)
    filename = f"Compliance_Audit_Report_{report_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        }
    )
