import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface TopbarProps {
  academicYear?: string;
  user: { name: string; image?: string | null };
  statusBadge?: ReactNode;
  rightExtras?: ReactNode;
  notificationCount?: number;
}

export function Topbar({
  academicYear,
  user,
  statusBadge,
  rightExtras,
  notificationCount = 0,
}: TopbarProps) {
  return (
    <header className="h-[68px] bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] flex items-center px-8 gap-5 shrink-0">
      {academicYear && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--color-info-bg)] text-[color:var(--color-brand-blue)] rounded-[10px] text-[13px] font-semibold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
          </svg>
          {academicYear}
        </div>
      )}

      {/* Search */}
      <div className="flex-1 max-w-[440px] relative">
        <Search
          size={16}
          className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Search students, classes, invoices…"
          className="w-full h-10 pl-[42px] pr-16 bg-[color:var(--color-bg)] border border-transparent rounded-[10px] text-sm transition-all focus:bg-[color:var(--color-surface)] focus:border-[color:var(--color-brand-blue)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(71,117,234,0.1)]"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded text-[11px] text-[color:var(--color-text-tertiary)]">
          ⌘ K
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {statusBadge}
        {rightExtras}
        <button
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-navy)] relative transition-all"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[color:var(--color-error)] rounded-full border-2 border-[color:var(--color-surface)]" />
          )}
        </button>
        <Avatar name={user.name} image={user.image} size="md" />
      </div>
    </header>
  );
}
