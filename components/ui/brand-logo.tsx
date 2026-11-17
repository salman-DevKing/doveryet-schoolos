import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  href?: string;
  variant?: "light" | "dark";
  className?: string;
}

const sizes = {
  sm: { logo: 28, text: "text-sm" },
  md: { logo: 36, text: "text-base" },
  lg: { logo: 44, text: "text-lg" },
};

export function BrandLogo({
  size = "md",
  showName = true,
  href = "/",
  variant = "light",
  className,
}: BrandLogoProps) {
  const s = sizes[size];
  const inner = (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/doveryet-logo.jpg"
        alt="Doveryet Technologies"
        width={s.logo}
        height={s.logo}
        className="rounded-[8px] object-cover shrink-0"
        priority
      />
      {showName && (
        <span
          className={cn(
            s.text,
            "font-display font-bold whitespace-nowrap -tracking-[0.015em]",
            variant === "light" ? "text-[color:var(--color-navy)]" : "text-white",
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          Doveryet SchoolOS
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
