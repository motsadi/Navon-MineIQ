import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Boxes,
  CalendarClock,
  HeartPulse,
  ShieldAlert,
  Database,
} from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, SectionHeader, SeverityBadge } from "@/components/ui";
import { RISK_COLORS, fmtDateShort, fmtNum } from "@/lib/format";

export default function ExecutiveOverview() {
  const { data, loading, error } = useApi(() => api.summary(), []);
  const navigate = useNavigate();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Executive Overview"
        subtitle="Fleet-wide asset health, reliability risk and reliability KPIs."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Assets Monitored" value={fmtNum(data.total_assets)} icon={<Boxes className="h-5 w-5" />} hint="Phase 1 representative fleet" />
        <KpiCard label="Average Health Score" value={`${fmtNum(data.average_health_score, 1)}`} icon={<HeartPulse className="h-5 w-5" />} accent="success" hint="0–100 scale" />
        <KpiCard label="High-Risk Assets" value={fmtNum(data.high_risk_assets)} icon={<ShieldAlert className="h-5 w-5" />} accent="warning" hint="High + Critical" />
        <KpiCard label="Open Critical Alerts" value={fmtNum(data.open_critical_alerts)} icon={<AlertTriangle className="h-5 w-5" />} accent="danger" hint={`${data.open_alerts} open total`} />
        <KpiCard label="Predicted Downtime Risk" value={`${fmtNum(data.predicted_downtime_risk_pct, 1)}%`} icon={<Activity className="h-5 w-5" />} accent="warning" hint="Risk × criticality" />
        <KpiCard label="Energy Efficiency" value={`${fmtNum(data.energy_efficiency_pct, 1)}%`} icon={<BatteryCharging className="h-5 w-5" />} accent="success" hint="Useful energy proxy" />
        <KpiCard label="Data Quality Score" value={`${fmtNum(data.data_quality_score, 1)}%`} icon={<Database className="h-5 w-5" />} hint="Across all sources" />
        <KpiCard label="Average RUL" value={`${fmtNum(data.avg_rul_days)} d`} icon={<CalendarClock className="h-5 w-5" />} hint="Remaining useful life" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="Asset Risk Ranking" subtitle="Failure risk by representative asset (click a bar to drill in)." />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data.asset_risk_ranking}
              margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
              onClick={(e: any) => {
                const id = e?.activePayload?.[0]?.payload?.asset_id;
                if (id) navigate(`/assets/${id}`);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="asset_id" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Failure risk"]}
                labelFormatter={(l) => `Asset ${l}`}
                cursor={{ fill: "rgba(47,155,240,0.06)" }}
              />
              <Bar dataKey="failure_risk" radius={[6, 6, 0, 0]} cursor="pointer">
                {data.asset_risk_ranking.map((r) => (
                  <Cell key={r.asset_id} fill={RISK_COLORS[r.risk_level] ?? "#2f9bf0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="Risk Distribution" subtitle="Assets by risk level." />
          <div className="space-y-3">
            {(["Critical", "High", "Medium", "Low"] as const).map((lvl) => {
              const count = data.risk_breakdown[lvl] ?? 0;
              const pct = (count / Math.max(1, data.total_assets)) * 100;
              return (
                <div key={lvl}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{lvl}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[lvl] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            One representative asset per Phase 1 class. The UI scales to the full multi-asset fleet.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="Fleet Health Score Trend" subtitle="Average health score across all assets (12 months)." />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.health_trend} margin={{ top: 8, right: 12, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmtNum(v, 1), "Avg health"]} />
              <Line type="monotone" dataKey="avg_health_score" stroke="#2f9bf0" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="Top Alerts" subtitle="Highest-severity open alerts." />
          <div className="space-y-3">
            {data.top_alerts.length === 0 && <p className="text-sm text-slate-500">No open alerts.</p>}
            {data.top_alerts.map((a) => (
              <button
                key={a.alert_id}
                onClick={() => navigate(`/assets/${a.asset_id}`)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left hover:border-accent/40 hover:bg-accent/5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{a.alert_type}</div>
                  <div className="truncate text-xs text-slate-500">
                    {a.asset_id} · {a.reason_code}
                  </div>
                </div>
                <SeverityBadge severity={a.severity} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
