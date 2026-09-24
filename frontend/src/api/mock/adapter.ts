import {
  INITIAL_MOCK_POLICIES,
  INITIAL_MOCK_CONTRACT,
  INITIAL_MOCK_REPORTS,
  INITIAL_MOCK_HEALTH,
  INITIAL_MOCK_CONFIG,
} from './data';
import { PIPELINE_STEPS } from '../../config/constants';
import type {
  PolicyDocument,
  ContractDocument,
  DocumentsResponse,
  AnalysisJob,
  AnalysisJobStep,
  ComplianceReport,
  ClauseFinding,
  SystemHealth,
  SystemConfig,
} from '../../types';
import { ApiError } from '../client';

class MockAdapter {
  private policies: PolicyDocument[] = [...INITIAL_MOCK_POLICIES];
  private contract: ContractDocument | null = { ...INITIAL_MOCK_CONTRACT };
  private reports: ComplianceReport[] = [...INITIAL_MOCK_REPORTS];
  private jobs: Map<string, { job: AnalysisJob; createdAt: number }> = new Map();

  async getDocuments(): Promise<DocumentsResponse> {
    await this.delay(200);
    return {
      policies: [...this.policies],
      contract: this.contract ? { ...this.contract } : null,
    };
  }

  async uploadPolicies(
    files: File[],
    onProgress?: (fileName: string, percent: number) => void
  ): Promise<PolicyDocument[]> {
    await this.delay(300);

    const uploaded: PolicyDocument[] = [];
    for (const file of files) {
      // Simulate incremental upload progress
      if (onProgress) {
        for (let p = 25; p <= 100; p += 25) {
          onProgress(file.name, p);
          await this.delay(70);
        }
      }

      const newDoc: PolicyDocument = {
        id: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size_bytes: file.size,
        status: 'READY',
        pages: Math.max(8, Math.floor(file.size / 65536)),
        uploaded_at: new Date().toISOString(),
      };
      this.policies.push(newDoc);
      uploaded.push(newDoc);
    }

    return uploaded;
  }

  async uploadContract(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ContractDocument> {
    await this.delay(300);

    if (onProgress) {
      for (let p = 20; p <= 100; p += 20) {
        onProgress(p);
        await this.delay(60);
      }
    }

    const newContract: ContractDocument = {
      id: `ctr-${Date.now()}`,
      name: file.name,
      size_bytes: file.size,
      status: 'READY',
      pages: Math.max(12, Math.floor(file.size / 80000)),
      uploaded_at: new Date().toISOString(),
    };

    this.contract = newContract;
    return newContract;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.delay(200);
    if (this.contract && this.contract.id === id) {
      this.contract = null;
      return;
    }
    const idx = this.policies.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.policies.splice(idx, 1);
      return;
    }
    throw new ApiError('not_found', `Document with ID ${id} was not found.`, 404);
  }

  async startAnalysis(): Promise<{ job_id: string }> {
    await this.delay(400);

    if (!this.contract) {
      throw new ApiError('validation', 'Cannot start analysis without an uploaded contract.', 400);
    }
    if (this.policies.length < 3 || this.policies.length > 5) {
      throw new ApiError(
        'validation',
        `Analysis requires between 3 and 5 policies. Current count: ${this.policies.length}`,
        400
      );
    }

    const jobId = `job-${Date.now()}`;
    const initialSteps: AnalysisJobStep[] = PIPELINE_STEPS.map((s, idx) => ({
      key: s.key,
      label: s.label,
      status: idx === 0 ? 'RUNNING' : 'PENDING',
    }));

    const job: AnalysisJob = {
      job_id: jobId,
      status: 'RUNNING',
      steps: initialSteps,
    };

    this.jobs.set(jobId, { job, createdAt: Date.now() });
    return { job_id: jobId };
  }

  async getAnalysisStatus(jobId: string): Promise<AnalysisJob> {
    await this.delay(200);

    const record = this.jobs.get(jobId);
    if (!record) {
      // If asking for a non-existent job in mock, throw not_found
      throw new ApiError('not_found', `Analysis job ${jobId} not found.`, 404);
    }

    const elapsed = Date.now() - record.createdAt;
    const stepDurationMs = 1200; // 1.2s per step in mock mode
    const totalSteps = PIPELINE_STEPS.length;
    const currentStepIndex = Math.min(Math.floor(elapsed / stepDurationMs), totalSteps);

    const updatedSteps: AnalysisJobStep[] = PIPELINE_STEPS.map((step, idx) => {
      if (idx < currentStepIndex) {
        return { key: step.key, label: step.label, status: 'DONE' };
      }
      if (idx === currentStepIndex && currentStepIndex < totalSteps) {
        return { key: step.key, label: step.label, status: 'RUNNING' };
      }
      return { key: step.key, label: step.label, status: 'PENDING' };
    });

    if (currentStepIndex >= totalSteps) {
      const reportId = `rep-${jobId.replace('job-', '')}`;
      // Ensure the newly completed report exists in reports list
      let existingReport = this.reports.find((r) => r.report_id === reportId);
      if (!existingReport) {
        const baseReport = this.reports[0] || INITIAL_MOCK_REPORTS[0];
        existingReport = {
          ...baseReport,
          report_id: reportId,
          contract: this.contract
            ? { id: this.contract.id, name: this.contract.name }
            : baseReport.contract,
          policies: this.policies.map((p) => ({ id: p.id, name: p.name })),
          created_at: new Date().toISOString(),
        };
        this.reports.unshift(existingReport);
      }

      record.job = {
        job_id: jobId,
        status: 'COMPLETED',
        steps: updatedSteps,
        report_id: reportId,
      };
    } else {
      record.job = {
        job_id: jobId,
        status: 'RUNNING',
        steps: updatedSteps,
      };
    }

    return { ...record.job };
  }

  async getReports(): Promise<ComplianceReport[]> {
    await this.delay(300);
    return [...this.reports];
  }

  async getReport(reportId: string): Promise<ComplianceReport> {
    await this.delay(350);
    const report = this.reports.find((r) => r.report_id === reportId);
    if (!report) {
      throw new ApiError('not_found', `Report with ID ${reportId} not found.`, 404);
    }
    return { ...report };
  }

  async getClauseDetails(reportId: string, clauseId: string): Promise<ClauseFinding> {
    await this.delay(200);
    const report = await this.getReport(reportId);
    const clause = report.clauses.find((c) => c.clause_id === clauseId);
    if (!clause) {
      throw new ApiError('not_found', `Clause with ID ${clauseId} not found in report ${reportId}.`, 404);
    }
    return { ...clause };
  }

  async exportReport(reportId: string): Promise<Blob> {
    await this.delay(500);
    const report = await this.getReport(reportId);
    const textContent = `GROUNDED COMPLIANCE REPORT\nID: ${report.report_id}\nContract: ${report.contract.name}\nDate: ${report.created_at}\n\nSUMMARY:\nExplicit Conflicts: ${report.summary?.explicit_conflicts ?? 0}\nInferred: ${report.summary?.inferred ?? 0}\nNo Conflict: ${report.summary?.no_conflict ?? 0}\nNot Found: ${report.summary?.not_found ?? 0}\n\nCLAUSES REVIEW:\n` +
      report.clauses
        .map(
          (c) =>
            `${c.clause_number}: ${c.clause_text}\nFINDING: ${c.classification} (Confidence: ${c.confidence}, Risk: ${c.risk_level})\nEXPLANATION: ${c.explanation}\n`
        )
        .join('\n----------------------------------------\n');

    return new Blob([textContent], { type: 'application/pdf' });
  }

  async getHealth(): Promise<SystemHealth> {
    await this.delay(200);
    return {
      ...INITIAL_MOCK_HEALTH,
      timestamp: new Date().toISOString(),
    };
  }

  async getConfig(): Promise<SystemConfig> {
    await this.delay(200);
    return { ...INITIAL_MOCK_CONFIG };
  }

  async getEvaluationMetrics(): Promise<any> {
    await this.delay(250);
    return {
      benchmark_name: 'ClauseGuard Compliance Benchmark Suite (HTH-GA-01)',
      target_contract: 'CloudScale_Inc_Master_Services_Agreement.pdf',
      total_clauses: 15,
      metrics: {
        recall: 1.0,
        recall_pct: 100.0,
        precision: 1.0,
        precision_pct: 100.0,
        f1_score: 1.0,
        accuracy_pct: 100.0,
        citation_accuracy: 1.0,
        citation_accuracy_pct: 100.0,
        hallucination_rate: 0.0,
        hallucination_rate_pct: 0.0,
        not_found_correctness: 1.0,
        not_found_correctness_pct: 100.0,
        total_citations_checked: 12,
        verified_citations: 12,
        unverified_citations: 0,
      },
      confusion_matrix: {
        true_positives: 8,
        false_positives: 0,
        true_negatives: 7,
        false_negatives: 0,
        total: 15,
      },
      targets: {
        min_recall: 0.85,
        min_precision: 0.85,
        min_not_found_correctness: 0.9,
        target_citation_accuracy: 1.0,
        target_hallucination_rate: 0.0,
      },
      clauses: [
        {
          clause_number: 'Clause 1',
          title: 'Provision of Services and Grant of License',
          ground_truth_classification: 'NO_CONFLICT',
          predicted_classification: 'NO_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'This policy governs all corporate systems...', verified: true, page: 1, doc: 'VRM-POL-09' }],
          reasoning: 'Standard license grant. Compliant with procurement standards.',
        },
        {
          clause_number: 'Clause 2',
          title: 'Security and Encryption Safeguards',
          ground_truth_classification: 'INFERRED',
          predicted_classification: 'INFERRED',
          ground_truth_confidence: 'INFERRED',
          predicted_confidence: 'INFERRED',
          ground_truth_risk: 'HIGH',
          predicted_risk: 'HIGH',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'All sensitive customer data must be encrypted at rest using AES-256...', verified: true, page: 1, doc: 'POL-SEC-2024' }],
          reasoning: 'Vague reasonable efforts fails mandatory AES-256 baseline.',
        },
        {
          clause_number: 'Clause 3',
          title: 'Security Incident Notification',
          ground_truth_classification: 'EXPLICIT_CONFLICT',
          predicted_classification: 'EXPLICIT_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'CRITICAL',
          predicted_risk: 'CRITICAL',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'must notify Company Information Security Team within twenty-four (24) hours...', verified: true, page: 1, doc: 'POL-SEC-2024' }],
          reasoning: '15 business days directly contradicts mandatory 24-hour notification deadline.',
        },
        {
          clause_number: 'Clause 4',
          title: 'Subprocessor Engagement and Notice',
          ground_truth_classification: 'INFERRED',
          predicted_classification: 'INFERRED',
          ground_truth_confidence: 'INFERRED',
          predicted_confidence: 'INFERRED',
          ground_truth_risk: 'HIGH',
          predicted_risk: 'HIGH',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'at least thirty (30) days prior written notice to the Company...', verified: true, page: 1, doc: 'POL-DPA-04' }],
          reasoning: 'Unrestricted subprocessor engagement bypasses 30-day notice and objection rights.',
        },
        {
          clause_number: 'Clause 5',
          title: 'Customer Audit and Inspection Rights',
          ground_truth_classification: 'EXPLICIT_CONFLICT',
          predicted_classification: 'EXPLICIT_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'CRITICAL',
          predicted_risk: 'CRITICAL',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'unrestricted right to conduct an annual on-site or virtual audit...', verified: true, page: 1, doc: 'VRM-POL-09' }],
          reasoning: 'Denial of audit rights directly violates mandatory annual inspection rights.',
        },
        {
          clause_number: 'Clause 6',
          title: 'Limitation of Liability and Breach Damages',
          ground_truth_classification: 'EXPLICIT_CONFLICT',
          predicted_classification: 'EXPLICIT_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'CRITICAL',
          predicted_risk: 'CRITICAL',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'Liability for data breach indemnification must remain uncapped or capped at not less than 5x ACV...', verified: true, page: 2, doc: 'VRM-POL-09' }],
          reasoning: '1-month fee cap on data breaches violates requirement for uncapped or 5x ACV.',
        },
        {
          clause_number: 'Clause 7',
          title: 'Data Retention and Deletion',
          ground_truth_classification: 'EXPLICIT_CONFLICT',
          predicted_classification: 'EXPLICIT_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'HIGH',
          predicted_risk: 'HIGH',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'Within thirty (30) calendar days... securely return or permanently destroy all Company Data...', verified: true, page: 2, doc: 'POL-DPA-04' }],
          reasoning: 'Indefinite retention violates mandatory 30-day return/destruction standard.',
        },
        {
          clause_number: 'Clause 8',
          title: 'Invoicing and Payment Terms',
          ground_truth_classification: 'EXPLICIT_CONFLICT',
          predicted_classification: 'EXPLICIT_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'HIGH',
          predicted_risk: 'HIGH',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'All vendor invoicing terms must strictly provide for payment within net-thirty (30) calendar days...', verified: true, page: 2, doc: 'VRM-POL-09' }],
          reasoning: 'Net-90 payment terms and 2.5% late fee violate mandatory net-30 policy.',
        },
        {
          clause_number: 'Clause 9',
          title: 'Vulnerability Remediation and Patch Cycles',
          ground_truth_classification: 'INFERRED',
          predicted_classification: 'INFERRED',
          ground_truth_confidence: 'INFERRED',
          predicted_confidence: 'INFERRED',
          ground_truth_risk: 'MEDIUM',
          predicted_risk: 'MEDIUM',
          is_conflict: true,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'remediate critical vulnerabilities (CVSS score >= 9.0) within seven (7) calendar days...', verified: true, page: 2, doc: 'POL-SEC-2024' }],
          reasoning: 'Quarterly patch cycles fail 7-day critical vulnerability remediation SLA.',
        },
        {
          clause_number: 'Clause 10',
          title: 'Governing Law and Dispute Arbitration',
          ground_truth_classification: 'NOT_FOUND',
          predicted_classification: 'NOT_FOUND',
          ground_truth_confidence: 'NOT_FOUND',
          predicted_confidence: 'NOT_FOUND',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 0,
          citations: [],
          reasoning: 'Policy is silent regarding Delaware law and AAA arbitration.',
        },
        {
          clause_number: 'Clause 11',
          title: 'Marketing Publicity and Trademark Usage',
          ground_truth_classification: 'NOT_FOUND',
          predicted_classification: 'NOT_FOUND',
          ground_truth_confidence: 'NOT_FOUND',
          predicted_confidence: 'NOT_FOUND',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 0,
          citations: [],
          reasoning: 'Policy is silent regarding vendor marketing logo usage.',
        },
        {
          clause_number: 'Clause 12',
          title: 'Force Majeure and Excused Delays',
          ground_truth_classification: 'NOT_FOUND',
          predicted_classification: 'NOT_FOUND',
          ground_truth_confidence: 'NOT_FOUND',
          predicted_confidence: 'NOT_FOUND',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 0,
          citations: [],
          reasoning: 'Policy is silent regarding force majeure conditions.',
        },
        {
          clause_number: 'Clause 13',
          title: 'Customer Data Ownership and AI Training Restrictions',
          ground_truth_classification: 'NO_CONFLICT',
          predicted_classification: 'NO_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'Company retains exclusive title... shall not use data for training AI models...', verified: true, page: 1, doc: 'POL-DPA-04' }],
          reasoning: 'Exclusive customer ownership and AI training ban are fully compliant.',
        },
        {
          clause_number: 'Clause 14',
          title: 'Multi-Factor Authentication Compliance',
          ground_truth_classification: 'NO_CONFLICT',
          predicted_classification: 'NO_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'Multi-factor authentication (MFA) is strictly required... adhere to NIST 800-63B...', verified: true, page: 1, doc: 'POL-SEC-2024' }],
          reasoning: 'Mandatory MFA adhering to NIST 800-63B is fully compliant.',
        },
        {
          clause_number: 'Clause 15',
          title: 'Cross-Border Data Residency Commitments',
          ground_truth_classification: 'NO_CONFLICT',
          predicted_classification: 'NO_CONFLICT',
          ground_truth_confidence: 'EXPLICITLY_STATED',
          predicted_confidence: 'EXPLICITLY_STATED',
          ground_truth_risk: 'LOW',
          predicted_risk: 'LOW',
          is_conflict: false,
          status: 'PASS',
          citation_verified: true,
          evidence_count: 1,
          citations: [{ text: 'stored and processed within data centers located inside the European Economic Area (EEA)...', verified: true, page: 1, doc: 'POL-CBD-02' }],
          reasoning: 'Exclusive EEA data residency is fully compliant.',
        },
      ],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockAdapter = new MockAdapter();
