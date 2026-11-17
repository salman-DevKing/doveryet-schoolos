"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadSchoolLogo } from "@/lib/storage";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";
import { quotePlan, type PlanCode, type BillingCycleMonths } from "@/lib/plans";
import type { BillingCycle } from "@prisma/client";

// ============================================
// Validation schema
// ============================================

const schema = z.object({
  // Step 1 — School
  schoolName: z.string().min(2, "School name required"),
  schoolType: z.string().min(1),
  schoolBoard: z.string().optional(),
  schoolCity: z.string().min(2),
  schoolState: z.string().min(2),
  schoolEstYear: z.coerce.number().optional(),
  schoolStrength: z.coerce.number().min(1).max(20000),
  schoolAddress: z.string().optional(),
  // logo handled as File separately

  // Step 2 — Admin account
  adminName: z.string().min(2),
  adminRole: z.string().min(1),
  adminEmail: z.string().email(),
  adminPhone: z.string().min(10),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  gstin: z.string().optional(),

  // Step 3 — Plan
  plan: z.enum(["MINI", "STARTER", "GROWTH", "INSTITUTION"]),
  cycleMonths: z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v), "Invalid cycle"),

  // Step 4 — Payment Setup
  collectionMode: z.enum(["UPI_ONLY", "BOTH"]),
  upiVpa: z.string().regex(/^[\w.\-]+@[\w\-]+$/, "Invalid UPI ID"),
  upiPhone: z.string().min(10),
  bankAccountHolder: z.string().min(2),
  bankName: z.string().min(2),
  bankBranch: z.string().optional(),
  bankAccountNumber: z.string().min(9).max(18),
  bankAccountConfirm: z.string(),
  bankIfsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  bankAccountType: z.enum(["Current", "Savings", "Trust / Society", "Nidhi"]).default("Savings"),

  // Agreements
  agreeTos: z.literal("on"),
});

export type RegisterFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

// ============================================
// Main server action
// ============================================

export async function createSchool(
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  // 1. Parse non-file fields
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0]?.toString() ?? "unknown", i.message]),
      ),
    };
  }
  const d = parsed.data;

  if (d.bankAccountNumber !== d.bankAccountConfirm) {
    return { ok: false, error: "Bank account numbers do not match." };
  }

  // 2. Logo file
  const logoFile = formData.get("schoolLogo");
  if (!(logoFile instanceof File) || logoFile.size === 0) {
    return { ok: false, error: "School logo is required." };
  }

  // 3. Uniqueness checks
  const existingUser = await db.user.findUnique({ where: { email: d.adminEmail.toLowerCase() } });
  if (existingUser) {
    return {
      ok: false,
      error: "An account with this email already exists. Please sign in instead.",
      fieldErrors: { adminEmail: "Already registered" },
    };
  }

  // 4. Generate unique slug
  const baseSlug = d.schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  let slug = baseSlug;
  let suffix = 0;
  while (await db.school.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  // 5. Upload logo to Blob storage
  let logoUrl: string;
  try {
    logoUrl = await uploadSchoolLogo(slug, logoFile);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Logo upload failed: ${err.message}`
          : "Logo upload failed. Please try a different file.",
    };
  }

  // 6. Calculate plan pricing
  const cycle = d.cycleMonths as BillingCycleMonths;
  const quote = quotePlan(d.plan as PlanCode, cycle, d.schoolStrength);
  const billingCycleEnum: BillingCycle =
    cycle === 1 ? "MONTHLY" : cycle === 3 ? "QUARTERLY" : cycle === 6 ? "HALF_YEARLY" : "ANNUAL";
  const isLaunch = d.plan === "MINI" || d.plan === "STARTER";

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const renewsAt = new Date(now);
  renewsAt.setMonth(renewsAt.getMonth() + cycle);

  // 7. Current academic year — Indian AY is Jun–May
  const ayStart = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const ayName = `AY ${ayStart}–${(ayStart + 1).toString().slice(-2)}`;
  const ayStartDate = new Date(ayStart, 5, 1); // 1 Jun
  const ayEndDate = new Date(ayStart + 1, 4, 31); // 31 May

  // 8. Hash password
  const passwordHash = await bcrypt.hash(d.adminPassword, 10);

  // 9. One atomic transaction — all or nothing
  await db.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        slug,
        name: d.schoolName,
        city: d.schoolCity,
        state: d.schoolState,
        logoUrl,
        schoolType: d.schoolType,
        board: d.schoolBoard,
        establishedYear: d.schoolEstYear,
        gstin: d.gstin,
        address: d.schoolAddress,
        phone: d.adminPhone,
        email: d.adminEmail.toLowerCase(),
        status: "TRIAL",
        trialEndsAt,
        onboardingStage: "SIGNED_UP",
      },
    });

    await tx.subscription.create({
      data: {
        schoolId: school.id,
        plan: d.plan,
        billingCycle: billingCycleEnum,
        studentCount: d.schoolStrength,
        monthlyPricePaise: quote ? quote.monthlyPaise : 0,
        pricePerStudentPaise: d.plan === "GROWTH" ? 8900 : 0,
        cycleTotalPaise: quote ? quote.totalPaise : 0,
        isLaunchOffer: isLaunch,
        launchOfferLockedUntil: isLaunch ? new Date("2027-12-31") : null,
        whatsappAllowance: 0, // deprecated — we use in-app notifications now
        billingCycleAnchor: now,
        renewsAt,
      },
    });

    await tx.schoolPaymentDetails.create({
      data: {
        schoolId: school.id,
        collectionMode: d.collectionMode,
        upiVpa: d.upiVpa,
        upiPhone: d.upiPhone,
        bankAccountHolder: d.bankAccountHolder,
        bankName: d.bankName,
        bankBranch: d.bankBranch,
        bankAccountNumber: d.bankAccountNumber,
        bankIfsc: d.bankIfsc.toUpperCase(),
        bankAccountType: d.bankAccountType,
      },
    });

    await tx.academicYear.create({
      data: {
        schoolId: school.id,
        name: ayName,
        startDate: ayStartDate,
        endDate: ayEndDate,
        isCurrent: true,
      },
    });

    await tx.user.create({
      data: {
        email: d.adminEmail.toLowerCase(),
        name: d.adminName,
        phone: d.adminPhone,
        role: "SCHOOL_ADMIN",
        schoolId: school.id,
        passwordHash,
        emailVerified: now, // Auto-verify on registration
      },
    });

    // Default onboarding playbook tasks
    const playbookTasks: { stage: Parameters<typeof tx.onboardingTask.create>[0]["data"]["stage"]; title: string; order: number }[] = [
      { stage: "SIGNED_UP", title: "Welcome call booked", order: 1 },
      { stage: "KYC_CONTRACT", title: "GSTIN & PAN verified", order: 2 },
      { stage: "KYC_CONTRACT", title: "UPI mandate activated", order: 3 },
      { stage: "DATA_IMPORT", title: "Student master imported", order: 4 },
      { stage: "DATA_IMPORT", title: "Fee structure configured", order: 5 },
      { stage: "TRAINING", title: "Admin training session", order: 6 },
      { stage: "TRAINING", title: "Teacher training session", order: 7 },
      { stage: "LIVE", title: "First attendance marked", order: 8 },
      { stage: "LIVE", title: "First fee cycle issued", order: 9 },
    ];

    await tx.onboardingTask.createMany({
      data: playbookTasks.map((t) => ({ schoolId: school.id, stage: t.stage, title: t.title, order: t.order })),
    });

    // Audit
    await tx.auditLog.create({
      data: {
        schoolId: school.id,
        action: "school.register",
        entity: "School",
        entityId: school.id,
        changes: {
          plan: d.plan,
          cycle: billingCycleEnum,
          strength: d.schoolStrength,
          isLaunchOffer: isLaunch,
        },
      },
    });
  });

  // 10. Send welcome email (fire-and-forget; don't block registration on SMTP failure)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://schoolos.doveryet.com";
  sendEmail({
    to: d.adminEmail,
    subject: `Welcome to SchoolOS — Let's add your first students`,
    html: welcomeEmailHtml({
      schoolName: d.schoolName,
      adminName: d.adminName,
      dashboardUrl: `${appUrl}/admin/dashboard`,
      addStudentUrl: `${appUrl}/admin/students/new`,
      csmName: "Almas",
    }),
  }).catch((err) => console.error("Welcome email failed:", err));

  // 11. Auto sign-in
  try {
    await signIn("credentials", {
      email: d.adminEmail.toLowerCase(),
      password: d.adminPassword,
      redirectTo: "/admin/dashboard",
    });
  } catch (err) {
    // Next.js throws NEXT_REDIRECT on success — let it propagate
    throw err;
  }

  return { ok: true };
}
