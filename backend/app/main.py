"""
FastAPI Main Application for Grounded Compliance Assistant.
Provides enterprise contract compliance cross-checking against corporate policies with verified citations.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import config
from app.api import documents, analysis, reports, settings, evaluation

app = FastAPI(
    title="ClauseGuard Compliance Analysis API",
    description="Enterprise legal-tech RAG platform for multi-document policy compliance verification.",
    version="1.0.0",
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-routers
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(evaluation.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "Grounded Multi-Document Compliance Assistant API",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0",
    }
