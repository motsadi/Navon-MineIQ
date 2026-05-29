import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

const TENDER_STATEMENT =
  "Navon MineIQ is demonstrated using simulated data. In production, the platform will integrate only with approved data sources and interfaces, including historian extracts, SCADA/PLC-derived data, OEM telemetry outputs, Pronto Xi ERP/CMMS data, condition monitoring outputs, energy meters and underground environmental monitoring systems. Direct PLC/SCADA/DCS access or control-system modification will only be implemented where expressly approved by IT/OT.";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="mx-auto max-w-[1400px] px-6 py-6">
          <p className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
            Designed for predictive maintenance, asset health monitoring, early fault detection and
            reliability decision support.
          </p>
          <Outlet />
          <footer className="mt-10 border-t border-slate-200 pt-5">
            <p className="text-[11px] leading-relaxed text-slate-400">{TENDER_STATEMENT}</p>
            <p className="mt-2 text-[11px] text-slate-400">
              © {new Date().getFullYear()} Navon Labs · Navon MineIQ · Demo build · Simulated data only.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
