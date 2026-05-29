import clsx from "clsx";

/**
 * Navon Labs / Navon MineIQ brand lockup. Uses the supplied Navon Labs logo
 * mark from /brand and pairs it with the product wordmark.
 */
export function Logo({
  variant = "light",
  showProduct = true,
  className,
}: {
  variant?: "light" | "dark";
  showProduct?: boolean;
  className?: string;
}) {
  const titleColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-slate-400" : "text-slate-500";
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <img
        src="/brand/navon-labs-logo.png"
        alt="Navon Labs"
        className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
      />
      {showProduct && (
        <div className="leading-tight">
          <div className={clsx("flex items-baseline gap-1 text-lg font-extrabold tracking-tight", titleColor)}>
            Navon <span className="text-accent">MineIQ</span>
          </div>
          <div className={clsx("text-[10px] font-medium uppercase tracking-wider", subColor)}>
            Predictive Maintenance Platform
          </div>
        </div>
      )}
    </div>
  );
}
