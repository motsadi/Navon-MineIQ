import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Download, Info, Lightbulb } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Gauge } from "@/components/Gauge";
import { Card, ErrorState, Loading, RiskBadge, SectionHeader, SeverityBadge, StatusBadge } from "@/components/ui";
import { fmtDate, fmtDateShort, fmtNum, metricLabel } from "@/lib/format";

export default function AssetDetail() {
  const { assetId = "" } = useParams();
  const [granularity, setGranularity] = useState<"daily" | "hourly">("daily");
  const [metric, setMetric] = useState("vibration_mm_s");

  const detail = useApi(() => api.asset(assetId), [assetId]);
  const telemetry = useApi(() => api.telemetry(assetId, granularity), [assetId, granularity]);
  const baseline = useApi(() => api.baseline(assetId), [assetId]);
  const rul = useApi(() => api.rul(assetId), [assetId]);
  const alerts = useApi(() => api.assetAlerts(assetId), [assetId]);
  const maint = useApi(() => api.maintenance(), []);

  const availableMetrics = useMemo(
    () => (baseline.data?.metrics ?? []).map((m) => m.metric),
    [baseline.data],
  );

  const activeBaseline = baseline.data?.metrics.find((m) => m.metric === metric);

  if (detail.loading) return <Loading />;
  if (detail.error || !detail.data) return <ErrorState message={detail.error ?? "No data"} />;

  const a = detail.data.asset;
  const reason = detail.data.latest_prediction?.model_reason as string | undefined;
  const assetMaint = (maint.data?.events ?? []).filter((e) => e.asset_id === assetId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Back to assets
        </Link>
        <a
          href={api.assetReportUrl(assetId)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-accent"
        >
          <Download className="h-4 w-4" /> Export asset report (CSV)
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{a.asset_name}</h2>
          <p className="text-sm text-slate-500">
            {a.asset_id} · {a.asset_type} · {a.location} ({a.area}) · Criticality: {a.criticality}
          </p>
        </div>
        <RiskBadge level={a.risk_level} />
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <Gauge value={a.health_score} />
        </Card>

        <Card className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Failure Risk" value={`${fmtNum(a.failure_risk, 1)}%`} />
            <Stat label="RUL Estimate" value={`${a.rul_days} days`} />
            <Stat label="Status" value={<StatusBadge status={a.status} />} />
            <Stat label="Open Alerts" value={String(detail.data.open_alerts)} />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="kpi-label mb-2">Latest telemetry snapshot</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["vibration_mm_s", "temperature_c", "motor_current_a", "power_kw", "speed_rpm", "energy_kwh"]
                .filter((k) => detail.data!.latest_telemetry[k] !== undefined && detail.data!.latest_telemetry[k] !== "")
                .map((k) => (
                  <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-400">{metricLabel(k)}</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {fmtNum(Number(detail.data!.latest_telemetry[k]), 2)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Why at risk + recommended action */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Info className="h-4 w-4 text-accent" />
            <h3 className="section-title">Why this asset is flagged</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{reason ?? "Within baseline with monitored trend behaviour."}</p>
          {rul.data && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              RUL method: {rul.data.method}. Estimated failure date {fmtDate(rul.data.estimated_failure_date)} ·
              confidence {(rul.data.confidence * 100).toFixed(0)}% (range {rul.data.rul_lower_days}–{rul.data.rul_upper_days} days).
            </div>
          )}
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="section-title">Recommended actions</h3>
          </div>
          <ul className="space-y-2">
            {(alerts.data?.items ?? []).slice(0, 3).map((al) => (
              <li key={al.alert_id} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {al.recommended_action}
              </li>
            ))}
            {(alerts.data?.items ?? []).length === 0 && (
              <li className="text-sm text-slate-500">No active alerts. Continue monitoring against engineering baselines.</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Trend + baseline chart */}
      <Card>
        <SectionHeader
          title="Telemetry Trend vs Engineering Baseline"
          subtitle="Signal with statistical control limits (mean ± 3σ) and warning bands."
          right={
            <div className="flex gap-2">
              <select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                {availableMetrics.map((m) => (
                  <option key={m} value={m}>{metricLabel(m)}</option>
                ))}
              </select>
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                {(["daily", "hourly"] as const).map((g) => (
                  <button key={g} onClick={() => setGranularity(g)} className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${granularity === g ? "bg-accent text-white" : "text-slate-500"}`}>{g}</button>
                ))}
              </div>
            </div>
          }
        />
        {telemetry.loading ? (
          <Loading label="Loading telemetry…" />
        ) : telemetry.error ? (
          <ErrorState message={telemetry.error} />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={telemetry.data?.points ?? []} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="timestamp" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [fmtNum(v, 2), metricLabel(metric)]} labelFormatter={(l) => fmtDate(String(l))} />
              {activeBaseline && (
                <>
                  <ReferenceLine y={activeBaseline.mean} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "mean", fontSize: 10, fill: "#94a3b8", position: "right" }} />
                  <ReferenceLine y={activeBaseline.upper_control_limit} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: "UCL", fontSize: 10, fill: "#f43f5e", position: "right" }} />
                  <ReferenceLine y={activeBaseline.lower_control_limit} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "LCL", fontSize: 10, fill: "#f59e0b", position: "right" }} />
                </>
              )}
              <Line type="monotone" dataKey={metric} stroke="#2f9bf0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* RUL trend */}
      {rul.data && (
        <Card>
          <SectionHeader title="Remaining Useful Life Trend" subtitle="Modelled RUL trajectory over the monitoring window." />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rul.data.trend} margin={{ top: 8, right: 12, bottom: 8, left: -16 }}>
              <defs>
                <linearGradient id="rulFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f9bf0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2f9bf0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="timestamp" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} unit="d" />
              <Tooltip formatter={(v: number) => [`${v} days`, "RUL"]} labelFormatter={(l) => fmtDate(String(l))} />
              <Area type="monotone" dataKey="rul_days" stroke="#2f9bf0" strokeWidth={2} fill="url(#rulFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Alert timeline + maintenance history */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Alert Timeline" />
          <div className="space-y-3">
            {(alerts.data?.items ?? []).length === 0 && <p className="text-sm text-slate-500">No alerts recorded for this asset.</p>}
            {(alerts.data?.items ?? []).map((al) => (
              <div key={al.alert_id} className="flex gap-3 border-l-2 border-slate-100 pl-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{al.alert_type}</span>
                    <SeverityBadge severity={al.severity} />
                  </div>
                  <p className="text-xs text-slate-500">{fmtDate(al.timestamp)} · {al.reason_code} · {al.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Maintenance History" />
          <div className="space-y-3">
            {assetMaint.length === 0 && <p className="text-sm text-slate-500">No maintenance events.</p>}
            {assetMaint.slice(0, 6).map((m) => (
              <div key={m.work_order_id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800">{m.event_type}</div>
                  <div className="text-xs text-slate-500">{m.work_order_id} · {fmtDate(m.event_date)} · {m.fault_category}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <StatusBadge status={m.status} />
                  <div className="mt-1">{m.downtime_hours}h · ${fmtNum(m.cost_estimate)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
