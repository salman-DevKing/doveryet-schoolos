"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number | string;
  exact?: boolean;
}

interface SidebarProps {
  schoolName: string;
  subtitle: string;
  logoUrl?: string;
  groups: NavGroup[];
  footer?: ReactNode;
}

export function Sidebar({
  schoolName,
  subtitle,
  logoUrl = "/doveryet-logo.jpg",
  groups,
  footer,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-screen flex flex-col bg-[color:var(--color-surface)] border-r border-[color:var(--color-border)] overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3 p-5 border-b border-[color:var(--color-border)]">
        <Image
          src={logoUrl}
          alt="School logo"
          width={36}
          height={36}
          className="rounded-[8px] object-cover shrink-0"
          priority
        />
        <div className="min-w-0">
          <div
            className="font-bold text-[15px] text-[color:var(--color-navy)] -tracking-[0.01em] truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {schoolName}
          </div>
          <div className="text-[11px] text-[color:var(--color-text-tertiary)] uppercase tracking-wider font-medium">
            {subtitle}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group, i) => (
          <div key={i} className="mb-5">
            {group.label && (
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[color:var(--color-text-tertiary)]">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all mb-0.5",
                    active
                      ? "bg-[color:var(--color-info-bg)] text-[color:var(--color-brand-blue)] font-semibold"
                      : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-navy)]",
                  )}
                >
                  {active && (
                    <span className="absolute -left-[11px] top-2.5 bottom-2.5 w-[3px] bg-gradient-brand rounded-full" />
                  )}
                  <span className="shrink-0 opacity-85">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        active
                          ? "bg-[color:var(--color-brand-blue)] text-white"
                          : "bg-[color:var(--color-bg)] text-[color:var(--color-text-secondary)]",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[color:var(--color-border)] text-xs text-[color:var(--color-text-tertiary)] flex items-center gap-2">
        {footer ?? (
          <>
            <Zap size={12} /> Powered by Doveryet Technologies
          </>
        )}
      </div>
    </aside>
  );
}
