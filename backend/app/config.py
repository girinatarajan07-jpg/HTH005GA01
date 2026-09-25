"""
Configuration module for Grounded Compliance Assistant Backend.
"""

import os

# Limit OpenBLAS, MKL, and OMP thread allocations to prevent out-of-memory errors
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
REPORT_DIR = STORAGE_DIR / "reports"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

# API Keys (Optional; system gracefully falls back to local grounded reasoning engine)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Pipeline and RAG Settings
DEFAULT_RETRIEVAL_TOP_K = 3
CHUNK_SIZE_CHARS = 800
CHUNK_OVERLAP_CHARS = 150
SIMILARITY_THRESHOLD = 0.22

# Constraints
MIN_POLICIES = 1  # Allows testing with 1 or full suite of 3-5
MAX_POLICIES = 5
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

# CORS Allowed Origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "*"
]
