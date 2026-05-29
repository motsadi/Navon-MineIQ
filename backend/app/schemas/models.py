"""Pydantic response schemas for the Navon MineIQ API."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    data: dict[str, int]


class Asset(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    location: str
    area: Optional[str] = None
    criticality: Optional[str] = None
    system_group: Optional[str] = None
    primary_source: Optional[str] = None
    phase1_population: Optional[str] = None
    health_score: float
    failure_risk: float
    risk_level: str
    rul_days: int
    status: str
    open_alerts: int = 0


class SummaryResponse(BaseModel):
    total_assets: int
    average_health_score: float
    high_risk_assets: int
    open_critical_alerts: int
    open_alerts: int
    predicted_downtime_risk_pct: float
    energy_efficiency_pct: float
    data_quality_score: float
    avg_rul_days: float
    risk_breakdown: dict[str, int]
    asset_risk_ranking: list[dict[str, Any]]
    health_trend: list[dict[str, Any]]
    top_alerts: list[dict[str, Any]]


class TelemetryResponse(BaseModel):
    asset_id: str
    granularity: str
    columns: list[str]
    points: list[dict[str, Any]]


class BaselineMetric(BaseModel):
    metric: str
    unit: str
    mean: float
    std: float
    lower_control_limit: float
    upper_control_limit: float
    warning_low: float
    warning_high: float
    critical_low: float
    critical_high: float
    latest_value: Optional[float] = None
    in_envelope: Optional[bool] = None
    breaches: int = 0


class BaselineResponse(BaseModel):
    asset_id: str
    training_window: str
    metrics: list[BaselineMetric]


class RulResponse(BaseModel):
    asset_id: str
    asset_name: str
    rul_days: int
    rul_lower_days: int
    rul_upper_days: int
    confidence: float
    method: str
    estimated_failure_date: str
    recommended_action: str
    trend: list[dict[str, Any]]


class Alert(BaseModel):
    alert_id: str
    asset_id: str
    timestamp: str
    severity: str
    alert_type: str
    reason_code: str
    recommended_action: str
    status: str
    owner_role: Optional[str] = None


class GenericTable(BaseModel):
    count: int
    items: list[dict[str, Any]]
