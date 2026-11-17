# Doveryet SchoolOS

Multi-tenant school management SaaS by [Doveryet Technologies](https://doveryet.com).

**Production setup:** Hostinger Web App Hosting + Hostinger MySQL + Cloudflare R2.

## Deploy

→ Follow [**HOSTINGER_SETUP.md**](./HOSTINGER_SETUP.md). 45 minutes from cloning this repo to `schoolos.doveryet.com` live over HTTPS.

## Build plan

→ [**BUILD_ROADMAP.md**](./BUILD_ROADMAP.md). 6 shippable milestones. Milestone 1 (Registration) is fully built; Milestones 2–6 are scaffolded with READMEs showing where to pick up.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions, standalone output
- **TypeScript** strict
- **Prisma 6** + **MySQL 8** (Hostinger-managed, localhost connection)
- **Auth.js v5** — credentials for admins, OTP for parents (Milestone 3)
- **Tailwind CSS v4** — design tokens matching the prototype 1:1
- **Cloudflare R2** — S3-compatible file storage (logos, photos, PDFs)
- **Nodemailer** — transactional email via Zoho / Resend / Postmark
- **Razorpay** — card/NetBanking payments
- **UPI intent URLs** — zero-fee direct parent payments to the school's VPA
- **`@react-pdf/renderer`** — server-side PDF generation (works on shared hosting — no Chromium needed)

## Architecture

```
Browser
   ↓ HTTPS
Hostinger Web App (Node 20, Next.js)
   ├── Hostinger MySQL (localhost:3306)  ← zero network latency, included in plan
   ├── Cloudflare R2                     ← logos, photos, attachments, PDFs
   ├── Razorpay API                       ← payment orders + webhooks
   └── Zoho SMTP                          ← transactional email
```

Multi-tenancy: shared DB, `schoolId` discriminator on every tenant table, enforced via `lib/tenant.ts` helpers.

## Repository

```
app/
  (auth)/
    login/               ✅ Branded split sign-in
    register/            ✅ 5-step wizard w/ logo + payment details
  (admin)/               School Admin portal
    dashboard/           ✅ Live KPIs from DB
    students/            ✅ List; new/, bulk/, [id]/ = Milestone 2
    activities/          ⏳ Milestone 4
    homework/            ⏳ Milestone 4
    messages/            ⏳ Milestone 4
    leave/               ⏳ Milestone 4
    certificates/        ⏳ Milestone 6
    settings/payments/   ⏳ Milestone 1 continuation
  (parent)/              ⏳ Milestone 3 — mobile-first parent app
  (super-admin)/         ⏳ Milestone 7
  api/
    auth/[...]           ✅ Auth.js handlers
    health/              ✅ Uptime ping
    students/template/   ✅ CSV template download
    webhooks/razorpay/   ✅ Razorpay webhook (signature-verified)
components/
  ui/                    ✅ BrandLogo, Button, Badge, Card, Kpi, Avatar
  layouts/               ✅ Sidebar, Topbar
lib/
  db.ts                  ✅ Prisma singleton (Neon-friendly)
  auth.ts                ✅ Auth.js config + role guards
  tenant.ts              ✅ requireSchoolUser(), scoped()
  utils.ts               ✅ formatINR, dates, initials
  plans.ts               ✅ Plan catalog + quotePlan()
  storage.ts             ✅ Dual-provider: Vercel Blob | R2 | S3
  email.ts               ✅ SMTP + welcome/invite HTML templates
  upi.ts                 ✅ UPI intent URL generator (GPay/PhonePe/Paytm)
  payments.ts            ✅ Razorpay order + webhook verification
prisma/
  schema.prisma          ✅ 38 tables across all milestones
  seed.ts                ✅ Riverside sample tenant
HOSTINGER_SETUP.md       ✅ Production deploy guide
BUILD_ROADMAP.md         ✅ 6-milestone plan
```

## Local development

```bash
# 1. Node 20+
node --version

# 2. Install
npm install

# 3. MySQL — easiest via Docker
docker run -d --name schoolos-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=schoolos \
  -e MYSQL_USER=schoolos \
  -e MYSQL_PASSWORD=schoolos \
  -p 3306:3306 mysql:8

# 4. Env
cp .env.example .env
# Set DATABASE_URL="mysql://schoolos:schoolos@localhost:3306/schoolos"
# Set AUTH_SECRET=$(openssl rand -base64 32)
# Leave R2/Razorpay/SMTP blank for local

# 5. Schema + seed
npm run db:push
npm run db:seed

# 6. Dev server
npm run dev   # → http://localhost:3000
```

### Seed logins (local only — NEVER run seed in production)

| Role          | Email                      | Password          |
|---------------|----------------------------|-------------------|
| Super Admin   | `salman@doveryet.com`      | `doveryet-admin`  |
| Super Admin   | `almas@doveryet.com`       | `doveryet-csm`    |
| Super Admin   | `asrar@doveryet.com`       | `doveryet-tech`   |
| School Admin  | `admin@riverside.edu`      | `admin123`        |
| Teacher       | `priya@riverside.edu`      | `teacher123`      |
| Parent        | `parent-0@riverside.edu`   | `parent123`       |

## Scripts

```bash
npm run dev          # Local dev server
npm run build        # Prod build — runs prisma generate + migrate deploy + next build
npm run start        # Production start (respects $PORT)
npm run db:push      # Dev — sync schema without migration file
npm run db:migrate   # Dev — create a new migration
npm run db:deploy    # Prod — apply pending migrations (used in build)
npm run db:seed      # Dev only — sample data
npm run db:studio    # Browse data via Prisma Studio
npm run typecheck    # tsc --noEmit
```

## Payments — two paths

### 1. UPI direct (zero fees)
`lib/upi.ts` generates `upi://pay?pa=...` intent URLs. Parent taps GPay button → UPI app opens with VPA + amount + note pre-filled. Parent pastes reference ID → admin reconciles.

### 2. Razorpay (card / NetBanking / UPI via gateway — 0.4–2% fee)
`lib/payments.ts` creates orders. Webhook captures payments atomically into `Payment` + updates `Invoice.amountPaid`.

School's own UPI VPA + bank account are collected at registration (Step 4 of the wizard) and stored in `SchoolPaymentDetails`.

## In-app parent communication

As of Milestone 3+, parent-school communication is fully in-app (dropped the WhatsApp dependency). The `Conversation` + `Message` tables model it. SSE or polling streams new messages; the Hostinger shared tier handles polling better than long-lived SSE connections.

---

Powered by Doveryet Technologies.
