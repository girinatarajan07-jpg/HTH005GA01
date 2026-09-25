"""
Unit Tests for Priority 1: Citation Verification & Anti-Hallucination Guard.

Tests:
1. Exact match -> VERIFIED
2. Whitespace-normalized match -> VERIFIED
3. Slightly modified text -> must NOT be VERIFIED (SIMILARITY_MATCH / NEEDS_REVIEW)
4. Fuzzy match -> must NOT be VERIFIED
5. No match -> NOT_FOUND
6. Empty citation -> NOT_FOUND
7. Wrong page -> NOT_FOUND (no silent fallback)
8. Wrong document -> NOT_FOUND
"""

import pytest
from app.services.pdf_parser import DocumentPage, TextBlock
from app.services.citation_verifier import CitationVerifier
from app.models.schemas import VerificationStatus


@pytest.fixture
def mock_pages():
    page1_text = (
        "Enterprise Information Security Policy\n"
        "Section 3.2: Security Incident Notification Timelines\n"
        "In the event of a confirmed or suspected Security Incident, unauthorized access, or Data Breach, "
        "any contracted service provider or vendor must notify the Company Information Security Team "
        "in writing within twenty-four (24) hours of initial discovery."
    )
    page2_text = (
        "Section 4.1: Vulnerability Remediation SLAs\n"
        "Vendors must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure."
    )

    p1 = DocumentPage(
        page_number=1,
        text=page1_text,
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        blocks=[TextBlock(page1_text, 50, 50, 550, 150, 0)]
    )
    p2 = DocumentPage(
        page_number=2,
        text=page2_text,
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        blocks=[TextBlock(page2_text, 50, 50, 550, 100, 0)]
    )

    return {
        "doc-infosec-01": [p1, p2],
        "Information_Security_Policy.pdf": [p1, p2]
    }


def test_exact_match_verified(mock_pages):
    verifier = CitationVerifier(mock_pages)
    exact_quote = "within twenty-four (24) hours of initial discovery."
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=1,
        section="Section 3.2",
        cited_text=exact_quote
    )

    assert ev.citation.status == VerificationStatus.VERIFIED
    assert ev.citation.verified is True
    assert ev.citation.similarity_score == 1.0
    assert ev.highlight_start is not None
    assert ev.highlight_end is not None
    assert ev.highlight_end - ev.highlight_start == len(exact_quote)


def test_whitespace_normalized_match_verified(mock_pages):
    verifier = CitationVerifier(mock_pages)
    # Quote with line breaks and varied spacing that exists in source
    normalized_quote = "within  twenty-four (24)   hours\nof initial discovery."
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=1,
        section="Section 3.2",
        cited_text=normalized_quote
    )

    assert ev.citation.status == VerificationStatus.VERIFIED
    assert ev.citation.verified is True
    assert ev.citation.similarity_score == 1.0
    assert ev.highlight_start is not None


def test_slightly_modified_text_must_not_be_verified(mock_pages):
    verifier = CitationVerifier(mock_pages)
    # Changed "twenty-four (24) hours" to "forty-eight (48) hours"
    modified_quote = (
        "In the event of a confirmed or suspected Security Incident, unauthorized access, or Data Breach, "
        "any contracted service provider or vendor must notify the Company Information Security Team "
        "in writing within forty-eight (48) hours of initial discovery."
    )
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=1,
        section="Section 3.2",
        cited_text=modified_quote
    )

    # Must NOT be VERIFIED!
    assert ev.citation.status != VerificationStatus.VERIFIED
    assert ev.citation.verified is False
    assert ev.citation.status == VerificationStatus.SIMILARITY_MATCH
    assert ev.citation.similarity_score is not None
    assert 0.70 <= ev.citation.similarity_score < 1.0
    assert ev.highlight_start is None


def test_fuzzy_match_never_enters_verified_path(mock_pages):
    verifier = CitationVerifier(mock_pages)
    # Paraphrased/hallucinated wording with partial keyword overlap
    fuzzy_quote = (
        "Vendors shall promptly remediate all critical software security vulnerabilities "
        "within 7 calendar days following announcement."
    )
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=2,
        section="Section 4.1",
        cited_text=fuzzy_quote
    )

    assert ev.citation.status != VerificationStatus.VERIFIED
    assert ev.citation.verified is False
    assert ev.highlight_start is None


def test_no_match_not_found(mock_pages):
    verifier = CitationVerifier(mock_pages)
    fake_quote = "Arbitration shall take place in Delaware under AAA rules."
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=1,
        section="Section 9.9",
        cited_text=fake_quote
    )

    assert ev.citation.status == VerificationStatus.NOT_FOUND
    assert ev.citation.verified is False
    assert ev.citation.similarity_score == 0.0
    assert ev.highlight_start is None


def test_empty_citation_not_found(mock_pages):
    verifier = CitationVerifier(mock_pages)
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=1,
        section="Section 1",
        cited_text=""
    )

    assert ev.citation.status == VerificationStatus.NOT_FOUND
    assert ev.citation.verified is False
    assert "empty" in ev.citation.note.lower()


def test_wrong_page_not_found(mock_pages):
    verifier = CitationVerifier(mock_pages)
    # The incident quote is on page 1, querying page 99 must fail and NOT silently fall back to page 1
    quote = "within twenty-four (24) hours of initial discovery."
    ev = verifier.verify_evidence(
        document_id="doc-infosec-01",
        document_name="Information_Security_Policy.pdf",
        page_number=99,
        section="Section 3.2",
        cited_text=quote
    )

    assert ev.citation.status == VerificationStatus.NOT_FOUND
    assert ev.citation.verified is False
    assert "page 99 not found" in ev.citation.note.lower()


def test_wrong_document_not_found(mock_pages):
    verifier = CitationVerifier(mock_pages)
    quote = "within twenty-four (24) hours of initial discovery."
    ev = verifier.verify_evidence(
        document_id="non_existent_doc_id",
        document_name="Non_Existent_Policy.pdf",
        page_number=1,
        section="Section 1",
        cited_text=quote
    )

    assert ev.citation.status == VerificationStatus.NOT_FOUND
    assert ev.citation.verified is False
    assert "not found in ingested documents" in ev.citation.note.lower()
