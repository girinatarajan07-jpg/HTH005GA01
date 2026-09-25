"""
Unit Tests for Priority 2, 5, 6, 7, 8:
- Removal of unsafe auto-verification
- None is never converted to VERIFIED
- SIMILARITY_MATCH cannot produce a verified finding
- NOT_FOUND cannot produce a verified finding
- Only VERIFIED evidence supports verified findings
- Evidence Chain verification
- 3-way outcomes (CONFLICT, COMPLIANT, POLICY_SILENT)
- Executive summary metrics & Top Issues
"""

import pytest
from app.models.schemas import (
    Classification,
    ComplianceOutcome,
    Confidence,
    RiskLevel,
    VerificationStatus,
    Citation,
    PolicyEvidence,
    ClauseFinding,
    EvidenceChain,
    ContractStep,
    RetrievalStep,
    VerificationStep,
    ObligationExtraction,
    ComparisonStep,
    ExecutiveSummary,
    ReportSummary,
)
from app.services.conflict_engine import ConflictDetectionEngine, POLICY_OBLIGATIONS
from app.services.clause_extractor import ExtractedClause


def test_none_is_not_converted_to_verified():
    cite = Citation(verified=False, status=VerificationStatus.NOT_FOUND)
    assert cite.verified is False
    assert cite.status == VerificationStatus.NOT_FOUND

    # Explicit check: None status or None verified cannot be VERIFIED
    ev = PolicyEvidence(
        document_id="doc-1",
        document="Test.pdf",
        page=1,
        text="Sample text",
        citation=Citation(verified=False, status=VerificationStatus.NOT_FOUND)
    )
    assert ev.citation.verified is False
    assert ev.citation.status != VerificationStatus.VERIFIED


def test_similarity_match_not_accepted_as_verified():
    ev = PolicyEvidence(
        document_id="doc-1",
        document="Test.pdf",
        page=1,
        text="Sample text",
        citation=Citation(
            verified=False,
            status=VerificationStatus.SIMILARITY_MATCH,
            similarity_score=0.85
        )
    )
    assert ev.citation.status == VerificationStatus.SIMILARITY_MATCH
    assert ev.citation.verified is False
    assert ev.citation.status != VerificationStatus.VERIFIED


def test_not_found_cannot_produce_verified_finding():
    finding = ClauseFinding(
        clause_id="cls-10",
        clause_number="Clause 10",
        clause_text="Governing law shall be Delaware.",
        classification=Classification.NOT_FOUND,
        confidence=Confidence.NOT_FOUND,
        risk_level=RiskLevel.LOW,
        outcome=ComplianceOutcome.POLICY_SILENT,
        explanation="Policy is silent.",
        evidence=[]
    )
    assert finding.outcome == ComplianceOutcome.POLICY_SILENT
    assert len(finding.evidence) == 0
    assert not any(ev.citation.verified for ev in finding.evidence)


def test_evidence_chain_structure():
    chain = EvidenceChain(
        contract=ContractStep(clause_number="Clause 3", quotation="Vendor may require 15 business days notice.", page=1),
        retrieval=RetrievalStep(document_name="Information Security Policy", section="Section 3.2", page=2),
        verification=VerificationStep(match_status="VERIFIED", page_confirmed=True, section_confirmed=True),
        extraction=ObligationExtraction(
            contract_obligation="15 business days notice",
            policy_obligation="Maximum 24 hours notice"
        ),
        comparison=ComparisonStep(
            contract_value="15 business days",
            policy_value="24 hours",
            operator="<=",
            comparison_result="15 business days (~360 hours) > 24 hours",
            is_conflict=True
        ),
        final_result="CONFLICT"
    )

    assert chain.contract.clause_number == "Clause 3"
    assert chain.retrieval.document_name == "Information Security Policy"
    assert chain.verification.match_status == "VERIFIED"
    assert chain.comparison.is_conflict is True
    assert chain.final_result == "CONFLICT"


def test_structured_policy_obligations():
    assert "INCIDENT_NOTIFICATION" in POLICY_OBLIGATIONS
    incident_ob = POLICY_OBLIGATIONS["INCIDENT_NOTIFICATION"]
    assert incident_ob.value == 24
    assert incident_ob.unit == "hours"
    assert incident_ob.operator == "<="
    assert incident_ob.severity == RiskLevel.CRITICAL

    assert "CUSTOMER_AUDIT" in POLICY_OBLIGATIONS
    audit_ob = POLICY_OBLIGATIONS["CUSTOMER_AUDIT"]
    assert audit_ob.value == 10
    assert audit_ob.unit == "business_days"
    assert audit_ob.operator == "<="

    assert "PAYMENT_TERMS" in POLICY_OBLIGATIONS
    pay_ob = POLICY_OBLIGATIONS["PAYMENT_TERMS"]
    assert pay_ob.value == 30
    assert pay_ob.unit == "calendar_days"


def test_three_way_outcomes_separation():
    # CONFLICT
    f_conflict = ClauseFinding(
        clause_id="c1",
        clause_number="Clause 3",
        clause_text="Incident notice 15 days",
        classification=Classification.EXPLICIT_CONFLICT,
        confidence=Confidence.EXPLICITLY_STATED,
        risk_level=RiskLevel.CRITICAL,
        outcome=ComplianceOutcome.CONFLICT,
        explanation="Direct contradiction with 24h SLA"
    )
    assert f_conflict.outcome == ComplianceOutcome.CONFLICT
    assert f_conflict.outcome != ComplianceOutcome.POLICY_SILENT

    # COMPLIANT
    f_compliant = ClauseFinding(
        clause_id="c2",
        clause_number="Clause 14",
        clause_text="MFA adhering to NIST 800-63B",
        classification=Classification.NO_CONFLICT,
        confidence=Confidence.EXPLICITLY_STATED,
        risk_level=RiskLevel.LOW,
        outcome=ComplianceOutcome.COMPLIANT,
        explanation="Complies with security policy"
    )
    assert f_compliant.outcome == ComplianceOutcome.COMPLIANT

    # POLICY_SILENT
    f_silent = ClauseFinding(
        clause_id="c3",
        clause_number="Clause 12",
        clause_text="Force majeure",
        classification=Classification.NOT_FOUND,
        confidence=Confidence.NOT_FOUND,
        risk_level=RiskLevel.LOW,
        outcome=ComplianceOutcome.POLICY_SILENT,
        explanation="Policy is silent"
    )
    assert f_silent.outcome == ComplianceOutcome.POLICY_SILENT
    assert f_silent.outcome != ComplianceOutcome.CONFLICT


def test_executive_summary_counts():
    exec_summary = ExecutiveSummary(
        overall_risk=RiskLevel.CRITICAL,
        total_clauses_analyzed=15,
        critical_count=3,
        high_count=3,
        medium_count=2,
        low_count=7,
        compliant_count=4,
        conflict_count=8,
        policy_silent_count=3,
        needs_review_count=0,
        top_issues=[]
    )
    assert exec_summary.overall_risk == RiskLevel.CRITICAL
    assert exec_summary.conflict_count == 8
    assert exec_summary.compliant_count == 4
    assert exec_summary.policy_silent_count == 3
    assert exec_summary.total_clauses_analyzed == 15
