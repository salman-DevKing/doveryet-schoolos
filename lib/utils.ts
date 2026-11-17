import { clsx, type ClassValue } from "clsx";

/** Tailwind-aware class merger. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ============================================
// Money — stored as paise (integer), displayed in rupees
// ============================================

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(paise: number, precise = false): string {
  const rupees = paiseToRupees(paise);
  return precise ? inrPrecise.format(rupees) : inr.format(rupees);
}

/** Compact Indian-notation lakh / crore. */
export function formatINRCompact(paise: number): string {
  const r = paiseToRupees(paise);
  if (r >= 1_00_00_000) return `₹${(r / 1_00_00_000).toFixed(2)} Cr`;
  if (r >= 1_00_000) return `₹${(r / 1_00_000).toFixed(2)} L`;
  if (r >= 1_000) return `₹${(r / 1_000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

// ============================================
// Dates
// ============================================

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / 86_400_000);
}

// ============================================
// Initials for avatars
// ============================================

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// ============================================
// IDs — human-readable business numbers
// ============================================

export function invoiceNumber(prefix: string, seq: number, year?: number): string {
  const y = (year ?? new Date().getFullYear()).toString();
  return `${prefix}-${y}-${seq.toString().padStart(5, "0")}`;
}

export function admissionNumber(seq: number, year?: number): string {
  const y = (year ?? new Date().getFullYear()).toString();
  return `ADM-${y}-${seq.toString().padStart(4, "0")}`;
}
