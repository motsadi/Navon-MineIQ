import clsx from "clsx";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { RiskLevel, Severity } from "@/types";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("card card-pad", className)}>{children}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "default" | "danger" | "warning" | "success";
  icon?: ReactNode;
}) {
  const bar = {
    default: "bg-accent",
    danger: "bg-rose-500",
    warning: "bg-amber-500",
    success: "bg-emerald-500",
  }[accent ?? "default"];
  return (
    <div className="card relative overflow-hidden p-5">
      <span className={clsx("absolute inset-y-0 left-0 w-1", bar)} />
      <div className="flex items-start justify-between">
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
        </div>
        {icon && <div className="text-slate-300">{icon}</div>}
      </div>
    </div>
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  High: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
  Critical: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={clsx("badge", RISK_STYLES[level] ?? RISK_STYLES.Low)}>{level}</span>;
}

const SEVERITY_DOT: Record<Severity, string> = {
  Low: "bg-sky-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-rose-500",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={clsx("badge", RISK_STYLES[severity] ?? RISK_STYLES.Low)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[severity])} />
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Running: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    Warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    Alarm: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
    Open: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
    Acknowledged: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    Closed: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    Scheduled: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    "In Progress": "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  };
  return <span className={clsx("badge", map[status] ?? "bg-slate-100 text-slate-600")}>{status}</span>;
}

export function Loading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-rose-500" />
      <p className="text-sm font-medium text-rose-700">Could not load data</p>
      <p className="max-w-md text-xs text-rose-500">{message}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">
        Confirm the backend is running and <code>VITE_API_BASE_URL</code> points to it.
      </p>
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = "accent" }: { value: number; max?: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    tone === "danger" ? "bg-rose-500" : tone === "warning" ? "bg-amber-500" : tone === "success" ? "bg-emerald-500" : "bg-accent";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p className={clsx("text-xs text-slate-400", className)}>
      This prototype uses simulated data only and does not connect to live operational systems.
    </p>
  );
}
