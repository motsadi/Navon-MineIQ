/**
 * Semi-circular health-score gauge rendered as inline SVG (no chart lib needed).
 * Score 0-100 maps to a red -> amber -> green arc.
 */
export function Gauge({ value, label = "Health Score" }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = Math.PI; // 180deg
  const endAngle = 0; // 0deg
  const angle = startAngle + (endAngle - startAngle) * (clamped / 100);

  const polar = (a: number) => ({
    x: cx + radius * Math.cos(a),
    y: cy - radius * Math.sin(a),
  });
  const start = polar(startAngle);
  const end = polar(angle);
  const trackEnd = polar(endAngle);
  const largeArc = 0;

  const color = clamped >= 75 ? "#10b981" : clamped >= 50 ? "#f59e0b" : clamped >= 30 ? "#f97316" : "#f43f5e";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={16}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 30, fontWeight: 700 }}>
          {clamped.toFixed(0)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11 }}>
          / 100
        </text>
      </svg>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </div>
  );
}
