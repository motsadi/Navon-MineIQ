import type { Role } from "@/types";
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Ruler,
  BrainCircuit,
  Bell,
  Wrench,
  Leaf,
  DatabaseZap,
  ShieldCheck,
  FileDown,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Executive Overview", path: "/overview", icon: LayoutDashboard },
  { label: "Asset Health", path: "/assets", icon: HeartPulse },
  { label: "Engineering Baselines", path: "/baselines", icon: Ruler },
  { label: "Predictive Analytics", path: "/predictive", icon: BrainCircuit },
  { label: "Alerts & Recommendations", path: "/alerts", icon: Bell },
  { label: "Maintenance Planning", path: "/maintenance", icon: Wrench },
  { label: "ESG / Energy / Environment", path: "/esg", icon: Leaf },
  { label: "Data Quality & Integration", path: "/data-quality", icon: DatabaseZap },
  { label: "Model Governance", path: "/governance", icon: ShieldCheck },
  { label: "Reports", path: "/reports", icon: FileDown },
];

// Icon used for the asset-detail route (not shown as a top-level nav item).
export const ASSET_DETAIL_ICON = Activity;

/** Allowed routes per demo role. */
export const ROLE_ACCESS: Record<Role, string[]> = {
  Executive: ["/overview", "/assets", "/esg", "/reports"],
  "Reliability Engineer": [
    "/overview", "/assets", "/baselines", "/predictive", "/alerts", "/maintenance", "/reports",
  ],
  "Maintenance Planner": ["/overview", "/assets", "/alerts", "/maintenance", "/reports"],
  "Operations User": ["/overview", "/assets", "/baselines", "/alerts", "/esg"],
  "IT/OT Admin": [
    "/overview", "/assets", "/baselines", "/data-quality", "/governance", "/reports",
  ],
  "SHE/ESG User": ["/overview", "/assets", "/esg", "/reports"],
};

export const ROLES: Role[] = [
  "Executive",
  "Reliability Engineer",
  "Maintenance Planner",
  "Operations User",
  "IT/OT Admin",
  "SHE/ESG User",
];

export const ROLE_DESCRIPTION: Record<Role, string> = {
  Executive: "Boardroom KPIs, fleet risk ranking and ESG/energy summary.",
  "Reliability Engineer": "Full reliability stack: baselines, analytics, RUL and alerts.",
  "Maintenance Planner": "Alert triage, work-order decision support and planning.",
  "Operations User": "Operational dashboards, asset trends and control limits.",
  "IT/OT Admin": "Data sources, ingestion quality and model governance.",
  "SHE/ESG User": "Energy, emissions proxy and underground environmental monitoring.",
};

export function canAccess(role: Role | null, path: string): boolean {
  if (!role) return false;
  if (path.startsWith("/assets/")) return ROLE_ACCESS[role].includes("/assets");
  return ROLE_ACCESS[role].includes(path);
}

export function navForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => ROLE_ACCESS[role].includes(item.path));
}
