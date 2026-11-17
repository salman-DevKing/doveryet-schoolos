# Build Roadmap — Doveryet SchoolOS

6 milestones, sequenced so each one unlocks the next. Each milestone is **shippable** — you can deploy after completing it and have something real schools can use.

Target: production-ready SaaS for your first 10 pilot schools. Estimated effort: ~6–10 weeks of hands-on dev.

---

## Milestone 1 · Registration persists (Week 1)

**Goal:** School can register via the 5-step wizard. School row, subscription, admin user, logo, UPI + bank details all persist. Admin lands on their dashboard.

### Tasks
- [x] **Prisma schema** — added `School.logoUrl`, `SchoolPaymentDetails` model, `BloodGroup` enum, `BillingCycle` enum (already in this tarball)
- [x] **lib/plans.ts** — plan catalog with `quotePlan()` (already in this tarball)
- [ ] **File storage setup** — Vercel Blob or Cloudflare R2 for logo uploads. Add `lib/storage.ts`
- [ ] **Register page** (`app/(auth)/register/page.tsx`) — 5-step client wizard matching prototype
- [ ] **createSchool server action** — one atomic transaction: School + Subscription + User + AcademicYear + SchoolPaymentDetails + OnboardingTasks
- [ ] **Welcome email** — send via nodemailer on success
- [ ] **Auto sign-in + redirect** to `/admin/dashboard`

### Acceptance
- Fill in all 5 steps → school workspace exists in DB → admin logged in → sees dashboard
- Logo renders in sidebar + topbar
- `/admin/settings/payments` shows the UPI + bank details, editable
- No validation bypass possible (IFSC regex, UPI VPA regex, account confirm match)

---

## Milestone 2 · Student & parent onboarding (Week 2)

**Goal:** Admin can add students one-by-one or via bulk CSV. Parent user auto-created, sibling auto-detected.

### Tasks
- [ ] **Prisma updates** — `Student.bloodGroup` (enum), `Student.photoUrl`, `Student.motherTongue`
- [ ] **Add Student page** (`app/(admin)/students/new/page.tsx`) — form matching prototype
- [ ] **createStudent server action** — already stubbed; extend for blood group, photo, sibling detection
- [ ] **Bulk upload page** (`app/(admin)/students/bulk/page.tsx`) — CSV preview with row-level Zod validation
- [ ] **Template download endpoint** (`app/api/students/template/route.ts`) — returns .csv or .xlsx
- [ ] **Student profile page** (`app/(admin)/students/[id]/page.tsx`) — profile + linked parents + attendance + fee status
- [ ] **Welcome parent email** — SMTP email with mobile login link

### Acceptance
- Admin adds 5 students with same parent phone → parent sees all 5 in Parent App child picker
- Bulk upload rejects a row with invalid email, shows which row & which field
- Student's photo loads in parent app

---

## Milestone 3 · Parent app foundation (Week 3)

**Goal:** Parent app renders with real data. Child picker works. Home dashboard loads live stats.

### Tasks
- [ ] **Parent auth flow** — OTP via SMS (Twilio or MSG91). Alternative: password-based.
- [ ] **Parent routes** under `app/(parent)/*` with mobile-first layout
- [ ] **Child picker** — persists selection in cookie/localStorage
- [ ] **Home dashboard** — today's homework count, pending fees, attendance %, upcoming activities
- [ ] **Notifications model + feed** — Prisma `Notification` table, push events on homework/activity/leave decisions
- [ ] **PWA manifest + service worker** — installable from Chrome on Android

### Acceptance
- Parent enters mobile → OTP → child picker → home
- Switching child updates all screens
- Notifications feed shows last 10, tap routes to relevant screen

---

## Milestone 4 · Communication modules (Weeks 4–5)

**Goal:** Full parent-school communication working in-app (no WhatsApp).

### Tasks
- [ ] **Activities** — admin publish form + list; parent viewer (`app/(parent)/activities/*`)
- [ ] **Homework** — admin assign form; parent list with date filter; file attachments via Blob
- [ ] **Parent Messages** — bi-directional chat
  - [ ] Prisma: `Conversation`, `Message` models
  - [ ] Admin side: inbox + conversation view
  - [ ] Parent side: list + chat
  - [ ] Realtime: Server-Sent Events (simpler than WebSockets for v1)
- [ ] **Leave Requests** — parent submit, admin approve/reject with note, parent sees status
- [ ] **In-app notifications** — badge counts, read/unread, push via service worker

### Acceptance
- Teacher posts homework → parent gets notification in < 5s → opens it
- Parent submits leave → admin sees it in queue → approves → parent gets notification
- Parent sends message → teacher's inbox shows unread → replies → parent sees it

---

## Milestone 5 · Payments (Weeks 6–7)

**Goal:** Parent pays fees via UPI (zero fees, direct) or Razorpay. School gets reconciliation.

### Tasks
- [ ] **UPI intent URL generator** — `upi://pay?pa=<vpa>&pn=<name>&am=<amt>&tn=<invoice>`
- [ ] **One-tap buttons** — iOS/Android deep-link into GPay, PhonePe, Paytm
- [ ] **UPI reference ID capture** — parent pastes after paying → admin reconciles with one click
- [ ] **Razorpay order flow** — already stubbed in `lib/payments.ts`; wire up the checkout widget
- [ ] **Payment webhook** — `/api/webhooks/razorpay/route.ts` — idempotent capture
- [ ] **Receipt PDF** — server-side via Playwright; emailed + available in parent app
- [ ] **Auto-reconcile via bank statement API** (optional, Milestone 5b) — HDFC/Axis API subscribe to credit alerts

### Acceptance
- Parent clicks GPay → UPI app opens with amount pre-filled → pays → pastes reference → admin sees it
- Razorpay webhook fires → invoice marks paid automatically → receipt emailed
- Partial payments supported (parent pays ₹5,000 of ₹12,500 → invoice shows "₹7,500 remaining")

---

## Milestone 6 · Certificates (Week 8)

**Goal:** Admin creates branded certificates in 5 steps, parent sees them in-app.

### Tasks
- [x] **Prisma**: `Certificate`, `CertificateTemplate`, `CertificateIssue` models (already in schema)
- [ ] **Template library** — 4 React components using `@react-pdf/renderer` (NOT Playwright — won't run on Hostinger shared)
- [ ] **Certificate page** — 5-step wizard matching prototype
- [ ] **Bulk preview** — generate N certificates with same template, different student data
- [ ] **PDF generation** — `@react-pdf/renderer` via `/api/certificates/issues/[id]/pdf` streams PDF buffer
- [ ] **Signature upload** — optional signatory image to R2
- [ ] **Parent app Certificates tab** — list + tap to download/share

### Acceptance
- Admin picks template → selects whole class → enters event details → previews → generates 42 PDFs in <30s
- Parent sees certificate in-app with "Download PDF" button
- Logo and signature render correctly on PDF

---

## Milestone 7 (optional) · Super Admin ops (Week 9–10)

Everything for your Doveryet team. Lower priority since you can run manually for the first 10 schools.

- [ ] Schools table across all tenants (strict role guard)
- [ ] Billing dashboard — Doveryet's invoices to schools, dunning
- [ ] Support ticket queue
- [ ] Onboarding Kanban
- [ ] Platform-level analytics (MRR, ARR, churn)

---

## Cross-cutting concerns (handle as you go)

| Area | What to add | When |
|---|---|---|
| **File storage** | Cloudflare R2 for logos, student photos, homework attachments, certificate PDFs | Milestone 1 |
| **Transactional email** | Zoho Mail (free with your domain) via nodemailer; HTML templates for welcome, OTP, receipt | Milestone 1 |
| **SMS / OTP** | MSG91 (cheapest India) | Milestone 3 |
| **Rate limiting** | Upstash Ratelimit on auth + payment endpoints | Milestone 5 |
| **Sentry** | Error tracking | Milestone 1 |
| **Audit log** | Already in schema; wire `AuditLog.create()` into every mutation | As you go |
| **Backups** | Neon handles PITR automatically; no manual cron needed on free tier | Automatic |
| **Legal** | ToS + updated Privacy with real company info → legal review | Before first paying school |
| **Chat realtime** | Polling every 15s on Hostinger shared (SSE connections get killed). SSE only if you upgrade to VPS. | Milestone 4 |

---

## Development workflow

1. **One branch per milestone** — `milestone-1-registration`, `milestone-2-students`, etc.
2. **Deploy preview on Vercel** for each PR — test on a real phone before merging
3. **Keep the prototype running** at `prototype.doveryetschoolos.com` as the design reference; build each milestone to match it exactly
4. **Pilot with 1 school per milestone completion** — don't ship all 6 to all schools at once

---

## What's in this tarball (Milestone 1 progress)

- Extended Prisma schema with every model needed for all milestones — **MySQL provider** (Hostinger-native)
- `lib/plans.ts` — plan catalog with `quotePlan()`
- `lib/storage.ts` — R2/S3 upload helpers
- `lib/email.ts` — SMTP helper + welcome / parent-invite templates
- `lib/upi.ts` — UPI intent URL generator
- `app/(auth)/register/*` — complete 5-step wizard (logo + bank + UPI)
- `app/(auth)/register/actions.ts` — `createSchool` server action (atomic: School + Subscription + SchoolPaymentDetails + AcademicYear + User + OnboardingTasks + AuditLog)
- `app/api/webhooks/razorpay/route.ts` — signature-verified webhook
- `prisma/seed.ts` — sample data with new payment details

## MySQL-specific notes

- Array columns (`photoUrls`, `attachmentUrls`) are stored as `Json` since MySQL has no native arrays. Read as `JsonValue`, cast to `string[]` in TypeScript.
- No pooler needed — DB runs on same box as the app (`localhost:3306`).
- `prisma db push` is used instead of `migrate deploy` for fast MVP iteration. Switch to formal migrations once schema stabilizes.

Everything else is scaffolded with `// TODO` markers so you know exactly what to fill in next.

---

Powered by Doveryet Technologies.
