import { Clock, Coins, Timer, Wrench } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, SectionHeader, StatusBadge } from "@/components/ui";
import { fmtDate, fmtNum } from "@/lib/format";

export default function Maintenance() {
  const { data, loading, error } = useApi(() => api.maintenance(), []);
  const assets = useApi(() => api.assets(), []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const upcoming = data.events.filter((e) => e.status === "Scheduled" || e.status === "In Progress");
  const history = data.events.filter((e) => e.status === "Completed");

  // Decision-support: rank assets by failure risk for recommended interventions.
  const recommendations = (assets.data ?? [])
    .filter((a) => a.failure_risk >= 30)
    .sort((a, b) => b.failure_risk - a.failure_risk);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Maintenance Planning"
        subtitle="Recommended interventions, work-order decision support and reliability KPIs."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="MTBF (proxy)" value={`${fmtNum(data.mtbf_days, 1)} d`} icon={<Clock className="h-5 w-5" />} hint="Mean time between events" />
        <KpiCard label="MTTR (proxy)" value={`${fmtNum(data.mttr_hours, 1)} h`} icon={<Timer className="h-5 w-5" />} hint="Mean downtime per event" />
        <KpiCard label="Downtime Avoided" value={`${fmtNum(data.estimated_downtime_avoided_hours)} h`} accent="success" icon={<Wrench className="h-5 w-5" />} hint="Estimated, risk-weighted" />
        <KpiCard label="Cost Impact" value={`$${fmtNum(data.total_cost_estimate)}`} accent="warning" icon={<Coins className="h-5 w-5" />} hint="Cumulative event cost" />
      </div>

      <Card>
        <SectionHeader title="Recommended Interventions" subtitle="Condition-based actions prioritised by failure risk." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Failure risk</th>
                <th className="px-4 py-3">RUL</th>
                <th className="px-4 py-3">Recommended window</th>
                <th className="px-4 py-3">Suggested action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((a) => {
                const window = a.rul_days < 30 ? "Within 2 weeks" : a.rul_days < 90 ? "Within 1 month" : "Next planned shutdown";
                return (
                  <tr key={a.asset_id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.asset_name}<div className="text-xs text-slate-400">{a.asset_id}</div></td>
                    <td className="px-4 py-3 text-slate-600">{fmtNum(a.failure_risk, 1)}%</td>
                    <td className="px-4 py-3 text-slate-600">{a.rul_days} d</td>
                    <td className="px-4 py-3"><span className="badge bg-sky-50 text-sky-700">{window}</span></td>
                    <td className="px-4 py-3 text-slate-600">Condition-based inspection of {a.asset_type.toLowerCase()} primary failure modes.</td>
                  </tr>
                );
              })}
              {recommendations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No assets currently above the intervention threshold.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Upcoming / In-Progress Work" />
          <div className="space-y-3">
            {upcoming.slice(0, 8).map((e) => (
              <div key={e.work_order_id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800">{e.event_type}</div>
                  <div className="text-xs text-slate-500">{e.work_order_id} · {e.asset_id} · {fmtDate(e.event_date)}</div>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-slate-500">No scheduled work in the demo snapshot.</p>}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Maintenance Event History" />
          <div className="space-y-3">
            {history.slice(0, 8).map((e) => (
              <div key={e.work_order_id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800">{e.event_type} · {e.fault_category}</div>
                  <div className="text-xs text-slate-500">{e.work_order_id} · {e.asset_id} · {fmtDate(e.event_date)}</div>
                </div>
                <div className="text-right text-xs text-slate-500">{e.downtime_hours}h<div>${fmtNum(e.cost_estimate)}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        ERP/CMMS work-order initiation is subject to client approval. This view provides decision
        support only and does not automatically create work orders.
      </p>
    </div>
  );
}
