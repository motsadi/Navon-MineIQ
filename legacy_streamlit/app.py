from pathlib import Path
from io import StringIO

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

APP_NAME = "Navon MineIQ"
APP_TAGLINE = "Asset Health, Reliability and Predictive Maintenance Platform"
DATA_DIR = Path(__file__).parent / "data"

st.set_page_config(
    page_title=APP_NAME,
    page_icon="⛏️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main .block-container {padding-top: 1.1rem; padding-bottom: 2rem;}
    h1, h2, h3 {letter-spacing: -0.02em;}
    .navon-card {
        padding: 1rem 1.1rem;
        border: 1px solid rgba(49, 136, 224, 0.22);
        border-radius: 16px;
        background: linear-gradient(180deg, rgba(49, 136, 224, 0.08), rgba(255,255,255,0.02));
        box-shadow: 0 1px 8px rgba(0,0,0,0.04);
    }
    .small-muted {color: #667085; font-size: 0.88rem;}
    .risk-critical {color: #B42318; font-weight: 700;}
    .risk-high {color: #B54708; font-weight: 700;}
    .risk-medium {color: #027A48; font-weight: 700;}
    .risk-low {color: #175CD3; font-weight: 700;}
    div[data-testid="stMetricValue"] {font-size: 1.8rem;}
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def load_csv(name: str, parse_dates=None) -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / name, parse_dates=parse_dates)


@st.cache_data
def load_all_data():
    assets = load_csv("assets.csv")
    telemetry = load_csv("telemetry.csv", parse_dates=["timestamp"])
    baselines = load_csv("engineering_baselines.csv")
    predictions = load_csv("predictions.csv", parse_dates=["timestamp"])
    alerts = load_csv("alerts.csv", parse_dates=["created_at", "due_date"])
    maintenance = load_csv("maintenance_events.csv", parse_dates=["event_date"])
    data_sources = load_csv("data_sources.csv")
    users = load_csv("users.csv")
    model_registry = load_csv("model_registry.csv", parse_dates=["last_validated"])
    audit_logs = load_csv("audit_logs.csv", parse_dates=["timestamp"])
    return assets, telemetry, baselines, predictions, alerts, maintenance, data_sources, users, model_registry, audit_logs


def risk_class(level: str) -> str:
    return {
        "Critical": "risk-critical",
        "High": "risk-high",
        "Medium": "risk-medium",
        "Low": "risk-low",
    }.get(str(level), "")


def latest_predictions(predictions: pd.DataFrame, assets: pd.DataFrame) -> pd.DataFrame:
    latest = predictions.sort_values("timestamp").groupby("asset_id", as_index=False).tail(1)
    return latest.merge(assets, on="asset_id", how="left")


def role_pages(role: str):
    pages = {
        "Executive": ["Executive Dashboard", "Asset Explorer", "ESG / Energy / Underground EMS", "Reports & Downloads"],
        "Reliability Engineer": ["Executive Dashboard", "Asset Explorer", "Engineering Baselines", "Predictive Analytics", "RUL & Maintenance Forecast", "Alerts & Maintenance Planner", "Reports & Downloads"],
        "Maintenance Planner": ["Executive Dashboard", "Asset Explorer", "Alerts & Maintenance Planner", "RUL & Maintenance Forecast", "Reports & Downloads"],
        "Operations Controller": ["Executive Dashboard", "Asset Explorer", "Engineering Baselines", "Alerts & Maintenance Planner", "ESG / Energy / Underground EMS"],
        "ESG / Energy": ["Executive Dashboard", "Asset Explorer", "ESG / Energy / Underground EMS", "Reports & Downloads"],
        "IT/OT Administrator": ["Executive Dashboard", "Data Ingestion & Quality", "Model Governance & Admin", "Engineering Baselines", "Reports & Downloads"],
        "Administrator": ["Executive Dashboard", "Asset Explorer", "Engineering Baselines", "Predictive Analytics", "RUL & Maintenance Forecast", "Alerts & Maintenance Planner", "ESG / Energy / Underground EMS", "Data Ingestion & Quality", "Model Governance & Admin", "Reports & Downloads"],
    }
    return pages.get(role, pages["Executive"])


def line_with_limits(df: pd.DataFrame, title: str, tag: str, lower=None, target=None, upper=None):
    fig = px.line(df, x="timestamp", y=tag, title=title)
    fig.update_layout(height=420, margin=dict(l=10, r=10, t=55, b=10))
    if lower is not None:
        fig.add_hline(y=lower, line_dash="dot", annotation_text="Lower")
    if target is not None:
        fig.add_hline(y=target, line_dash="dash", annotation_text="Target")
    if upper is not None:
        fig.add_hline(y=upper, line_dash="dot", annotation_text="Upper")
    return fig


def make_report_text(latest_df, alerts, data_sources, role):
    buf = StringIO()
    buf.write(f"{APP_NAME} Demo Report\n")
    buf.write(f"Role: {role}\n")
    buf.write("Data: Preloaded simulated demo data only. No live MCM systems connected.\n\n")
    buf.write("Current Asset Health Summary\n")
    for _, r in latest_df.sort_values("failure_risk_pct", ascending=False).iterrows():
        buf.write(f"- {r.asset_id} | {r.asset_class} | Health {r.health_score:.1f} | Risk {r.failure_risk_pct:.1f}% | RUL {int(r.rul_days)} days | {r.risk_level}\n")
    buf.write("\nOpen/Monitoring Alerts\n")
    if alerts.empty:
        buf.write("- No active alerts.\n")
    else:
        for _, a in alerts.iterrows():
            buf.write(f"- {a.alert_id} | {a.asset_id} | {a.severity} | {a.description} | Action: {a.recommended_action}\n")
    buf.write("\nData Sources\n")
    for _, d in data_sources.iterrows():
        buf.write(f"- {d.source_system}: {d.status}, quality {d.quality_score_pct}%\n")
    return buf.getvalue()


assets, telemetry, baselines, predictions, alerts, maintenance, data_sources, users, model_registry, audit_logs = load_all_data()
latest_df = latest_predictions(predictions, assets)

# Add an administrator role at runtime for demonstration of full access.
role_options = list(users["role"].unique()) + ["Administrator"]

with st.sidebar:
    st.markdown(f"# ⛏️ {APP_NAME}")
    st.caption(APP_TAGLINE)
    st.divider()
    selected_role = st.selectbox("Demo user role", role_options, index=role_options.index("Reliability Engineer"))
    available_pages = role_pages(selected_role)
    page = st.radio("Navigation", available_pages)
    st.divider()
    asset_options = assets["asset_id"].tolist()
    selected_asset = st.selectbox("Selected asset", asset_options, format_func=lambda x: f"{x} - {assets.loc[assets.asset_id==x, 'asset_name'].iloc[0]}")
    st.caption("This demo uses preloaded simulated data for one representative asset per Phase 1 asset class.")

st.title(APP_NAME)
st.markdown(f"**{APP_TAGLINE}**")
st.caption("Demo environment | Preloaded simulated data | No live connection to PLC, SCADA, historian, ERP/CMMS or MCM networks")

risk_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
latest_df["risk_rank"] = latest_df["risk_level"].map(risk_order).fillna(0)

if page == "Executive Dashboard":
    st.subheader("Executive Asset Health Dashboard")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Assets monitored", len(assets))
    c2.metric("Average health", f"{latest_df.health_score.mean():.1f}/100")
    c3.metric("High/Critical risks", int(latest_df[latest_df.risk_level.isin(["High", "Critical"])].shape[0]))
    c4.metric("Open alerts", int(alerts[alerts.status.eq("Open")].shape[0]))
    c5.metric("Avg RUL", f"{latest_df.rul_days.mean():.0f} days")

    col1, col2 = st.columns([1.25, 1])
    with col1:
        fig = px.bar(
            latest_df.sort_values("failure_risk_pct", ascending=False),
            x="asset_id", y="failure_risk_pct", color="risk_level",
            hover_data=["asset_name", "asset_class", "health_score", "rul_days"],
            title="Failure Risk Ranking by Representative Asset",
        )
        fig.update_layout(height=420, yaxis_title="Failure risk (%)")
        st.plotly_chart(fig, use_container_width=True)
    with col2:
        fig = px.scatter(
            latest_df,
            x="failure_risk_pct", y="health_score", size="rul_days", color="asset_class",
            hover_name="asset_name", title="Health vs Failure Risk",
        )
        fig.update_layout(height=420, xaxis_title="Failure risk (%)", yaxis_title="Health score")
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("### Current Asset Summary")
    show = latest_df[["asset_id", "asset_name", "asset_class", "location", "criticality", "health_score", "failure_risk_pct", "risk_level", "rul_days", "model_reason"]].copy()
    st.dataframe(show.sort_values("failure_risk_pct", ascending=False), use_container_width=True, hide_index=True)

elif page == "Asset Explorer":
    asset = assets[assets.asset_id == selected_asset].iloc[0]
    asset_pred = predictions[predictions.asset_id == selected_asset].copy()
    asset_tel = telemetry[telemetry.asset_id == selected_asset].copy()
    latest = asset_pred.sort_values("timestamp").iloc[-1]

    st.subheader(f"Asset Explorer: {asset.asset_name}")
    st.markdown(f"""
    <div class="navon-card">
    <b>Asset class:</b> {asset.asset_class} &nbsp; | &nbsp;
    <b>Location:</b> {asset.location} &nbsp; | &nbsp;
    <b>Criticality:</b> {asset.criticality} &nbsp; | &nbsp;
    <b>Primary source:</b> {asset.primary_source}
    </div>
    """, unsafe_allow_html=True)
    st.write("")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Health score", f"{latest.health_score:.1f}/100")
    c2.metric("Failure risk", f"{latest.failure_risk_pct:.1f}%")
    c3.metric("RUL estimate", f"{int(latest.rul_days)} days")
    c4.markdown(f"**Risk level**  \n<span class='{risk_class(latest.risk_level)}'>{latest.risk_level}</span>", unsafe_allow_html=True)

    tags = [c for c in asset_tel.columns if c not in ["timestamp", "asset_id"]]
    selected_tag = st.selectbox("Trend tag", tags, index=tags.index("vibration_mm_s") if "vibration_mm_s" in tags else 0)
    limits = baselines[(baselines.asset_id == selected_asset) & (baselines.tag == selected_tag)]
    if not limits.empty:
        lim = limits.iloc[0]
        fig = line_with_limits(asset_tel, f"{asset.asset_name} - {selected_tag}", selected_tag, lim.lower_limit, lim.target, lim.upper_limit)
    else:
        fig = px.line(asset_tel, x="timestamp", y=selected_tag, title=f"{asset.asset_name} - {selected_tag}")
    st.plotly_chart(fig, use_container_width=True)
    st.markdown("### Model reason and recommended action")
    st.info(str(latest.model_reason))
    asset_alerts = alerts[alerts.asset_id == selected_asset]
    if not asset_alerts.empty:
        st.warning(asset_alerts.iloc[0].recommended_action)
    else:
        st.success("No active alert for this asset in the current demo snapshot.")

elif page == "Engineering Baselines":
    st.subheader("Engineering Baselines and Control Limits")
    st.write("Baselines represent engineering limits and statistical envelopes used for early warning and alert rationalisation.")
    asset_tel = telemetry[telemetry.asset_id == selected_asset].copy()
    tags = baselines[baselines.asset_id == selected_asset]["tag"].tolist()
    tag = st.selectbox("Baseline tag", tags)
    lim = baselines[(baselines.asset_id == selected_asset) & (baselines.tag == tag)].iloc[0]
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Lower limit", f"{lim.lower_limit:g} {lim.unit}")
    k2.metric("Target", f"{lim.target:g} {lim.unit}")
    k3.metric("Upper limit", f"{lim.upper_limit:g} {lim.unit}")
    breaches = int((asset_tel[tag] > lim.upper_limit).sum()) if lim.upper_limit > 0 else 0
    k4.metric("Upper-limit breaches", breaches)
    st.plotly_chart(line_with_limits(asset_tel, f"Baseline envelope for {selected_asset} - {tag}", tag, lim.lower_limit, lim.target, lim.upper_limit), use_container_width=True)
    st.markdown("### Baseline table")
    st.dataframe(baselines[baselines.asset_id == selected_asset], use_container_width=True, hide_index=True)

elif page == "Predictive Analytics":
    st.subheader("Predictive Analytics and Failure Risk Intelligence")
    c1, c2 = st.columns([1, 1])
    with c1:
        fig = px.line(predictions[predictions.asset_id == selected_asset], x="timestamp", y=["health_score", "failure_risk_pct"], title=f"Health and failure risk trend - {selected_asset}")
        fig.update_layout(height=420, yaxis_title="Score / percentage")
        st.plotly_chart(fig, use_container_width=True)
    with c2:
        fig = px.line(predictions[predictions.asset_id == selected_asset], x="timestamp", y="anomaly_score", title=f"Anomaly score - {selected_asset}")
        fig.update_layout(height=420, yaxis_title="Anomaly score")
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("### Latest model outputs")
    cols = ["asset_id", "asset_class", "health_score", "failure_risk_pct", "anomaly_score", "risk_level", "rul_days", "model_reason"]
    st.dataframe(latest_df[cols].sort_values("failure_risk_pct", ascending=False), use_container_width=True, hide_index=True)

    st.markdown("### Model explanation")
    st.write("The demo combines engineering baselines, trend deviation, anomaly score, asset criticality and maintenance-event context into a single failure-risk score. RUL is shown as a data-dependent estimate and should be validated against confirmed failure history in a live deployment.")

elif page == "RUL & Maintenance Forecast":
    st.subheader("Remaining Useful Life and Maintenance Forecast")
    fig = px.bar(latest_df.sort_values("rul_days"), x="asset_id", y="rul_days", color="risk_level", hover_name="asset_name", title="Current RUL estimate by asset")
    fig.update_layout(height=420, yaxis_title="Estimated RUL (days)")
    st.plotly_chart(fig, use_container_width=True)
    asset_pred = predictions[predictions.asset_id == selected_asset]
    st.plotly_chart(px.line(asset_pred, x="timestamp", y="rul_days", title=f"RUL trend - {selected_asset}"), use_container_width=True)
    st.markdown("### Maintenance forecast actions")
    combined = alerts.merge(assets[["asset_id", "asset_name", "asset_class"]], on="asset_id", how="left")
    if not combined.empty:
        st.dataframe(combined[["asset_id", "asset_name", "asset_class", "severity", "status", "due_date", "recommended_action"]].sort_values(["severity", "due_date"]), use_container_width=True, hide_index=True)
    else:
        st.success("No active maintenance forecast actions in the current demo snapshot.")

elif page == "Alerts & Maintenance Planner":
    st.subheader("Alerts and Maintenance Planner")
    c1, c2, c3 = st.columns(3)
    c1.metric("Alerts", len(alerts))
    c2.metric("Open", int((alerts.status == "Open").sum()))
    c3.metric("Maintenance events", len(maintenance))
    st.markdown("### Alert register")
    if alerts.empty:
        st.success("No alerts in current demo data.")
    else:
        st.dataframe(alerts.merge(assets[["asset_id", "asset_name", "asset_class"]], on="asset_id", how="left")[["alert_id", "asset_id", "asset_name", "asset_class", "severity", "status", "alert_type", "description", "recommended_action", "due_date"]], use_container_width=True, hide_index=True)
    st.markdown("### Maintenance event history")
    st.dataframe(maintenance.merge(assets[["asset_id", "asset_name", "asset_class"]], on="asset_id", how="left")[["event_id", "asset_id", "asset_name", "asset_class", "event_date", "event_type", "description", "downtime_hours", "work_order_ref"]], use_container_width=True, hide_index=True)

elif page == "ESG / Energy / Underground EMS":
    st.subheader("ESG, Energy and Underground Environmental Monitoring")
    energy = telemetry.groupby("timestamp", as_index=False)["energy_kwh"].sum()
    c1, c2 = st.columns(2)
    with c1:
        fig = px.line(energy, x="timestamp", y="energy_kwh", title="Total energy profile across demo assets")
        fig.update_layout(height=420, yaxis_title="kWh / 4h")
        st.plotly_chart(fig, use_container_width=True)
    with c2:
        latest_energy = telemetry.sort_values("timestamp").groupby("asset_id", as_index=False).tail(1).merge(assets, on="asset_id")
        fig = px.bar(latest_energy.sort_values("energy_kwh", ascending=False), x="asset_id", y="energy_kwh", color="asset_class", title="Latest energy consumption by asset")
        fig.update_layout(height=420, yaxis_title="kWh / 4h")
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("### Underground EMS indicators")
    ems = telemetry[telemetry.asset_id == "EMS-01"].copy()
    st.plotly_chart(px.line(ems, x="timestamp", y=["ch4_pct", "oil_temperature_C"], title="Underground EMS simulated gas and temperature indicators"), use_container_width=True)
    st.info("In a production deployment, EMS indicators would be validated against approved gas, airflow, fire and environmental monitoring data sources provided by MCM.")

elif page == "Data Ingestion & Quality":
    st.subheader("Data Ingestion and Quality View")
    st.write("This view represents the ingestion layer for MCM-approved data sources/interfaces. The demo does not connect to live PLC/SCADA systems.")
    st.dataframe(data_sources, use_container_width=True, hide_index=True)
    fig = px.bar(data_sources, x="source_system", y="quality_score_pct", color="source_type", title="Data quality score by source")
    fig.update_layout(height=420, yaxis_range=[0, 100], xaxis_title="")
    st.plotly_chart(fig, use_container_width=True)
    st.markdown("### Data tables included in this demo")
    st.code("data/assets.csv\ndata/telemetry.csv\ndata/predictions.csv\ndata/engineering_baselines.csv\ndata/alerts.csv\ndata/maintenance_events.csv\ndata/data_sources.csv\ndata/model_registry.csv\ndata/users.csv\ndata/audit_logs.csv")

elif page == "Model Governance & Admin":
    st.subheader("Model Governance, Users and Audit Logs")
    st.markdown("### Model registry")
    st.dataframe(model_registry, use_container_width=True, hide_index=True)
    st.markdown("### User roles")
    st.dataframe(users, use_container_width=True, hide_index=True)
    st.markdown("### Audit logs")
    st.dataframe(audit_logs.sort_values("timestamp", ascending=False), use_container_width=True, hide_index=True)
    st.info("In live deployment, model approval, threshold changes, user access changes and data-ingestion events should be logged and reviewed under MCM governance procedures.")

elif page == "Reports & Downloads":
    st.subheader("Reports and Downloads")
    report_text = make_report_text(latest_df, alerts, data_sources, selected_role)
    st.download_button("Download demo executive report (.txt)", report_text, file_name="navon_mineq_demo_report.txt")
    st.download_button("Download current asset health CSV", latest_df.to_csv(index=False).encode("utf-8"), file_name="navon_mineq_asset_health.csv", mime="text/csv")
    st.download_button("Download alert register CSV", alerts.to_csv(index=False).encode("utf-8"), file_name="navon_mineq_alerts.csv", mime="text/csv")
    st.download_button("Download data source quality CSV", data_sources.to_csv(index=False).encode("utf-8"), file_name="navon_mineq_data_sources.csv", mime="text/csv")
    st.text_area("Report preview", report_text, height=420)

st.divider()
st.caption("Navon MineIQ demo app. Uses preloaded simulated data only. No live MCM data, no live PLC/SCADA/historian/ERP connection, and no operational control-system write-back.")
