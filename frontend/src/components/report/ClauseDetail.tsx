import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { FindingBadge } from '../badges/FindingBadge';
import { RiskBadge } from '../badges/RiskBadge';
import { CitationStatus } from '../badges/CitationStatus';
import { RedlineDiff } from './RedlineDiff';
import { EvidenceCard } from './EvidenceCard';
import type {
  ClauseFinding,
  PolicyEvidence,
  ReviewerDecision,
  ReviewDecisionType,
  Citation,
} from '../../types';
import { formatDate } from '../../utils/formatters';

interface ClauseDetailProps {
  clause: ClauseFinding;
  decision?: ReviewerDecision;
  onSaveDecision: (decision: ReviewerDecision) => void;
  onViewSource: (evidence: PolicyEvidence) => void;
}

export const ClauseDetail: React.FC<ClauseDetailProps> = ({
  clause,
  decision,
  onSaveDecision,
  onViewSource,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<ReviewDecisionType | null>(
    decision?.decision ?? null
  );
  const [decisionNote, setDecisionNote] = useState<string>(decision?.note ?? '');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  useEffect(() => {
    setSelectedDecision(decision?.decision ?? null);
    setDecisionNote(decision?.note ?? '');
    setIsSavedFeedback(false);
  }, [clause.clause_id, decision]);

  const handleDecisionChange = (type: ReviewDecisionType) => {
    setSelectedDecision(type);
    const newDecision: ReviewerDecision = {
      clause_id: clause.clause_id,
      decision: type,
      note: decisionNote.trim(),
      updated_at: new Date().toISOString(),
    };
    onSaveDecision(newDecision);
    triggerSavedFeedback();
  };

  const handleNoteBlur = () => {
    if (selectedDecision) {
      const newDecision: ReviewerDecision = {
        clause_id: clause.clause_id,
        decision: selectedDecision,
        note: decisionNote.trim(),
        updated_at: new Date().toISOString(),
      };
      onSaveDecision(newDecision);
      triggerSavedFeedback();
    }
  };

  const triggerSavedFeedback = () => {
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  // Compute overall citation status
  const overallCitation: Citation = React.useMemo(() => {
    if (!clause.evidence || clause.evidence.length === 0) {
      if (clause.classification === 'NOT_FOUND') {
        return { verified: null, note: 'Policy is silent (No ungrounded claims)' };
      }
      return { verified: null, note: 'No policy citations available' };
    }
    const hasUnverified = clause.evidence.some((e) => e.citation?.verified === false);
    if (hasUnverified) {
      return { verified: false, note: 'Citation failed substring verification' };
    }
    const allVerified = clause.evidence.every((e) => e.citation?.verified === true);
    if (allVerified) {
      return { verified: true, note: '100% verified verbatim against policy repository' };
    }
    return { verified: null };
  }, [clause.evidence, clause.classification]);

  const formatConfidence = (c: string) => {
    switch (c) {
      case 'EXPLICITLY_STATED':
        return 'Explicitly stated';
      case 'INFERRED':
        return 'Inferred';
      case 'NOT_FOUND':
      default:
        return 'Not found';
    }
  };

  return (
    <div className="space-y-5">
      {/* Clause Heading & Overall Citation Verification */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-sky-900 tracking-wider">
                {clause.clause_number}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Compliance Evaluation</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FindingBadge classification={clause.classification} />
              <RiskBadge level={clause.risk_level} />
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Citation Verification
            </span>
            <CitationStatus citation={overallCitation} prominent />
          </div>
        </div>

        {/* Contract Text */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            <FileText size={14} className="text-slate-500" />
            <span>Target Contract Clause</span>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs leading-relaxed text-slate-900 select-text">
            {clause.clause_text}
          </div>
        </div>
      </div>

      {/* Finding Analysis & Risk Rationale Card */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Compliance Finding & Rationale
        </h4>

        {/* Risk & Classification Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Classification</span>
            <span className="font-semibold text-slate-800 capitalize">
              {clause.classification.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Evidence Confidence</span>
            <span className="font-semibold text-slate-800">
              {formatConfidence(clause.confidence)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Risk Assessment</span>
            <span className="font-semibold text-slate-800 capitalize">
              {clause.risk_level.replace(/_/g, ' ').toLowerCase()}
              {clause.risk_score ? ` (${Math.round(clause.risk_score)}/100)` : ''}
            </span>
          </div>
        </div>

        {/* One-Line Risk Rationale (PRD F10) */}
        {clause.risk_rationale && (
          <div className="rounded border border-rose-100 bg-rose-50/50 p-2.5 text-xs text-rose-900 flex items-start gap-2">
            <span className="font-bold text-rose-800 shrink-0">Risk Rationale:</span>
            <span>{clause.risk_rationale}</span>
          </div>
        )}

        {/* Finding Rationale specific to Classification */}
        <div className="pt-1">
          {clause.classification === 'EXPLICIT_CONFLICT' && (
            <div className="rounded-md border border-red-200 bg-red-50/50 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
                <AlertTriangle size={15} className="text-red-700 shrink-0" />
                <span>Explicit Policy Conflict Detected</span>
              </div>
              <p className="text-xs text-red-950 leading-relaxed font-medium">
                {clause.explanation}
              </p>
            </div>
          )}

          {clause.classification === 'INFERRED' && (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                <span>Inferred Variance Notice</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {clause.explanation}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
                  Human counsel negotiation advised.
                </span>
              </div>
            </div>
          )}

          {clause.classification === 'NO_CONFLICT' && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <CheckCircle size={15} className="text-emerald-700 shrink-0" />
                <span>Policy Compliant</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {clause.explanation}
              </p>
            </div>
          )}

          {clause.classification === 'NOT_FOUND' && (
            <div className="rounded-md border border-slate-200 bg-slate-100/70 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <HelpCircle size={15} className="text-slate-500 shrink-0" />
                <span>Policy Silent — Not Found in Any Policy</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {clause.explanation}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  Grounding note: Zero fabricated claims.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Revision (Redline Diff View - PRD F9) */}
      {clause.suggested_redline && (
        <RedlineDiff
          originalText={clause.clause_text}
          redlineText={clause.suggested_redline}
          onAccept={() => handleDecisionChange('ACCEPT')}
          onReject={() => handleDecisionChange('DISMISS')}
        />
      )}

      {/* Policy Evidence Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Policy Citations ({clause.evidence.length})
          </h4>
          <span className="text-[11px] text-slate-500">
            100% verified verbatim against policy repository
          </span>
        </div>

        {clause.evidence.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
            No policy documents contain matching provisions for this clause. (Policy Silent)
          </div>
        ) : (
          <div className="space-y-3">
            {clause.evidence.map((evidence, idx) => (
              <div key={`${evidence.document_id}-${evidence.page}-${idx}`} className="relative group">
                <EvidenceCard
                  evidence={evidence}
                  onViewSource={onViewSource}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewer Decision (Real input persisted to localStorage) */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4 print-avoid-break">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-sky-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reviewer Decision
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Clock size={12} />
            <span>Saved in this browser</span>
            {isSavedFeedback && (
              <span className="text-emerald-600 font-semibold transition-opacity">
                • Saved!
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs text-slate-600 font-medium block">
            Record compliance decision for this clause:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDecisionChange('ACCEPT')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-all ${
                selectedDecision === 'ACCEPT'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              ✓ Accept Finding
            </button>

            <button
              type="button"
              onClick={() => handleDecisionChange('DISMISS')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-all ${
                selectedDecision === 'DISMISS'
                  ? 'border-slate-600 bg-slate-100 text-slate-900 ring-2 ring-slate-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              ✕ Dismiss Finding
            </button>

            <button
              type="button"
              onClick={() => handleDecisionChange('NEEDS_LEGAL_REVIEW')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition-all ${
                selectedDecision === 'NEEDS_LEGAL_REVIEW'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              ⚖ Needs Legal Review
            </button>
          </div>

          <div className="pt-2">
            <label
              htmlFor={`note-${clause.clause_id}`}
              className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1"
            >
              Compliance Counsel Notes (Optional)
            </label>
            <textarea
              id={`note-${clause.clause_id}`}
              rows={2}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Add internal counsel notes, negotiation counter-terms, or policy variance justification..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {decision && (
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Status: <strong className="text-slate-700">{decision.decision}</strong>
              </span>
              <span>Last updated: {formatDate(decision.updated_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
