# Navon MineIQ

### Asset Health, Reliability and Predictive Maintenance Platform

Navon MineIQ is a production-style, full-stack prototype that demonstrates an enterprise
asset-reliability and predictive-maintenance platform for mining operations. It unifies condition
monitoring, engineering baselines, anomaly detection, failure-risk scoring, remaining-useful-life
(RUL) estimation, alert management, maintenance decision support, ESG/energy analytics, data-quality
monitoring and model governance into a single, boardroom-ready application.

> **Demo disclaimer:** This prototype uses **simulated data only** and does **not** connect to MCM
> systems, live PLC/SCADA/historian/ERP or any operational network. All data is pre-generated and
> loaded from static files in the repository.

---

## 1. What Navon MineIQ is

A two-tier application:

- **Frontend** — React + TypeScript + Vite + Tailwind CSS, charts via Recharts. Deployable to **Vercel**.
- **Backend** — FastAPI (Python) serving clean, typed JSON APIs computed from static CSV data with
  Pandas / NumPy / scikit-learn. Containerised and deployable to **Google Cloud Run**.

No database is required for the prototype, but the code is structured so PostgreSQL / TimescaleDB can
be added later behind the `data_loader` / service layer without changing the API contract.

## 2. Simulated data

The platform never generates data at runtime. All datasets are **pre-generated** by
`scripts/generate_data.py` (deterministic, fixed seed) and committed under `backend/data`:

| File | Contents |
| --- | --- |
| `assets.csv` | Asset master + latest health/risk/RUL snapshot |
| `telemetry.csv` | 12 months of **daily** telemetry per asset |
| `telemetry_hourly.csv` | 30 days of **hourly** telemetry per asset |
| `model_predictions.csv` | Daily health, failure risk, anomaly score, RUL and feature contributions |
| `rul_estimates.csv` | Latest RUL per asset with confidence bounds |
| `alerts.csv` | Alert register (severity, reason code, recommended action, status) |
| `maintenance_events.csv` | Work orders, downtime, cost, technician notes |
| `data_quality.csv` | Source-system completeness, freshness and quality |
| `model_governance.csv` | Model registry, validation, drift and approval status |
| `users.csv` | Demo roles |

Telemetry includes vibration, temperature, motor current, pressure, flow, speed, power, operating
hours, status, alarm count, downtime, health score, failure risk and RUL — plus energy-meter fields
(energy, demand, intensity, avoidable loss) and underground-EMS fields (CH₄, CO, airflow, smoke,
humidity, environmental risk score).

To regenerate the data:

```bash
pip install numpy pandas
python scripts/generate_data.py
```

## 3. How it maps to the MCM Phase 1 scope

The real Phase 1 tender scope includes **4 continuous miners, 6 trunk conveyors, 2 ventilation fans,
1 DMS drum, 3 crushers, 3 compressors, energy meters and an underground environmental management
system**.

For a clear, fast demo, Navon MineIQ uses **one representative asset per class** while the UI and API
are designed to scale to the full multi-asset fleet:

| Demo asset | Class | Location |
| --- | --- | --- |
| CM-01 Continuous Miner 01 | Continuous Miner | Underground |
| TC-01 Trunk Conveyor 01 | Trunk Conveyor | Underground |
| VF-01 Ventilation Fan 01 | Ventilation Fan | Surface |
| DMS-01 DMS Drum 01 | DMS Drum | Surface |
| CR-01 Crusher 01 | Crusher | Surface |
| CP-01 Compressor 01 | Compressor | Surface |
| EM-01 Energy Meter 01 | Energy Meter | Surface |
| EMS-01 Underground EMS 01 | Underground EMS | Underground |

## 4. Features

- **Role-based demo access** — Executive, Reliability Engineer, Maintenance Planner, Operations User,
  IT/OT Admin, SHE/ESG User (simulated RBAC; no real authentication).
- **Executive Overview** — KPI tiles, asset risk ranking, fleet health trend, top alerts.
- **Asset Health Dashboard** — card/table views with filtering by type, location and risk.
- **Asset Detail** — health gauge, RUL, failure risk, latest telemetry, trend vs control limits,
  alert timeline, maintenance history, recommended actions and risk explanation.
- **Engineering Baselines** — mean, σ, control limits, warning/critical bands and operating envelope.
- **Predictive Analytics** — anomaly summary, failure-risk output, RUL table, model confidence and
  feature-contribution explainability.
- **Alerts & Recommendations** — severity filtering, reason codes, recommended actions and local
  acknowledge/close state, linked to asset detail.
- **Maintenance Planning** — recommended interventions, event history, MTBF/MTTR proxies, estimated
  downtime avoided and cost impact (decision support only).
- **ESG / Energy / Environmental** — energy trend, intensity, avoidable losses, ventilation-fan
  efficiency and underground EMS indicators (CH₄, CO, airflow, smoke, environmental risk).
- **Data Quality & Integration** — source-system readiness, completeness, missing-value rate,
  freshness and ingestion status.
- **Model Governance** — model registry, versions, validation metrics, drift and approval status.
- **Reports** — CSV exports for asset health, alerts, maintenance, data quality, governance and
  per-asset telemetry.

## 5. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router, lucide-react |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Data / analytics | Pandas, NumPy, scikit-learn |
| API docs | OpenAPI / Swagger (`/docs`), ReDoc (`/redoc`) |
| Frontend hosting | Vercel |
| Backend hosting | Google Cloud Run (Docker) |

## 6. Repository structure

```text
navon-mineq/
  frontend/            React + TypeScript + Vite app (Vercel)
    src/{components,pages,layouts,services,hooks,types,lib,assets}
    public/brand/navon-labs-logo.png
    .env.example
    vercel.json
  backend/             FastAPI app (Cloud Run)
    app/{api,services,models,schemas,core,main.py,data_loader.py}
    data/              Static pre-generated CSV datasets
    requirements.txt
    Dockerfile
    .env.example
  scripts/             Deterministic data generator + smoke test
  legacy_streamlit/    Original Streamlit demo (kept for reference)
  README.md
  .gitignore
```

## 7. Local setup

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

- Health check: <http://localhost:8080/health>
- Swagger docs: <http://localhost:8080/docs>

### Frontend (React + Vite)

```bash
cd frontend
cp .env.example .env        # ensure VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev                 # http://localhost:5173
npm run build               # production build into dist/
```

## 8. Deployment

### Frontend → Vercel

1. In the Vercel project, set **Root Directory** to `frontend` (this is the key fix for the
   `Found app.py …` build error — Vercel was building the repo root as a Python function).
2. Framework preset: **Vite**. Build command `npm run build`, output `dist` (already in
   `frontend/vercel.json`).
3. Add an environment variable **`VITE_API_BASE_URL`** pointing at your Cloud Run backend URL, e.g.
   `https://navon-mineiq-backend-xxxxxxxx-uc.a.run.app`.
4. Deploy. SPA routing is handled by the rewrite rule in `frontend/vercel.json`.

### Backend → Google Cloud Run

```bash
cd backend

# Build & push (replace PROJECT_ID / REGION)
gcloud builds submit --tag gcr.io/PROJECT_ID/navon-mineiq-backend

gcloud run deploy navon-mineiq-backend \
  --image gcr.io/PROJECT_ID/navon-mineiq-backend \
  --region REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app
```

The container listens on `$PORT` (Cloud Run injects it; defaults to 8080). After deploy, copy the
service URL into the Vercel `VITE_API_BASE_URL` variable and redeploy the frontend.

> Set `CORS_ORIGINS` to your exact Vercel URL in production. `*` is fine for the demo.

## 9. API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service + data integrity check |
| GET | `/api/summary` | Executive KPI summary |
| GET | `/api/assets` | All assets (filter by `asset_type`, `location`, `risk_level`) |
| GET | `/api/assets/{asset_id}` | Asset detail snapshot |
| GET | `/api/assets/{asset_id}/telemetry` | Telemetry (`granularity=daily|hourly`) |
| GET | `/api/assets/{asset_id}/baseline` | Engineering baselines / control limits |
| GET | `/api/assets/{asset_id}/rul` | RUL estimate + trend |
| GET | `/api/assets/{asset_id}/alerts` | Alerts for an asset |
| GET | `/api/assets/{asset_id}/anomalies` | Anomaly flags (threshold + model) |
| GET | `/api/alerts` | Alert register (filter by `severity`, `status`) |
| GET | `/api/maintenance` | Maintenance summary + events |
| GET | `/api/predictive` | Predictive analytics summary |
| GET | `/api/model-governance` | Model registry |
| GET | `/api/data-quality` | Source-system data quality |
| GET | `/api/esg` | ESG / energy / environmental analytics |
| GET | `/api/export/{report}` | CSV export (asset-health, alerts, maintenance, …) |
| GET | `/api/export/asset-report/{asset_id}` | Per-asset telemetry CSV |

## 10. Limitations and exclusions

- Simulated data only; no connection to live PLC, SCADA, DCS, historian, ERP/CMMS, OEM telemetry or
  MCM networks.
- No real authentication — roles are simulated to demonstrate role-based access.
- RUL and failure-risk outputs are demonstration estimates, not validated against confirmed failure
  history.
- ERP/CMMS work-order initiation is **not** automated; the platform provides decision support only.
- Direct PLC/SCADA/DCS access or control-system modification is **excluded** unless expressly
  approved by MCM IT/OT.

## 11. Future production roadmap

- **Time-series storage:** PostgreSQL / TimescaleDB behind the existing data/service layer.
- **ML lifecycle:** MLflow for experiment tracking, model registry and deployment.
- **Identity & access:** Keycloak / Active Directory for SSO and enterprise RBAC.
- **Integration:** ingestion only through MCM-approved data sources and interfaces (historian
  extracts, SCADA/PLC-derived data, OEM telemetry, Pronto Xi ERP/CMMS, condition monitoring, energy
  meters, underground EMS).
- **Deployment:** hybrid on-premise / cloud topology aligned to MCM IT/OT requirements.
- **Operations:** 12-month support model with monitoring, retraining cadence and governance reviews.

---

### Tender positioning statement

> Navon MineIQ is demonstrated using simulated data. In production, the platform will integrate only
> with MCM-approved data sources and interfaces, including historian extracts, SCADA/PLC-derived
> data, OEM telemetry outputs, Pronto Xi ERP/CMMS data, condition monitoring outputs, energy meters
> and underground environmental monitoring systems. Direct PLC/SCADA/DCS access or control-system
> modification will only be implemented where expressly approved by MCM IT/OT.

© Navon Labs · Navon MineIQ · Demo build · Simulated data only.
