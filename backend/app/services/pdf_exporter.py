"""
PDF Exporter Service.
Generates audit-ready compliance PDF reports using ReportLab.
"""

import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.models.schemas import ComplianceReport


def generate_compliance_report_pdf(report: ComplianceReport) -> bytes:
    """
    Renders a complete ComplianceReport as a downloadable PDF document.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
    )
    
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
    )
    
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=6,
    )

    clause_title = ParagraphStyle(
        "ClauseTitle",
        parent=styles["Heading3"],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    code_style = ParagraphStyle(
        "ReportCode",
        parent=styles["Normal"],
        fontSize=8.5,
        leading=12,
        fontName="Helvetica-Oblique",
        textColor=colors.HexColor("#1e3a8a"),
        backColor=colors.HexColor("#f1f5f9"),
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("Contract Compliance Audit Report", title_style))
    elements.append(Paragraph("Grounded Multi-Document Compliance Assistant — Anti-Hallucination Verified", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=12))

    # Meta Info Table
    meta_data = [
        [
            Paragraph("<b>Report ID:</b>", body_style),
            Paragraph(report.report_id, body_style),
            Paragraph("<b>Date Generated:</b>", body_style),
            Paragraph(report.created_at[:19].replace("T", " "), body_style),
        ],
        [
            Paragraph("<b>Contract Analyzed:</b>", body_style),
            Paragraph(report.contract.name, body_style),
            Paragraph("<b>Audit Status:</b>", body_style),
            Paragraph(report.status, body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[100, 180, 90, 160])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # Policies Evaluated
    elements.append(Paragraph("Evaluated Corporate Policies", section_heading))
    policy_names = "<br/>".join([f"• <b>{p.name}</b>" for p in report.policies])
    elements.append(Paragraph(policy_names or "None", body_style))
    elements.append(Spacer(1, 14))

    # Executive Summary Metrics
    if report.summary:
        elements.append(Paragraph("Executive Compliance Summary", section_heading))
        summary_data = [
            [
                Paragraph("<b>Explicit Conflicts</b>", body_style),
                Paragraph("<b>Inferred Gaps</b>", body_style),
                Paragraph("<b>Compliant Clauses</b>", body_style),
                Paragraph("<b>Policy Silent</b>", body_style),
            ],
            [
                Paragraph(f"<font color='#dc2626'><b>{report.summary.explicit_conflicts}</b></font>", body_style),
                Paragraph(f"<font color='#d97706'><b>{report.summary.inferred}</b></font>", body_style),
                Paragraph(f"<font color='#16a34a'><b>{report.summary.no_conflict}</b></font>", body_style),
                Paragraph(f"<font color='#475569'><b>{report.summary.not_found}</b></font>", body_style),
            ],
        ]
        sum_table = Table(summary_data, colWidths=[130, 130, 135, 135])
        sum_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 16))

    # Detailed Clause Findings
    elements.append(Paragraph("Clause-by-Clause Compliance Findings", section_heading))

    for idx, clause in enumerate(report.clauses, start=1):
        elements.append(Spacer(1, 8))
        
        # Color coding header
        risk_color = "#dc2626" if clause.risk_level.value == "HIGH" else ("#d97706" if clause.risk_level.value == "MEDIUM" else "#16a34a")
        badge_header = f"<b>{clause.clause_number}</b> &nbsp;|&nbsp; Status: <b>{clause.classification.value}</b> &nbsp;|&nbsp; Risk: <font color='{risk_color}'><b>{clause.risk_level.value} ({clause.risk_score or 0}/100)</b></font> &nbsp;|&nbsp; Confidence: {clause.confidence.value}"
        elements.append(Paragraph(badge_header, clause_title))
        elements.append(Spacer(1, 3))

        # Contract Clause Text Box
        clause_p = Paragraph(f"<b>Contract Provision:</b><br/>{clause.clause_text}", code_style)
        elements.append(clause_p)
        elements.append(Spacer(1, 4))

        # Explanation
        elements.append(Paragraph(f"<b>Auditor Analysis:</b> {clause.explanation}", body_style))
        elements.append(Spacer(1, 4))

        # Citations / Evidence
        if clause.evidence:
            ev_snippets = []
            for ev in clause.evidence:
                v_badge = "[VERIFIED CITATION]" if ev.citation.verified else "[UNVERIFIED]"
                ev_snippets.append(
                    f"<b>{v_badge}</b> <i>{ev.document} (Page {ev.page}, {ev.section or 'Section'}):</i> \"{ev.text[:220]}...\""
                )
            elements.append(Paragraph(f"<b>Grounding Source Citations:</b><br/>" + "<br/>".join(ev_snippets), body_style))
            elements.append(Spacer(1, 4))

        # Suggested Redline
        if clause.suggested_redline:
            elements.append(Paragraph(f"<b>Suggested Redline Amendment:</b><br/>{clause.suggested_redline}", code_style))
            elements.append(Spacer(1, 6))

        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8))

    doc.build(elements)
    return buffer.getvalue()
