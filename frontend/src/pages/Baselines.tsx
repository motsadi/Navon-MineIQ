import { useEffect, useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, Loading, SectionHeader } from "@/components/ui";
import { fmtDateShort, fmtNum, metricLabel } from "@/lib/format";
import type { BaselineResponse, TelemetryResponse } from "@/types";

export default function Baselines() {
  const assets = useApi(() => api.assets(), []);
  const [assetId, setAssetId] = useState("");

  useEffect(() => {
    if (!assetId && assets.data?.length) setAssetId(assets.data[0].asset_id);
  }, [assets.data, assetId]);

  const baseline = useApi<BaselineResponse | null>(
    () => (assetId ? api.baseline(assetId) : Promise.resolve(null)),
    [assetId],
  );
  const telemetry = useApi<TelemetryResponse | null>(
    () => (assetId ? api.telemetry(assetId, "daily") : Promise.resolve(null)),
    [assetId],
  );

  const [metric, setMetric] = useState("vibration_mm_s");
  const metrics = useMemo(() => baseline.data?.metrics ?? [], [baseline.data]);
  useEffect(() => {
    if (metrics.length && !metrics.find((m) => m.metric === metric)) setMetric(metrics[0].metric);
  }, [metrics, metric]);

  const active = metrics.find((m) => m.metric === metric);

  if (assets.loading) return <Loading />;
  if (assets.error) return <ErrorState message={assets.error} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Engineering Baselines & Control Limits"
        subtitle="Statistical operating envelopes computed from historical telemetry for early-warning and alert rationalisation."
        right={
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {(assets.data ?? []).map((a) => (
              <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
            ))}
          </select>
        }
      />

      {baseline.loading ? (
        <Loading />
      ) : !active ? (
        <Card><p className="text-sm text-slate-500">No baseline metrics available for this asset.</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Baseline mean" value={`${fmtNum(active.mean, 2)} ${active.unit}`} />
            <Stat label="Std deviation (σ)" value={`${fmtNum(active.std, 3)} ${active.unit}`} />
            <Stat label="Upper control limit" value={`${fmtNum(active.upper_control_limit, 2)} ${active.unit}`} tone="danger" />
            <Stat label="Control-limit breaches" value={String(active.breaches)} tone={active.breaches > 0 ? "warning" : undefined} />
          </div>

          <Card>
            <SectionHeader
              title={`Normal vs Abnormal Operating Envelope — ${metricLabel(metric)}`}
              subtitle="Green band = warning envelope (mean ± 2σ). Outside the control limits is treated as abnormal."
              right={
                <select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                  {metrics.map((m) => (
                    <option key={m.metric} value={m.metric}>{metricLabel(m.metric)}</option>
                  ))}
                </select>
              }
            />
            {telemetry.loading ? (
              <Loading label="Loading telemetry…" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={telemetry.data?.points ?? []} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => [fmtNum(v, 2), metricLabel(metric)]} />
                  <ReferenceArea y1={active.warning_low} y2={active.warning_high} fill="#10b981" fillOpacity={0.08} />
                  <ReferenceArea y1={active.upper_control_limit} y2={active.warning_high} fill="#f59e0b" fillOpacity={0.05} />
                  <Line type="monotone" dataKey={metric} stroke="#2f9bf0" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey={() => active.mean} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} legendType="none" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <p className="mt-2 text-xs text-slate-400">Training window: {baseline.data?.training_window}</p>
          </Card>

          <Card className="overflow-x-auto p-0">
            <div className="px-5 pt-5"><h3 className="section-title">Baseline table — all variables</h3></div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Variable</th>
                  <th className="px-4 py-3">Mean</th>
                  <th className="px-4 py-3">σ</th>
                  <th className="px-4 py-3">Warning low</th>
                  <th className="px-4 py-3">Warning high</th>
                  <th className="px-4 py-3">LCL</th>
                  <th className="px-4 py-3">UCL</th>
                  <th className="px-4 py-3">Latest</th>
                  <th className="px-4 py-3">In envelope</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.metric} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{metricLabel(m.metric)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.mean, 2)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.std, 3)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.warning_low, 2)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.warning_high, 2)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.lower_control_limit, 2)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(m.upper_control_limit, 2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{fmtNum(m.latest_value ?? null, 2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${m.in_envelope ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {m.in_envelope ? "Normal" : "Out of envelope"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warning" }) {
  const color = tone === "danger" ? "text-rose-600" : tone === "warning" ? "text-amber-600" : "text-slate-900";
  return (
    <Card>
      <div className="kpi-label">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </Card>
  );
}
