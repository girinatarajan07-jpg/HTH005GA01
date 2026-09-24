"""
Analysis API endpoints.
Initiates compliance analysis jobs and provides status polling.
"""

import asyncio
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, status

from app.models.schemas import AnalysisJob, AnalysisStatus, StepStatus
import app.services.pipeline as pl

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("", status_code=status.HTTP_200_OK)
async def start_analysis(background_tasks: BackgroundTasks):
    """
    Kicks off a grounded compliance analysis job over currently uploaded policies and contract.
    """
    if not pl.uploaded_policies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 1 corporate policy document must be uploaded before starting analysis."
        )

    if not pl.uploaded_contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A contract document must be uploaded before starting analysis."
        )

    job_id = f"job-{uuid.uuid4().hex[:8]}"

    job = AnalysisJob(
        job_id=job_id,
        status=AnalysisStatus.QUEUED,
        steps=[s.model_copy() for s in pl.INITIAL_STEPS],
        report_id=None,
        error_message=None
    )
    pl.active_jobs[job_id] = job

    # Run in background
    background_tasks.add_task(
        pl.run_compliance_pipeline,
        job_id,
        list(pl.uploaded_policies),
        pl.uploaded_contract
    )

    return {"job_id": job_id}


@router.get("/{job_id}", response_model=AnalysisJob)
async def get_analysis_status(job_id: str):
    """
    Polls the current execution status and step progression of an analysis job.
    """
    job = pl.active_jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job with ID '{job_id}' not found."
        )

    return job
