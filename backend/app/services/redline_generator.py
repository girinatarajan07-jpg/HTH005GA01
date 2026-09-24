"""
Suggested Redline Language Generator Service.
Generates proposed contract amendments (redlines) for conflicting or deficient clauses.
Returns replacement contract text that directly replaces non-compliant terms with policy-compliant legal terms,
enabling exact visual diffing (insertions vs deletions) in the UI.
"""

import re
from typing import Optional
from app.models.schemas import Classification


def generate_suggested_redline(
    clause_text: str,
    classification: Classification,
    evidence_text: Optional[str] = None
) -> Optional[str]:
    """
    Produces actionable, drop-in replacement redline amendments for contract clauses violating policies.
    """
    if classification not in [Classification.EXPLICIT_CONFLICT, Classification.INFERRED]:
        return None

    clause_lower = clause_text.lower()

    # 1. Payment Terms (Net-90 vs Net-30)
    if "payment" in clause_lower or "invoic" in clause_lower or "ninety (90)" in clause_lower or "90 days" in clause_lower:
        return (
            "Customer agrees to pay all undisputed, valid invoices within thirty (30) calendar days of invoice receipt. "
            "Vendor shall not charge late interest exceeding statutory limits, and no unilateral fee escalation shall apply."
        )

    # 2. Security Incident Notification
    if "incident" in clause_lower or "breach" in clause_lower or "notification" in clause_lower or "notify" in clause_lower:
        return (
            "Vendor shall notify Customer in writing within twenty-four (24) hours of initial discovery of any confirmed "
            "or suspected Security Incident, unauthorized access, or Data Breach. The notification must include root cause, "
            "impacted data records, and immediate mitigations."
        )

    # 3. Audit Rights
    if "audit" in clause_lower or "inspection" in clause_lower:
        return (
            "Customer, or its designated independent certified public accounting firm, reserves the unrestricted right to "
            "conduct an annual on-site or virtual audit of Vendor facilities, security controls, and operational infrastructure "
            "with ten (10) business days prior written notice. Vendor shall furnish annual SOC 2 Type II or ISO 27001 audit certifications."
        )

    # 4. Subprocessor Engagement
    if "subprocessor" in clause_lower or "subcontractor" in clause_lower:
        return (
            "Vendor shall not engage third-party subprocessors without providing at least thirty (30) days prior written notice "
            "to Customer. Customer maintains the explicit right to object to any new subprocessor on data protection and compliance grounds."
        )

    # 5. Limitation of Liability
    if "limitation of liability" in clause_lower or "aggregate liability" in clause_lower or "damages" in clause_lower:
        return (
            "In no event shall Vendor's total aggregate liability cap apply to data privacy breaches, unauthorized disclosure of "
            "confidential information, intellectual property infringement, or gross negligence. Liability for data breach indemnification "
            "must remain uncapped or capped at not less than 5x annual contract value."
        )

    # 6. Data Retention and Deletion
    if "retention" in clause_lower or "deletion" in clause_lower or "archival" in clause_lower or "indefinitely" in clause_lower:
        return (
            "Within thirty (30) calendar days of agreement termination or expiration, Vendor must securely return or permanently "
            "destroy all Customer Data in compliance with NIST SP 800-88 sanitization standards. Written certificate of destruction "
            "signed by an authorized officer must be delivered within five (5) business days thereafter."
        )

    # 7. Vulnerability Patching SLA
    if "vulnerabilit" in clause_lower or "patch" in clause_lower or "cvss" in clause_lower or "quarterly" in clause_lower:
        return (
            "Vendor must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure. "
            "High severity vulnerabilities must be remediated within thirty (30) calendar days. Ordinary release deferrals for critical "
            "patches are strictly prohibited."
        )

    # 8. Security & Encryption Standards
    if "security" in clause_lower or "encryption" in clause_lower or "safeguard" in clause_lower:
        return (
            "Vendor covenants that all sensitive Customer Data must be encrypted at rest using industry-standard AES-256 cipher suites. "
            "All data in transit across public or untrusted networks must be encrypted using Transport Layer Security (TLS) protocol "
            "version 1.3 (or minimum TLS 1.2 with perfect forward secrecy)."
        )

    # 9. Cross-Border Transfers
    if "cross-border" in clause_lower or "transfer" in clause_lower or "jurisdiction" in clause_lower:
        return (
            "All Customer personal data, telemetry, and business records must be stored and processed within data centers located "
            "inside the European Economic Area (EEA). Transfers outside designated regions require prior written Customer consent, "
            "executed Standard Contractual Clauses (SCCs), and a documented Transfer Impact Assessment."
        )

    # Fallback template
    if evidence_text:
        return (
            f"Vendor shall amend this provision to comply with corporate policy: '{evidence_text[:180].strip()}...'"
        )

    return None
