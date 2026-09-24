# ClauseGuard: Grounded Multi-Document Compliance Assistant (Frontend)
> **Winning Pitch:** *"Contract review where every claim has a receipt."*  
> **One-Line Thesis:** *"Every flag is backed by a verbatim quote we verify in code, so if the policy is silent, we say 'not found.'"*

ClauseGuard (HTH-GA-01) is an enterprise legal-tech compliance workspace designed for general counsel, compliance auditors, and procurement teams.

---

## 🚀 Key UI & Functional Capabilities

1. **Three-Pane Split Workspace (`/report/:reportId`):**
   - **Left Pane:** Contract clauses list with colored risk markers (Critical, High, Medium, Low), search, finding filters, and an interactive **Risk Heatmap** (click to jump to any clause).
   - **Middle Pane:** Deep compliance finding analysis, 3-state confidence badges (Explicitly Stated - green, Inferred - amber, Not Found - grey), one-line risk rationales, **Word-Level Redline Diff Viewer** (insertions in green, deletions in red strikethrough with Accept, Reject, and Copy actions), and reviewer decision storage saved to `localStorage`.
   - **Right Pane (Click-to-Source PDF / Policy Viewer):** Automatically opens the authoritative policy PDF/document at the exact page with the verbatim quote highlighted in luminous amber, displaying exact character start/end offset receipts.
2. **Evaluation & Benchmark Dashboard (`/evaluation`):**
   - Live KPI tiles: **100% Citation Accuracy**, **0% Hallucination Rate**, **100% Recall**, **100% Precision**, **100% Not Found Correctness**.
   - Interactive 2x2 **Confusion Matrix** (TP: 8, FP: 0, TN: 7, FN: 0).
   - Clause-by-clause Ground Truth vs Prediction verification table with substring match receipts.
   - **"Re-run Live Evaluation"** button.
3. **Trust Top Bar:**
   - Persistent top bar showing: `"15 clauses analyzed · 12/12 citations verified (100% verbatim substring) · 0 unsupported claims · 0% hallucination rate"`.
4. **1-Click Demo Landing Experience (`/dashboard`):**
   - Headline: *"Contract review where every claim has a receipt."*
   - Single-click **"Try 1-Click Demo"** button immediately loads the 4-policy + 15-clause benchmark and takes the user directly into the review workspace.

---

## Architecture & Technology Stack

- **Framework:** React 18 with TypeScript (Strict mode enabled)
- **Bundler:** Vite
- **Styling:** Tailwind CSS v3.4 (Legal-professional palette, slate-50 backgrounds, serif headings + sans body, strict border definitions)
- **Routing:** React Router v6
- **State & Caching:** TanStack React Query (caching, query invalidation, polling)
- **Icons:** `lucide-react` (all badges use icon + text + color)

---

## Running the Application

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript compilation & production build
npm run build

# 3. Start development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.
