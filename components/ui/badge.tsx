import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "error" | "info" | "neutral" | "violet";

const variants: Record<Variant, string> = {
  success: "bg-[color:var(--color-success-bg)] text-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning-bg)] text-[color:var(--color-warning)]",
  error: "bg-[color:var(--color-error-bg)] text-[color:var(--color-error)]",
  info: "bg-[color:var(--color-info-bg)] text-[color:var(--color-brand-blue)]",
  neutral: "bg-[color:var(--color-bg)] text-[color:var(--color-text-secondary)]",
  violet: "bg-[color:var(--color-violet-bg)] text-[color:var(--color-violet)]",
};

interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", dot = true, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight",
        variants[variant],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
