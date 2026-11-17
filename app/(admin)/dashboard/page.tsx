import { Users, CheckSquare, Receipt, AlertCircle, MessageCircle, Plus, Calendar } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { requireSchoolUser } from "@/lib/tenant";
import { formatINRCompact, formatDate, daysBetween } from "@/lib/utils";
import { getDashboardData } from "./queries";

export const metadata = { title: "Dashboard · Doveryet SchoolOS" };

export default async function AdminDashboardPage() {
  const session = await requireSchoolUser();
  const d = await getDashboardData(session.user.schoolId);

  const greeting = session.user.name?.split(" ")[0] ?? "there";
  const pendingTitle = `${d.pendingReminders.length} pending fee follow-ups`;

  return (
    <>
      {/* Page head */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold -tracking-[0.025em] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Good morning, <span className="text-gradient-brand">{greeting}</span>
        </h1>
        <p className="text-[color:var(--color-text-secondary)] text-[15px]">
          {pendingTitle} · {d.subscription?.whatsappAllowance ?
            `${d.subscription.whatsappUsed} / ${d.subscription.whatsappAllowance} WhatsApp credits used this cycle`
            : "WhatsApp allowance not configured"}
        </p>
      </div>

      {/* Welcome banner */}
      <div className="bg-gradient-navy rounded-[20px] px-8 py-6 text-white flex items-center justify-between gap-6 mb-8 relative overflow-hidden flex-wrap">
        <div
          className="absolute -top-[50px] -right-[50px] w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(71,117,234,0.3), transparent 70%)" }}
        />
        <div className="relative z-10 max-w-[540px]">
          <h2 className="text-white font-semibold text-xl mb-2">Here's what needs you today</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            {d.pendingFees > 0
              ? `${formatINRCompact(d.pendingFees)} outstanding across ${d.pendingFeeStudents} students. Send WhatsApp reminders in one click to collect faster.`
              : "No overdue fees — everything looks on track today."}
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Button href="/admin/attendance" variant="secondary" size="sm" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/15">
            View schedule
          </Button>
          <Button href="/admin/fees" size="sm">
            Resolve now
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <Kpi
          label="Total Students"
          value={d.totalStudents.toLocaleString("en-IN")}
          icon={<Users size={18} />}
          iconBg="brand"
          meta="active enrollments"
        />
        <Kpi
          label="Today's Attendance"
          value={`${d.attendanceRate.toFixed(1)}%`}
          icon={<CheckSquare size={18} strokeWidth={2.5} />}
          iconBg="success"
          meta={`${d.presentToday} / ${d.totalMarkedToday} marked`}
        />
        <Kpi
          label="Fees Collected (This Month)"
          value={formatINRCompact(d.collectedThisMonth)}
          icon={<Receipt size={18} />}
          iconBg="violet"
          meta="auto-reconciled from Razorpay"
        />
        <Kpi
          label="Pending Fees"
          value={formatINRCompact(d.pendingFees)}
          icon={<AlertCircle size={18} />}
          iconBg="warning"
          trend={d.pendingFeeStudents > 0 ? { direction: "down", value: `${d.pendingFeeStudents} students` } : undefined}
          meta="overdue"
        />
      </div>

      {/* Reminders + Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader
            title="Pending Fee Reminders"
            action={<Button href="/admin/fees" variant="ghost" size="sm">See all →</Button>}
          />
          <CardBody className="!p-3">
            {d.pendingReminders.length === 0 ? (
              <div className="p-8 text-center text-[color:var(--color-text-secondary)] text-sm">
                All caught up — no pending reminders.
              </div>
            ) : (
              <>
                {d.pendingReminders.map((inv) => {
                  const overdueDays = daysBetween(new Date(), new Date(inv.dueDate));
                  const isOverdue = new Date(inv.dueDate) < new Date();
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-[10px] hover:bg-[color:var(--color-bg)] cursor-pointer"
                    >
                      <Avatar name={`${inv.student.firstName} ${inv.student.lastName ?? ""}`} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[color:var(--color-text-primary)] text-sm truncate">
                          {inv.student.firstName} {inv.student.lastName}
                        </div>
                        <div className="text-xs text-[color:var(--color-text-secondary)] flex gap-2 mt-0.5">
                          <span>{inv.student.class?.name ?? "—"}</span>
                          <span>·</span>
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="font-bold text-[color:var(--color-navy)] text-sm"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {formatINRCompact(inv.total - inv.amountPaid)}
                        </div>
                        <div
                          className={`text-[11px] font-semibold mt-0.5 ${
                            isOverdue
                              ? "text-[color:var(--color-error)]"
                              : "text-[color:var(--color-warning)]"
                          }`}
                        >
                          {isOverdue ? `${overdueDays} days overdue` : `due in ${overdueDays} days`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 pt-2">
                  <Button className="w-full" size="sm">
                    <MessageCircle size={14} /> Send All WhatsApp Reminders
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Payments"
            action={<Badge variant="info">Live</Badge>}
          />
          <CardBody className="!p-6 !pt-2">
            {d.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-[color:var(--color-text-secondary)] text-sm">
                No payments yet.
              </div>
            ) : (
              d.recentActivity.map((payment) => (
                <div
                  key={payment.id}
                  className="flex gap-3 py-3 border-b border-[color:var(--color-border)] last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[color:var(--color-success-bg)] text-[color:var(--color-success)] flex items-center justify-center shrink-0">
                    <CheckSquare size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[color:var(--color-text-primary)] leading-snug">
                      <b>
                        {payment.invoice?.student.firstName} {payment.invoice?.student.lastName}
                      </b>{" "}
                      paid {formatINRCompact(payment.amount)} · {payment.method}
                    </div>
                    <div className="text-xs text-[color:var(--color-text-tertiary)] mt-0.5">
                      {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-semibold">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          href="/admin/students/new"
          label="Add Student"
          sub="Enroll a new student"
          icon={<Plus size={18} />}
          color="brand"
        />
        <QuickAction
          href="/admin/fees/new"
          label="Create Invoice"
          sub="Generate a fee invoice"
          icon={<Receipt size={18} />}
          color="violet"
        />
        <QuickAction
          href="/admin/announcements/new"
          label="Send Announcement"
          sub="Broadcast to parents"
          icon={<MessageCircle size={18} />}
          color="success"
        />
        <QuickAction
          href="/admin/payroll"
          label="Run Payroll"
          sub="Current cycle"
          icon={<Calendar size={18} />}
          color="navy"
        />
      </div>
    </>
  );
}

function QuickAction({
  href,
  label,
  sub,
  icon,
  color,
}: {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: "brand" | "violet" | "success" | "navy";
}) {
  const bgs = {
    brand: "bg-gradient-brand",
    violet: "bg-[color:var(--color-violet)]",
    success: "bg-[color:var(--color-success)]",
    navy: "bg-[color:var(--color-navy)]",
  };
  return (
    <a
      href={href}
      className="p-5 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-[14px] flex flex-col gap-3 transition-all hover:border-[color:var(--color-brand-blue)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px"
    >
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-white ${bgs[color]}`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-[color:var(--color-text-secondary)] mt-0.5">{sub}</div>
      </div>
    </a>
  );
}
