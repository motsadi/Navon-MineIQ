"""Application configuration.

Configuration is read from environment variables so the same image can run
locally, on Cloud Run, or anywhere else without code changes.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path


class Settings:
    """Runtime settings for the Navon MineIQ backend."""

    APP_NAME: str = "Navon MineIQ"
    APP_TAGLINE: str = "Asset Health, Reliability and Predictive Maintenance Platform"
    API_VERSION: str = "1.0.0"

    # Directory that holds the static, pre-generated demo data.
    DATA_DIR: Path = Path(
        os.getenv("DATA_DIR", str(Path(__file__).resolve().parents[2] / "data"))
    )

    # Comma-separated list of allowed CORS origins for the Vercel frontend.
    # "*" is allowed for the demo; tighten in production.
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "*",
        ).split(",")
        if o.strip()
    ]

    DISCLAIMER: str = (
        "This prototype uses simulated data only and does not connect to "
        "external operational systems."
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
