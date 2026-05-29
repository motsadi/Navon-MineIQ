# Navon MineIQ

**Navon MineIQ** is a Streamlit demo for an Asset Health, Reliability and Predictive Maintenance Platform for mine assets.

This demo uses **preloaded simulated data only**. It does not connect to live PLC, SCADA, historian, ERP/CMMS, OEM telemetry, MCM systems or operational networks.

## Included demo scope

The dataset includes one representative asset from each Phase 1 asset class:

- Continuous Miner 01
- Trunk Conveyor 01
- Ventilation Fan 01
- DMS Drum 01
- Crusher 01
- Compressor 01
- Energy Meter 01
- Underground EMS 01

## Main functions

- Role-based demo access
- Executive asset health dashboard
- Asset explorer
- Engineering baselines and control limits
- Predictive analytics and anomaly scoring
- Failure-risk scoring
- RUL estimate view
- Alerts and maintenance planner
- ESG, energy and underground EMS view
- Data ingestion and quality view
- Model governance and audit logs
- Downloadable demo reports and CSVs

## Local run

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Streamlit Community Cloud deployment

1. Create a GitHub repository.
2. Upload all files and folders in this package to the repository root.
3. Go to Streamlit Community Cloud.
4. Select the repository.
5. Set the main file path to `app.py`.
6. Deploy.

## Folder structure

```text
navon_mineq_streamlit_app/
├── app.py
├── requirements.txt
├── README.md
├── .streamlit/
│   └── config.toml
└── data/
    ├── alerts.csv
    ├── assets.csv
    ├── audit_logs.csv
    ├── data_sources.csv
    ├── engineering_baselines.csv
    ├── maintenance_events.csv
    ├── model_registry.csv
    ├── predictions.csv
    ├── telemetry.csv
    └── users.csv
```
