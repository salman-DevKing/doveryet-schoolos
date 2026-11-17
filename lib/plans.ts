/**
 * Doveryet SchoolOS — Plan catalog.
 * Single source of truth for pricing, limits and commitment-cycle discounts.
 *
 * Launch offer (Nov 2026): flat monthly pricing for small schools
 * (Mini and Starter), per-student annual for larger schools.
 *
 * Amounts are stored as PAISE (integer). ₹349 = 34900 paise.
 */

export type PlanCode = "MINI" | "STARTER" | "GROWTH" | "INSTITUTION";
export type BillingCycleMonths = 1 | 3 | 6 | 12;

export interface PlanCatalogEntry {
  code: PlanCode;
  name: string;
  tagline: string;
  /** Null = no student limit (Institution). */
  maxStudents: number | null;
  /** Whether this plan uses flat monthly pricing or per-student annual. */
  pricingModel: "flat_monthly" | "per_student_annual" | "custom";
  /** Base monthly price in paise. For per-student plans, this is per student. */
  basePricePaise: number;
  /** Is this a limited-time launch offer? */
  isLaunchOffer: boolean;
  /** WhatsApp credit allowance per billing month. */
  whatsappAllowance: number;
  features: string[];
  highlighted?: boolean;
}

/**
 * Commitment-cycle discounts. The longer the commitment, the lower the
 * effective per-month price. Discounts apply to Mini and Starter.
 */
export const CYCLE_DISCOUNTS: Record<BillingCycleMonths, { discount: number; label: string }> = {
  1: { discount: 0, label: "Monthly" },
  3: { discount: 0.10, label: "Quarterly · save 10%" },
  6: { discount: 0.15, label: "Half-yearly · save 15%" },
  12: { discount: 0.20, label: "Annual · save 20%" },
};

export const PLAN_CATALOG: Record<PlanCode, PlanCatalogEntry> = {
  MINI: {
    code: "MINI",
    name: "Mini",
    tagline: "For small schools getting started digital-first.",
    maxStudents: 29,
    pricingModel: "flat_monthly",
    basePricePaise: 34900, // ₹349
    isLaunchOffer: true,
    whatsappAllowance: 250,
    features: [
      "Up to 29 students",
      "Attendance & fees",
      "250 WhatsApp credits/month",
      "Parent portal",
      "Email support",
    ],
  },
  STARTER: {
    code: "STARTER",
    name: "Starter",
    tagline: "For schools up to 50 students, launch-priced.",
    maxStudents: 49,
    pricingModel: "flat_monthly",
    basePricePaise: 49900, // ₹499
    isLaunchOffer: true,
    whatsappAllowance: 500,
    features: [
      "Up to 49 students",
      "Everything in Mini",
      "500 WhatsApp credits/month",
      "Printable invoice & payslip templates",
      "Priority email support",
    ],
  },
  GROWTH: {
    code: "GROWTH",
    name: "Growth",
    tagline: "For established schools running full operations digitally.",
    maxStudents: 1500,
    pricingModel: "per_student_annual",
    basePricePaise: 8900, // ₹89 per student / year
    isLaunchOffer: false,
    whatsappAllowance: 2500,
    features: [
      "Up to 1,500 students",
      "Everything in Starter",
      "Payroll & payslips",
      "2,500 WhatsApp credits/month",
      "Dedicated onboarding",
      "Priority support",
    ],
    highlighted: true,
  },
  INSTITUTION: {
    code: "INSTITUTION",
    name: "Institution",
    tagline: "For multi-campus trusts and larger institutions.",
    maxStudents: null,
    pricingModel: "custom",
    basePricePaise: 0,
    isLaunchOffer: false,
    whatsappAllowance: 10000,
    features: [
      "Unlimited students",
      "Multi-campus management",
      "Custom branding (white-label)",
      "SLA + dedicated account manager",
      "Custom integrations",
      "On-site training",
    ],
  },
};

export interface PriceQuote {
  /** Effective monthly price in paise after commitment discount. */
  monthlyPaise: number;
  /** Total amount billed up-front for this cycle, in paise. */
  totalPaise: number;
  /** Savings vs monthly-cycle price, in paise. */
  savingsPaise: number;
  /** Original undiscounted monthly price (shown struck-through). */
  listMonthlyPaise: number;
}

/**
 * Compute the price for a plan, cycle and student count.
 */
export function quotePlan(
  code: PlanCode,
  cycle: BillingCycleMonths,
  studentCount: number,
): PriceQuote | null {
  const plan = PLAN_CATALOG[code];
  if (plan.pricingModel === "custom") return null;

  // Per-student annual plans have no cycle discount; they bill yearly.
  if (plan.pricingModel === "per_student_annual") {
    const annualTotal = plan.basePricePaise * studentCount;
    const monthlyEquiv = Math.round(annualTotal / 12);
    return {
      listMonthlyPaise: monthlyEquiv,
      monthlyPaise: monthlyEquiv,
      totalPaise: annualTotal,
      savingsPaise: 0,
    };
  }

  // Flat monthly plans — cycle discount applies.
  const list = plan.basePricePaise;
  const { discount } = CYCLE_DISCOUNTS[cycle];
  const discountedMonthly = Math.round(list * (1 - discount));
  const total = discountedMonthly * cycle;
  const wouldBeTotal = list * cycle;
  return {
    listMonthlyPaise: list,
    monthlyPaise: discountedMonthly,
    totalPaise: total,
    savingsPaise: wouldBeTotal - total,
  };
}

/**
 * Pick the right plan for a given student count (for recommendation / signup).
 */
export function recommendPlan(studentCount: number): PlanCode {
  if (studentCount < 30) return "MINI";
  if (studentCount < 50) return "STARTER";
  if (studentCount <= 1500) return "GROWTH";
  return "INSTITUTION";
}
