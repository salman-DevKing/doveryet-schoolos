import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Root routes users to the right portal based on their role.
 * Unauthenticated users land at /login.
 */
export default async function HomePage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin/dashboard");
    case "SCHOOL_ADMIN":
    case "ACCOUNTANT":
      redirect("/admin/dashboard");
    case "TEACHER":
      redirect("/teacher/dashboard");
    case "PARENT":
      redirect("/parent/dashboard");
    default:
      redirect("/login");
  }
}
