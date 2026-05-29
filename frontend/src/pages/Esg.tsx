import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fan, Gauge, Leaf, Wind, Zap } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, SectionHeader } from "@/components/ui";
import { fmtDateShort, fmtNum } from "@/lib/format";

function Indicator({ label, value, unit, tone }: { label: string; value: number | null | undefined; unit: string; tone: "ok" | "warn" | "danger" }) {
  const color = tone === "danger" ? "text-rose-600" : tone === "warn" ? "text-amber-600" : "text-emerald-600";
  const ring = tone === "danger" ? "ring-rose-200" : tone === "warn" ? "ring-amber-200" : "ring-emerald-200";
  return (
    <div className={`rounded-xl bg-white p-4 ring-1 ${ring}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>
        {value === null || value === undefined ? "—" : fmtNum(value, 2)} <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export default function Esg() {
  const { data, loading, error } = useApi(() => api.esg(), []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const ems = data.ems_latest_indicators ?? {};
  const ch4 = Number(ems.methane_ch4);
  const co = Number(ems.carbon_monoxide_co);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ESG / Energy / Environmental Monitoring"
        subtitle="Energy efficiency, avoidable losses, ventilation efficiency and underground environmental indicators."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Energy" value={`${fmtNum(data.total_energy_kwh)} kWh`} icon={<Zap className="h-5 w-5" />} />
        <KpiCard label="Avoidable Loss (est.)" value={`${fmtNum(data.total_avoidable_loss_kwh)} kWh`} accent="warning" icon={<Leaf className="h-5 w-5" />} />
        <KpiCard label="Avg Energy Intensity" value={fmtNum(data.avg_energy_intensity, 3)} icon={<Gauge className="h-5 w-5" />} hint="kWh per unit output" />
        <KpiCard label="Fan Efficiency Index" value={data.ventilation_fan_efficiency_index === null ? "—" : fmtNum(data.ventilation_fan_efficiency_index, 1)} accent="success" icon={<Fan className="h-5 w-5" />} hint="Airflow per kW" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Energy Consumption Trend" subtitle="Energy meter profile over the monitoring window." />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.energy_trend} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
              <defs>
                <linearGradient id="engFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f9bf0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2f9bf0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${fmtNum(v)} kWh`, "Energy"]} />
              <Area type="monotone" dataKey="energy_kwh" stroke="#2f9bf0" strokeWidth={2} fill="url(#engFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="Avoidable Loss Estimate" subtitle="Estimated recoverable energy losses." />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.energy_trend} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${fmtNum(v)} kWh`, "Avoidable loss"]} />
              <Line type="monotone" dataKey="avoidable_loss_estimate" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Underground Environmental Management System"
          subtitle="Simulated gas, airflow and environmental indicators."
          right={
            <span className={`badge ${Number(data.environmental_risk_score) > 40 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              Environmental risk: {fmtNum(data.environmental_risk_score, 1)}
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Indicator label="Methane CH₄" value={ch4} unit="%" tone={ch4 > 0.5 ? "danger" : ch4 > 0.3 ? "warn" : "ok"} />
          <Indicator label="Carbon monoxide" value={co} unit="ppm" tone={co > 25 ? "danger" : co > 12 ? "warn" : "ok"} />
          <Indicator label="Airflow velocity" value={Number(ems.airflow_velocity)} unit="m/s" tone="ok" />
          <Indicator label="Humidity" value={Number(ems.humidity)} unit="%" tone="ok" />
          <Indicator label="Smoke alarm" value={Number(ems.smoke_alarm)} unit="" tone={Number(ems.smoke_alarm) > 0 ? "danger" : "ok"} />
        </div>

        <div className="mt-6">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.ems_trend} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={36} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="methane_ch4" name="CH₄ (%)" stroke="#f43f5e" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="airflow_velocity" name="Airflow (m/s)" stroke="#2f9bf0" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="environmental_risk_score" name="Env risk" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Wind className="h-3.5 w-3.5" />
            Indicators are simulated for the demo and would be validated against approved gas, airflow,
            fire and environmental monitoring data sources in production.
          </div>
        </div>
      </Card>
    </div>
  );
}
