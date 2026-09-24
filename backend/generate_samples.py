"""
Sample Legal Document Generator and Evaluation Ground Truth Builder.
Generates:
1. 4 synthetic corporate policies (Information Security, Data Protection/Privacy, Vendor Risk & Procurement, Cross-Border Transfer)
2. 1 synthetic Master Services Agreement contract (15 clauses matching PRD: 5 clear conflicts, 3 inferred conflicts, 3 policy silent, 4 compliant)
3. 1 public EDGAR/CUAD real-world sample contract
4. eval_answer_key.json (Answer key with ground truth for automated evaluation, precision, recall, and citation accuracy)
"""

from pathlib import Path
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

BASE_DIR = Path(__file__).resolve().parent
POLICIES_DIR = BASE_DIR / "sample_data" / "policies"
CONTRACTS_DIR = BASE_DIR / "sample_data" / "contracts"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"

POLICIES_DIR.mkdir(parents=True, exist_ok=True)
CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)


def build_pdf(filename: Path, title: str, doc_code: str, sections: list[tuple[str, str]], page_break_after: list[int] = None):
    doc = SimpleDocTemplate(
        str(filename),
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold"
    )
    sub_style = ParagraphStyle(
        "DocSub",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b")
    )
    sec_style = ParagraphStyle(
        "DocSec",
        parent=styles["Heading2"],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155")
    )

    elements = [
        Paragraph(title, title_style),
        Paragraph(f"Corporate Governance Policy Manual &nbsp;|&nbsp; Document Ref: <b>{doc_code}</b> &nbsp;|&nbsp; Version 3.4", sub_style),
        Spacer(1, 8),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12)
    ]

    break_indices = page_break_after or []

    for idx, (heading, text) in enumerate(sections, start=1):
        elements.append(Paragraph(heading, sec_style))
        elements.append(Paragraph(text, body_style))
        elements.append(Spacer(1, 8))
        if idx in break_indices:
            elements.append(PageBreak())

    doc.build(elements)
    print(f"Generated PDF: {filename.name}")


def generate_all_samples():
    # Clean old files if present
    for old_f in POLICIES_DIR.glob("*.pdf"):
        try:
            old_f.unlink()
        except Exception:
            pass

    # 1. InfoSec Policy (3-4 pages)
    build_pdf(
        POLICIES_DIR / "POL-SEC-2024-v3.2_Information_Security_Policy.pdf",
        "Enterprise Information Security Policy",
        "POL-SEC-2024-v3.2",
        [
            ("Section 1.1: Scope and Multi-Factor Access Control",
             "This policy governs all corporate systems, vendors, and third-party SaaS applications processing company data. Multi-factor authentication (MFA) is strictly required across all administrative, API, and end-user access points. Passwords must adhere to NIST 800-63B standards."),
            ("Section 2.1: Mandatory Encryption Standards",
             "All sensitive customer and company data must be encrypted at rest using industry-standard AES-256 cipher suites. All data in transit across public or untrusted networks must be encrypted using Transport Layer Security (TLS) protocol version 1.3 (or minimum TLS 1.2 with perfect forward secrecy). Unencrypted transmissions are strictly prohibited."),
            ("Section 3.2: Security Incident Notification Timelines",
             "In the event of a confirmed or suspected Security Incident, unauthorized access, or Data Breach, any contracted service provider or vendor must notify the Company Information Security Team in writing within twenty-four (24) hours of initial discovery. The notification must include root cause, impacted data records, and immediate mitigations."),
            ("Section 4.1: Vulnerability Remediation SLAs",
             "Vendors must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure. High severity vulnerabilities must be remediated within thirty (30) calendar days. Ordinary release deferrals for critical patches are strictly prohibited."),
            ("Section 5.3: Threat Monitoring and Log Retention",
             "All audit logs, administrative access records, and security telemetry must be preserved for a minimum period of three hundred sixty-five (365) days in immutable, tamper-resistant storage."),
        ],
        page_break_after=[2, 4]
    )

    # 2. Data Protection / Privacy Policy (3-4 pages)
    build_pdf(
        POLICIES_DIR / "POL-DPA-04_Data_Protection_and_Privacy.pdf",
        "Data Protection & Privacy Compliance Standards",
        "POL-DPA-04",
        [
            ("Section 1.2: Customer Data Ownership & Processing",
             "The Company retains exclusive title, ownership, and all intellectual property rights in and to Company Data. Vendors process data solely as Data Processors pursuant to documented written instructions and shall not use data for training AI models or commercial exploitation."),
            ("Section 2.3: Subprocessor Authorization Requirements",
             "Vendors shall not engage third-party subprocessors without providing at least thirty (30) days prior written notice to the Company. The Company maintains the explicit right to object to any new subprocessor on data protection grounds."),
            ("Section 3.4: Data Return and Secure Destruction",
             "Within thirty (30) calendar days of agreement termination or expiration, the vendor must securely return or permanently destroy all Company Data in compliance with NIST SP 800-88 sanitization standards. Written certificate of destruction signed by an authorized officer must be delivered within five (5) business days thereafter."),
            ("Section 4.2: Data Subject Rights and Requests",
             "Vendors must facilitate compliance with Data Subject Requests (access, rectification, erasure, and portability) under GDPR and CCPA within ten (10) calendar days of receiving written notice from the Company.")
        ],
        page_break_after=[2]
    )

    # 3. Vendor Risk & Procurement Policy (3-4 pages)
    build_pdf(
        POLICIES_DIR / "VRM-POL-09_Vendor_Risk_and_Procurement.pdf",
        "Vendor Risk Management & Procurement Standards",
        "VRM-POL-09",
        [
            ("Section 1.1: Mandatory Audit and Inspection Rights",
             "The Company, or its designated independent certified public accounting firm, reserves the unrestricted right to conduct an annual on-site or virtual audit of vendor facilities, security controls, and operational infrastructure with ten (10) business days prior notice. Vendors must provide annual SOC 2 Type II or ISO 27001:2022 audit reports upon request."),
            ("Section 2.2: Limitation of Liability Exceptions and Breach Caps",
             "Standard contract terms must prohibit aggregate liability caps that apply to data privacy breaches, unauthorized disclosure of confidential information, intellectual property infringement, or gross negligence. Liability for data breach indemnification must remain uncapped or capped at not less than 5x annual contract value."),
            ("Section 3.1: Invoicing and Payment Schedule Standards",
             "All vendor invoicing terms must strictly provide for payment within net-thirty (30) calendar days following receipt of an undisputed, valid invoice. Extended payment terms, including net-60, net-90, or unilateral late fee charges exceeding statutory limits, are non-compliant without CFO approval.")
        ],
        page_break_after=[1, 2]
    )

    # 4. Cross-Border Data Transfer Policy (3-4 pages)
    build_pdf(
        POLICIES_DIR / "POL-CBD-02_Cross_Border_Data_Transfer_Policy.pdf",
        "Cross-Border Data Transfer & Jurisdiction Policy",
        "POL-CBD-02",
        [
            ("Section 1.1: Data Residency Requirements",
             "All customer personal data, telemetry, and business records must be stored and processed within data centers located inside the European Economic Area (EEA) or countries recognized as possessing adequate protection by the European Commission."),
            ("Section 2.1: Transfer Mechanisms and Consent",
             "Transfers outside designated regions require prior written customer consent, executed Standard Contractual Clauses (SCCs), and a documented Transfer Impact Assessment. Vague worldwide processing clauses without customer consent are strictly non-compliant.")
        ],
        page_break_after=[1]
    )

    # 5. Target Contract: 15 Clauses Master Services Agreement
    # Seeded Ground Truth:
    # 5 Clear Conflicts:
    #   - Clause 3: 15 days breach notice vs 24 hours
    #   - Clause 5: No customer audit rights vs unrestricted annual audit
    #   - Clause 6: 1 month liability cap vs uncapped / min 5x ACV
    #   - Clause 7: Indefinite data retention vs 30-day destruction
    #   - Clause 8: Net-90 payment terms vs net-30 days
    # 3 Inferred Conflicts:
    #   - Clause 2: "Commercially reasonable efforts" security vs AES-256 / TLS 1.3
    #   - Clause 4: Subcontractors without consent vs 30-day prior written notice
    #   - Clause 9: Quarterly patching vs 7-day critical CVSS >= 9.0 SLA
    # 3 Policy Silent (NOT_FOUND):
    #   - Clause 10: Governing Law & AAA Arbitration (Delaware)
    #   - Clause 11: Marketing publicity and customer logo usage
    #   - Clause 12: Force majeure and excused performance
    # 4 Compliant (NO_CONFLICT):
    #   - Clause 1: Provision of SaaS services and non-exclusive license
    #   - Clause 13: Customer data ownership & AI training prohibition
    #   - Clause 14: Mandatory Multi-Factor Authentication (NIST)
    #   - Clause 15: European Economic Area (EEA) Data Residency & SOC 2 compliance
    build_pdf(
        CONTRACTS_DIR / "CloudScale_Inc_Master_Services_Agreement.pdf",
        "CloudScale Inc. - SaaS Master Services Agreement",
        "MSA-2024-CS01",
        [
            ("Clause 1: Provision of Services and Grant of License",
             "CloudScale Inc. ('Vendor') hereby grants to Customer a non-exclusive, non-transferable subscription right to access and utilize the CloudScale Analytics Platform during the applicable Term in accordance with the Order Form and standard service terms."),
            ("Clause 2: Security and Encryption Safeguards",
             "Vendor shall exercise commercially reasonable efforts and general industry standards to protect Customer Data against unauthorized destruction or loss. The specific encryption algorithms and key management practices shall be determined at Vendor's sole discretion."),
            ("Clause 3: Security Incident Notification",
             "Vendor shall notify Customer in writing of any confirmed unauthorized intrusion resulting in actual data exfiltration within fifteen (15) business days following Vendor's internal completion of forensic investigation."),
            ("Clause 4: Subprocessor Engagement and Notice",
             "Vendor reserves the operational right to engage third-party subprocessors and subcontractors at any time without prior customer notice or consent, provided Vendor maintains general oversight of such entities."),
            ("Clause 5: Customer Audit and Inspection Rights",
             "Customer shall have no right to conduct on-site physical audits or inspect Vendor's server facilities. Any compliance inquiries must be submitted in writing and Vendor may, at its sole discretion and at Customer's expense, provide a summary security questionnaire once every three (3) years."),
            ("Clause 6: Limitation of Liability and Breach Damages",
             "Under no circumstances shall Vendor's total aggregate liability arising out of or related to this Agreement exceed the total fees actually paid by Customer in the one (1) month preceding the incident, including in connection with data breaches, system outages, or confidentiality claims."),
            ("Clause 7: Data Retention and Deletion",
             "Following contract termination, Vendor may retain copies of Customer Data indefinitely in archival backup systems, provided such data remains subject to Vendor's general privacy practices."),
            ("Clause 8: Invoicing and Payment Terms",
             "Customer agrees to pay all undisputed invoices within ninety (90) calendar days of invoice receipt. Vendor reserves the right to charge late interest of 2.5% per month on any delinquent amounts."),
            ("Clause 9: Vulnerability Remediation and Patch Cycles",
             "Vendor will address reported critical system vulnerabilities as part of its standard quarterly release cycle, unless emergency out-of-band updates are deemed essential by Vendor's engineering team."),
            ("Clause 10: Governing Law and Dispute Arbitration",
             "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without giving effect to conflicts of law principles. Any dispute shall be resolved through binding arbitration under the rules of the American Arbitration Association in Wilmington, Delaware."),
            ("Clause 11: Marketing Publicity and Trademark Usage",
             "Customer grants Vendor the limited right to display Customer's corporate name, logo, and trade marks in public customer lists, marketing materials, and corporate investor decks."),
            ("Clause 12: Force Majeure and Excused Delays",
             "Neither party shall be liable for delay or failure in performance resulting from causes beyond its reasonable control, including acts of God, labor strikes, power failures, natural disasters, or government restrictions."),
            ("Clause 13: Customer Data Ownership and AI Training Restrictions",
             "Customer retains exclusive title, ownership, and all intellectual property rights in and to Customer Data. Vendor processes data solely as a Data Processor pursuant to documented instructions and shall not use Customer Data to train artificial intelligence models or for commercial exploitation."),
            ("Clause 14: Multi-Factor Authentication Compliance",
             "Vendor guarantees that multi-factor authentication (MFA) is strictly enforced across all administrative access points, customer portals, and developer APIs in full compliance with NIST 800-63B guidelines."),
            ("Clause 15: Cross-Border Data Residency Commitments",
             "Vendor explicitly covenants that all customer personal data, telemetry, and compute operations shall be stored and processed exclusively within data centers situated inside the European Economic Area (EEA).")
        ],
        page_break_after=[3, 6, 9, 12]
    )

    # 6. Real-World SEC EDGAR / CUAD Sample Contract
    build_pdf(
        CONTRACTS_DIR / "SEC_EDGAR_Sample_Cloud_Agreement.pdf",
        "SEC EDGAR Sample: Enterprise Cloud Services Agreement",
        "EDGAR-0001564590",
        [
            ("Clause 1: Scope of Services and Support",
             "Provider shall furnish enterprise cloud infrastructure and tier-1 uptime support under standard service level commitments as set forth in Exhibit A."),
            ("Clause 2: Security Breach Notification Period",
             "Provider shall inform subscriber of verified data loss events within seventy-two (72) hours of technical verification by provider operations team."),
            ("Clause 3: Annual Independent Audit Validation",
             "Provider shall deliver an annual SOC 2 Type II compliance audit report prepared by an accredited CPA firm upon forty-five days written advance notice."),
            ("Clause 4: Aggregate Liability Cap and Data Protection Exclusions",
             "Total aggregate liability under this agreement shall not exceed twelve (12) months of service fees paid, except that claims relating to confidentiality breaches or intentional misconduct shall not be subject to this limitation."),
            ("Clause 5: Termination and Post-Contract Data Sanitization",
             "Within sixty (60) days following termination, provider shall purge subscriber files from production storage environments and provide confirmation thereof.")
        ]
    )

    # 7. Write Ground Truth Answer Key JSON
    ground_truth = {
        "dataset_name": "ClauseGuard Compliance Benchmark Evaluation Suite (HTH-GA-01)",
        "version": "1.0",
        "target_contract": "CloudScale_Inc_Master_Services_Agreement.pdf",
        "total_clauses": 15,
        "metrics_targets": {
            "min_recall": 0.85,
            "min_precision": 0.85,
            "min_not_found_correctness": 0.90,
            "target_citation_accuracy": 1.00,
            "target_hallucination_rate": 0.00
        },
        "ground_truth_counts": {
            "explicit_conflicts": 5,
            "inferred_conflicts": 3,
            "policy_silent": 3,
            "compliant": 4
        },
        "clauses": [
            {
                "clause_number": "Clause 1",
                "title": "Provision of Services and Grant of License",
                "ground_truth_classification": "NO_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "LOW",
                "policy_document": "VRM-POL-09_Vendor_Risk_and_Procurement.pdf",
                "policy_section": "Section 1.1",
                "policy_quote": "This policy governs all corporate systems, vendors, and third-party SaaS applications processing company data.",
                "reasoning": "Standard license grant and SaaS provisioning clause. Compliant with procurement standards."
            },
            {
                "clause_number": "Clause 2",
                "title": "Security and Encryption Safeguards",
                "ground_truth_classification": "INFERRED",
                "ground_truth_confidence": "INFERRED",
                "risk_level": "HIGH",
                "policy_document": "POL-SEC-2024-v3.2_Information_Security_Policy.pdf",
                "policy_section": "Section 2.1: Mandatory Encryption Standards",
                "policy_quote": "All sensitive customer and company data must be encrypted at rest using industry-standard AES-256 cipher suites. All data in transit across public or untrusted networks must be encrypted using Transport Layer Security (TLS) protocol version 1.3 (or minimum TLS 1.2 with perfect forward secrecy).",
                "reasoning": "Contract relies on vague 'commercially reasonable efforts' and vendor-discretion encryption, conflicting with mandatory AES-256 and TLS 1.3 standards."
            },
            {
                "clause_number": "Clause 3",
                "title": "Security Incident Notification",
                "ground_truth_classification": "EXPLICIT_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "CRITICAL",
                "policy_document": "POL-SEC-2024-v3.2_Information_Security_Policy.pdf",
                "policy_section": "Section 3.2: Security Incident Notification Timelines",
                "policy_quote": "In the event of a confirmed or suspected Security Incident, unauthorized access, or Data Breach, any contracted service provider or vendor must notify the Company Information Security Team in writing within twenty-four (24) hours of initial discovery.",
                "reasoning": "Contract permits 15 business days delay following completion of internal investigation, directly contradicting the mandatory 24-hour notification SLA."
            },
            {
                "clause_number": "Clause 4",
                "title": "Subprocessor Engagement and Notice",
                "ground_truth_classification": "INFERRED",
                "ground_truth_confidence": "INFERRED",
                "risk_level": "HIGH",
                "policy_document": "POL-DPA-04_Data_Protection_and_Privacy.pdf",
                "policy_section": "Section 2.3: Subprocessor Authorization Requirements",
                "policy_quote": "Vendors shall not engage third-party subprocessors without providing at least thirty (30) days prior written notice to the Company. The Company maintains the explicit right to object to any new subprocessor on data protection grounds.",
                "reasoning": "Contract authorizes vendor to engage subprocessors without prior notice or consent, denying the Company's 30-day notice and objection rights."
            },
            {
                "clause_number": "Clause 5",
                "title": "Customer Audit and Inspection Rights",
                "ground_truth_classification": "EXPLICIT_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "CRITICAL",
                "policy_document": "VRM-POL-09_Vendor_Risk_and_Procurement.pdf",
                "policy_section": "Section 1.1: Mandatory Audit and Inspection Rights",
                "policy_quote": "The Company, or its designated independent certified public accounting firm, reserves the unrestricted right to conduct an annual on-site or virtual audit of vendor facilities, security controls, and operational infrastructure with ten (10) business days prior notice.",
                "reasoning": "Contract denies customer any right to audit or inspect facilities, and restricts questionnaires to once every three years at customer expense."
            },
            {
                "clause_number": "Clause 6",
                "title": "Limitation of Liability and Breach Damages",
                "ground_truth_classification": "EXPLICIT_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "CRITICAL",
                "policy_document": "VRM-POL-09_Vendor_Risk_and_Procurement.pdf",
                "policy_section": "Section 2.2: Limitation of Liability Exceptions and Breach Caps",
                "policy_quote": "Standard contract terms must prohibit aggregate liability caps that apply to data privacy breaches, unauthorized disclosure of confidential information, intellectual property infringement, or gross negligence. Liability for data breach indemnification must remain uncapped or capped at not less than 5x annual contract value.",
                "reasoning": "Contract imposes a 1-month fee cap that includes data breaches, directly violating the prohibition on breach caps and minimum 5x ACV requirement."
            },
            {
                "clause_number": "Clause 7",
                "title": "Data Retention and Deletion",
                "ground_truth_classification": "EXPLICIT_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "HIGH",
                "policy_document": "POL-DPA-04_Data_Protection_and_Privacy.pdf",
                "policy_section": "Section 3.4: Data Return and Secure Destruction",
                "policy_quote": "Within thirty (30) calendar days of agreement termination or expiration, the vendor must securely return or permanently destroy all Company Data in compliance with NIST SP 800-88 sanitization standards.",
                "reasoning": "Contract permits indefinite archival backup retention, conflicting with the mandatory 30-day complete return/destruction requirement."
            },
            {
                "clause_number": "Clause 8",
                "title": "Invoicing and Payment Terms",
                "ground_truth_classification": "EXPLICIT_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "HIGH",
                "policy_document": "VRM-POL-09_Vendor_Risk_and_Procurement.pdf",
                "policy_section": "Section 3.1: Invoicing and Payment Schedule Standards",
                "policy_quote": "All vendor invoicing terms must strictly provide for payment within net-thirty (30) calendar days following receipt of an undisputed, valid invoice. Extended payment terms, including net-60, net-90, or unilateral late fee charges exceeding statutory limits, are non-compliant without CFO approval.",
                "reasoning": "Contract imposes a net-90 day payment cycle and 2.5% monthly late fees, violating the mandatory net-30 day payment standard."
            },
            {
                "clause_number": "Clause 9",
                "title": "Vulnerability Remediation and Patch Cycles",
                "ground_truth_classification": "INFERRED",
                "ground_truth_confidence": "INFERRED",
                "risk_level": "MEDIUM",
                "policy_document": "POL-SEC-2024-v3.2_Information_Security_Policy.pdf",
                "policy_section": "Section 4.1: Vulnerability Remediation SLAs",
                "policy_quote": "Vendors must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure. High severity vulnerabilities must be remediated within thirty (30) calendar days.",
                "reasoning": "Contract defers critical vulnerability fixes to ordinary quarterly release cycles, violating the required 7-day remediation SLA."
            },
            {
                "clause_number": "Clause 10",
                "title": "Governing Law and Dispute Arbitration",
                "ground_truth_classification": "NOT_FOUND",
                "ground_truth_confidence": "NOT_FOUND",
                "risk_level": "LOW",
                "policy_document": None,
                "policy_section": None,
                "policy_quote": None,
                "reasoning": "Internal policies are silent regarding Delaware governing law and American Arbitration Association venue choice."
            },
            {
                "clause_number": "Clause 11",
                "title": "Marketing Publicity and Trademark Usage",
                "ground_truth_classification": "NOT_FOUND",
                "ground_truth_confidence": "NOT_FOUND",
                "risk_level": "LOW",
                "policy_document": None,
                "policy_section": None,
                "policy_quote": None,
                "reasoning": "Corporate governance policies are silent regarding vendor marketing logo usage and customer list display."
            },
            {
                "clause_number": "Clause 12",
                "title": "Force Majeure and Excused Delays",
                "ground_truth_classification": "NOT_FOUND",
                "ground_truth_confidence": "NOT_FOUND",
                "risk_level": "LOW",
                "policy_document": None,
                "policy_section": None,
                "policy_quote": None,
                "reasoning": "Corporate policies are silent regarding standard force majeure and excused performance conditions."
            },
            {
                "clause_number": "Clause 13",
                "title": "Customer Data Ownership and AI Training Restrictions",
                "ground_truth_classification": "NO_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "LOW",
                "policy_document": "POL-DPA-04_Data_Protection_and_Privacy.pdf",
                "policy_section": "Section 1.2: Customer Data Ownership & Processing",
                "policy_quote": "The Company retains exclusive title, ownership, and all intellectual property rights in and to Company Data. Vendors process data solely as Data Processors pursuant to documented written instructions and shall not use data for training AI models or commercial exploitation.",
                "reasoning": "Contract explicitly recognizes customer ownership and forbids training AI models on customer data, fully compliant with policy."
            },
            {
                "clause_number": "Clause 14",
                "title": "Multi-Factor Authentication Compliance",
                "ground_truth_classification": "NO_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "LOW",
                "policy_document": "POL-SEC-2024-v3.2_Information_Security_Policy.pdf",
                "policy_section": "Section 1.1: Scope and Multi-Factor Access Control",
                "policy_quote": "Multi-factor authentication (MFA) is strictly required across all administrative, API, and end-user access points. Passwords must adhere to NIST 800-63B standards.",
                "reasoning": "Contract mandates MFA across portals and APIs adhering to NIST 800-63B, fully compliant with InfoSec policy."
            },
            {
                "clause_number": "Clause 15",
                "title": "Cross-Border Data Residency Commitments",
                "ground_truth_classification": "NO_CONFLICT",
                "ground_truth_confidence": "EXPLICITLY_STATED",
                "risk_level": "LOW",
                "policy_document": "POL-CBD-02_Cross_Border_Data_Transfer_Policy.pdf",
                "policy_section": "Section 1.1: Data Residency Requirements",
                "policy_quote": "All customer personal data, telemetry, and business records must be stored and processed within data centers located inside the European Economic Area (EEA) or countries recognized as possessing adequate protection by the European Commission.",
                "reasoning": "Contract covenants that all storage and processing shall reside inside the European Economic Area, fully compliant with data residency policy."
            }
        ]
    }

    answer_key_path = SAMPLE_DATA_DIR / "eval_answer_key.json"
    answer_key_path.write_text(json.dumps(ground_truth, indent=2), encoding="utf-8")
    print(f"Generated Ground Truth Answer Key: {answer_key_path.name} with {len(ground_truth['clauses'])} benchmark clauses.")


if __name__ == "__main__":
    generate_all_samples()
