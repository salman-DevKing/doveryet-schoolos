import { auth } from "./auth";
import { db } from "./db";
import { redirect } from "next/navigation";

/**
 * Returns the authenticated session, redirects to /login if none.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/**
 * Returns the authenticated school user (any school-scoped role).
 * Guarantees session.user.schoolId is non-null.
 */
export async function requireSchoolUser() {
  const session = await requireSession();
  if (!session.user.schoolId) redirect("/login");
  return session as typeof session & { user: { schoolId: string } };
}

/**
 * Returns the Doveryet super-admin session (platform level).
 */
export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") redirect("/");
  return session;
}

/**
 * Fetches the current school with its subscription and current academic year.
 * Scoped to the user's tenant. Throws if the school doesn't exist.
 */
export async function getCurrentSchool() {
  const session = await requireSchoolUser();
  const school = await db.school.findUnique({
    where: { id: session.user.schoolId },
    include: {
      subscription: true,
      academicYears: { where: { isCurrent: true }, take: 1 },
    },
  });
  if (!school) redirect("/login");
  return {
    ...school,
    currentAcademicYear: school.academicYears[0] ?? null,
  };
}

/**
 * Scoped where clause helper. Every tenant-level query should include this.
 *
 *   await db.student.findMany({ where: scoped(schoolId, { isActive: true }) })
 */
export function scoped<T extends Record<string, unknown>>(
  schoolId: string,
  where: T = {} as T,
): T & { schoolId: string } {
  return { ...where, schoolId };
}
