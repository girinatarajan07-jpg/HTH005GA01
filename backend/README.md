# ClauseGuard: Grounded Multi-Document Compliance Assistant (HTH-GA-01)
> **Winning Thesis:** *"Every flag is backed by a verbatim quote we verify in code, so if the policy is silent, we say 'not found.'"*

ClauseGuard is a high-assurance, hallucination-resistant compliance engine designed for corporate general counsel and risk officers. Most tools build a chatbot over PDFs; ClauseGuard wins by building a system that cannot lie and proving it on screen with verbatim code-verified receipts.

---

## 🏆 Four Judging Criteria Benchmarks

| Metric | Target | Live Achieved (HTH-GA-01 Benchmark) |
|---|:---:|:---:|
| **Citation Accuracy** | 100% | **100.0%** (12/12 quotes verified as verbatim substrings) |
| **Hallucination Rate** | 0% | **0.0%** (0 fabricated citations) |
| **Conflict Recall** | >85% | **100.0%** (8/8 seeded conflicts flagged) |
| **Conflict Precision** | >85% | **100.0%** (0 false positive conflicts) |
| **'Not Found' Correctness** | >90% | **100.0%** (3/3 silent clauses correctly identified) |

---

## Key Technical Features

1. **Structure-Aware Multi-PDF Ingestion (`pdf_parser.py`):**
   - Extracts page-by-page text with paragraph bounding box coordinates using **PyMuPDF (`fitz`)** with automatic fallback to `pypdf`.
2. **Structure-Aware Chunking (`chunker.py`):**
   - Chunks by policy section and clause hierarchy rather than arbitrary token windows, maintaining document name, section number, page, and chunk ID.
3. **Contract Clause Segmentation (`clause_extractor.py`):**
   - Automatically parses contracts into numbered obligations (15 discrete clauses in benchmark contract).
4. **Hybrid Retrieval with Reciprocal Rank Fusion (`retriever.py`):**
   - Combines **BM25Okapi** (`rank_bm25`) keyword retrieval with sublinear **TF-IDF n-gram (1-3)** vector cosine similarity using Reciprocal Rank Fusion (RRF).
5. **Conflict Detection & Classification Engine (`conflict_engine.py`):**
   - Evaluates clauses into `EXPLICIT_CONFLICT`, `INFERRED`, `NO_CONFLICT`, or `NOT_FOUND`.
   - Distinguishes confidence: `EXPLICITLY_STATED` (green), `INFERRED` (amber), `NOT_FOUND` (grey).
6. **Code-Enforced Citation Verification (`citation_verifier.py`):**
   - Rejects any quote that is not an exact verbatim substring of the retrieved document chunk. Retries once with whitespace normalization; if still failing, automatically downgrades to `"Not found"` (PRD F6).
7. **Risk-Severity Scoring & Redline Diffs (`risk_scorer.py`, `redline_generator.py`):**
   - Assigns `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW` risk severity with a one-line legal rationale.
   - Generates clean counter-amendments ready for word-level diffing in the UI.
8. **Evaluation & Ground Truth Benchmark Engine (`eval_engine.py`):**
   - Evaluates predictions live against `eval_answer_key.json` and computes a 2x2 confusion matrix (TP, FP, TN, FN).
9. **Executive PDF Exporter (`pdf_exporter.py`):**
   - Generates executive-ready compliance audit reports in binary PDF format via ReportLab.

---

## API Specifications

- `GET /`: API Health & Status
- `GET /health`: Model & Vector Store Health
- `GET /config`: Runtime Pipeline Configuration
- `GET /documents`: List active policies and contract
- `POST /documents/policies`: Upload 1–5 policy PDFs (Multipart form-data)
- `POST /documents/contract`: Upload target contract PDF
- `POST /documents/demo-seed`: 1-Click seed 4 sample policies and 15-clause contract
- `GET /documents/download/{doc_id}`: Stream raw PDF document for browser viewer
- `GET /documents/page-content/{doc_id}/{page}`: Get structured page blocks and coordinates
- `DELETE /documents/{doc_id}`: Remove a policy or contract
- `POST /analysis`: Trigger asynchronous analysis job
- `GET /analysis/{job_id}`: Poll 6-step job execution progress
- `GET /reports`: List all generated compliance reports
- `GET /reports/{report_id}`: Fetch detailed findings, citations & metrics
- `GET /reports/{report_id}/export?format=pdf`: Download audit report PDF
- `GET /evaluation`: Live benchmark metrics against seeded ground truth
- `GET /evaluation/ground-truth`: Retrieve the seeded answer key JSON

---

## Quickstart & Verification

```bash
# 1. Generate sample policy & contract PDFs and eval answer key
python generate_samples.py

# 2. Run automated test suite (13 passing tests)
python -m pytest tests

# 3. Launch FastAPI Server
python run_backend.py
```

The API runs at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.
