import type {
  Alert,
  AssetDetail,
  Asset,
  BaselineResponse,
  DataQualitySource,
  DemoUser,
  EsgSummary,
  MaintenanceSummary,
  ModelGovernanceRow,
  PredictiveSummary,
  RulResponse,
  Summary,
  TableResponse,
  TelemetryResponse,
} from "@/types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} for ${path}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: BASE_URL,
  health: () => get<{ status: string }>("/health"),
  summary: () => get<Summary>("/api/summary"),
  assets: (params?: { asset_type?: string; location?: string; risk_level?: string }) => {
    const q = new URLSearchParams();
    if (params?.asset_type) q.set("asset_type", params.asset_type);
    if (params?.location) q.set("location", params.location);
    if (params?.risk_level) q.set("risk_level", params.risk_level);
    const qs = q.toString();
    return get<Asset[]>(`/api/assets${qs ? `?${qs}` : ""}`);
  },
  asset: (id: string) => get<AssetDetail>(`/api/assets/${id}`),
  telemetry: (id: string, granularity: "daily" | "hourly" = "daily") =>
    get<TelemetryResponse>(`/api/assets/${id}/telemetry?granularity=${granularity}`),
  baseline: (id: string) => get<BaselineResponse>(`/api/assets/${id}/baseline`),
  rul: (id: string) => get<RulResponse>(`/api/assets/${id}/rul`),
  assetAlerts: (id: string) => get<TableResponse<Alert>>(`/api/assets/${id}/alerts`),
  alerts: (params?: { severity?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.set("severity", params.severity);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return get<TableResponse<Alert>>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },
  maintenance: () => get<MaintenanceSummary>("/api/maintenance"),
  predictive: () => get<PredictiveSummary>("/api/predictive"),
  modelGovernance: () => get<TableResponse<ModelGovernanceRow>>("/api/model-governance"),
  dataQuality: () => get<TableResponse<DataQualitySource>>("/api/data-quality"),
  esg: () => get<EsgSummary>("/api/esg"),
  users: () => get<TableResponse<DemoUser>>("/api/users"),
  exportUrl: (report: string) => `${BASE_URL}/api/export/${report}`,
  assetReportUrl: (id: string) => `${BASE_URL}/api/export/asset-report/${id}`,
};
