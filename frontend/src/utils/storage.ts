import type { ReviewerDecision } from '../types';

const STORAGE_PREFIX = 'compliance_reviewer_decisions_';

export function getStoredDecisions(reportId: string): Record<string, ReviewerDecision> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read reviewer decisions from localStorage', e);
    return {};
  }
}

export function saveStoredDecision(
  reportId: string,
  decision: ReviewerDecision
): Record<string, ReviewerDecision> {
  try {
    const existing = getStoredDecisions(reportId);
    existing[decision.clause_id] = decision;
    localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(existing));
    return existing;
  } catch (e) {
    console.error('Failed to write reviewer decision to localStorage', e);
    return {};
  }
}
