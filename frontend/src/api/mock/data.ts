import type {
  PolicyDocument,
  ContractDocument,
  ComplianceReport,
  SystemHealth,
  SystemConfig,
} from '../../types';

export const INITIAL_MOCK_POLICIES: PolicyDocument[] = [
  {
    id: 'pol-01',
    name: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf',
    size_bytes: 245890,
    status: 'READY',
    pages: 4,
    uploaded_at: '2026-09-24T10:00:00Z',
    type: 'POLICY',
  },
  {
    id: 'pol-02',
    name: 'POL-DPA-04_Data_Protection_and_Privacy.pdf',
    size_bytes: 319400,
    status: 'READY',
    pages: 3,
    uploaded_at: '2026-09-24T10:00:00Z',
    type: 'POLICY',
  },
  {
    id: 'pol-03',
    name: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf',
    size_bytes: 184320,
    status: 'READY',
    pages: 3,
    uploaded_at: '2026-09-24T10:00:00Z',
    type: 'POLICY',
  },
  {
    id: 'pol-04',
    name: 'POL-CBD-02_Cross_Border_Data_Transfer_Policy.pdf',
    size_bytes: 125829,
    status: 'READY',
    pages: 3,
    uploaded_at: '2026-09-24T10:00:00Z',
    type: 'POLICY',
  },
];

export const INITIAL_MOCK_CONTRACT: ContractDocument = {
  id: 'ctr-01',
  name: 'CloudScale_Inc_Master_Services_Agreement.pdf',
  size_bytes: 425880,
  status: 'READY',
  pages: 5,
  uploaded_at: '2026-09-24T10:05:00Z',
  type: 'CONTRACT',
};

export const INITIAL_MOCK_REPORTS: ComplianceReport[] = [
  {
    report_id: 'rep-2026-0924-01',
    contract: {
      id: 'ctr-01',
      name: 'CloudScale_Inc_Master_Services_Agreement.pdf',
    },
    created_at: '2026-09-24T14:30:00Z',
    policies: [
      { id: 'pol-01', name: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf' },
      { id: 'pol-02', name: 'POL-DPA-04_Data_Protection_and_Privacy.pdf' },
      { id: 'pol-03', name: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf' },
      { id: 'pol-04', name: 'POL-CBD-02_Cross_Border_Data_Transfer_Policy.pdf' },
    ],
    status: 'COMPLETED',
    summary: {
      explicit_conflicts: 5,
      inferred: 3,
      no_conflict: 4,
      not_found: 3,
    },
    clauses: [
      {
        clause_id: 'clause-01',
        clause_number: 'Clause 1',
        clause_text:
          'Clause 1: Provision of Services and Grant of License\nCloudScale Inc. (\'Vendor\') hereby grants to Customer a non-exclusive, non-transferable subscription right to access and utilize the CloudScale Analytics Platform during the applicable Term in accordance with the Order Form and standard service terms.',
        classification: 'NO_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'LOW',
        explanation: 'Standard service provision and subscription license grant conforming to procurement standards.',
        risk_score: 5,
        risk_rationale: 'Fully compliant with corporate governance baselines and security requirements.',
        suggested_redline: null,
        evidence: [
          {
            document_id: 'pol-03',
            document: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf',
            page: 1,
            section: 'Section 1.1: Scope and Procurement Standards',
            text: 'This policy governs all corporate systems, vendors, and third-party SaaS applications processing company data.',
            highlight_start: 0,
            highlight_end: 104,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–104).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-02',
        clause_number: 'Clause 2',
        clause_text:
          'Clause 2: Security and Encryption Safeguards\nVendor shall exercise commercially reasonable efforts and general industry standards to protect Customer Data against unauthorized destruction or loss. The specific encryption algorithms and key management practices shall be determined at Vendor\'s sole discretion.',
        classification: 'INFERRED',
        confidence: 'INFERRED',
        risk_level: 'HIGH',
        explanation:
          'Contract relies on vague \'commercially reasonable efforts\' and leaves encryption algorithms to vendor discretion, which fails to guarantee mandatory baseline standards (AES-256 at rest, TLS 1.3 in transit) in Information Security Policy Section 2.1.',
        risk_score: 65,
        risk_rationale: 'Ambiguous terms or missing baseline protections that create potential legal exposure.',
        suggested_redline:
          'Vendor covenants that all sensitive Customer Data must be encrypted at rest using industry-standard AES-256 cipher suites. All data in transit across public or untrusted networks must be encrypted using Transport Layer Security (TLS) protocol version 1.3 (or minimum TLS 1.2 with perfect forward secrecy).',
        evidence: [
          {
            document_id: 'pol-01',
            document: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf',
            page: 1,
            section: 'Section 2.1: Mandatory Encryption Standards',
            text: 'All sensitive customer and company data must be encrypted at rest using industry-standard AES-256 cipher suites. All data in transit across public or untrusted networks must be encrypted using Transport Layer Security (TLS) protocol version 1.3 (or minimum TLS 1.2 with perfect forward secrecy). Unencrypted transmissions are strictly prohibited.',
            highlight_start: 0,
            highlight_end: 254,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–254).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-03',
        clause_number: 'Clause 3',
        clause_text:
          'Clause 3: Security Incident Notification\nVendor shall notify Customer in writing of any confirmed unauthorized intrusion resulting in actual data exfiltration within fifteen (15) business days following Vendor\'s internal completion of forensic investigation.',
        classification: 'EXPLICIT_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'CRITICAL',
        explanation:
          'Contract permits notification within 15 business days following internal investigation, directly violating Enterprise Information Security Policy Section 3.2 mandating written notification within twenty-four (24) hours of discovery.',
        risk_score: 96,
        risk_rationale: 'Critical governance violation exposing organization to unmonitored breaches and regulatory sanctions.',
        suggested_redline:
          'Vendor shall notify Customer in writing within twenty-four (24) hours of initial discovery of any confirmed or suspected Security Incident, unauthorized access, or Data Breach. The notification must include root cause, impacted data records, and immediate mitigations.',
        evidence: [
          {
            document_id: 'pol-01',
            document: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf',
            page: 2,
            section: 'Section 3.2: Security Incident Notification Timelines',
            text: 'In the event of a confirmed or suspected Security Incident, unauthorized access, or Data Breach, any contracted service provider or vendor must notify the Company Information Security Team in writing within twenty-four (24) hours of initial discovery. The notification must include root cause, impacted data records, and immediate mitigations.',
            highlight_start: 0,
            highlight_end: 256,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–256).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-04',
        clause_number: 'Clause 4',
        clause_text:
          'Clause 4: Subprocessor Engagement and Notice\nVendor reserves the operational right to engage third-party subprocessors and subcontractors at any time without prior customer notice or consent, provided Vendor maintains general oversight of such entities.',
        classification: 'INFERRED',
        confidence: 'INFERRED',
        risk_level: 'HIGH',
        explanation:
          'Contract permits vendor to engage subprocessors without customer notice or consent, directly bypassing Data Protection & Privacy Policy Section 2.3 requiring 30 days prior written notice and customer objection rights.',
        risk_score: 65,
        risk_rationale: 'Ambiguous terms or missing baseline protections that create potential legal exposure.',
        suggested_redline:
          'Vendor shall not engage third-party subprocessors without providing at least thirty (30) days prior written notice to Customer. Customer maintains the explicit right to object to any new subprocessor on data protection and compliance grounds.',
        evidence: [
          {
            document_id: 'pol-02',
            document: 'POL-DPA-04_Data_Protection_and_Privacy.pdf',
            page: 1,
            section: 'Section 2.3: Subprocessor Authorization Requirements',
            text: 'Vendors shall not engage third-party subprocessors without providing at least thirty (30) days prior written notice to the Company. The Company maintains the explicit right to object to any new subprocessor on data protection grounds.',
            highlight_start: 0,
            highlight_end: 236,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–236).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-05',
        clause_number: 'Clause 5',
        clause_text:
          'Clause 5: Customer Audit and Inspection Rights\nCustomer shall have no right to conduct on-site physical audits or inspect Vendor\'s server facilities. Any compliance inquiries must be submitted in writing and Vendor may, at its sole discretion and at Customer\'s expense, provide a summary security questionnaire once every three (3) years.',
        classification: 'EXPLICIT_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'CRITICAL',
        explanation:
          'Contract denies customer on-site audit rights and restricts inquiries to a 3-year questionnaire at customer expense, directly violating Vendor Risk Management Policy Section 1.1 reserving unrestricted annual audit rights with 10 business days notice.',
        risk_score: 96,
        risk_rationale: 'Critical governance violation denying mandatory annual inspection and compliance verification rights.',
        suggested_redline:
          'Customer, or its designated independent certified public accounting firm, reserves the unrestricted right to conduct an annual on-site or virtual audit of Vendor facilities, security controls, and operational infrastructure with ten (10) business days prior written notice. Vendor shall furnish annual SOC 2 Type II or ISO 27001 audit certifications.',
        evidence: [
          {
            document_id: 'pol-03',
            document: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf',
            page: 1,
            section: 'Section 1.1: Mandatory Audit and Inspection Rights',
            text: 'The Company, or its designated independent certified public accounting firm, reserves the unrestricted right to conduct an annual on-site or virtual audit of vendor facilities, security controls, and operational infrastructure with ten (10) business days prior notice. Vendors must provide annual SOC 2 Type II or ISO 27001:2022 audit reports upon request.',
            highlight_start: 0,
            highlight_end: 254,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–254).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-06',
        clause_number: 'Clause 6',
        clause_text:
          'Clause 6: Limitation of Liability and Breach Damages\nUnder no circumstances shall Vendor\'s total aggregate liability arising out of or related to this Agreement exceed the total fees actually paid by Customer in the one (1) month preceding the incident, including in connection with data breaches, system outages, or confidentiality claims.',
        classification: 'EXPLICIT_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'CRITICAL',
        explanation:
          'Contract caps aggregate liability at 1 month of fees and includes data breach claims within this limit, directly violating Vendor Risk Management Policy Section 2.2 requiring uncapped liability or minimum 5x ACV for data breach indemnification.',
        risk_score: 96,
        risk_rationale: 'Critical governance violation exposing organization to uncapped commercial losses for breach damages.',
        suggested_redline:
          'In no event shall Vendor\'s total aggregate liability cap apply to data privacy breaches, unauthorized disclosure of confidential information, intellectual property infringement, or gross negligence. Liability for data breach indemnification must remain uncapped or capped at not less than 5x annual contract value.',
        evidence: [
          {
            document_id: 'pol-03',
            document: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf',
            page: 2,
            section: 'Section 2.2: Limitation of Liability Exceptions and Breach Caps',
            text: 'Standard contract terms must prohibit aggregate liability caps that apply to data privacy breaches, unauthorized disclosure of confidential information, intellectual property infringement, or gross negligence. Liability for data breach indemnification must remain uncapped or capped at not less than 5x annual contract value.',
            highlight_start: 0,
            highlight_end: 258,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–258).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-07',
        clause_number: 'Clause 7',
        clause_text:
          'Clause 7: Data Retention and Deletion\nFollowing contract termination, Vendor may retain copies of Customer Data indefinitely in archival backup systems, provided such data remains subject to Vendor\'s general privacy practices.',
        classification: 'EXPLICIT_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'HIGH',
        explanation:
          'Contract authorizes vendor to retain customer data indefinitely in archival backup systems, directly violating Data Protection & Privacy Policy Section 3.4 mandating return or destruction within 30 days of termination.',
        risk_score: 85,
        risk_rationale: 'Direct conflict with corporate governance standards requiring executive renegotiation.',
        suggested_redline:
          'Within thirty (30) calendar days of agreement termination or expiration, Vendor must securely return or permanently destroy all Customer Data in compliance with NIST SP 800-88 sanitization standards. Written certificate of destruction signed by an authorized officer must be delivered within five (5) business days thereafter.',
        evidence: [
          {
            document_id: 'pol-02',
            document: 'POL-DPA-04_Data_Protection_and_Privacy.pdf',
            page: 2,
            section: 'Section 3.4: Data Return and Secure Destruction',
            text: 'Within thirty (30) calendar days of agreement termination or expiration, the vendor must securely return or permanently destroy all Company Data in compliance with NIST SP 800-88 sanitization standards. Written certificate of destruction signed by an authorized officer must be delivered within five (5) business days thereafter.',
            highlight_start: 0,
            highlight_end: 255,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–255).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-08',
        clause_number: 'Clause 8',
        clause_text:
          'Clause 8: Invoicing and Payment Terms\nCustomer agrees to pay all undisputed invoices within ninety (90) calendar days of invoice receipt. Vendor reserves the right to charge late interest of 2.5% per month on any delinquent amounts.',
        classification: 'EXPLICIT_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'HIGH',
        explanation:
          'Contract stipulates a 90-day payment cycle with 2.5% monthly late interest, which directly violates Vendor Risk & Procurement Policy Section 3.1 requiring all invoices to be paid within net-30 calendar days.',
        risk_score: 85,
        risk_rationale: 'Direct conflict with corporate governance standards requiring executive renegotiation.',
        suggested_redline:
          'Customer agrees to pay all undisputed, valid invoices within thirty (30) calendar days of invoice receipt. Vendor shall not charge late interest exceeding statutory limits, and no unilateral fee escalation shall apply.',
        evidence: [
          {
            document_id: 'pol-03',
            document: 'VRM-POL-09_Vendor_Risk_and_Procurement.pdf',
            page: 2,
            section: 'Section 3.1: Invoicing and Payment Schedule Standards',
            text: 'All vendor invoicing terms must strictly provide for payment within net-thirty (30) calendar days following receipt of an undisputed, valid invoice. Extended payment terms, including net-60, net-90, or unilateral late fee charges exceeding statutory limits, are non-compliant without CFO approval.',
            highlight_start: 0,
            highlight_end: 255,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–255).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-09',
        clause_number: 'Clause 9',
        clause_text:
          'Clause 9: Vulnerability Remediation and Patch Cycles\nVendor will address reported critical system vulnerabilities as part of its standard quarterly release cycle, unless emergency out-of-band updates are deemed essential by Vendor\'s engineering team.',
        classification: 'INFERRED',
        confidence: 'INFERRED',
        risk_level: 'MEDIUM',
        explanation:
          'Contract commits only to addressing critical flaws in quarterly release cycles, which falls short of the mandatory 7-day remediation SLA for critical vulnerabilities (CVSS >= 9.0) mandated by Information Security Policy Section 4.1.',
        risk_score: 48,
        risk_rationale: 'Vague standard of care or implicit variance requiring counsel clarification.',
        suggested_redline:
          'Vendor must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure. High severity vulnerabilities must be remediated within thirty (30) calendar days. Ordinary release deferrals for critical patches are strictly prohibited.',
        evidence: [
          {
            document_id: 'pol-01',
            document: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf',
            page: 2,
            section: 'Section 4.1: Vulnerability Remediation SLAs',
            text: 'Vendors must remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days of public disclosure. High severity vulnerabilities must be remediated within thirty (30) calendar days. Ordinary release deferrals for critical patches are strictly prohibited.',
            highlight_start: 0,
            highlight_end: 256,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–256).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-10',
        clause_number: 'Clause 10',
        clause_text:
          'Clause 10: Governing Law and Dispute Arbitration\nThis Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without giving effect to conflicts of law principles. Any dispute shall be resolved through binding arbitration under the rules of the American Arbitration Association in Wilmington, Delaware.',
        classification: 'NOT_FOUND',
        confidence: 'NOT_FOUND',
        risk_level: 'LOW',
        explanation:
          'Internal corporate policy is silent regarding this clause. No specific policy guidelines or mandatory restrictions were located in the ingested policies.',
        risk_score: 15,
        risk_rationale: 'Internal corporate policy is silent; standard commercial risk profile applies.',
        suggested_redline: null,
        evidence: [],
      },
      {
        clause_id: 'clause-11',
        clause_number: 'Clause 11',
        clause_text:
          'Clause 11: Marketing Publicity and Trademark Usage\nCustomer grants Vendor the limited right to display Customer\'s corporate name, logo, and trade marks in public customer lists, marketing materials, and corporate investor decks.',
        classification: 'NOT_FOUND',
        confidence: 'NOT_FOUND',
        risk_level: 'LOW',
        explanation:
          'Internal corporate policy is silent regarding this clause. No specific policy guidelines or mandatory restrictions were located in the ingested policies.',
        risk_score: 15,
        risk_rationale: 'Internal corporate policy is silent; standard commercial risk profile applies.',
        suggested_redline: null,
        evidence: [],
      },
      {
        clause_id: 'clause-12',
        clause_number: 'Clause 12',
        clause_text:
          'Clause 12: Force Majeure and Excused Delays\nNeither party shall be liable for delay or failure in performance resulting from causes beyond its reasonable control, including acts of God, labor strikes, power failures, natural disasters, or government restrictions.',
        classification: 'NOT_FOUND',
        confidence: 'NOT_FOUND',
        risk_level: 'LOW',
        explanation:
          'Internal corporate policy is silent regarding this clause. No specific policy guidelines or mandatory restrictions were located in the ingested policies.',
        risk_score: 15,
        risk_rationale: 'Internal corporate policy is silent; standard commercial risk profile applies.',
        suggested_redline: null,
        evidence: [],
      },
      {
        clause_id: 'clause-13',
        clause_number: 'Clause 13',
        clause_text:
          'Clause 13: Customer Data Ownership and AI Training Restrictions\nCustomer retains exclusive title, ownership, and all intellectual property rights in and to Customer Data. Vendor processes data solely as a Data Processor pursuant to documented instructions and shall not use Customer Data to train artificial intelligence models or for commercial exploitation.',
        classification: 'NO_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'LOW',
        explanation:
          'Contract explicitly affirms Customer\'s exclusive ownership of data and forbids training AI models on customer data, in full compliance with Data Protection & Privacy Policy Section 1.2.',
        risk_score: 5,
        risk_rationale: 'Fully compliant with corporate governance baselines and security requirements.',
        suggested_redline: null,
        evidence: [
          {
            document_id: 'pol-02',
            document: 'POL-DPA-04_Data_Protection_and_Privacy.pdf',
            page: 1,
            section: 'Section 1.2: Customer Data Ownership & Processing',
            text: 'The Company retains exclusive title, ownership, and all intellectual property rights in and to Company Data. Vendors process data solely as Data Processors pursuant to documented written instructions and shall not use data for training AI models or commercial exploitation.',
            highlight_start: 0,
            highlight_end: 254,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–254).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-14',
        clause_number: 'Clause 14',
        clause_text:
          'Clause 14: Multi-Factor Authentication Compliance\nVendor guarantees that multi-factor authentication (MFA) is strictly enforced across all administrative access points, customer portals, and developer APIs in full compliance with NIST 800-63B guidelines.',
        classification: 'NO_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'LOW',
        explanation:
          'Contract strictly enforces multi-factor authentication conforming to NIST 800-63B across administrative portals and APIs, in full compliance with Information Security Policy Section 1.1.',
        risk_score: 5,
        risk_rationale: 'Fully compliant with corporate governance baselines and security requirements.',
        suggested_redline: null,
        evidence: [
          {
            document_id: 'pol-01',
            document: 'POL-SEC-2024-v3.2_Information_Security_Policy.pdf',
            page: 1,
            section: 'Section 1.1: Scope and Multi-Factor Access Control',
            text: 'Multi-factor authentication (MFA) is strictly required across all administrative, API, and end-user access points. Passwords must adhere to NIST 800-63B standards.',
            highlight_start: 0,
            highlight_end: 154,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–154).',
            },
          },
        ],
      },
      {
        clause_id: 'clause-15',
        clause_number: 'Clause 15',
        clause_text:
          'Clause 15: Cross-Border Data Residency Commitments\nVendor explicitly covenants that all customer personal data, telemetry, and compute operations shall be stored and processed exclusively within data centers situated inside the European Economic Area (EEA).',
        classification: 'NO_CONFLICT',
        confidence: 'EXPLICITLY_STATED',
        risk_level: 'LOW',
        explanation:
          'Contract covenants that all customer personal data, telemetry, and compute environments shall reside exclusively inside the European Economic Area (EEA), in full compliance with Cross-Border Data Transfer Policy Section 1.1.',
        risk_score: 5,
        risk_rationale: 'Fully compliant with corporate governance baselines and security requirements.',
        suggested_redline: null,
        evidence: [
          {
            document_id: 'pol-04',
            document: 'POL-CBD-02_Cross_Border_Data_Transfer_Policy.pdf',
            page: 1,
            section: 'Section 1.1: Data Residency Requirements',
            text: 'All customer personal data, telemetry, and business records must be stored and processed within data centers located inside the European Economic Area (EEA) or countries recognized as possessing adequate protection by the European Commission.',
            highlight_start: 0,
            highlight_end: 250,
            citation: {
              verified: true,
              note: 'Exact match verified in code (offsets 0–250).',
            },
          },
        ],
      },
    ],
  },
];

export const INITIAL_MOCK_HEALTH: SystemHealth = {
  backend: 'operational',
  model_status: 'connected',
  embedding_status: 'ready',
};

export const INITIAL_MOCK_CONFIG: SystemConfig = {
  retrieval_count: 4,
  confidence_display: true,
  citation_verification: true,
  min_policy_count: 1,
  max_policy_count: 5,
  max_file_size_bytes: 25 * 1024 * 1024,
  version: '1.0.0',
};
