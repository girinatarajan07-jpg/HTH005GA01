import React, { useState } from 'react';
import { Check, Copy, CheckCheck, X, Sparkles, SplitSquareVertical, Columns } from 'lucide-react';

interface RedlineDiffProps {
  originalText: string;
  redlineText: string;
  onAccept?: () => void;
  onReject?: () => void;
}

interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

/**
 * Word-level diff computation using Longest Common Subsequence (LCS).
 * Produces crisp insertions in green and deletions in red with strikethrough.
 */
function computeWordDiff(original: string, modified: string): DiffToken[] {
  // Tokenize into words and punctuation
  const tokenize = (text: string) => text.match(/\S+|\s+/g) || [];
  const origTokens = tokenize(original);
  const modTokens = tokenize(modified);

  const m = origTokens.length;
  const n = modTokens.length;

  // LCS dynamic programming table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i - 1] === modTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find differences
  const diff: DiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === modTokens[j - 1]) {
      diff.unshift({ type: 'unchanged', value: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', value: modTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'removed', value: origTokens[i - 1] });
      i--;
    }
  }

  return diff;
}

export const RedlineDiff: React.FC<RedlineDiffProps> = ({
  originalText,
  redlineText,
  onAccept,
  onReject,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const diffTokens = React.useMemo(() => {
    return computeWordDiff(originalText, redlineText);
  }, [originalText, redlineText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(redlineText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-sky-700" />
          <span className="font-bold text-slate-800">Suggested Redline Revision</span>
          <span className="text-[11px] text-slate-500 font-normal">
            (Word-level compliance diff)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                viewMode === 'unified'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SplitSquareVertical size={11} />
              <span>Unified Diff</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-sky-100 text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns size={11} />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            title="Copy redlined clause text to clipboard"
          >
            {copied ? (
              <>
                <CheckCheck size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-500" />
                <span>Copy Redline</span>
              </>
            )}
          </button>

          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 text-xs font-semibold shadow-xs"
            >
              <Check size={13} />
              <span>Accept Redline</span>
            </button>
          )}

          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <X size={13} />
              <span>Reject</span>
            </button>
          )}
        </div>
      </div>

      {/* Diff Content View */}
      {viewMode === 'unified' ? (
        <div className="p-4 font-mono text-xs leading-relaxed select-text bg-slate-50/40">
          <div className="p-3 bg-white rounded border border-slate-200">
            {diffTokens.map((token, idx) => {
              if (token.type === 'removed') {
                return (
                  <span
                    key={idx}
                    className="bg-rose-100 text-rose-900 line-through decoration-rose-700 decoration-1 px-0.5 rounded-xs"
                  >
                    {token.value}
                  </span>
                );
              }
              if (token.type === 'added') {
                return (
                  <span
                    key={idx}
                    className="bg-emerald-100 text-emerald-950 font-bold px-0.5 rounded-xs underline decoration-emerald-600 decoration-2"
                  >
                    {token.value}
                  </span>
                );
              }
              return <span key={idx} className="text-slate-700">{token.value}</span>;
            })}
          </div>

          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2.5 bg-rose-200 border border-rose-300 rounded-xs" />
              <span>Strikethrough: Non-compliant term deleted</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2.5 bg-emerald-200 border border-emerald-400 rounded-xs" />
              <span>Green underline: Policy-aligned term inserted</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-3 bg-slate-50/50 text-xs font-mono">
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
              Original Contract Clause
            </span>
            <div className="mt-2 text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">
              {originalText}
            </div>
          </div>
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              Proposed Counter-Language
            </span>
            <div className="mt-2 text-emerald-950 font-medium leading-relaxed bg-emerald-50/40 p-3 rounded border border-emerald-200">
              {redlineText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
