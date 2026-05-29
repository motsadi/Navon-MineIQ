"""Navon MineIQ - FastAPI application entrypoint.

Run locally:
    uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

Interactive API docs are available at /docs (Swagger) and /redoc.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as api_router
from app.core.config import settings
from app.data_loader import get_store
from app.schemas.models import HealthResponse

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description=(
        f"{settings.APP_TAGLINE}. {settings.DISCLAIMER} "
        "All endpoints serve pre-generated static demo data."
    ),
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": settings.APP_TAGLINE,
        "version": settings.API_VERSION,
        "disclaimer": settings.DISCLAIMER,
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health():
    try:
        data = get_store().health()
        status = "ok"
    except Exception as exc:  # pragma: no cover - defensive
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": str(exc)},
        )
    return {
        "status": status,
        "app": settings.APP_NAME,
        "version": settings.API_VERSION,
        "data": data,
    }


app.include_router(api_router, prefix="/api")
