import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Printer,
  PlusCircle,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { getReport, exportReport } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/report/SummaryCard';
import { FilterBar, type FilterState } from '../components/report/FilterBar';
import { ClauseList } from '../components/report/ClauseList';
import { ClauseDetail } from '../components/report/ClauseDetail';
import { SourceDockViewer } from '../components/report/SourceDockViewer';
import { RiskHeatmap } from '../components/report/RiskHeatmap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { getStoredDecisions, saveStoredDecision } from '../utils/storage';
import { formatDate } from '../utils/formatters';
import type {
  Classification,
  RiskLevel,
  PolicyEvidence,
  ReviewerDecision,
} from '../types';

export const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Source Evidence for the Right-hand PDF / Document viewer
  const [activeEvidence, setActiveEvidence] = useState<PolicyEvidence | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportNotAvailable, setExportNotAvailable] = useState(false);

  // Reviewer decisions persisted in localStorage
  const [decisions, setDecisions] = useState<Record<string, ReviewerDecision>>(() => {
    return reportId ? getStoredDecisions(reportId) : {};
  });

  // Fetch report data
  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId!),
    enabled: !!reportId,
  });

  // Sync stored decisions when reportId changes
  useEffect(() => {
    if (reportId) {
      setDecisions(getStoredDecisions(reportId));
    }
  }, [reportId]);

  // Read filter state from URL query parameters
  const currentFilters: FilterState = useMemo(() => {
    return {
      search: searchParams.get('q') || '',
      classification: (searchParams.get('finding') as FilterState['classification']) || 'ALL',
      risk: (searchParams.get('risk') as FilterState['risk']) || 'ALL',
      sort: (searchParams.get('sort') as FilterState['sort']) || 'clause_number',
    };
  }, [searchParams]);

  // Read selected clause from URL or default to first clause
  const selectedClauseId = searchParams.get('clause') || null;

  // Filter and sort clauses
  const filteredClauses = useMemo(() => {
    if (!report?.clauses) return [];

    let list = [...report.clauses];

    // Search query
    if (currentFilters.search.trim()) {
      const q = currentFilters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.clause_number.toLowerCase().includes(q) ||
          c.clause_text.toLowerCase().includes(q) ||
          c.explanation.toLowerCase().includes(q) ||
          c.evidence.some(
            (e) =>
              e.document.toLowerCase().includes(q) ||
              e.text.toLowerCase().includes(q) ||
              e.section?.toLowerCase().includes(q)
          )
      );
    }

    // Classification filter
    if (currentFilters.classification !== 'ALL') {
      list = list.filter((c) => c.classification === currentFilters.classification);
    }

    // Risk filter
    if (currentFilters.risk !== 'ALL') {
      list = list.filter((c) => c.risk_level === currentFilters.risk);
    }

    // Sorting
    list.sort((a, b) => {
      if (currentFilters.sort === 'risk') {
        const riskOrder: Record<RiskLevel, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
          NOT_ASSESSED: 0,
        };
        return riskOrder[b.risk_level] - riskOrder[a.risk_level];
      }
      if (currentFilters.sort === 'classification') {
        const classOrder: Record<Classification, number> = {
          EXPLICIT_CONFLICT: 3,
          INFERRED: 2,
          NOT_FOUND: 1,
          NO_CONFLICT: 0,
        };
        return classOrder[b.classification] - classOrder[a.classification];
      }
      return a.clause_number.localeCompare(b.clause_number, undefined, {
        numeric: true,
      });
    });

    return list;
  }, [report?.clauses, currentFilters]);

  // Ensure an active selected clause exists
  const activeClause = useMemo(() => {
    if (!report?.clauses || report.clauses.length === 0) return null;
    if (selectedClauseId) {
      const match = report.clauses.find((c) => c.clause_id === selectedClauseId);
      if (match) return match;
    }
    return filteredClauses[0] || report.clauses[0];
  }, [report?.clauses, selectedClauseId, filteredClauses]);

  // Automatically update activeEvidence whenever activeClause changes
  useEffect(() => {
    if (activeClause && activeClause.evidence && activeClause.evidence.length > 0) {
      setActiveEvidence(activeClause.evidence[0]);
    } else {
      setActiveEvidence(null);
    }
  }, [activeClause?.clause_id]);

  const handleFilterChange = (newFilters: FilterState) => {
    const params = new URLSearchParams(searchParams);
    if (newFilters.search) params.set('q', newFilters.search);
    else params.delete('q');

    if (newFilters.classification !== 'ALL') params.set('finding', newFilters.classification);
    else params.delete('finding');

    if (newFilters.risk !== 'ALL') params.set('risk', newFilters.risk);
    else params.delete('risk');

    if (newFilters.sort !== 'clause_number') params.set('sort', newFilters.sort);
    else params.delete('sort');

    setSearchParams(params, { replace: true });
  };

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    params.delete('finding');
    params.delete('risk');
    params.delete('sort');
    setSearchParams(params, { replace: true });
  };

  const handleSelectClause = (clauseId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('clause', clauseId);
    setSearchParams(params, { replace: true });
  };

  const handleCardFilter = (type: 'conflicts' | 'inferred' | 'no_conflict' | 'not_found') => {
    const map: Record<string, Classification> = {
      conflicts: 'EXPLICIT_CONFLICT',
      inferred: 'INFERRED',
      no_conflict: 'NO_CONFLICT',
      not_found: 'NOT_FOUND',
    };
    const targetFinding = map[type];
    const isAlreadySelected = currentFilters.classification === targetFinding;
    handleFilterChange({
      ...currentFilters,
      classification: isAlreadySelected ? 'ALL' : targetFinding,
    });
  };

  const handleSaveDecision = (newDecision: ReviewerDecision) => {
    if (!reportId) return;
    const updated = saveStoredDecision(reportId, newDecision);
    setDecisions({ ...updated });
  };

  // Export report
  const handleExport = async () => {
    if (!reportId || exportNotAvailable) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const blob = await exportReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 501 || err?.kind === 'not_found') {
        setExportNotAvailable(true);
      } else {
        setExportError(err?.message || 'Export failed. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Verification statistics for the Trust Top Bar
  const stats = useMemo(() => {
    if (!report?.clauses) return { totalClauses: 0, verifiedCitations: 0, totalCitations: 0, unverifiedCount: 0 };
    let totalCites = 0;
    let verifiedCites = 0;
    let unverifiedCites = 0;

    report.clauses.forEach((c) => {
      c.evidence.forEach((e) => {
        totalCites++;
        if (e.citation?.verified === true) {
          verifiedCites++;
        } else {
          unverifiedCites++;
        }
      });
    });

    return {
      totalClauses: report.clauses.length,
      totalCitations: totalCites,
      verifiedCitations: verifiedCites,
      unverifiedCount: unverifiedCites,
    };
  }, [report?.clauses]);

  // Review progress calculation
  const totalClauses = report?.clauses?.length || 0;
  const reviewedClausesCount = useMemo(() => {
    if (!report?.clauses) return 0;
    return report.clauses.filter((c) => !!decisions[c.clause_id]).length;
  }, [report?.clauses, decisions]);

  const reviewPercent =
    totalClauses > 0 ? Math.round((reviewedClausesCount / totalClauses) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar with Counts & Trust Metrics (PRD Section 8) */}
      <div className="bg-slate-900 text-slate-200 px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print-hide">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="font-semibold text-white">Trust & Verification Bar:</span>
          <span className="font-mono text-emerald-300 font-bold">
            {stats.totalClauses} clauses analyzed
          </span>
          <span className="text-slate-500">•</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 size={13} />
            <span>{stats.verifiedCitations}/{stats.totalCitations} citations verified (100% verbatim substring)</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-mono">
            {stats.unverifiedCount} unsupported claims
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/evaluation')}
            className="inline-flex items-center gap-1.5 rounded bg-sky-900/80 hover:bg-sky-800 text-sky-200 border border-sky-700/60 px-2.5 py-1 text-[11px] font-semibold transition-colors"
          >
            <BarChart3 size={13} />
            <span>View Benchmark & Eval Dashboard</span>
          </button>
        </div>
      </div>

      {/* Report Header */}
      {report && (
        <PageHeader
          title={report.contract.name}
          subtitle={`Analysis conducted on ${formatDate(report.created_at)} • ${
            report.policies.length
          } internal policy baselines referenced`}
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-sky-700"
              >
                <PlusCircle size={14} className="text-slate-500" />
                <span>New Review</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-sky-700"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Print Report</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || exportNotAvailable}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold shadow-sm focus-visible:outline-sky-700 ${
                  exportNotAvailable
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-sky-700 text-white hover:bg-sky-800'
                }`}
                title="Download verified compliance report PDF"
              >
                <Download size={14} />
                <span>
                  {isExporting
                    ? 'Exporting...'
                    : exportNotAvailable
                    ? 'Export Not Available'
                    : 'Export PDF Report'}
                </span>
              </button>
            </>
          }
        >
          {/* Metadata badges and review progress */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span className="font-mono text-slate-500 font-semibold">
                Report ID: {report.report_id}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>{formatDate(report.created_at)}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Layers size={12} className="text-slate-400" />
                <span>{report.policies.length} Policies Verified</span>
              </span>
            </div>

            {/* Review Progress Indicator */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 font-medium">Review Progress:</span>
              <span className="font-semibold text-slate-800 text-xs font-mono">
                {reviewedClausesCount} of {totalClauses} clauses reviewed ({reviewPercent}%)
              </span>
              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${reviewPercent}%` }}
                />
              </div>
            </div>
          </div>
        </PageHeader>
      )}

      <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full space-y-5">
        {isLoading && <LoadingState label="Loading compliance report findings..." />}

        {isError && (
          <ErrorState
            error={error}
            title="Failed to load compliance report"
            onRetry={() => refetch()}
          />
        )}

        {exportError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-700" />
              <span>{exportError}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportError(null)}
              className="text-amber-700 hover:text-amber-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {report && (
          <>
            {/* 4 Summary Classification Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print-avoid-break">
              <SummaryCard
                type="conflicts"
                count={report.summary?.explicit_conflicts}
                isSelected={currentFilters.classification === 'EXPLICIT_CONFLICT'}
                onClick={() => handleCardFilter('conflicts')}
              />
              <SummaryCard
                type="inferred"
                count={report.summary?.inferred}
                isSelected={currentFilters.classification === 'INFERRED'}
                onClick={() => handleCardFilter('inferred')}
              />
              <SummaryCard
                type="no_conflict"
                count={report.summary?.no_conflict}
                isSelected={currentFilters.classification === 'NO_CONFLICT'}
                onClick={() => handleCardFilter('no_conflict')}
              />
              <SummaryCard
                type="not_found"
                count={report.summary?.not_found}
                isSelected={currentFilters.classification === 'NOT_FOUND'}
                onClick={() => handleCardFilter('not_found')}
              />
            </div>

            {/* Filter Bar */}
            <FilterBar
              filters={currentFilters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              totalCount={report.clauses.length}
              filteredCount={filteredClauses.length}
            />

            {/* THREE-PANE SPLIT WORKSPACE (PRD Section 4 & Section 8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* PANE 1: Left Column (3.5 cols) - Clause Navigation & Risk Heatmap */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-3 print-hide">
                {/* Risk Heatmap (PRD F10) */}
                <RiskHeatmap
                  clauses={report.clauses}
                  selectedClauseId={activeClause?.clause_id || null}
                  onSelectClause={handleSelectClause}
                />

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1 pt-1">
                  <span>Clause Catalog</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {filteredClauses.length} displayed
                  </span>
                </div>

                <ClauseList
                  clauses={filteredClauses}
                  selectedClauseId={activeClause?.clause_id || null}
                  decisions={decisions}
                  onSelectClause={handleSelectClause}
                  onClearFilters={handleResetFilters}
                />
              </div>

              {/* PANE 2: Middle Column (5 cols) - Finding Details & Redline Diff */}
              <div className="lg:col-span-5 xl:col-span-5">
                {activeClause ? (
                  <ClauseDetail
                    clause={activeClause}
                    decision={decisions[activeClause.clause_id]}
                    onSaveDecision={handleSaveDecision}
                    onViewSource={(ev) => setActiveEvidence(ev)}
                  />
                ) : (
                  <div className="rounded-md border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                    Select a clause from the left list to review detailed evidence.
                  </div>
                )}
              </div>

              {/* PANE 3: Right Column (3.5 / 4 cols) - Click-to-Source Policy PDF & Highlighted Passage Viewer (PRD F12) */}
              <div className="lg:col-span-3 xl:col-span-4 lg:sticky lg:top-4 h-[calc(100vh-140px)] min-h-[500px] print-hide">
                <SourceDockViewer
                  evidence={activeEvidence}
                  clause={activeClause}
                />
              </div>
            </div>

            {/* Print View Only: Comprehensive list of all clauses for printing */}
            <div className="hidden print:block space-y-8 mt-8">
              <h2 className="text-lg font-bold border-b pb-2">Full Clause Findings Breakdown</h2>
              {report.clauses.map((c) => (
                <div key={c.clause_id} className="print-avoid-break border-b pb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">{c.clause_number}</h3>
                    <span className="font-mono text-xs">{c.classification} • {c.risk_level}</span>
                  </div>
                  <p className="text-xs italic bg-slate-50 p-2 border">{c.clause_text}</p>
                  <p className="text-xs"><strong>Finding Rationale:</strong> {c.explanation}</p>
                  {c.evidence.length > 0 && (
                    <div className="text-xs space-y-1">
                      <strong>Citations ({c.evidence.length}):</strong>
                      {c.evidence.map((ev, i) => (
                        <div key={i} className="pl-3 border-l-2 border-slate-300 text-[11px]">
                          <span>{ev.document} (p. {ev.page}, {ev.section || ''}): </span>
                          <span className="font-mono">"{ev.text}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {decisions[c.clause_id] && (
                    <div className="text-xs bg-slate-100 p-2 rounded">
                      <strong>Reviewer Recorded Decision:</strong> {decisions[c.clause_id].decision}
                      {decisions[c.clause_id].note && ` — Note: ${decisions[c.clause_id].note}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
