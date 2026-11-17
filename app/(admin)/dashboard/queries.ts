import { db } from "@/lib/db";
import { startOfDay, endOfDay, subMonths, startOfMonth } from "date-fns";

/**
 * All data a School Admin dashboard needs, scoped to one tenant.
 * One function because the dashboard renders once; batch the queries.
 */
export async function getDashboardData(schoolId: string) {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));

  const [
    totalStudents,
    todayAttendance,
    collectedThisMonth,
    pendingFees,
    pendingReminders,
    recentActivity,
    subscription,
  ] = await Promise.all([
    db.student.count({ where: { schoolId, isActive: true } }),

    db.attendance.groupBy({
      by: ["status"],
      where: { student: { schoolId }, date: { gte: todayStart, lte: todayEnd } },
      _count: true,
    }),

    db.payment.aggregate({
      where: {
        schoolId,
        status: "CAPTURED",
        paidAt: { gte: monthStart, lte: today },
      },
      _sum: { amount: true },
    }),

    db.invoice.aggregate({
      where: {
        schoolId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),

    db.invoice.findMany({
      where: {
        schoolId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        student: { include: { class: true } },
      },
    }),

    // Recent activity: last 10 attendance + payment + leave events
    db.payment.findMany({
      where: { schoolId, status: "CAPTURED" },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: {
        invoice: { include: { student: true } },
      },
    }),

    db.subscription.findUnique({ where: { schoolId } }),
  ]);

  const presentCount = todayAttendance.find((a) => a.status === "PRESENT")?._count ?? 0;
  const totalMarked = todayAttendance.reduce((sum, a) => sum + a._count, 0);
  const attendanceRate = totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0;

  const pendingTotal = (pendingFees._sum.total ?? 0) - (pendingFees._sum.amountPaid ?? 0);

  return {
    totalStudents,
    attendanceRate,
    presentToday: presentCount,
    totalMarkedToday: totalMarked,
    collectedThisMonth: collectedThisMonth._sum.amount ?? 0,
    pendingFees: pendingTotal,
    pendingFeeStudents: pendingFees._count,
    pendingReminders,
    recentActivity,
    subscription,
  };
}
