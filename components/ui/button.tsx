import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap border disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white border-transparent shadow-brand hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(71,117,234,0.35)]",
  secondary:
    "bg-[color:var(--color-surface)] text-[color:var(--color-navy)] border-[color:var(--color-border-strong)] hover:border-[color:var(--color-brand-blue)] hover:text-[color:var(--color-brand-blue)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-primary)] border-transparent hover:bg-[color:var(--color-bg)]",
  danger:
    "bg-[color:var(--color-surface)] text-[color:var(--color-error)] border-[color:var(--color-error)] hover:bg-[color:var(--color-error)] hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-[34px] px-4 text-[13px]",
  md: "h-[42px] px-5 text-sm",
  lg: "h-[50px] px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", href, loading, className, children, ...props }, ref) => {
    const cls = cn(base, variants[variant], sizes[size], className);

    if (href) {
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={cls} disabled={loading || props.disabled} {...props}>
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
