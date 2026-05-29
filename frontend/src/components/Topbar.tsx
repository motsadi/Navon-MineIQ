import { Database, ShieldQuestion } from "lucide-react";
import { useApp } from "@/hooks/AppContext";

export function Topbar() {
  const { role } = useApp();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div>
        <h1 className="text-base font-bold tracking-tight text-slate-900">
          Navon MineIQ
        </h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          Asset Health, Reliability and Predictive Maintenance Platform
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 lg:inline-flex">
          <Database className="h-3.5 w-3.5" />
          Demo Mode: Simulated Data
        </span>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
          <ShieldQuestion className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">{role ?? "Guest"}</span>
        </div>
      </div>
    </header>
  );
}
