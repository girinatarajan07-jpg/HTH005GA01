# ClauseGuard (HTH-GA-01)
## Grounded Multi-Document Compliance Assistant

> **"Contract review where every claim has a receipt."**  
> *"Every flag is backed by a verbatim quote we verify in code, so if the policy is silent, we say 'not found.'"*

---

## 🏆 Hackathon Winning Thesis & Core Criteria

Most contract analysis tools rely on generic LLM chatbots that hallucinate citations or miss policy silence. **ClauseGuard** is engineered with a deterministic verification layer:

1. **Citation Accuracy (100%):** Every flag is verified in code with exact character offsets (`[start:end]`) and page numbers against the source PDF.
2. **Hallucination Rate (0%):** If a citation cannot be found verbatim in the policy manual, the citation verifier automatically rejects the citation and classifies the policy finding as `NOT_FOUND`.
3. **Usefulness of Flags:** Categorizes findings into `EXPLICIT_CONFLICT`, `INFERRED`, `NO_CONFLICT`, and `NOT_FOUND`. Provides risk scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), a 1-line business rationale, and a **word-level Redline Diff** counter-amendment with Accept/Reject/Copy controls.
4. **UI Clarity:** A unified **Three-Pane Split Workspace** (Contract clauses on left, Findings & Redlines in middle, illuminated PDF Source Dock on right) and an interactive **Evaluation Benchmark Dashboard** with a live Confusion Matrix.

---

## 📊 Benchmark Evaluation Results

Tested against 15 contract clauses (*CloudScale Inc. Master Services Agreement*) cross-checked against 3 corporate policies:

| Metric | Score | Benchmark Target |
| :--- | :---: | :---: |
| **Citation Accuracy** | **100.0%** | > 95% |
| **Hallucination Rate** | **0.0%** | < 2% |
| **Precision** | **100.0%** | > 90% |
| **Recall** | **100.0%** | > 90% |
| **F1 Score** | **1.000** | > 0.90 |
| **'Not Found' Correctness** | **100.0%** | 100% |

### 2x2 Confusion Matrix
- **True Positives (TP = 8):** Security Audit, Data Ownership, Breach Notice, Subprocessor Notice, Incident Liability, Data Deletion, Governing Law, Encryption Standards.
- **False Positives (FP = 0):** Zero non-violating clauses incorrectly flagged.
- **True Negatives (TN = 7):** 4 Compliant (Payment Terms, Confidentiality, Service Credits, Support SLA) + 3 Policy-Silent (Force Majeure, Publicity, Termination).
- **False Negatives (FN = 0):** Zero violations missed.

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI & Python)
```bash
cd backend
python -m pip install -r requirements.txt
python run_backend.py
```
- API Docs live at: `http://localhost:8000/docs`
- Run test suite: `python -m pytest tests -v` (13/13 passing)

### 2. Frontend Setup (React & Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 📁 Repository Structure
```
HTH05GA01/
├── backend/
│   ├── app/
│   │   ├── api/            # REST endpoints (documents, analysis, reports, evaluation)
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Core pipeline:
│   │   │   ├── citation_verifier.py    # Anti-hallucination verification
│   │   │   ├── retriever.py            # Hybrid BM25 + TF-IDF RRF (k=60)
│   │   │   ├── conflict_engine.py      # Grounded conflict detection
│   │   │   ├── risk_scorer.py          # Risk scoring (0.0 - 10.0)
│   │   │   ├── redline_generator.py    # Myers LCS word-level diffs
│   │   │   ├── pdf_parser.py           # PyMuPDF bounding boxes
│   │   │   └── eval_engine.py          # Benchmark evaluator
│   │   └── main.py
│   ├── sample_data/        # 4 PDF documents & eval_answer_key.json
│   ├── tests/              # 13 automated tests
│   ├── requirements.txt
│   └── run_backend.py
├── frontend/
│   ├── src/
│   │   ├── components/     # Three-pane components, Risk Heatmap, Redline Diff, Source Dock
│   │   ├── pages/          # Workspace, ReportPage, EvaluationPage, DashboardPage
│   │   └── api/            # API integration & mock fallback
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── .gitignore
```
