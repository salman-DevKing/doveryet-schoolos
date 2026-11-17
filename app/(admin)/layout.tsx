import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { adminNavGroups } from "@/components/layouts/admin-nav";
import { getCurrentSchool, requireSchoolUser } from "@/lib/tenant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSchoolUser();
  const school = await getCurrentSchool();

  return (
    <div className="h-screen grid grid-cols-[260px_1fr] overflow-hidden">
      <Sidebar
        schoolName={school.name}
        subtitle={school.subscription?.plan ?? "SchoolOS"}
        logoUrl={school.logoUrl ?? "/doveryet-logo.jpg"}
        groups={adminNavGroups}
      />
      <div className="flex flex-col overflow-hidden">
        <Topbar
          academicYear={school.currentAcademicYear?.name ?? ""}
          user={{ name: session.user.name ?? "User", image: session.user.image }}
          statusBadge={
            school.subscription && (
              <Badge variant="success">
                {school.subscription.plan} · {school.status.toLowerCase()}
              </Badge>
            )
          }
          notificationCount={3}
        />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
