import { Mail, Lock, Check, Zap } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Doveryet SchoolOS" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="bg-gradient-navy text-white p-10 flex flex-col justify-between relative overflow-hidden">
        <div
          className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(71,117,234,0.3), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-[200px] -left-[100px] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(19,181,209,0.25), transparent 70%)" }}
        />

        <div className="relative z-10">
          <BrandLogo variant="dark" />
        </div>

        <div className="relative z-10 max-w-md">
          <h1
            className="text-white text-[40px] leading-[1.1] -tracking-[0.025em] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The calm school management workspace.
          </h1>
          <p className="text-white/75 text-lg leading-relaxed mb-8">
            Attendance, fees, WhatsApp, payroll and parent communication — one platform your admins actually enjoy.
          </p>
          <ul className="space-y-3">
            {[
              "Mark attendance in seconds, auto-notify parents on absences",
              "WhatsApp fee reminders that go out while you sleep",
              "Printable invoices and payslips, on your brand",
              "Parent portal — no app install required",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/85">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(71, 117, 234, 0.3)", color: "var(--color-cyan)" }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-white/50 text-sm flex items-center gap-2">
          <Zap size={14} className="text-[color:var(--color-cyan)]" />
          Powered by Doveryet Technologies
        </div>
      </div>

      {/* Form side */}
      <div className="p-10 flex items-center justify-center">
        <div className="w-full max-w-[420px]">
          <h2
            className="text-3xl -tracking-[0.025em] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back
          </h2>
          <p className="text-[color:var(--color-text-secondary)] mb-8 text-[15px]">
            Sign in to your school workspace to continue.
          </p>

          <LoginForm />

          <div className="text-center mt-10 text-xs text-[color:var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
            <Zap size={10} /> Powered by Doveryet Technologies
          </div>
        </div>
      </div>
    </div>
  );
}
