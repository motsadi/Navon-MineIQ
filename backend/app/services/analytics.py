"""Analytics services.

These functions compute KPI summaries, engineering baselines / control limits,
anomaly flags and RUL views from the static data. Baselines are computed from
the historical telemetry (a rolling training window) rather than hard-coded,
demonstrating the engineering-baseline methodology used in production.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd

from app.data_loader import DataStore

# Metrics that carry physical meaning per asset and are used for baselines.
BASELINE_METRICS = {
    "vibration_mm_s": "mm/s",
    "temperature_c": "C",
    "motor_current_a": "A",
    "pressure_bar": "bar",
    "flow_rate": "m3/s",
    "speed_rpm": "rpm",
    "power_kw": "kW",
    "energy_kwh": "kWh",
}

# Number of leading samples used as the engineering training window.
TRAINING_WINDOW = 120


def _clean(value: Any) -> Any:
    """Convert NaN/inf to None for safe JSON serialisation."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        v = float(value)
        return None if math.isnan(v) else v
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return value


def records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Return DataFrame rows as JSON-safe dictionaries."""
    out: list[dict[str, Any]] = []
    for row in df.to_dict(orient="records"):
        out.append({k: _clean(v) for k, v in row.items()})
    return out


def _numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").dropna()


def open_alert_counts(store: DataStore) -> dict[str, int]:
    a = store.alerts
    open_a = a[a["status"].isin(["Open", "Acknowledged"])]
    return open_a.groupby("asset_id").size().to_dict()


def assets_with_alerts(store: DataStore) -> pd.DataFrame:
    df = store.assets.copy()
    counts = open_alert_counts(store)
    df["open_alerts"] = df["asset_id"].map(counts).fillna(0).astype(int)
    return df


def build_summary(store: DataStore) -> dict[str, Any]:
    assets = assets_with_alerts(store)
    alerts = store.alerts

    risk_levels = assets["risk_level"].value_counts().to_dict()
    breakdown = {k: int(risk_levels.get(k, 0)) for k in ["Low", "Medium", "High", "Critical"]}

    open_alerts = alerts[alerts["status"].isin(["Open", "Acknowledged"])]
    open_critical = open_alerts[open_alerts["severity"] == "Critical"]

    # Predicted downtime risk: weighted blend of failure risk and criticality.
    crit_weight = assets["criticality"].map(
        {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.3}
    ).fillna(0.5)
    downtime_risk = float((assets["failure_risk"] * crit_weight).mean())

    # Energy efficiency proxy from the energy meter (lower avoidable loss = better).
    dq = store.data_quality
    data_quality_score = float(dq["quality_score"].mean())

    energy = store.telemetry
    em = energy[energy["asset_id"] == "EM-01"]
    if not em.empty:
        loss = _numeric(em["avoidable_loss_estimate"])
        energy_kwh = _numeric(em["energy_kwh"])
        eff = 100 - float((loss.sum() / energy_kwh.sum()) * 100) if energy_kwh.sum() else 92.0
    else:
        eff = 92.0

    ranking = (
        assets.sort_values("failure_risk", ascending=False)[
            ["asset_id", "asset_name", "asset_type", "health_score", "failure_risk", "risk_level", "rul_days"]
        ]
    )

    # Fleet health trend: average health score over time across all assets.
    preds = store.predictions.copy()
    preds["date"] = preds["timestamp"].dt.date.astype(str)
    trend = (
        preds.groupby("date")["health_score"].mean().round(2).reset_index()
        .rename(columns={"health_score": "avg_health_score"})
    )
    # Downsample to weekly points to keep payload light.
    trend = trend.iloc[::7]

    top_alerts = (
        open_alerts.sort_values("severity", key=lambda s: s.map(
            {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}), ascending=False)
        .head(6)
    )

    return {
        "total_assets": int(len(assets)),
        "average_health_score": round(float(assets["health_score"].mean()), 1),
        "high_risk_assets": int(assets["risk_level"].isin(["High", "Critical"]).sum()),
        "open_critical_alerts": int(len(open_critical)),
        "open_alerts": int(len(open_alerts)),
        "predicted_downtime_risk_pct": round(downtime_risk, 1),
        "energy_efficiency_pct": round(eff, 1),
        "data_quality_score": round(data_quality_score, 1),
        "avg_rul_days": round(float(assets["rul_days"].mean()), 0),
        "risk_breakdown": breakdown,
        "asset_risk_ranking": records(ranking),
        "health_trend": records(trend),
        "top_alerts": records(top_alerts),
    }


def compute_baselines(store: DataStore, asset_id: str) -> dict[str, Any]:
    """Compute statistical control limits from the historical telemetry."""
    df = store.telemetry_for(asset_id, "daily")
    metrics_out = []
    for metric, unit in BASELINE_METRICS.items():
        if metric not in df.columns:
            continue
        series = _numeric(df[metric])
        if series.empty or series.sum() == 0:
            continue
        train = series.iloc[:TRAINING_WINDOW] if len(series) > TRAINING_WINDOW else series
        mean = float(train.mean())
        std = float(train.std(ddof=0)) or max(abs(mean) * 0.02, 0.01)
        ucl = mean + 3 * std
        lcl = max(mean - 3 * std, 0.0)
        warn_high = mean + 2 * std
        warn_low = max(mean - 2 * std, 0.0)
        latest = float(series.iloc[-1])
        breaches = int(((series > ucl) | (series < lcl)).sum())
        metrics_out.append({
            "metric": metric,
            "unit": unit,
            "mean": round(mean, 3),
            "std": round(std, 3),
            "lower_control_limit": round(lcl, 3),
            "upper_control_limit": round(ucl, 3),
            "warning_low": round(warn_low, 3),
            "warning_high": round(warn_high, 3),
            "critical_low": round(lcl, 3),
            "critical_high": round(ucl, 3),
            "latest_value": round(latest, 3),
            "in_envelope": bool(lcl <= latest <= ucl),
            "breaches": breaches,
        })
    return {
        "asset_id": asset_id,
        "training_window": f"First {TRAINING_WINDOW} daily samples (rolling engineering window)",
        "metrics": metrics_out,
    }


def anomaly_flags(store: DataStore, asset_id: str) -> list[dict[str, Any]]:
    """Flag telemetry points that breach control limits or model anomaly score."""
    baselines = {m["metric"]: m for m in compute_baselines(store, asset_id)["metrics"]}
    df = store.telemetry_for(asset_id, "daily").copy()
    preds = store.predictions
    preds = preds[preds["asset_id"] == asset_id][["timestamp", "anomaly_score"]]
    df = df.merge(preds, on="timestamp", how="left")

    flags = []
    for _, row in df.iterrows():
        breached = []
        for metric, b in baselines.items():
            val = pd.to_numeric(row.get(metric), errors="coerce")
            if pd.notna(val) and (val > b["upper_control_limit"] or val < b["lower_control_limit"]):
                breached.append(metric)
        anomaly = row.get("anomaly_score")
        is_anom = (pd.notna(anomaly) and anomaly > 0.6) or bool(breached)
        if is_anom:
            flags.append({
                "timestamp": str(row["timestamp"]),
                "anomaly_score": _clean(anomaly),
                "breached_metrics": breached,
            })
    return flags


def predictive_summary(store: DataStore) -> dict[str, Any]:
    preds = store.predictions
    latest = preds.sort_values("timestamp").groupby("asset_id").tail(1)
    latest = latest.merge(
        store.assets[["asset_id", "asset_name"]], on="asset_id", how="left"
    )
    feature_cols = [
        "contrib_vibration", "contrib_temperature", "contrib_motor_current",
        "contrib_downtime", "contrib_alarm_count",
    ]
    feature_importance = {
        c.replace("contrib_", ""): round(float(_numeric(latest[c]).mean()), 3)
        for c in feature_cols if c in latest.columns
    }
    total_anomalies = int((preds["anomaly_score"] > 0.6).sum())
    return {
        "total_assets_scored": int(len(latest)),
        "total_anomalies_detected": total_anomalies,
        "average_model_confidence": round(float(_numeric(latest["model_confidence"]).mean()), 3),
        "global_feature_importance": feature_importance,
        "latest_predictions": records(
            latest[[
                "asset_id", "asset_name", "asset_type", "health_score", "failure_risk",
                "anomaly_score", "rul_days", "risk_level", "model_confidence",
                "contrib_vibration", "contrib_temperature", "contrib_motor_current",
                "contrib_downtime", "contrib_alarm_count", "model_reason",
            ]].sort_values("failure_risk", ascending=False)
        ),
    }


def esg_summary(store: DataStore) -> dict[str, Any]:
    tel = store.telemetry.copy()
    tel["date"] = tel["timestamp"].dt.date.astype(str)

    # Energy trend from the energy meter.
    em = tel[tel["asset_id"] == "EM-01"].copy()
    em["energy_kwh"] = _numeric(em["energy_kwh"])
    energy_trend = records(
        em[["date", "energy_kwh", "demand_kw", "energy_intensity", "avoidable_loss_estimate"]]
        .iloc[::7]
    )

    total_energy = float(_numeric(tel["energy_kwh"]).sum())
    total_loss = float(_numeric(em["avoidable_loss_estimate"]).sum())
    avg_intensity = float(_numeric(em["energy_intensity"]).mean())

    # Ventilation fan efficiency proxy: airflow per kW.
    vf = tel[tel["asset_id"] == "VF-01"].copy()
    vf_flow = _numeric(vf["flow_rate"])
    vf_power = _numeric(vf["power_kw"])
    fan_eff = round(float((vf_flow / vf_power).mean()) * 100, 2) if not vf_power.empty else None

    # Underground EMS indicators.
    ems = tel[tel["asset_id"] == "EMS-01"].copy()
    ems_trend = records(
        ems[["date", "methane_ch4", "carbon_monoxide_co", "airflow_velocity",
             "humidity", "environmental_risk_score", "smoke_alarm"]].iloc[::5]
    )
    ems_latest = ems.sort_values("timestamp").tail(1)
    ems_indicators = records(ems_latest[[
        "methane_ch4", "carbon_monoxide_co", "airflow_velocity", "humidity",
        "smoke_alarm", "environmental_risk_score",
    ]])[0] if not ems_latest.empty else {}

    return {
        "total_energy_kwh": round(total_energy, 1),
        "total_avoidable_loss_kwh": round(total_loss, 1),
        "avg_energy_intensity": round(avg_intensity, 4),
        "ventilation_fan_efficiency_index": fan_eff,
        "environmental_risk_score": ems_indicators.get("environmental_risk_score"),
        "ems_latest_indicators": ems_indicators,
        "energy_trend": energy_trend,
        "ems_trend": ems_trend,
    }


def maintenance_summary(store: DataStore) -> dict[str, Any]:
    m = store.maintenance.copy()
    m["downtime_hours"] = _numeric(m["downtime_hours"])
    m["cost_estimate"] = _numeric(m["cost_estimate"])

    completed = m[m["status"] == "Completed"]
    # MTTR proxy = mean downtime hours of corrective/completed events.
    mttr = round(float(completed["downtime_hours"].mean()), 1) if not completed.empty else 0.0
    # MTBF proxy = window days / events per asset (demo heuristic).
    events_per_asset = m.groupby("asset_id").size()
    mtbf_days = round(365.0 / float(events_per_asset.mean()), 1) if not events_per_asset.empty else 0.0

    # Estimated downtime avoided: failure risk * criticality * nominal hours.
    assets = store.assets
    avoided = float((assets["failure_risk"] / 100.0 * 18).sum())
    cost_impact = float(m["cost_estimate"].sum())

    return {
        "total_events": int(len(m)),
        "scheduled": int((m["status"] == "Scheduled").sum()),
        "in_progress": int((m["status"] == "In Progress").sum()),
        "completed": int(len(completed)),
        "mttr_hours": mttr,
        "mtbf_days": mtbf_days,
        "estimated_downtime_avoided_hours": round(avoided, 1),
        "total_cost_estimate": round(cost_impact, 0),
        "events": records(m.sort_values("event_date", ascending=False)),
    }
