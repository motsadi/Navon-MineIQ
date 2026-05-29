import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Gauge as GaugeIcon, ScanSearch } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, RiskBadge, SectionHeader } from "@/components/ui";
import { CHART_COLORS, RISK_COLORS, fmtNum } from "@/lib/format";

export default function Predictive() {
  const { data, loading, error } = useApi(() => api.predictive(), []);
  const navigate = useNavigate();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const featureData = Object.entries(data.global_feature_importance).map(([k, v]) => ({
    feature: k.replace(/_/g, " "),
    value: Number((v * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Predictive Analytics"
        subtitle="Anomaly detection, failure-risk scoring, RUL and model explainability."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Assets Scored" value={fmtNum(data.total_assets_scored)} icon={<GaugeIcon className="h-5 w-5" />} />
        <KpiCard label="Anomalies Detected" value={fmtNum(data.total_anomalies_detected)} accent="warning" icon={<ScanSearch className="h-5 w-5" />} hint="Across monitoring window" />
        <KpiCard label="Avg Model Confidence" value={`${fmtNum(data.average_model_confidence * 100, 0)}%`} accent="success" icon={<Activity className="h-5 w-5" />} />
        <KpiCard label="Top Risk Driver" value={featureData.length ? featureData.reduce((a, b) => (a.value > b.value ? a : b)).feature : "—"} hint="Highest mean contribution" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Risk Drivers — Feature Contribution" subtitle="Mean contribution of each driver to the failure-risk model." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="feature" width={96} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Contribution"]} cursor={{ fill: "rgba(47,155,240,0.06)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {featureData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="Failure-Risk Model Output" subtitle="Latest failure risk by asset." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.latest_predictions} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="asset_id" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${fmtNum(v, 1)}%`, "Failure risk"]} cursor={{ fill: "rgba(47,155,240,0.06)" }} />
              <Bar dataKey="failure_risk" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d: any) => d?.asset_id && navigate(`/assets/${d.asset_id}`)}>
                {data.latest_predictions.map((r, i) => (
                  <Cell key={i} fill={RISK_COLORS[r.risk_level] ?? "#2f9bf0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="px-5 pt-5"><h3 className="section-title">Model Output & RUL Table</h3></div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Failure risk</th>
              <th className="px-4 py-3">Anomaly</th>
              <th className="px-4 py-3">RUL</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Risk level</th>
              <th className="px-4 py-3">Model reason</th>
            </tr>
          </thead>
          <tbody>
            {data.latest_predictions.map((r) => (
              <tr key={r.asset_id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => navigate(`/assets/${r.asset_id}`)}>
                <td className="px-4 py-3 font-medium text-slate-800">{r.asset_id}</td>
                <td className="px-4 py-3 text-slate-600">{fmtNum(r.health_score, 1)}</td>
                <td className="px-4 py-3 text-slate-600">{fmtNum(r.failure_risk, 1)}%</td>
                <td className="px-4 py-3 text-slate-600">{fmtNum(r.anomaly_score, 3)}</td>
                <td className="px-4 py-3 text-slate-600">{r.rul_days} d</td>
                <td className="px-4 py-3 text-slate-600">{fmtNum(r.model_confidence * 100, 0)}%</td>
                <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
                <td className="max-w-sm px-4 py-3 text-xs text-slate-500">{r.model_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-slate-400">
        Models combine engineering baselines, trend deviation, anomaly scores, asset criticality and
        maintenance context. RUL is a data-dependent estimate and should be validated against confirmed
        failure history in production.
      </p>
    </div>
  );
}
