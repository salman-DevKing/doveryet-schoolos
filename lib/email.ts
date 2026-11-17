/**
 * Email sending via SMTP (nodemailer).
 * Works with Zoho, Resend, Postmark, Google Workspace.
 */

import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: parseInt(process.env.SMTP_PORT ?? "587") === 465,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(opts: EmailOptions) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM ?? "SchoolOS <no-reply@doveryet.com>",
    ...opts,
  });
}

// ============================================
// Templates
// ============================================

export function welcomeEmailHtml(args: {
  schoolName: string;
  adminName: string;
  dashboardUrl: string;
  addStudentUrl: string;
  csmName: string;
}): string {
  // See prototype/welcome-email.html for the full design — this is a condensed inline version.
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#F5F8FD;padding:40px 24px;margin:0;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(20,33,61,0.08);overflow:hidden;">
    <div style="padding:40px 48px 0;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#94A0B6;text-transform:uppercase;">YOUR SCHOOL WORKSPACE IS LIVE</div>
      <h1 style="color:#14213D;font-size:28px;margin:20px 0 14px;">Welcome, ${args.adminName} 👋</h1>
      <p style="color:#17233D;font-size:15px;line-height:1.6;">
        Thank you for registering <b>${args.schoolName}</b> on Doveryet SchoolOS. Your workspace is ready, and your onboarding specialist <b>${args.csmName}</b> will call you within 24 hours.
      </p>
    </div>
    <div style="margin:28px 48px;padding:24px 28px;background:linear-gradient(135deg,#14213D,#243758);color:#fff;border-radius:14px;">
      <div style="font-weight:700;font-size:18px;margin-bottom:8px;">Add your first students</div>
      <div style="font-size:14px;opacity:0.8;margin-bottom:18px;">Attendance, fee reminders and parent chat all come alive once students are added.</div>
      <a href="${args.addStudentUrl}" style="display:inline-block;padding:12px 22px;background:#fff;color:#14213D;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">Open Add Student Page →</a>
    </div>
    <div style="padding:0 48px 32px;color:#17233D;font-size:14px;line-height:1.6;">
      <p>If anything is unclear, reply to this email — we're here to help.</p>
      <p>— <b>${args.csmName}</b><br><span style="color:#68758A;font-size:13px;">Customer Success Manager · Doveryet Technologies</span></p>
    </div>
    <div style="padding:20px 48px;background:#FAFBFE;border-top:1px solid #E5EAF3;text-align:center;font-size:12px;color:#94A0B6;">
      Doveryet Technologies · Tamil Nadu, India<br>
      <a href="${args.dashboardUrl.replace("/admin/dashboard","/privacy")}" style="color:#4775EA;">Privacy Policy</a>
    </div>
  </div>
</body>
</html>`;
}

export function parentInviteHtml(args: {
  parentName: string;
  childName: string;
  schoolName: string;
  loginUrl: string;
}): string {
  return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#F5F8FD;padding:40px;">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:40px;border-radius:14px;">
  <h1 style="color:#14213D;">${args.schoolName} has invited you</h1>
  <p>Hi ${args.parentName},</p>
  <p>Your child <b>${args.childName}</b> has been added to the ${args.schoolName} workspace on Doveryet SchoolOS.</p>
  <p>Open the Parent App to see attendance, homework, fees and chat with teachers:</p>
  <p><a href="${args.loginUrl}" style="display:inline-block;padding:12px 22px;background:#4775EA;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Open Parent App</a></p>
  <p>Sign in with this mobile number — we'll send you a 6-digit OTP.</p>
</div></body></html>`;
}
