import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Database } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, ProgressBar, SectionHeader } from "@/components/ui";
import { fmtDate, fmtNum } from "@/lib/format";

export default function DataQuality() {
  const { data, loading, error } = useApi(() => api.dataQuality(), []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const sources = data.items;
  const avgQuality = sources.reduce((s, x) => s + x.quality_score, 0) / Math.max(1, sources.length);
  const avgComplete = sources.reduce((s, x) => s + x.completeness_pct, 0) / Math.max(1, sources.length);
  const chartData = sources.map((s) => ({ name: s.source_system.split(" ")[0], score: s.quality_score }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Data Quality & Integration"
        subtitle="Source-system readiness, ingestion status, completeness and freshness."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Source Systems" value={sources.length} icon={<Database className="h-5 w-5" />} />
        <KpiCard label="Avg Quality Score" value={`${fmtNum(avgQuality, 1)}%`} accent="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <KpiCard label="Avg Completeness" value={`${fmtNum(avgComplete, 1)}%`} />
        <KpiCard label="Connected (demo)" value={`${sources.filter((s) => s.ingestion_status.includes("Connected")).length}/${sources.length}`} accent="success" />
      </div>

      <Card>
        <SectionHeader title="Data Quality Score by Source" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [`${v}%`, "Quality"]} cursor={{ fill: "rgba(47,155,240,0.06)" }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.score >= 90 ? "#10b981" : d.score >= 85 ? "#2f9bf0" : "#f59e0b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="space-y-3">
        {sources.map((s) => (
          <Card key={s.source_system}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="lg:w-1/3">
                <div className="font-semibold text-slate-900">{s.source_system}</div>
                <div className="text-xs text-slate-500">{s.source_type} · {s.interface}</div>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {s.ingestion_status}
                </span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-[11px] text-slate-400">Completeness</div>
                  <div className="text-sm font-semibold text-slate-800">{fmtNum(s.completeness_pct, 1)}%</div>
                  <ProgressBar value={s.completeness_pct} tone="success" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Missing rate</div>
                  <div className="text-sm font-semibold text-slate-800">{fmtNum(s.missing_value_rate_pct, 1)}%</div>
                  <ProgressBar value={s.missing_value_rate_pct} tone="warning" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Freshness</div>
                  <div className="text-sm font-semibold text-slate-800">{s.freshness}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Latest data</div>
                  <div className="text-sm font-semibold text-slate-800">{fmtDate(s.latest_timestamp)}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        Integration is through approved data sources/interfaces. Direct PLC/SCADA/DCS access or
        modification is excluded unless expressly approved by the client's IT/OT function.
      </p>
    </div>
  );
}
