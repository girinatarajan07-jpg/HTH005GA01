"""
Evaluation and Benchmark Engine.
Computes live compliance evaluation metrics against seeded ground truth answer key:
- Citation Accuracy (Target: 100%)
- Hallucination Rate (Target: 0%)
- Conflict Recall (Target: >85%)
- Conflict Precision (Target: >85%)
- 'Not Found' Correctness (Target: >90%)
- Confusion Matrix (TP, FP, TN, FN)
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.models.schemas import ComplianceReport, Classification, Confidence, RiskLevel
from app import config

ANSWER_KEY_PATH = config.SAMPLE_DATA_DIR / "eval_answer_key.json"


def load_answer_key() -> Optional[Dict[str, Any]]:
    if not ANSWER_KEY_PATH.exists():
        return None
    try:
        return json.loads(ANSWER_KEY_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def run_evaluation(report: Optional[ComplianceReport] = None) -> Dict[str, Any]:
    """
    Evaluates report findings against the ground truth answer key.
    If no report is provided, looks up the latest stored report.
    """
    answer_key = load_answer_key()
    if not answer_key:
        return {
            "error": "Ground truth answer key not found.",
            "metrics": {},
            "confusion_matrix": {},
            "clauses": []
        }

    gt_clauses = answer_key.get("clauses", [])
    report_clauses = report.clauses if report else []
    report_clauses_by_num = {c.clause_number.strip().lower(): c for c in report_clauses}

    tp = 0
    fp = 0
    tn = 0
    fn = 0

    total_citations = 0
    verified_citations = 0
    unverified_citations = 0

    not_found_expected_count = 0
    not_found_correct_count = 0

    comparison_items = []

    for idx, gt in enumerate(gt_clauses, start=1):
        num_str = gt["clause_number"].strip().lower()
        pred = report_clauses_by_num.get(num_str)
        if not pred and idx <= len(report_clauses):
            pred = report_clauses[idx - 1]

        gt_cls = gt["ground_truth_classification"]
        is_gt_conflict = gt_cls in ["EXPLICIT_CONFLICT", "INFERRED"]
        is_gt_not_found = gt_cls == "NOT_FOUND"

        if is_gt_not_found:
            not_found_expected_count += 1

        pred_cls = pred.classification.value if pred else "NOT_FOUND"
        pred_conf = pred.confidence.value if pred else "NOT_FOUND"
        pred_risk = pred.risk_level.value if pred else "LOW"
        is_pred_conflict = pred_cls in ["EXPLICIT_CONFLICT", "INFERRED"]

        # Confusion Matrix
        if is_gt_conflict and is_pred_conflict:
            tp += 1
        elif not is_gt_conflict and is_pred_conflict:
            fp += 1
        elif not is_gt_conflict and not is_pred_conflict:
            tn += 1
        elif is_gt_conflict and not is_pred_conflict:
            fn += 1

        # Not Found correctness
        if is_gt_not_found and pred_cls == "NOT_FOUND":
            not_found_correct_count += 1

        # Citation verification metrics
        clause_cites_verified = True
        cited_snippets = []
        if pred and pred.evidence:
            for ev in pred.evidence:
                total_citations += 1
                if ev.citation and ev.citation.verified is True:
                    verified_citations += 1
                    cited_snippets.append({"text": ev.text[:120], "verified": True, "page": ev.page, "doc": ev.document})
                else:
                    unverified_citations += 1
                    clause_cites_verified = False
                    cited_snippets.append({"text": ev.text[:120], "verified": False, "page": ev.page, "doc": ev.document})

        is_exact_match = (gt_cls == pred_cls)
        
        comparison_items.append({
            "clause_number": gt["clause_number"],
            "title": gt["title"],
            "ground_truth_classification": gt_cls,
            "predicted_classification": pred_cls,
            "ground_truth_confidence": gt.get("ground_truth_confidence", "EXPLICITLY_STATED"),
            "predicted_confidence": pred_conf,
            "ground_truth_risk": gt.get("risk_level", "LOW"),
            "predicted_risk": pred_risk,
            "is_conflict": is_pred_conflict,
            "status": "PASS" if is_exact_match else "DISCREPANCY",
            "citation_verified": clause_cites_verified,
            "evidence_count": len(pred.evidence) if pred else 0,
            "citations": cited_snippets,
            "reasoning": gt["reasoning"]
        })

    # Calculations
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 1.0
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 1.0
    f1 = round(2 * (precision * recall) / (precision + recall + 1e-9), 4)
    accuracy = round((tp + tn) / len(gt_clauses), 4) if gt_clauses else 1.0

    citation_accuracy = round(verified_citations / total_citations, 4) if total_citations > 0 else 1.0
    hallucination_rate = round(unverified_citations / total_citations, 4) if total_citations > 0 else 0.0
    not_found_correctness = round(not_found_correct_count / not_found_expected_count, 4) if not_found_expected_count > 0 else 1.0

    return {
        "benchmark_name": answer_key.get("dataset_name", "ClauseGuard Evaluation Suite"),
        "target_contract": answer_key.get("target_contract", "CloudScale_Inc_Master_Services_Agreement.pdf"),
        "total_clauses": len(gt_clauses),
        "metrics": {
            "recall": recall,
            "recall_pct": round(recall * 100, 1),
            "precision": precision,
            "precision_pct": round(precision * 100, 1),
            "f1_score": f1,
            "accuracy_pct": round(accuracy * 100, 1),
            "citation_accuracy": citation_accuracy,
            "citation_accuracy_pct": round(citation_accuracy * 100, 1),
            "hallucination_rate": hallucination_rate,
            "hallucination_rate_pct": round(hallucination_rate * 100, 1),
            "not_found_correctness": not_found_correctness,
            "not_found_correctness_pct": round(not_found_correctness * 100, 1),
            "total_citations_checked": total_citations,
            "verified_citations": verified_citations,
            "unverified_citations": unverified_citations
        },
        "confusion_matrix": {
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "total": len(gt_clauses)
        },
        "targets": answer_key.get("metrics_targets", {
            "min_recall": 0.85,
            "min_precision": 0.85,
            "min_not_found_correctness": 0.90,
            "target_citation_accuracy": 1.00,
            "target_hallucination_rate": 0.00
        }),
        "clauses": comparison_items
    }
