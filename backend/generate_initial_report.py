"""
Generates an initial demonstration compliance audit report from the sample policies and contract.
"""

import asyncio
from pathlib import Path
from app.services.pipeline import (
    seed_sample_documents_if_empty,
    run_compliance_pipeline,
    active_jobs,
    uploaded_policies,
    uploaded_contract,
    INITIAL_STEPS,
)
from app.models.schemas import AnalysisJob, AnalysisStatus


async def main():
    seed_sample_documents_if_empty()
    job_id = "job-initial-demo"
    job = AnalysisJob(
        job_id=job_id,
        status=AnalysisStatus.QUEUED,
        steps=[s.model_copy() for s in INITIAL_STEPS],
    )
    active_jobs[job_id] = job
    print("Running compliance pipeline on sample documents...")
    await run_compliance_pipeline(job_id, uploaded_policies, uploaded_contract)
    print(f"Pipeline completed with status: {job.status}")
    print(f"Generated Report ID: {job.report_id}")


if __name__ == "__main__":
    asyncio.run(main())
