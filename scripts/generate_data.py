"""
Navon MineIQ - deterministic demo data generator.

This script PRE-GENERATES all static demo data used by the platform and writes
it to ``backend/data`` as CSV files. It uses a fixed random seed so the output
is reproducible. The application itself NEVER generates data at runtime - it
only loads the static files produced here.

Run:
    python scripts/generate_data.py
"""
from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "backend" / "data"
OUT.mkdir(parents=True, exist_ok=True)

# Reference "current" date for the demo snapshot.
END = datetime(2026, 5, 29)
DAILY_DAYS = 365
HOURLY_DAYS = 30

daily_dates = [END - timedelta(days=i) for i in range(DAILY_DAYS - 1, -1, -1)]
hourly_dates = [
    END - timedelta(days=HOURLY_DAYS) + timedelta(hours=h)
    for h in range(HOURLY_DAYS * 24 + 1)
]


# ---------------------------------------------------------------------------
# Asset master definition. One representative asset per Phase 1 asset class.
# ``health0`` -> health one year ago, ``health1`` -> current health. The
# trajectory between them drives the failure-risk / RUL story for each asset.
# ---------------------------------------------------------------------------
ASSETS = [
    dict(
        asset_id="CM-01", asset_name="Continuous Miner 01", asset_type="Continuous Miner",
        location="Underground", area="Section A", criticality="High",
        system_group="Mobile Mining Equipment",
        primary_source="OEM telemetry / CM online communication",
        phase1_population="4 Continuous Miners",
        health0=90, health1=76, rul1=58,
    ),
    dict(
        asset_id="TC-01", asset_name="Trunk Conveyor 01", asset_type="Trunk Conveyor",
        location="Underground", area="Main Trunk", criticality="High",
        system_group="Material Handling",
        primary_source="SCADA / PLC-derived data",
        phase1_population="6 Trunk Conveyors",
        health0=92, health1=82, rul1=120,
    ),
    dict(
        asset_id="VF-01", asset_name="Ventilation Fan 01", asset_type="Ventilation Fan",
        location="Surface", area="Main Ventilation Station", criticality="Critical",
        system_group="Ventilation",
        primary_source="Ventilation fan online monitoring / SCADA",
        phase1_population="2 Ventilation Fans",
        health0=93, health1=68, rul1=41,
    ),
    dict(
        asset_id="DMS-01", asset_name="DMS Drum 01", asset_type="DMS Drum",
        location="Surface", area="Processing Plant - DMS Circuit", criticality="High",
        system_group="Processing Plant",
        primary_source="Adroit SCADA / historian extract",
        phase1_population="1 DMS Drum",
        health0=89, health1=78, rul1=96,
    ),
    dict(
        asset_id="CR-01", asset_name="Crusher 01", asset_type="Crusher",
        location="Surface", area="Processing Plant - Crushing", criticality="High",
        system_group="Processing Plant",
        primary_source="SCADA / vibration monitoring",
        phase1_population="3 Crushers",
        health0=91, health1=57, rul1=23,
    ),
    dict(
        asset_id="CP-01", asset_name="Compressor 01", asset_type="Compressor",
        location="Surface", area="Surface Services", criticality="Medium",
        system_group="Compressed Air",
        primary_source="SCADA / condition monitoring",
        phase1_population="3 Compressors",
        health0=92, health1=85, rul1=180,
    ),
    dict(
        asset_id="EM-01", asset_name="Energy Meter 01", asset_type="Energy Meter",
        location="Surface", area="Main Substation", criticality="Medium",
        system_group="Energy Management",
        primary_source="Energy meter export / Modbus-derived data",
        phase1_population="Energy Meters",
        health0=96, health1=94, rul1=320,
    ),
    dict(
        asset_id="EMS-01", asset_name="Underground EMS 01", asset_type="Underground EMS",
        location="Underground", area="Environmental Monitoring", criticality="Critical",
        system_group="Safety and Environment",
        primary_source="Underground EMS / surface SCADA",
        phase1_population="Underground Environmental Management System",
        health0=95, health1=90, rul1=300,
    ),
]

# Nominal operating values per asset_type. (mean, daily_std, year_drift_frac)
# year_drift_frac is the fractional increase of the metric over the full year
# for a degrading asset (proportional to how much health degrades).
METRIC_PROFILE = {
    "Continuous Miner": dict(
        vibration_mm_s=(3.1, 0.25, 0.55), temperature_c=(66, 2.2, 0.18),
        motor_current_a=(165, 8, 0.20), pressure_bar=(205, 9, 0.10),
        flow_rate=(0, 0, 0), speed_rpm=(980, 35, -0.05), power_kw=(245, 14, 0.08),
        energy_kwh=(250, 16, 0.08),
    ),
    "Trunk Conveyor": dict(
        vibration_mm_s=(2.4, 0.2, 0.4), temperature_c=(54, 1.8, 0.14),
        motor_current_a=(92, 6, 0.16), pressure_bar=(0, 0, 0),
        flow_rate=(0, 0, 0), speed_rpm=(450, 18, -0.03), power_kw=(150, 9, 0.06),
        energy_kwh=(150, 11, 0.06),
    ),
    "Ventilation Fan": dict(
        vibration_mm_s=(2.7, 0.22, 0.7), temperature_c=(61, 2.0, 0.22),
        motor_current_a=(183, 9, 0.22), pressure_bar=(0, 0, 0),
        flow_rate=(310, 12, -0.12), speed_rpm=(895, 22, -0.04), power_kw=(330, 16, 0.10),
        energy_kwh=(330, 20, 0.10),
    ),
    "DMS Drum": dict(
        vibration_mm_s=(2.9, 0.24, 0.42), temperature_c=(57, 1.9, 0.16),
        motor_current_a=(128, 7, 0.17), pressure_bar=(0, 0, 0),
        flow_rate=(0, 0, 0), speed_rpm=(25, 1.2, -0.04), power_kw=(210, 12, 0.07),
        energy_kwh=(210, 14, 0.07),
    ),
    "Crusher": dict(
        vibration_mm_s=(3.9, 0.3, 0.95), temperature_c=(64, 2.4, 0.30),
        motor_current_a=(178, 10, 0.30), pressure_bar=(0, 0, 0),
        flow_rate=(0, 0, 0), speed_rpm=(750, 26, -0.07), power_kw=(300, 18, 0.14),
        energy_kwh=(300, 22, 0.14),
    ),
    "Compressor": dict(
        vibration_mm_s=(2.3, 0.18, 0.28), temperature_c=(59, 1.7, 0.12),
        motor_current_a=(118, 6, 0.12), pressure_bar=(7.1, 0.25, 0.10),
        flow_rate=(0, 0, 0), speed_rpm=(1450, 40, -0.02), power_kw=(165, 9, 0.05),
        energy_kwh=(165, 11, 0.05),
    ),
    "Energy Meter": dict(
        vibration_mm_s=(0, 0, 0), temperature_c=(31, 1.0, 0.03),
        motor_current_a=(0, 0, 0), pressure_bar=(0, 0, 0),
        flow_rate=(0, 0, 0), speed_rpm=(0, 0, 0), power_kw=(0, 0, 0),
        energy_kwh=(920, 60, 0.04),
    ),
    "Underground EMS": dict(
        vibration_mm_s=(0, 0, 0), temperature_c=(29, 1.4, 0.05),
        motor_current_a=(0, 0, 0), pressure_bar=(0, 0, 0),
        flow_rate=(0, 0, 0), speed_rpm=(0, 0, 0), power_kw=(0, 0, 0),
        energy_kwh=(24, 3, 0.02),
    ),
}


def trajectory(h0: float, h1: float, n: int, noise: float) -> np.ndarray:
    """Smooth degradation trajectory from h0 to h1 with bounded noise."""
    base = np.linspace(h0, h1, n)
    # slight late-life acceleration of degradation
    curve = (np.linspace(0, 1, n) ** 1.6) * (h1 - h0) * 0.25
    series = base + curve + rng.normal(0, noise, n)
    return np.clip(series, 1, 100)


def metric_series(asset_type: str, metric: str, n: int, degr_frac: float) -> np.ndarray:
    mean, std, drift = METRIC_PROFILE[asset_type][metric]
    if mean == 0 and std == 0:
        return np.zeros(n)
    # drift scaled by how degraded the asset is (degr_frac in 0..1)
    ramp = np.linspace(0, 1, n) ** 1.4
    drifted_mean = mean * (1 + drift * degr_frac * ramp)
    noise = rng.normal(0, max(std, 1e-6), n)
    series = drifted_mean + noise
    return np.round(np.clip(series, 0, None), 3)


def build_telemetry(dates, granularity: str) -> pd.DataFrame:
    rows = []
    n = len(dates)
    for a in ASSETS:
        atype = a["asset_type"]
        degr_frac = float(np.clip((a["health0"] - a["health1"]) / 40.0, 0, 1))
        health = trajectory(a["health0"], a["health1"], n, noise=1.6)
        failure_risk = np.round(np.clip((100 - health) * 1.4 + rng.normal(0, 2, n), 0, 100), 2)
        rul = np.round(np.clip(np.linspace(a["rul1"] * 2.6, a["rul1"], n) + rng.normal(0, 4, n), 2, None), 0)

        vib = metric_series(atype, "vibration_mm_s", n, degr_frac)
        temp = metric_series(atype, "temperature_c", n, degr_frac)
        cur = metric_series(atype, "motor_current_a", n, degr_frac)
        press = metric_series(atype, "pressure_bar", n, degr_frac)
        flow = metric_series(atype, "flow_rate", n, degr_frac)
        speed = metric_series(atype, "speed_rpm", n, degr_frac)
        power = metric_series(atype, "power_kw", n, degr_frac)
        energy = metric_series(atype, "energy_kwh", n, degr_frac)

        # operating hours / status / downtime / alarms
        op_factor = 24 if granularity == "daily" else 1
        operating_hours = np.round(np.clip(rng.normal(0.82, 0.08, n), 0.2, 1.0) * op_factor, 2)
        alarm_count = np.clip(np.round((failure_risk / 100.0) * rng.normal(3, 1.2, n)), 0, None).astype(int)
        downtime = np.clip(np.round((failure_risk / 100.0) * rng.normal(40, 25, n)), 0, None).astype(int)
        status = np.where(failure_risk > 70, "Alarm", np.where(failure_risk > 45, "Warning", "Running"))

        # Energy meter specifics
        if atype == "Energy Meter":
            demand_kw = np.round(energy / 4.0 + rng.normal(0, 8, n), 2)
            energy_intensity = np.round(energy / np.clip(rng.normal(180, 12, n), 80, None), 4)
            avoidable_loss = np.round(np.clip(energy * rng.uniform(0.04, 0.09, n), 0, None), 2)
        else:
            demand_kw = np.full(n, np.nan)
            energy_intensity = np.full(n, np.nan)
            avoidable_loss = np.full(n, np.nan)

        # Underground EMS specifics
        if atype == "Underground EMS":
            methane = np.round(np.clip(0.28 + rng.normal(0, 0.08, n) + (np.linspace(0, 1, n) ** 3) * 0.15, 0, 1.4), 3)
            co = np.round(np.clip(rng.normal(8, 3, n), 0, None), 2)
            airflow = np.round(np.clip(rng.normal(2.6, 0.3, n), 0.5, None), 3)
            smoke = (rng.random(n) < 0.01).astype(int)
            humidity = np.round(np.clip(rng.normal(78, 5, n), 30, 100), 1)
            env_risk = np.round(np.clip(methane * 35 + co * 1.5 + smoke * 30 + rng.normal(0, 3, n), 0, 100), 2)
        else:
            methane = np.full(n, np.nan)
            co = np.full(n, np.nan)
            airflow = flow if atype == "Ventilation Fan" else np.full(n, np.nan)
            smoke = np.full(n, np.nan)
            humidity = np.full(n, np.nan)
            env_risk = np.full(n, np.nan)

        for i, ts in enumerate(dates):
            rows.append(dict(
                timestamp=ts.strftime("%Y-%m-%d %H:%M:%S"),
                granularity=granularity,
                asset_id=a["asset_id"], asset_name=a["asset_name"], asset_type=atype,
                location=a["location"],
                vibration_mm_s=vib[i] if vib[i] else "",
                temperature_c=temp[i] if temp[i] else "",
                motor_current_a=cur[i] if cur[i] else "",
                pressure_bar=press[i] if press[i] else "",
                flow_rate=flow[i] if flow[i] else "",
                speed_rpm=speed[i] if speed[i] else "",
                power_kw=power[i] if power[i] else "",
                operating_hours=operating_hours[i],
                status=str(status[i]),
                alarm_count=int(alarm_count[i]),
                downtime_minutes=int(downtime[i]),
                health_score=round(float(health[i]), 2),
                failure_risk=round(float(failure_risk[i]), 2),
                rul_days=int(rul[i]),
                energy_kwh=energy[i] if energy[i] else "",
                demand_kw="" if np.isnan(demand_kw[i]) else round(float(demand_kw[i]), 2),
                energy_intensity="" if np.isnan(energy_intensity[i]) else round(float(energy_intensity[i]), 4),
                avoidable_loss_estimate="" if np.isnan(avoidable_loss[i]) else round(float(avoidable_loss[i]), 2),
                methane_ch4="" if np.isnan(methane[i]) else round(float(methane[i]), 3),
                carbon_monoxide_co="" if np.isnan(co[i]) else round(float(co[i]), 2),
                airflow_velocity="" if (isinstance(airflow[i], float) and np.isnan(airflow[i])) else round(float(airflow[i]), 3),
                smoke_alarm="" if np.isnan(smoke[i]) else int(smoke[i]),
                humidity="" if np.isnan(humidity[i]) else round(float(humidity[i]), 1),
                environmental_risk_score="" if np.isnan(env_risk[i]) else round(float(env_risk[i]), 2),
            ))
    return pd.DataFrame(rows)


print("Generating telemetry (daily, 12 months)...")
daily = build_telemetry(daily_dates, "daily")
daily.to_csv(OUT / "telemetry.csv", index=False)
print(f"  telemetry.csv: {len(daily)} rows")

print("Generating telemetry (hourly, 30 days)...")
hourly = build_telemetry(hourly_dates, "hourly")
hourly.to_csv(OUT / "telemetry_hourly.csv", index=False)
print(f"  telemetry_hourly.csv: {len(hourly)} rows")


# ---------------------------------------------------------------------------
# Latest snapshot per asset (from last daily row) -> assets.csv
# ---------------------------------------------------------------------------
latest = daily.sort_values("timestamp").groupby("asset_id").tail(1).set_index("asset_id")


def risk_level(r: float) -> str:
    if r >= 70:
        return "Critical"
    if r >= 50:
        return "High"
    if r >= 30:
        return "Medium"
    return "Low"


asset_rows = []
for a in ASSETS:
    l = latest.loc[a["asset_id"]]
    fr = float(l["failure_risk"])
    asset_rows.append(dict(
        asset_id=a["asset_id"], asset_name=a["asset_name"], asset_type=a["asset_type"],
        location=a["location"], area=a["area"], criticality=a["criticality"],
        system_group=a["system_group"], primary_source=a["primary_source"],
        phase1_population=a["phase1_population"],
        health_score=round(float(l["health_score"]), 1),
        failure_risk=round(fr, 1),
        risk_level=risk_level(fr),
        rul_days=int(l["rul_days"]),
        status=str(l["status"]),
        commissioned="2019-2023",
    ))
assets_df = pd.DataFrame(asset_rows)
assets_df.to_csv(OUT / "assets.csv", index=False)
print(f"assets.csv: {len(assets_df)} rows")


# ---------------------------------------------------------------------------
# model_predictions.csv (daily) - health, failure risk, anomaly, RUL + drivers
# ---------------------------------------------------------------------------
def model_reason(atype, fr):
    drivers = {
        "Continuous Miner": "cutter motor current and hydraulic pressure trending above baseline",
        "Trunk Conveyor": "drive bearing vibration and motor current rising at transfer points",
        "Ventilation Fan": "fan bearing vibration and motor temperature exceeding control limits",
        "DMS Drum": "drum drive vibration and bearing temperature drift",
        "Crusher": "main bearing vibration and motor current sustained above upper control limit",
        "Compressor": "discharge pressure and oil temperature within warning band",
        "Energy Meter": "load profile and peak demand within expected envelope",
        "Underground EMS": "gas and airflow readings within environmental control band",
    }
    base = drivers.get(atype, "monitored trend behaviour")
    if fr >= 70:
        return f"Critical: {base}; immediate inspection recommended."
    if fr >= 50:
        return f"Elevated: {base}; schedule condition-based intervention."
    if fr >= 30:
        return f"Watch: {base}; continue monitoring trend."
    return "Within baseline with monitored trend behaviour."


pred_rows = []
driver_features = ["vibration", "temperature", "motor_current", "downtime", "alarm_count"]
for a in ASSETS:
    sub = daily[daily.asset_id == a["asset_id"]].reset_index(drop=True)
    n = len(sub)
    degr = float(np.clip((a["health0"] - a["health1"]) / 40.0, 0, 1))
    anomaly = np.round(np.clip((sub["failure_risk"].astype(float) / 100.0) + rng.normal(0, 0.04, n), 0, 1), 3)
    for i in range(n):
        fr = float(sub.loc[i, "failure_risk"])
        # deterministic-ish feature contributions summing to ~1
        contrib = np.array([
            0.30 + 0.25 * degr, 0.20, 0.18, 0.17, 0.15
        ]) + rng.normal(0, 0.01, 5)
        contrib = np.clip(contrib, 0.01, None)
        contrib = contrib / contrib.sum()
        pred_rows.append(dict(
            timestamp=sub.loc[i, "timestamp"],
            asset_id=a["asset_id"], asset_type=a["asset_type"],
            health_score=sub.loc[i, "health_score"],
            failure_risk=fr,
            anomaly_score=float(anomaly[i]),
            rul_days=int(sub.loc[i, "rul_days"]),
            risk_level=risk_level(fr),
            model_confidence=round(float(np.clip(rng.normal(0.88, 0.04, 1)[0], 0.6, 0.99)), 3),
            contrib_vibration=round(float(contrib[0]), 3),
            contrib_temperature=round(float(contrib[1]), 3),
            contrib_motor_current=round(float(contrib[2]), 3),
            contrib_downtime=round(float(contrib[3]), 3),
            contrib_alarm_count=round(float(contrib[4]), 3),
            model_reason=model_reason(a["asset_type"], fr),
        ))
pred_df = pd.DataFrame(pred_rows)
pred_df.to_csv(OUT / "model_predictions.csv", index=False)
print(f"model_predictions.csv: {len(pred_df)} rows")


# ---------------------------------------------------------------------------
# rul_estimates.csv - latest RUL per asset with bounds + confidence
# ---------------------------------------------------------------------------
rul_rows = []
for a in ASSETS:
    l = latest.loc[a["asset_id"]]
    rul = int(l["rul_days"])
    fr = float(l["failure_risk"])
    rul_rows.append(dict(
        asset_id=a["asset_id"], asset_name=a["asset_name"], asset_type=a["asset_type"],
        rul_days=rul,
        rul_lower_days=max(int(rul * 0.7), 1),
        rul_upper_days=int(rul * 1.3),
        confidence=round(float(np.clip(rng.normal(0.86, 0.05, 1)[0], 0.6, 0.98)), 3),
        method="Trend-based degradation estimator (demo)",
        estimated_failure_date=(END + timedelta(days=rul)).strftime("%Y-%m-%d"),
        recommended_action="Schedule inspection" if fr < 50 else "Plan condition-based intervention",
    ))
pd.DataFrame(rul_rows).to_csv(OUT / "rul_estimates.csv", index=False)
print(f"rul_estimates.csv: {len(rul_rows)} rows")


# ---------------------------------------------------------------------------
# alerts.csv
# ---------------------------------------------------------------------------
SEV_BY_RISK = {"Critical": "Critical", "High": "High", "Medium": "Medium", "Low": "Low"}
alert_templates = {
    "Continuous Miner": ("Vibration / current deviation", "VIB-CUR-01",
                          "Inspect cutter and traction drives, hydraulic system and oil condition."),
    "Trunk Conveyor": ("Drive bearing vibration", "VIB-DRV-02",
                       "Inspect pulley/bearing condition, belt alignment and transfer-point loading."),
    "Ventilation Fan": ("Bearing vibration / temperature", "VIB-TMP-03",
                        "Inspect motor bearings, vibration trend, inlet guide condition and fan efficiency."),
    "DMS Drum": ("Drum drive vibration", "VIB-DRM-04",
                 "Inspect drum drive, bearing vibration and medium-density stability."),
    "Crusher": ("Main bearing vibration", "VIB-BRG-05",
                "Inspect main bearings, liners, drive current and feed variability."),
    "Compressor": ("Discharge pressure / oil temperature", "PRS-OIL-06",
                   "Inspect pressure stability, oil temperature and leakage indicators."),
    "Energy Meter": ("Energy / demand anomaly", "ENG-DMD-07",
                     "Review load profile, peak demand and abnormal consumption drivers."),
    "Underground EMS": ("Environmental threshold watch", "ENV-GAS-08",
                        "Verify gas sensor calibration, airflow trend and alarm response readiness."),
}
sev_order = ["Low", "Medium", "High", "Critical"]
alert_rows = []
aidx = 1
for a in ASSETS:
    fr = float(latest.loc[a["asset_id"], "failure_risk"])
    rl = risk_level(fr)
    atype = a["asset_type"]
    alert_type, reason_code, action = alert_templates[atype]
    # Number of alerts proportional to risk
    n_alerts = {"Critical": 3, "High": 2, "Medium": 1, "Low": 1}[rl]
    for k in range(n_alerts):
        sev = rl if k == 0 else sev_order[max(0, sev_order.index(rl) - k)]
        ts = END - timedelta(days=int(rng.integers(0, 12)), hours=int(rng.integers(0, 23)))
        status = "Open" if k == 0 else rng.choice(["Open", "Acknowledged", "Closed"])
        alert_rows.append(dict(
            alert_id=f"AL-{aidx:04d}",
            asset_id=a["asset_id"],
            timestamp=ts.strftime("%Y-%m-%d %H:%M:%S"),
            severity=sev,
            alert_type=alert_type,
            reason_code=reason_code,
            recommended_action=action,
            status=str(status),
            owner_role="Reliability Engineer",
        ))
        aidx += 1
alerts_df = pd.DataFrame(alert_rows).sort_values("timestamp", ascending=False)
alerts_df.to_csv(OUT / "alerts.csv", index=False)
print(f"alerts.csv: {len(alerts_df)} rows")


# ---------------------------------------------------------------------------
# maintenance_events.csv
# ---------------------------------------------------------------------------
event_types = ["Planned inspection", "Corrective action", "Condition-based maintenance", "Lubrication / service"]
fault_cats = {
    "Continuous Miner": "Hydraulics / drive train",
    "Trunk Conveyor": "Bearings / belt",
    "Ventilation Fan": "Bearings / imbalance",
    "DMS Drum": "Drive / bearings",
    "Crusher": "Bearings / liners",
    "Compressor": "Air end / cooling",
    "Energy Meter": "Metering / calibration",
    "Underground EMS": "Sensors / calibration",
}
maint_rows = []
midx = 1
for a in ASSETS:
    n_events = int(rng.integers(3, 6))
    for k in range(n_events):
        days_ago = int(rng.integers(10, 360))
        ev_date = END - timedelta(days=days_ago)
        et = rng.choice(event_types)
        downtime = round(float(np.clip(rng.normal(4, 2.5, 1)[0], 0.5, 14)), 1)
        cost = int(np.clip(rng.normal(45000, 25000, 1)[0], 5000, 250000))
        maint_rows.append(dict(
            work_order_id=f"WO-{a['asset_id']}-{midx:03d}",
            asset_id=a["asset_id"],
            event_date=ev_date.strftime("%Y-%m-%d"),
            event_type=str(et),
            fault_category=fault_cats[a["asset_type"]],
            action_taken=f"{et} performed on {a['asset_name']}; condition data reviewed.",
            downtime_hours=downtime,
            cost_estimate=cost,
            technician_notes="Findings logged; trend monitored against engineering baseline.",
            status=str(rng.choice(["Completed", "Completed", "Scheduled", "In Progress"])),
        ))
        midx += 1
maint_df = pd.DataFrame(maint_rows).sort_values("event_date", ascending=False)
maint_df.to_csv(OUT / "maintenance_events.csv", index=False)
print(f"maintenance_events.csv: {len(maint_df)} rows")


# ---------------------------------------------------------------------------
# users.csv
# ---------------------------------------------------------------------------
users = [
    dict(username="exec", display_name="Thabo Director", role="Executive",
         access_level="Executive overview, KPIs, reports"),
    dict(username="reliability", display_name="Lerato Engineer", role="Reliability Engineer",
         access_level="Asset health, baselines, analytics, alerts"),
    dict(username="planner", display_name="Kabelo Planner", role="Maintenance Planner",
         access_level="Alerts, work-order support, maintenance planner"),
    dict(username="ops", display_name="Naledi Controller", role="Operations User",
         access_level="Operational dashboards and asset trends"),
    dict(username="itot", display_name="Sipho Admin", role="IT/OT Admin",
         access_level="Data sources, users, audit logs, model governance"),
    dict(username="she", display_name="Boitumelo SHE", role="SHE/ESG User",
         access_level="Energy, emissions and environmental dashboards"),
]
pd.DataFrame(users).to_csv(OUT / "users.csv", index=False)
print(f"users.csv: {len(users)} rows")


# ---------------------------------------------------------------------------
# data_quality.csv
# ---------------------------------------------------------------------------
sources = [
    dict(source_system="Historian / SCADA-derived data", source_type="SCADA / historian",
         interface="Approved historian export / API", ingestion_status="Connected (demo)",
         freshness="4-hourly simulated", completeness_pct=96.4, missing_value_rate_pct=3.6,
         quality_score=92, latest_timestamp=END.strftime("%Y-%m-%d 00:00:00"),
         notes="Processed SCADA-derived tags represented."),
    dict(source_system="OEM telemetry output", source_type="Mobile equipment telemetry",
         interface="Approved OEM export / API", ingestion_status="Connected (demo)",
         freshness="4-hourly simulated", completeness_pct=93.1, missing_value_rate_pct=6.9,
         quality_score=90, latest_timestamp=END.strftime("%Y-%m-%d 00:00:00"),
         notes="Continuous miner production and engineering data represented."),
    dict(source_system="Pronto Xi ERP/CMMS export", source_type="Maintenance records",
         interface="Approved ERP/CMMS export / API", ingestion_status="Connected (demo)",
         freshness="Event-based simulated", completeness_pct=98.0, missing_value_rate_pct=2.0,
         quality_score=88, latest_timestamp=(END - timedelta(days=1)).strftime("%Y-%m-%d 00:00:00"),
         notes="Work-order, downtime and cost records represented."),
    dict(source_system="Condition monitoring output", source_type="Vibration / oil / motor analysis",
         interface="Report / database extract", ingestion_status="Connected (demo)",
         freshness="Scheduled / event-based simulated", completeness_pct=90.5, missing_value_rate_pct=9.5,
         quality_score=87, latest_timestamp=(END - timedelta(days=2)).strftime("%Y-%m-%d 00:00:00"),
         notes="Overall vibration and condition indicators represented."),
    dict(source_system="Energy meter data", source_type="Energy management",
         interface="Meter export / API", ingestion_status="Connected (demo)",
         freshness="4-hourly simulated", completeness_pct=97.8, missing_value_rate_pct=2.2,
         quality_score=91, latest_timestamp=END.strftime("%Y-%m-%d 00:00:00"),
         notes="Energy profile and intensity analytics represented."),
    dict(source_system="Underground EMS data", source_type="Environmental monitoring",
         interface="EMS / SCADA-derived data", ingestion_status="Connected (demo)",
         freshness="Hourly simulated", completeness_pct=95.2, missing_value_rate_pct=4.8,
         quality_score=90, latest_timestamp=END.strftime("%Y-%m-%d 00:00:00"),
         notes="CH4, CO, airflow, smoke and environmental variables represented."),
]
pd.DataFrame(sources).to_csv(OUT / "data_quality.csv", index=False)
print(f"data_quality.csv: {len(sources)} rows")


# ---------------------------------------------------------------------------
# model_governance.csv
# ---------------------------------------------------------------------------
asset_classes = sorted({a["asset_type"] for a in ASSETS})
gov_rows = [
    dict(model_name="Asset Health Index", model_type="Weighted scoring model",
         asset_class="All rotating equipment", version="v1.2",
         training_period="2025-01 to 2026-03", validation_metric="MAE 3.1 (health pts)",
         last_trained="2026-03-30", drift_status="Stable", approval_status="Approved (demo)",
         retraining_recommendation="Next scheduled review 2026-06"),
    dict(model_name="Failure Risk Classifier", model_type="Gradient-boosted classifier",
         asset_class="Continuous Miner / Crusher / Fan", version="v1.1",
         training_period="2025-01 to 2026-02", validation_metric="ROC-AUC 0.91",
         last_trained="2026-02-18", drift_status="Minor drift", approval_status="Approved (demo)",
         retraining_recommendation="Retrain recommended - feature drift on vibration"),
    dict(model_name="RUL Estimator", model_type="Trend-based degradation model",
         asset_class="Rotating equipment", version="v0.9",
         training_period="2025-03 to 2026-03", validation_metric="MAPE 14%",
         last_trained="2026-03-12", drift_status="Stable", approval_status="Demo / data-dependent",
         retraining_recommendation="Validate against confirmed failure history"),
    dict(model_name="Anomaly Detection", model_type="Statistical / isolation-based",
         asset_class="All assets", version="v1.0",
         training_period="2025-01 to 2026-01", validation_metric="Precision 0.84",
         last_trained="2026-01-25", drift_status="Stable", approval_status="Approved (demo)",
         retraining_recommendation="Stable - no action"),
    dict(model_name="Engineering Baseline Envelope", model_type="Rules / statistical control limits",
         asset_class="All assets", version="v1.0",
         training_period="Rolling 90-day window", validation_metric="Control-limit coverage 99.7%",
         last_trained="2026-05-01", drift_status="Stable", approval_status="Approved (demo)",
         retraining_recommendation="Recompute monthly"),
    dict(model_name="Energy / Loss Estimator", model_type="Regression",
         asset_class="Energy Meter", version="v1.0",
         training_period="2025-01 to 2026-03", validation_metric="R2 0.88",
         last_trained="2026-03-22", drift_status="Stable", approval_status="Approved (demo)",
         retraining_recommendation="Stable - no action"),
]
pd.DataFrame(gov_rows).to_csv(OUT / "model_governance.csv", index=False)
print(f"model_governance.csv: {len(gov_rows)} rows")

print("\nDone. All static demo data written to", OUT)
