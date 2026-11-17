import { Download, Plus, Search, Filter, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { requireSchoolUser, scoped } from "@/lib/tenant";
import { db } from "@/lib/db";
import { formatINRCompact } from "@/lib/utils";

export const metadata = { title: "Students · Doveryet SchoolOS" };

interface SearchParams {
  q?: string;
  class?: string;
  page?: string;
}

const PAGE_SIZE = 25;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSchoolUser();
  const { q, class: classFilter, page } = await searchParams;
  const schoolId = session.user.schoolId;
  const currentPage = Math.max(1, parseInt(page ?? "1"));

  const where = scoped(schoolId, {
    isActive: true,
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { admissionNo: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(classFilter && { classId: classFilter }),
  });

  const [students, totalCount, classes] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        class: true,
        parents: { include: { parent: true }, where: { isPrimary: true }, take: 1 },
        invoices: {
          where: { status: { in: ["SENT", "PARTIAL", "OVERDUE"] } },
          select: { total: true, amountPaid: true, status: true },
        },
      },
      orderBy: [{ class: { grade: "asc" } }, { firstName: "asc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.student.count({ where }),
    db.class.findMany({
      where: scoped(schoolId, { academicYear: { isCurrent: true } }),
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      {/* Page head */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1
            className="text-[28px] font-bold -tracking-[0.025em] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Students
          </h1>
          <p className="text-[color:var(--color-text-secondary)] text-[15px]">
            {totalCount.toLocaleString("en-IN")} enrolled · {classes.length} classes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm">
            <Download size={14} /> Export CSV
          </Button>
          <Button href="/admin/students/new" size="sm">
            <Plus size={14} strokeWidth={2.5} /> Add Student
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <form className="flex gap-3 p-4 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-[14px] mb-5 items-center flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
          <input
            name="q"
            defaultValue={q}
            type="text"
            placeholder="Search by name or admission ID…"
            className="w-full h-10 pl-[42px] pr-4 bg-[color:var(--color-bg)] border border-transparent rounded-[10px] text-sm focus:bg-[color:var(--color-surface)] focus:border-[color:var(--color-brand-blue)] focus:outline-none"
          />
        </div>
        <select
          name="class"
          defaultValue={classFilter ?? ""}
          className="h-10 px-4 bg-[color:var(--color-surface)] border border-[color:var(--color-border-strong)] rounded-[10px] text-sm font-medium"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="h-10 px-4 bg-[color:var(--color-surface)] border border-[color:var(--color-border-strong)] rounded-[10px] text-sm font-medium inline-flex items-center gap-2"
        >
          Fee Status <ChevronDown size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="h-10 px-4 bg-[color:var(--color-surface)] border border-[color:var(--color-border-strong)] rounded-[10px] text-sm font-medium inline-flex items-center gap-2"
        >
          <Filter size={12} /> More filters
        </button>
      </form>

      {/* Table */}
      <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-[14px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[color:var(--color-surface-alt)] border-b border-[color:var(--color-border)]">
              <TH>Student</TH>
              <TH>Class</TH>
              <TH>Primary Parent</TH>
              <TH>Fee Status</TH>
              <TH>Admission Date</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[color:var(--color-text-secondary)] text-sm">
                  No students found.{" "}
                  <a href="/admin/students/new" className="text-[color:var(--color-brand-blue)] font-semibold">
                    Add the first one →
                  </a>
                </td>
              </tr>
            ) : (
              students.map((s) => {
                const pending = s.invoices.reduce(
                  (sum, inv) => sum + (inv.total - inv.amountPaid),
                  0,
                );
                const overdue = s.invoices.some((inv) => inv.status === "OVERDUE");
                const parent = s.parents[0]?.parent;
                const fullName = `${s.firstName} ${s.lastName ?? ""}`.trim();

                return (
                  <tr
                    key={s.id}
                    className="border-b border-[color:var(--color-border)] last:border-0 hover:bg-[color:var(--color-surface-alt)] transition-colors"
                  >
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName} colorKey={s.id} />
                        <div>
                          <div className="font-semibold">{fullName}</div>
                          <div className="text-[11px] text-[color:var(--color-text-tertiary)] font-medium mt-0.5">
                            {s.admissionNo}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>{s.class?.name ?? "—"}</TD>
                    <TD>
                      {parent ? (
                        <>
                          <div className="font-medium">{parent.name}</div>
                          <div className="text-[11px] text-[color:var(--color-text-tertiary)] mt-0.5">
                            {parent.phone ?? parent.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-[color:var(--color-text-tertiary)]">—</span>
                      )}
                    </TD>
                    <TD>
                      {pending === 0 ? (
                        <Badge variant="success">Paid in full</Badge>
                      ) : overdue ? (
                        <Badge variant="error">Overdue {formatINRCompact(pending)}</Badge>
                      ) : (
                        <Badge variant="warning">Due {formatINRCompact(pending)}</Badge>
                      )}
                    </TD>
                    <TD>
                      {new Date(s.admissionDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TD>
                    <TD>
                      <button className="w-8 h-8 rounded-[8px] inline-flex items-center justify-center text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-bg)] hover:text-[color:var(--color-navy)]">
                        <MoreHorizontal size={16} />
                      </button>
                    </TD>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[color:var(--color-border)] text-sm text-[color:var(--color-text-secondary)]">
            <div>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString("en-IN")}
            </div>
            <div className="flex gap-1">
              {currentPage > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...(q && { q }), ...(classFilter && { class: classFilter }), page: String(currentPage - 1) })}`}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg)]"
                >
                  ←
                </a>
              )}
              <span className="px-3 h-8 inline-flex items-center">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <a
                  href={`?${new URLSearchParams({ ...(q && { q }), ...(classFilter && { class: classFilter }), page: String(currentPage + 1) })}`}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg)]"
                >
                  →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)] whitespace-nowrap">
      {children}
    </th>
  );
}

function TD({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4 text-sm text-[color:var(--color-text-primary)] align-middle">{children}</td>;
}
