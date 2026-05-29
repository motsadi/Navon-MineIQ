import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CheckCheck, ExternalLink } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { useApp } from "@/hooks/AppContext";
import { Card, ErrorState, KpiCard, Loading, SectionHeader, SeverityBadge, StatusBadge } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { AlertStatus, Severity } from "@/types";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

export default function Alerts() {
  const { data, loading, error } = useApi(() => api.alerts(), []);
  const { alertOverrides, setAlertStatus } = useApp();
  const [sev, setSev] = useState<string>("");

  const alerts = useMemo(() => {
    return (data?.items ?? []).map((a) => ({
      ...a,
      status: (alertOverrides[a.alert_id] ?? a.status) as AlertStatus,
    }));
  }, [data, alertOverrides]);

  const filtered = alerts.filter((a) => !sev || a.severity === sev);
  const openCount = alerts.filter((a) => a.status === "Open").length;
  const ackCount = alerts.filter((a) => a.status === "Acknowledged").length;
  const closedCount = alerts.filter((a) => a.status === "Closed").length;

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Alerts & Recommendations"
        subtitle="Active alerts with reason codes and recommended actions. Acknowledge/close is held in local demo state."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Alerts" value={alerts.length} />
        <KpiCard label="Open" value={openCount} accent="danger" />
        <KpiCard label="Acknowledged" value={ackCount} accent="warning" />
        <KpiCard label="Closed" value={closedCount} accent="success" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setSev("")} className={`rounded-full px-3 py-1.5 text-xs font-medium ${sev === "" ? "bg-accent text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>All</button>
        {SEVERITIES.map((s) => (
          <button key={s} onClick={() => setSev(s)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${sev === s ? "bg-accent text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.alert_id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <SeverityBadge severity={a.severity} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{a.alert_type}</span>
                  <span className="text-xs text-slate-400">· {a.reason_code}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{a.recommended_action}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {a.alert_id} · {a.asset_id} · {fmtDate(a.timestamp)} · Owner: {a.owner_role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={a.status} />
              <Link to={`/assets/${a.asset_id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-accent">
                <ExternalLink className="h-3.5 w-3.5" /> Asset
              </Link>
              <button
                disabled={a.status !== "Open"}
                onClick={() => setAlertStatus(a.alert_id, "Acknowledged")}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" /> Ack
              </button>
              <button
                disabled={a.status === "Closed"}
                onClick={() => setAlertStatus(a.alert_id, "Closed")}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 disabled:opacity-40"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Close
              </button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card><p className="text-sm text-slate-500">No alerts for this filter.</p></Card>}
      </div>
    </div>
  );
}
