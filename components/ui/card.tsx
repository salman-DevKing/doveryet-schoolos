import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-[14px] shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
}

export function CardHeader({ title, action, description, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between px-6 py-5 border-b border-[color:var(--color-border)]",
        className,
      )}
      {...props}
    >
      <div>
        <h3
          className="font-semibold text-[15px] text-[color:var(--color-text-primary)] -tracking-[0.01em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[13px] text-[color:var(--color-text-secondary)] mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}
