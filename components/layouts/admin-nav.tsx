import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  UserCog,
  Receipt,
  MessageCircle,
  Megaphone,
  Calendar,
  Wallet,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";
import type { NavGroup } from "./sidebar";

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={18} />,
      },
    ],
  },
  {
    label: "Academic",
    items: [
      { href: "/admin/students", label: "Students", icon: <Users size={18} /> },
      { href: "/admin/classes", label: "Classes", icon: <BookOpen size={18} /> },
      { href: "/admin/attendance", label: "Attendance", icon: <CheckSquare size={18} /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/staff", label: "Staff", icon: <UserCog size={18} /> },
      { href: "/admin/fees", label: "Fees & Invoices", icon: <Receipt size={18} /> },
      { href: "/admin/whatsapp", label: "WhatsApp Messages", icon: <MessageCircle size={18} /> },
      { href: "/admin/homework", label: "Homework", icon: <BookOpen size={18} /> },
      { href: "/admin/announcements", label: "Announcements", icon: <Megaphone size={18} /> },
      { href: "/admin/leave", label: "Leave Management", icon: <Calendar size={18} /> },
      { href: "/admin/payroll", label: "Payroll & Payslips", icon: <Wallet size={18} /> },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: <BarChart3 size={18} /> },
      { href: "/admin/subscription", label: "Subscription", icon: <CreditCard size={18} /> },
      { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
    ],
  },
];
