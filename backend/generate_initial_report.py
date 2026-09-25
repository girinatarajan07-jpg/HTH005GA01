"""
Generates an initial demonstration compliance audit report from the sample policies and contract.
"""

import asyncio
from pathlib import Path
import app.services.pipeline as pl
from app.models.schemas import AnalysisJob, AnalysisStatus


async def main():
    pl.seed_sample_documents_if_empty()
    job_id = "job-initial-demo"
    job = AnalysisJob(
        job_id=job_id,
        status=AnalysisStatus.QUEUED,
        steps=[s.model_copy() for s in pl.INITIAL_STEPS],
    )
    pl.active_jobs[job_id] = job
    print("Running compliance pipeline on sample documents...")
    await pl.run_compliance_pipeline(job_id, pl.uploaded_policies, pl.uploaded_contract)
    print(f"Pipeline completed with status: {job.status}")
    if job.error_message:
        print(f"Error message: {job.error_message}")
    print(f"Generated Report ID: {job.report_id}")


if __name__ == "__main__":
    asyncio.run(main())
