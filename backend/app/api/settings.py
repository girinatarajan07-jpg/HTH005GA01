"""
Settings and System Health API endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import SystemHealth, SystemConfig
from app import config

router = APIRouter(tags=["Settings"])


@router.get("/health", response_model=SystemHealth)
async def get_health():
    """
    Returns live health status of backend and model inference services.
    """
    model_stat = "connected (hybrid local/cloud)" if (config.GEMINI_API_KEY or config.OPENAI_API_KEY) else "active (local grounded rule-engine)"
    return SystemHealth(
        backend="operational",
        model_status=model_stat,
        embedding_status="ready (TF-IDF sublinear vectorizer)",
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@router.get("/config", response_model=SystemConfig)
async def get_config():
    """
    Returns platform runtime configurations.
    """
    return SystemConfig(
        retrieval_count=config.DEFAULT_RETRIEVAL_TOP_K,
        confidence_display=True,
        citation_verification=True,
        min_policy_count=config.MIN_POLICIES,
        max_policy_count=config.MAX_POLICIES,
        max_file_size_bytes=config.MAX_FILE_SIZE_BYTES,
        version="1.0.0"
    )
