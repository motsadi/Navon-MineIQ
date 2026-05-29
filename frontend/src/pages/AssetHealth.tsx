import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, LayoutGrid, Table2 } from "lucide-react";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Card, ErrorState, Loading, RiskBadge, SectionHeader, StatusBadge } from "@/components/ui";
import { fmtNum } from "@/lib/format";
import type { Asset } from "@/types";

function HealthDot({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : score >= 30 ? "#f97316" : "#f43f5e";
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

export default function AssetHealth() {
  const { data, loading, error } = useApi(() => api.assets(), []);
  const navigate = useNavigate();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [type, setType] = useState("");
  const [loc, setLoc] = useState("");
  const [risk, setRisk] = useState("");

  const types = useMemo(() => [...new Set((data ?? []).map((a) => a.asset_type))], [data]);
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (a) => (!type || a.asset_type === type) && (!loc || a.location === loc) && (!risk || a.risk_level === risk),
      ),
    [data, type, loc, risk],
  );

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Asset Health Dashboard"
        subtitle="All monitored assets with health, risk, RUL and open alerts."
        right={
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => setView("cards")} className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "cards" ? "bg-accent text-white" : "text-slate-500"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button onClick={() => setView("table")} className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "table" ? "bg-accent text-white" : "text-slate-500"}`}>
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select label="Asset type" value={type} onChange={setType} options={types} />
        <Select label="Location" value={loc} onChange={setLoc} options={["Underground", "Surface"]} />
        <Select label="Risk level" value={risk} onChange={setRisk} options={["Low", "Medium", "High", "Critical"]} />
        <div className="flex items-end text-sm text-slate-500">{filtered.length} of {data.length} assets</div>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <AssetCard key={a.asset_id} asset={a} onOpen={() => navigate(`/assets/${a.asset_id}`)} />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Failure risk</th>
                <th className="px-4 py-3">RUL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Alerts</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.asset_id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => navigate(`/assets/${a.asset_id}`)}>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.asset_name}<div className="text-xs text-slate-400">{a.asset_id}</div></td>
                  <td className="px-4 py-3 text-slate-600">{a.asset_type}</td>
                  <td className="px-4 py-3 text-slate-600">{a.location}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><HealthDot score={a.health_score} />{fmtNum(a.health_score, 1)}</span></td>
                  <td className="px-4 py-3 text-slate-600">{fmtNum(a.failure_risk, 1)}%</td>
                  <td className="px-4 py-3 text-slate-600">{a.rul_days} d</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><RiskBadge level={a.risk_level} /></td>
                  <td className="px-4 py-3 text-right text-slate-300"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function AssetCard({ asset, onOpen }: { asset: Asset; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card card-pad text-left transition-all hover:-translate-y-0.5 hover:shadow-cardlg">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-900">{asset.asset_name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" /> {asset.location} · {asset.asset_type}
          </div>
        </div>
        <RiskBadge level={asset.risk_level} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Metric label="Health" value={fmtNum(asset.health_score, 1)} tone={asset.health_score} />
        <Metric label="Risk" value={`${fmtNum(asset.failure_risk, 0)}%`} />
        <Metric label="RUL" value={`${asset.rul_days}d`} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <StatusBadge status={asset.status} />
        <span className="text-xs text-slate-500">
          {asset.open_alerts} open alert{asset.open_alerts === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: number }) {
  const color = tone === undefined ? "text-slate-900" : tone >= 75 ? "text-emerald-600" : tone >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
