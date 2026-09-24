"""
Tests for Core Pipeline Modules:
- PDF parser
- Smart Chunker
- Semantic Retriever
- Citation Verifier & Anti-Hallucination Guard
- Risk-Severity Scorer & Redlining
- Conflict Detection Engine
- Evaluation Engine
"""

import pytest
from pathlib import Path
from app.services.pdf_parser import parse_pdf
from app.services.chunker import smart_chunk_document_pages
from app.services.clause_extractor import extract_contract_clauses
from app.services.retriever import PolicyRetriever
from app.services.citation_verifier import CitationVerifier
from app.services.risk_scorer import calculate_risk_score
from app.services.redline_generator import generate_suggested_redline
from app.services.conflict_engine import ConflictDetectionEngine
from app.services.eval_engine import run_evaluation, load_answer_key
from app.models.schemas import Classification, Confidence, RiskLevel, ComplianceReport, DocumentRef, ReportSummary
from app import config


def test_pdf_parsing_and_chunking():
    policies_dir = config.SAMPLE_DATA_DIR / "policies"
    policy_files = list(policies_dir.glob("*.pdf"))
    assert len(policy_files) >= 4, "Should have at least 4 sample policy PDFs"

    pages = parse_pdf(policy_files[0], "test-pol", policy_files[0].name)
    assert len(pages) >= 1
    assert "Section" in pages[0].text or len(pages[0].text) > 100

    chunks = smart_chunk_document_pages(pages, target_chunk_size=400, chunk_overlap=80)
    assert len(chunks) >= 1
    for c in chunks:
        assert c.document_id == "test-pol"
        assert c.page_number >= 1
        assert len(c.text) > 0


def test_contract_clause_extraction():
    contracts_dir = config.SAMPLE_DATA_DIR / "contracts"
    contract_files = list(contracts_dir.glob("*.pdf"))
    assert len(contract_files) >= 1

    # Test the primary 15-clause contract
    m_file = next((f for f in contract_files if "CloudScale" in f.name), contract_files[0])
    pages = parse_pdf(m_file, "test-ctr", m_file.name)
    clauses = extract_contract_clauses(pages)
    assert len(clauses) == 15, f"Expected exactly 15 clauses, found {len(clauses)}"
    
    clause_numbers = [c.clause_number for c in clauses]
    assert any("Clause 1" in num for num in clause_numbers)
    assert any("Clause 15" in num for num in clause_numbers)


def test_retriever_and_conflict_engine():
    policies_dir = config.SAMPLE_DATA_DIR / "policies"
    all_chunks = []
    pages_by_doc = {}

    for idx, p_file in enumerate(sorted(policies_dir.glob("*.pdf")), start=1):
        doc_id = f"pol-{idx}"
        pages = parse_pdf(p_file, doc_id, p_file.name)
        pages_by_doc[doc_id] = pages
        chunks = smart_chunk_document_pages(pages)
        all_chunks.extend(chunks)

    retriever = PolicyRetriever(all_chunks)
    verifier = CitationVerifier(pages_by_doc)
    engine = ConflictDetectionEngine(retriever, verifier, use_llm=False)

    c_file = config.SAMPLE_DATA_DIR / "contracts" / "CloudScale_Inc_Master_Services_Agreement.pdf"
    c_pages = parse_pdf(c_file, "ctr-01", c_file.name)
    clauses = extract_contract_clauses(c_pages)

    findings = [engine.analyze_clause(cl) for cl in clauses]
    assert len(findings) == 15

    # Verify explicit conflict detected for incident notification (15 days vs 24h)
    incident_finding = next((f for f in findings if "incident" in f.clause_text.lower()), None)
    assert incident_finding is not None
    assert incident_finding.classification == Classification.EXPLICIT_CONFLICT
    assert incident_finding.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]
    assert incident_finding.risk_score >= 80.0
    assert incident_finding.suggested_redline is not None

    # Verify that all cited evidence is verified verbatim
    for f in findings:
        for ev in f.evidence:
            assert ev.citation.verified is True, f"Unverified citation in {f.clause_number}: {ev.text}"


def test_citation_anti_hallucination_guard():
    policies = list((config.SAMPLE_DATA_DIR / "policies").glob("*.pdf"))
    pages_by_doc = {
        "pol-1": [parse_pdf(policies[0], "pol-1", policies[0].name)[0]]
    }
    verifier = CitationVerifier(pages_by_doc)

    fake_text = "This is a hallucinated phrase that does not exist anywhere in the policy text at all."
    ev = verifier.verify_evidence(
        document_id="pol-1",
        document_name=policies[0].name,
        page_number=1,
        section="Fake Section",
        cited_text=fake_text
    )

    assert ev.citation.verified is False
    assert ev.highlight_start is None
    assert "rejected" in ev.citation.note.lower() or "not an authentic substring" in ev.citation.note.lower()


def test_risk_scorer_and_redline():
    score, level, rationale = calculate_risk_score(Classification.EXPLICIT_CONFLICT, "15 business days breach notice", "Direct contradiction")
    assert level in [RiskLevel.CRITICAL, RiskLevel.HIGH]
    assert score >= 80.0
    assert len(rationale) > 10

    score_low, level_low, rationale_low = calculate_risk_score(Classification.NO_CONFLICT, "Normal service terms", "Aligned")
    assert level_low == RiskLevel.LOW
    assert score_low <= 15.0

    redline = generate_suggested_redline(
        "Vendor shall notify Customer in writing within fifteen (15) business days.",
        Classification.EXPLICIT_CONFLICT
    )
    assert redline is not None
    assert "twenty-four (24) hours" in redline


def test_evaluation_benchmark_engine():
    # Load answer key
    key = load_answer_key()
    assert key is not None
    assert len(key["clauses"]) == 15

    # Run evaluation against latest report
    report_files = sorted(config.REPORT_DIR.glob("*.json"))
    assert len(report_files) >= 1
    report = ComplianceReport.model_validate_json(report_files[-1].read_text("utf-8"))

    eval_result = run_evaluation(report)
    assert eval_result["total_clauses"] == 15
    metrics = eval_result["metrics"]
    assert metrics["citation_accuracy"] == 1.0
    assert metrics["hallucination_rate"] == 0.0
    assert metrics["recall"] >= 0.85
    assert metrics["precision"] >= 0.85
    assert metrics["not_found_correctness"] >= 0.90
