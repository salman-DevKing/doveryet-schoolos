import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  iconBg?: "brand" | "navy" | "violet" | "success" | "warning" | "error" | "cyan";
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
  };
  meta?: ReactNode;
  className?: string;
}

const iconBgs = {
  brand: "bg-gradient-brand",
  navy: "bg-[color:var(--color-navy)]",
  violet: "bg-[color:var(--color-violet)]",
  success: "bg-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning)]",
  error: "bg-[color:var(--color-error)]",
  cyan: "bg-[color:var(--color-cyan)]",
};

export function Kpi({ label, value, icon, iconBg = "brand", trend, meta, className }: KpiProps) {
  return (
    <div
      className={cn(
        "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-[14px] p-5",
        "transition-all hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-medium text-[color:var(--color-text-secondary)]">{label}</div>
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-[10px] flex items-center justify-center text-white",
              iconBgs[iconBg],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className="text-3xl font-bold -tracking-[0.025em] leading-none mb-2 text-[color:var(--color-text-primary)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-secondary)]">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-full text-[11px]",
              trend.direction === "up" && "bg-[color:var(--color-success-bg)] text-[color:var(--color-success)]",
              trend.direction === "down" && "bg-[color:var(--color-error-bg)] text-[color:var(--color-error)]",
              trend.direction === "flat" && "bg-[color:var(--color-bg)] text-[color:var(--color-text-secondary)]",
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
        )}
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}
