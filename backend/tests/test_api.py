"""
Tests for FastAPI Endpoints.
Verifies compliance with frontend API contracts.
"""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.pipeline import seed_sample_documents_if_empty

client = TestClient(app)


def setup_module():
    seed_sample_documents_if_empty()


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"


def test_health_and_config():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "backend" in data
    assert data["backend"] == "operational"

    resp_cfg = client.get("/config")
    assert resp_cfg.status_code == 200
    cfg = resp_cfg.json()
    assert cfg["retrieval_count"] >= 3
    assert cfg["citation_verification"] is True


def test_documents_listing():
    resp = client.get("/documents")
    assert resp.status_code == 200
    data = resp.json()
    assert "policies" in data
    assert "contract" in data
    assert len(data["policies"]) >= 1
    assert data["contract"] is not None


def test_start_analysis_and_wait():
    # Start analysis
    resp = client.post("/analysis")
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    assert job_id.startswith("job-")

    # Poll status
    status_resp = client.get(f"/analysis/{job_id}")
    assert status_resp.status_code == 200
    job = status_resp.json()
    assert len(job["steps"]) == 6
    assert job["status"] in ["QUEUED", "RUNNING", "COMPLETED"]


def test_reports_and_export():
    resp = client.get("/reports")
    assert resp.status_code == 200
    reports = resp.json()
    assert isinstance(reports, list)

    if reports:
        rep_id = reports[0]["report_id"]
        detail = client.get(f"/reports/{rep_id}")
        assert detail.status_code == 200
        rep_json = detail.json()
        assert "clauses" in rep_json
        assert "summary" in rep_json

        # Test PDF export
        pdf_resp = client.get(f"/reports/{rep_id}/export?format=pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 1000


def test_evaluation_api_endpoints():
    resp = client.get("/evaluation")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert "confusion_matrix" in data
    assert data["metrics"]["citation_accuracy"] == 1.0
    assert data["metrics"]["hallucination_rate"] == 0.0

    gt_resp = client.get("/evaluation/ground-truth")
    assert gt_resp.status_code == 200
    gt = gt_resp.json()
    assert gt["total_clauses"] == 15


def test_demo_seed_endpoint():
    resp = client.post("/documents/demo-seed")
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs["policies"]) == 4
    assert docs["contract"] is not None
    assert "CloudScale" in docs["contract"]["name"]
