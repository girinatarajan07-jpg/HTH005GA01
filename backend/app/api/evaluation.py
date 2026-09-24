"""
Evaluation & Benchmarking API Endpoints.
Serves live metrics, confusion matrix, precision, recall, and citation accuracy against ground truth.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, Optional

from app.services.eval_engine import run_evaluation, load_answer_key
import app.services.pipeline as pl

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.get("", response_model=Dict[str, Any])
async def get_evaluation_metrics(report_id: Optional[str] = None):
    """
    Returns live benchmark evaluation metrics comparing the compliance analysis against seeded ground truth.
    Metrics include: Recall, Precision, Citation Accuracy, Hallucination Rate, 'Not Found' Correctness,
    Confusion Matrix (TP/FP/TN/FN), and a clause-by-clause audit comparison.
    """
    target_report = None
    if report_id:
        target_report = pl.stored_reports.get(report_id)
        if not target_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID '{report_id}' not found."
            )
    else:
        # Pick latest report if available
        if pl.stored_reports:
            target_report = list(pl.stored_reports.values())[-1]

    results = run_evaluation(target_report)
    return results


@router.get("/ground-truth", response_model=Dict[str, Any])
async def get_ground_truth_answer_key():
    """
    Returns the seeded ground truth answer key dataset.
    """
    data = load_answer_key()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seeded ground truth answer key not found on server."
        )
    return data
