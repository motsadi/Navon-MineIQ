"""API routes for Navon MineIQ."""
from __future__ import annotations

import io
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.data_loader import DataStore, get_store
from app.schemas.models import (
    Asset,
    BaselineResponse,
    GenericTable,
    RulResponse,
    SummaryResponse,
    TelemetryResponse,
)
from app.services import analytics

router = APIRouter()


def store() -> DataStore:
    return get_store()


def _require_asset(s: DataStore, asset_id: str) -> dict:
    row = s.assets[s.assets["asset_id"] == asset_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    return analytics.records(row)[0]


@router.get("/summary", response_model=SummaryResponse, tags=["overview"])
def get_summary():
    return analytics.build_summary(store())


@router.get("/assets", response_model=list[Asset], tags=["assets"])
def list_assets(
    asset_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
):
    df = analytics.assets_with_alerts(store())
    if asset_type:
        df = df[df["asset_type"] == asset_type]
    if location:
        df = df[df["location"] == location]
    if risk_level:
        df = df[df["risk_level"] == risk_level]
    return analytics.records(df)


@router.get("/assets/{asset_id}", tags=["assets"])
def get_asset(asset_id: str):
    s = store()
    asset = _require_asset(s, asset_id)
    asset["open_alerts"] = int(analytics.open_alert_counts(s).get(asset_id, 0))
    latest = s.telemetry_for(asset_id, "daily").tail(1)
    rul = s.rul_estimates[s.rul_estimates["asset_id"] == asset_id]
    preds = s.predictions[s.predictions["asset_id"] == asset_id].sort_values("timestamp").tail(1)
    return {
        "asset": asset,
        "latest_telemetry": analytics.records(latest)[0] if not latest.empty else {},
        "rul": analytics.records(rul)[0] if not rul.empty else {},
        "latest_prediction": analytics.records(preds)[0] if not preds.empty else {},
        "open_alerts": int(analytics.open_alert_counts(s).get(asset_id, 0)),
    }


@router.get("/assets/{asset_id}/telemetry", response_model=TelemetryResponse, tags=["assets"])
def get_telemetry(
    asset_id: str,
    granularity: str = Query("daily", pattern="^(daily|hourly)$"),
):
    s = store()
    _require_asset(s, asset_id)
    df = s.telemetry_for(asset_id, granularity)
    if df.empty:
        raise HTTPException(status_code=404, detail="No telemetry for asset")
    df = df.copy()
    df["timestamp"] = df["timestamp"].astype(str)
    return {
        "asset_id": asset_id,
        "granularity": granularity,
        "columns": list(df.columns),
        "points": analytics.records(df),
    }


@router.get("/assets/{asset_id}/baseline", response_model=BaselineResponse, tags=["assets"])
def get_baseline(asset_id: str):
    s = store()
    _require_asset(s, asset_id)
    return analytics.compute_baselines(s, asset_id)


@router.get("/assets/{asset_id}/rul", response_model=RulResponse, tags=["assets"])
def get_rul(asset_id: str):
    s = store()
    _require_asset(s, asset_id)
    rul = s.rul_estimates[s.rul_estimates["asset_id"] == asset_id]
    if rul.empty:
        raise HTTPException(status_code=404, detail="No RUL estimate for asset")
    record = analytics.records(rul)[0]
    preds = s.predictions[s.predictions["asset_id"] == asset_id].sort_values("timestamp")
    trend = preds[["timestamp", "rul_days", "failure_risk", "health_score"]].copy()
    trend["timestamp"] = trend["timestamp"].astype(str)
    record["trend"] = analytics.records(trend.iloc[::7])
    return record


@router.get("/assets/{asset_id}/alerts", response_model=GenericTable, tags=["assets"])
def get_asset_alerts(asset_id: str):
    s = store()
    _require_asset(s, asset_id)
    df = s.alerts[s.alerts["asset_id"] == asset_id].copy()
    df["timestamp"] = df["timestamp"].astype(str)
    return {"count": int(len(df)), "items": analytics.records(df)}


@router.get("/assets/{asset_id}/anomalies", response_model=GenericTable, tags=["assets"])
def get_asset_anomalies(asset_id: str):
    s = store()
    _require_asset(s, asset_id)
    flags = analytics.anomaly_flags(s, asset_id)
    return {"count": len(flags), "items": flags}


@router.get("/alerts", response_model=GenericTable, tags=["alerts"])
def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    df = store().alerts.copy()
    if severity:
        df = df[df["severity"] == severity]
    if status:
        df = df[df["status"] == status]
    df["timestamp"] = df["timestamp"].astype(str)
    return {"count": int(len(df)), "items": analytics.records(df)}


@router.get("/maintenance", tags=["maintenance"])
def get_maintenance():
    return analytics.maintenance_summary(store())


@router.get("/predictive", tags=["analytics"])
def get_predictive():
    return analytics.predictive_summary(store())


@router.get("/model-governance", response_model=GenericTable, tags=["governance"])
def get_model_governance():
    df = store().model_governance
    return {"count": int(len(df)), "items": analytics.records(df)}


@router.get("/data-quality", response_model=GenericTable, tags=["governance"])
def get_data_quality():
    df = store().data_quality
    return {"count": int(len(df)), "items": analytics.records(df)}


@router.get("/esg", tags=["esg"])
def get_esg():
    return analytics.esg_summary(store())


@router.get("/users", response_model=GenericTable, tags=["admin"])
def get_users():
    df = store().users
    return {"count": int(len(df)), "items": analytics.records(df)}


def _csv_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/asset-report/{asset_id}", tags=["reports"])
def export_asset_report(asset_id: str):
    s = store()
    _require_asset(s, asset_id)
    tel = s.telemetry_for(asset_id, "daily").copy()
    tel["timestamp"] = tel["timestamp"].astype(str)
    return _csv_response(tel, f"navon_mineiq_{asset_id}_report.csv")


@router.get("/export/{report}", tags=["reports"])
def export_report(report: str):
    s = store()
    mapping = {
        "asset-health": (analytics.assets_with_alerts(s), "asset_health"),
        "alerts": (s.alerts, "alerts"),
        "maintenance": (s.maintenance, "maintenance"),
        "data-quality": (s.data_quality, "data_quality"),
        "model-governance": (s.model_governance, "model_governance"),
    }
    if report not in mapping:
        raise HTTPException(status_code=404, detail=f"Unknown report '{report}'")
    df, name = mapping[report]
    df = df.copy()
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].astype(str)
    return _csv_response(df, f"navon_mineiq_{name}.csv")
