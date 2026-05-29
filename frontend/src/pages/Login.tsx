import { useNavigate } from "react-router-dom";
import { ArrowRight, Database } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/hooks/AppContext";
import { ROLES, ROLE_DESCRIPTION } from "@/lib/nav";
import type { Role } from "@/types";

const FEATURES = [
  "Asset health scoring",
  "Engineering baselines & control limits",
  "Anomaly detection & failure-risk scoring",
  "Remaining useful life (RUL) estimates",
  "Alert management & maintenance decision support",
  "ESG, energy & underground environmental analytics",
  "Data quality, integration readiness & model governance",
];

export default function Login() {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const choose = (role: Role) => {
    setRole(role);
    navigate("/overview");
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Brand / pitch panel */}
        <div className="relative flex flex-col justify-between overflow-hidden p-10 lg:p-14">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sand-500/10 blur-3xl"
            aria-hidden
          />
          <Logo variant="light" />

          <div className="relative z-10 max-w-lg">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
              <Database className="h-3.5 w-3.5" />
              Demo Mode · Simulated Data
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Asset Health, Reliability &<br />
              <span className="text-accent">Predictive Maintenance</span> Platform
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Navon MineIQ unifies condition monitoring, engineering baselines, predictive analytics
              and reliability decision support into a single executive-ready platform — purpose-built
              for mining asset reliability.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 mt-8 max-w-lg text-[11px] leading-relaxed text-slate-500">
            This prototype uses simulated data only and does not connect to live operational systems. In
            production, Navon MineIQ will integrate only with approved data sources and interfaces.
          </p>
        </div>

        {/* Role selector panel */}
        <div className="flex items-center bg-white p-8 text-slate-900 lg:p-14">
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight">Select a demo role</h2>
            <p className="mt-1 text-sm text-slate-500">
              No authentication is required for the demo. Choose a role to explore role-based access.
            </p>

            <div className="mt-6 space-y-3">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => choose(role)}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-accent hover:shadow-cardlg"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{role}</div>
                    <div className="text-xs text-slate-500">{ROLE_DESCRIPTION[role]}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
