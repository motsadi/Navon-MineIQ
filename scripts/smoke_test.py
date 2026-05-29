"""Quick in-process smoke test for the FastAPI backend."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)

endpoints = [
    "/health",
    "/api/summary",
    "/api/assets",
    "/api/assets/CR-01",
    "/api/assets/CR-01/telemetry?granularity=daily",
    "/api/assets/CR-01/telemetry?granularity=hourly",
    "/api/assets/CR-01/baseline",
    "/api/assets/CR-01/rul",
    "/api/assets/CR-01/alerts",
    "/api/assets/CR-01/anomalies",
    "/api/alerts",
    "/api/maintenance",
    "/api/predictive",
    "/api/model-governance",
    "/api/data-quality",
    "/api/esg",
    "/api/users",
    "/api/export/asset-health",
    "/api/export/asset-report/CR-01",
]

failed = 0
for ep in endpoints:
    r = client.get(ep)
    ok = r.status_code == 200
    failed += 0 if ok else 1
    body = r.text[:80].replace("\n", " ")
    print(f"{'OK ' if ok else 'ERR'} {r.status_code} {ep}  -> {body}")

print("\nFAILURES:", failed)
sys.exit(1 if failed else 0)
