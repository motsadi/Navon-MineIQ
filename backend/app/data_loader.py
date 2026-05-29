"""Static data loader.

Loads the pre-generated CSV files from ``backend/data`` into pandas
DataFrames and caches them in memory. The platform never generates data at
runtime - it only reads these static files.
"""
from __future__ import annotations

import functools
from pathlib import Path

import pandas as pd

from app.core.config import settings


class DataStore:
    """Lazy, cached in-memory store for the static demo datasets."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir

    def _read(self, name: str, parse_dates: list[str] | None = None) -> pd.DataFrame:
        path = self.data_dir / name
        if not path.exists():
            raise FileNotFoundError(f"Required data file not found: {path}")
        return pd.read_csv(path, parse_dates=parse_dates)

    @functools.cached_property
    def assets(self) -> pd.DataFrame:
        return self._read("assets.csv")

    @functools.cached_property
    def telemetry(self) -> pd.DataFrame:
        return self._read("telemetry.csv", parse_dates=["timestamp"])

    @functools.cached_property
    def telemetry_hourly(self) -> pd.DataFrame:
        return self._read("telemetry_hourly.csv", parse_dates=["timestamp"])

    @functools.cached_property
    def predictions(self) -> pd.DataFrame:
        return self._read("model_predictions.csv", parse_dates=["timestamp"])

    @functools.cached_property
    def rul_estimates(self) -> pd.DataFrame:
        return self._read("rul_estimates.csv")

    @functools.cached_property
    def alerts(self) -> pd.DataFrame:
        return self._read("alerts.csv", parse_dates=["timestamp"])

    @functools.cached_property
    def maintenance(self) -> pd.DataFrame:
        return self._read("maintenance_events.csv", parse_dates=["event_date"])

    @functools.cached_property
    def users(self) -> pd.DataFrame:
        return self._read("users.csv")

    @functools.cached_property
    def data_quality(self) -> pd.DataFrame:
        return self._read("data_quality.csv")

    @functools.cached_property
    def model_governance(self) -> pd.DataFrame:
        return self._read("model_governance.csv")

    def telemetry_for(self, asset_id: str, granularity: str = "daily") -> pd.DataFrame:
        df = self.telemetry_hourly if granularity == "hourly" else self.telemetry
        return df[df["asset_id"] == asset_id].sort_values("timestamp").reset_index(drop=True)

    def health(self) -> dict:
        """Lightweight integrity check used by the /health endpoint."""
        return {
            "assets": int(len(self.assets)),
            "telemetry_rows": int(len(self.telemetry)),
            "telemetry_hourly_rows": int(len(self.telemetry_hourly)),
            "alerts": int(len(self.alerts)),
            "maintenance_events": int(len(self.maintenance)),
        }


@functools.lru_cache
def get_store() -> DataStore:
    return DataStore(settings.DATA_DIR)
