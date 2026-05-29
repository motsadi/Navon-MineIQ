export const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#f43f5e",
};

export const CHART_COLORS = ["#2f9bf0", "#7c5cff", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#c9a25f", "#64748b"];

export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtDate(v: string): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateShort(v: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function metricLabel(metric: string): string {
  const map: Record<string, string> = {
    vibration_mm_s: "Vibration (mm/s)",
    temperature_c: "Temperature (°C)",
    motor_current_a: "Motor current (A)",
    pressure_bar: "Pressure (bar)",
    flow_rate: "Flow / airflow",
    speed_rpm: "Speed (rpm)",
    power_kw: "Power (kW)",
    energy_kwh: "Energy (kWh)",
    methane_ch4: "Methane CH₄ (%)",
    carbon_monoxide_co: "Carbon monoxide (ppm)",
    airflow_velocity: "Airflow velocity (m/s)",
    humidity: "Humidity (%)",
    environmental_risk_score: "Environmental risk",
  };
  return map[metric] ?? metric.replace(/_/g, " ");
}
