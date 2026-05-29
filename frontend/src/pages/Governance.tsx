import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, KpiCard, Loading, SectionHeader } from "@/components/ui";

function DriftBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Stable: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    "Minor drift": "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    "Drift detected": "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
  };
  return <span className={`badge ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function ApprovalBadge({ status }: { status: string }) {
  const ok = status.toLowerCase().includes("approved");
  return (
    <span className={`badge ${ok ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20" : "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function Governance() {
  const { data, loading, error } = useApi(() => api.modelGovernance(), []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const models = data.items;
  const needRetrain = models.filter((m) => m.retraining_recommendation.toLowerCase().includes("retrain")).length;
  const drifting = models.filter((m) => m.drift_status !== "Stable").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Model Governance"
        subtitle="Model registry, validation, drift monitoring and approval status."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Registered Models" value={models.length} />
        <KpiCard label="Approved" value={models.filter((m) => m.approval_status.toLowerCase().includes("approved")).length} accent="success" />
        <KpiCard label="Drift Flags" value={drifting} accent="warning" />
        <KpiCard label="Retraining Recommended" value={needRetrain} accent={needRetrain ? "danger" : "success"} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Asset class</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Training period</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Last trained</th>
              <th className="px-4 py-3">Drift</th>
              <th className="px-4 py-3">Approval</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.model_name} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3 font-medium text-slate-800">{m.model_name}
                  <div className="mt-1 max-w-xs text-xs font-normal text-slate-400">{m.retraining_recommendation}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.model_type}</td>
                <td className="px-4 py-3 text-slate-600">{m.asset_class}</td>
                <td className="px-4 py-3 text-slate-600">{m.version}</td>
                <td className="px-4 py-3 text-slate-600">{m.training_period}</td>
                <td className="px-4 py-3 text-slate-600">{m.validation_metric}</td>
                <td className="px-4 py-3 text-slate-600">{m.last_trained}</td>
                <td className="px-4 py-3"><DriftBadge status={m.drift_status} /></td>
                <td className="px-4 py-3"><ApprovalBadge status={m.approval_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        In production, model approval, threshold changes, access changes and data-ingestion events would
        be logged and reviewed under the client's governance procedures.
      </p>
    </div>
  );
}
