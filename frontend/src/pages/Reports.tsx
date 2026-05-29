import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, Loading, SectionHeader } from "@/components/ui";

const REPORTS = [
  { key: "asset-health", title: "Asset Health Report", desc: "Health, failure risk, RUL and status for all assets." },
  { key: "alerts", title: "Alerts Report", desc: "Full alert register with severity, reason codes and actions." },
  { key: "maintenance", title: "Maintenance Recommendations Report", desc: "Work orders, downtime and cost estimates." },
  { key: "data-quality", title: "Data Quality Report", desc: "Source-system completeness, freshness and quality." },
  { key: "model-governance", title: "Model Governance Report", desc: "Model registry, drift and approval status." },
];

export default function Reports() {
  const assets = useApi(() => api.assets(), []);
  const [assetId, setAssetId] = useState("");
  useEffect(() => {
    if (!assetId && assets.data?.length) setAssetId(assets.data[0].asset_id);
  }, [assets.data, assetId]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        subtitle="Export simulated demo datasets as CSV. PDF export is available in production."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.key} className="flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
            </div>
            <a
              href={api.exportUrl(r.key)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              <Download className="h-4 w-4" /> Download CSV
            </a>
          </Card>
        ))}

        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sand-500/15 text-sand-500">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Per-Asset Telemetry Report</h3>
            <p className="mt-1 text-sm text-slate-500">Full daily telemetry export for a selected asset.</p>
            {assets.loading ? (
              <Loading label="Loading assets…" />
            ) : (
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                {(assets.data ?? []).map((a) => (
                  <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
                ))}
              </select>
            )}
          </div>
          <a
            href={assetId ? api.assetReportUrl(assetId) : "#"}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-accent"
          >
            <Download className="h-4 w-4" /> Download asset CSV
          </a>
        </Card>
      </div>

      <p className="text-xs text-slate-400">
        All exports contain simulated demo data only. ESG/energy figures are included in the asset
        health and per-asset reports.
      </p>
    </div>
  );
}
