import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/hooks/AppContext";
import { navForRole } from "@/lib/nav";

export function Sidebar() {
  const { role, setRole } = useApp();
  const items = navForRole(role);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy-900 text-slate-200">
      <div className="flex h-16 items-center border-b border-white/5 px-5">
        <Logo variant="light" />
      </div>

      <div className="px-4 pb-2 pt-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx("nav-link", isActive && "nav-link-active")}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 rounded-lg bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Active role</p>
          <p className="truncate text-sm font-semibold text-white">{role ?? "—"}</p>
        </div>
        <button
          onClick={() => setRole(null)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Switch role / exit demo
        </button>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-600">
          Simulated data only. No connection to live operational systems.
        </p>
      </div>
    </aside>
  );
}
