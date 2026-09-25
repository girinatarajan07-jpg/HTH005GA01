import React, { useState } from 'react';
import {
  GitCommit,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import type { EvidenceChain, ClauseFinding } from '../../types';

interface EvidenceChainPanelProps {
  chain: EvidenceChain | null | undefined;
  clause: ClauseFinding;
}

export const EvidenceChainPanel: React.FC<EvidenceChainPanelProps> = ({
  chain,
  clause,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!chain) {
    return null;
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-xs font-bold text-rose-900">
            <AlertTriangle size={12} className="text-rose-700" />
            <span>CONFLICT</span>
          </span>
        );
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 size={12} className="text-emerald-700" />
            <span>COMPLIANT</span>
          </span>
        );
      case 'POLICY_SILENT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-700">
            <Info size={12} className="text-slate-500" />
            <span>POLICY SILENT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900">
            <AlertTriangle size={12} className="text-amber-700" />
            <span>NEEDS REVIEW</span>
          </span>
        );
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 size={11} className="text-emerald-700" />
            <span>Exact Verbatim Match</span>
          </span>
        );
      case 'SIMILARITY_MATCH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <AlertTriangle size={11} className="text-amber-700" />
            <span>Fuzzy Match (Unverified)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            <span>Not Found / Policy Silent</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 bg-gradient-to-r from-slate-50 to-sky-50/50 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-sky-700 text-white shrink-0">
            <GitCommit size={14} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>6-Stage Compliance Evidence Chain ({clause.clause_number})</span>
              <span className="text-[10px] font-mono font-normal text-slate-500">
                (Deterministic Legal Audit Trail)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {getResultBadge(chain.final_result)}
          <span className="text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {/* Expanded Chain Flow */}
      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs bg-slate-50/30">
          {/* Step 1: Contract */}
          <div className="rounded border border-slate-200 bg-white p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-sky-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <FileText size={12} className="text-sky-700" />
                <span>1. Contract Provision</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Page {chain.contract.page} • {chain.contract.clause_number}
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed italic">
              "{chain.contract.quotation}"
            </p>
          </div>

          {/* Step 2: Retrieval */}
          {chain.retrieval && (
            <div className="rounded border border-slate-200 bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-indigo-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Search size={12} className="text-indigo-700" />
                  <span>2. Policy Retrieval</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {chain.retrieval.method}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 pt-0.5">
                <div>
                  <span className="text-slate-400 block text-[10px]">Document</span>
                  <span className="font-semibold text-slate-900 truncate block" title={chain.retrieval.document_name}>
                    {chain.retrieval.document_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Section</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {chain.retrieval.section || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Page Provenance</span>
                  <span className="font-semibold text-slate-900">
                    Page {chain.retrieval.page}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {chain.verification && (
            <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-950 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span>3. Citation Verification & Grounding Check</span>
                </span>
                {getVerificationBadge(chain.verification.match_status)}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">✓</span> Page Confirmed
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">✓</span> Section Confirmed
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">✓</span> Document Version Confirmed
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Extraction */}
          {chain.extraction && (
            <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-600" />
                  <span>4. Obligation Extraction</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                <div className="rounded bg-sky-50/70 border border-sky-200 p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-sky-900 uppercase">Contract Obligation</span>
                  <p className="text-[11px] text-sky-950 font-medium leading-relaxed">
                    {chain.extraction.contract_obligation}
                  </p>
                </div>
                <div className="rounded bg-indigo-50/70 border border-indigo-200 p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase">Policy Standard</span>
                  <p className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                    {chain.extraction.policy_obligation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Comparison & Final Result */}
          {chain.comparison && (
            <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Scale size={12} className="text-purple-600" />
                  <span>5 & 6. Deterministic Comparison & Outcome</span>
                </span>
                {getResultBadge(chain.final_result)}
              </div>
              <div className="rounded bg-slate-900 text-white p-3 font-mono text-[11px] space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <span>Contract Value: <strong className="text-amber-300">{chain.comparison.contract_value}</strong></span>
                  <ArrowRight size={12} className="text-slate-500" />
                  <span>Policy Operator: <strong className="text-sky-300">{chain.comparison.operator}</strong></span>
                  <ArrowRight size={12} className="text-slate-500" />
                  <span>Policy Target: <strong className="text-emerald-300">{chain.comparison.policy_value}</strong></span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 text-xs font-sans font-semibold text-slate-200">
                  Result: {chain.comparison.comparison_result}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
