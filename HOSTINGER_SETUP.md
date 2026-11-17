# Deploying SchoolOS to Hostinger Web App Hosting

**Target:** Hostinger shared hosting plan with Node.js Web App creation + Neon PostgreSQL + Cloudflare R2.

Total time first deploy: **~45 minutes**. Subsequent deploys: push to GitHub → auto-rebuild.

---

## Architecture

```
          ┌─────────────────────────┐
          │  schoolos.doveryet.com  │
          │    (Hostinger CNAME)    │
          └───────────┬─────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │   Hostinger Web App     │
          │   Node 20 · Next.js 15  │
          │   Auto-deploy from Git  │
          └───┬─────────────────┬───┘
              │                 │
              ▼                 ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Hostinger MySQL │  │  Cloudflare  │
    │  (same server)   │  │  R2 Storage  │
    │  localhost:3306  │  │  (assets)    │
    └──────────────────┘  └──────────────┘
```

**Why this split:**
- Hostinger Web App = compute (Next.js, auto-SSL, CDN, auto-restart)
- Hostinger MySQL = database (included with your plan, zero extra cost, localhost connection = fastest latency possible)
- Cloudflare R2 = files (logos, photos, PDFs — 10 GB free, no egress fees)

Files can't be stored on Hostinger shared hosting reliably (no guaranteed persistence across deploys), so R2 handles that. Database stays on Hostinger — same box as the app, zero network hop.

---

## Prerequisites

Check these boxes before starting:

- [ ] Hostinger Web App Hosting plan active (your current plan works)
- [ ] GitHub account + the schoolos-platform code pushed to a **private** repo
- [ ] Domain DNS access for doveryet.com
- [ ] Phone nearby (for Neon + Cloudflare signup verification)

---

## Step 1 — Create Hostinger MySQL database (5 min)

1. hPanel → **Databases** → **MySQL Databases** → **Create database**
2. Fill in:
   - **Database name**: `schoolos` (final name becomes something like `u123456789_schoolos`)
   - **Username**: `schoolos` (final becomes `u123456789_schoolos`)
   - **Password**: click **Generate** or type a strong one. Save it.
3. Hit **Create**.

Note the three values shown:
- **Database**: `u123456789_schoolos`
- **Username**: `u123456789_schoolos` (same prefix — Hostinger's convention)
- **Host**: usually blank or shown as `localhost` (you'll use `localhost` since the Web App runs on the same server)

Your `DATABASE_URL` will be:
```
mysql://u123456789_schoolos:THE_PASSWORD@localhost:3306/u123456789_schoolos
```

(URL-encode special characters in the password if any: `@` becomes `%40`, `#` becomes `%23`, etc.)

**Optional — enable Remote MySQL** so you can connect from your laptop for admin work:
- Databases → **Remote MySQL** → add your IP (or `%` for any IP during setup — restrict later)
- For remote access, swap `localhost` for the host shown in the Remote MySQL tab (something like `mysql.hostinger.com` or an IP).

---

## Step 2 — Create Cloudflare R2 bucket (5 min)

1. **https://dash.cloudflare.com** → **R2 Object Storage** → **Create bucket**
2. Name: `schoolos-assets` · Location hint: **Asia-Pacific**
3. Click into the bucket → **Settings** → **Public access** → **Allow**
4. Copy the **R2.dev public URL** (looks like `https://pub-xxxxx.r2.dev`) → this is `R2_PUBLIC_URL`
5. Go back to **R2 overview** → **Manage R2 API Tokens** → **Create API Token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: `schoolos-assets`
   - Create → copy **Access Key ID** and **Secret Access Key**
   - Also copy the **Endpoint URL** (ends with `.r2.cloudflarestorage.com`)

Save all four values: access key, secret, endpoint, public URL.

---

## Step 3 — Push code to GitHub (5 min, skip if done)

From your laptop:
```bash
cd schoolos-platform

git init
git add .
git commit -m "Initial SchoolOS"
git branch -M main

# Create private repo via GitHub CLI
gh repo create doveryet-schoolos --private --source=. --remote=origin --push

# OR manually: create private repo at github.com, then:
#   git remote add origin https://github.com/<you>/doveryet-schoolos.git
#   git push -u origin main
```

Verify at `github.com/<you>/doveryet-schoolos` — all 50+ files should be there, **not including `.env`** (gitignored).

---

## Step 4 — Create the Web App on Hostinger (15 min)

1. Log into **hPanel** → **Websites** → **Create web app** (or similar; label varies by plan)
2. Choose:
   - **Framework**: Next.js
   - **Node.js version**: 20.x
   - **Source**: GitHub
   - Authorize Hostinger to read your repos
   - **Repository**: `<you>/doveryet-schoolos`
   - **Branch**: `main`
   - **Root directory**: leave empty if you pushed `schoolos-platform/` contents as the repo root; otherwise `schoolos-platform`

3. **Build command**:
   ```
   npm ci && npm run build
   ```
   (The build script internally runs `prisma generate && prisma migrate deploy && next build`.)

4. **Start command**:
   ```
   npm start
   ```

5. **Port**: leave blank — Hostinger assigns via `PORT` env var, our `next start -p ${PORT:-3000}` handles it.

6. **Do NOT click Deploy yet.** Go to **Environment Variables** and add each row below.

### Environment variables to set in the Hostinger panel

| Name | Value |
|---|---|
| `DATABASE_URL` | `mysql://u123456789_schoolos:THE_PASSWORD@localhost:3306/u123456789_schoolos` (from Step 1) |
| `AUTH_SECRET` | Run `openssl rand -base64 32` locally, paste output |
| `AUTH_URL` | `https://schoolos.doveryet.com` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_NAME` | `Doveryet SchoolOS` |
| `NEXT_PUBLIC_APP_URL` | `https://schoolos.doveryet.com` |
| `STORAGE_PROVIDER` | `r2` |
| `R2_ACCESS_KEY_ID` | From Step 2 |
| `R2_SECRET_ACCESS_KEY` | From Step 2 |
| `R2_ENDPOINT` | From Step 2 |
| `R2_BUCKET` | `schoolos-assets` |
| `R2_PUBLIC_URL` | From Step 2 (`https://pub-xxxxx.r2.dev`) |
| `NODE_ENV` | `production` |

Leave Razorpay / SMTP blank for now — registration still works without them (logos upload, DB saves, email just no-ops). Add them in Step 7.

**Click Save.**

---

## Step 5 — Connect your domain (5 min)

1. In the Web App settings → **Domains** → **Add domain**: `schoolos.doveryet.com`
2. Hostinger shows a **CNAME target** (something like `<app-id>.hostingersite.com`)
3. In your DNS provider for `doveryet.com`:
   ```
   Type   Name        Value                           TTL
   CNAME  schoolos    <target-from-hostinger>         Auto
   ```
4. Wait 5–10 minutes. Hostinger auto-issues HTTPS via Let's Encrypt within a few minutes of CNAME propagating.

Verify DNS is propagated:
```bash
dig schoolos.doveryet.com +short CNAME
```

---

## Step 6 — First deploy (5 min + wait)

Back in the Web App → **Deploy** button.

Hostinger's log tail will show:
```
→ npm ci                   (~90s installing deps)
→ npm run build            
    → prisma generate      (~5s)
    → prisma db push       (~3s — syncs schema to Hostinger MySQL)
    → next build           (~90s compiling)
→ npm start                (launches on $PORT)
```

**On first-ever deploy**, `db push` creates all 38 tables in your MySQL database fresh. On subsequent deploys, it syncs incremental changes safely — fails loudly if a column drop would lose data.

Status flips to **Running** after ~3–4 minutes. Open **https://schoolos.doveryet.com** — login page loads.

---

## Step 7 — Create your first super admin

The seed script is for local dev. In production, create the first user by hand via Hostinger's phpMyAdmin:

1. hPanel → **Databases** → **phpMyAdmin** → click the key icon next to your schoolos DB
2. Generate a bcrypt password hash locally first:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('ChooseAStrongPassword', 10))"
   ```
   Copy the output (starts with `$2a$10$...`).

3. In phpMyAdmin → click the **SQL** tab → paste:
   ```sql
   INSERT INTO `User` (id, email, name, role, passwordHash, isActive, createdAt, updatedAt)
   VALUES (
     CONCAT('usr_', SUBSTRING(MD5(RAND()), 1, 20)),
     'salman@doveryet.com',
     'Salman B.',
     'SUPER_ADMIN',
     '$2a$10$PASTE_YOUR_HASH_HERE',
     1,
     NOW(),
     NOW()
   );
   ```
4. Click **Go** → go to `https://schoolos.doveryet.com/login` → sign in → you land at `/super-admin/dashboard`.

---

## Step 8 — Add Razorpay + Email (this week)

### Razorpay

1. **dashboard.razorpay.com** → Settings → API Keys → Generate Test Key
2. Paste into Hostinger env vars:
   - `RAZORPAY_KEY_ID=rzp_test_xxx`
   - `RAZORPAY_KEY_SECRET=xxx`
3. Settings → Webhooks → Add webhook:
   - URL: `https://schoolos.doveryet.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`
   - Copy the webhook secret → `RAZORPAY_WEBHOOK_SECRET`
4. In Hostinger → **Redeploy** (env var change needs a restart)

### Email (Zoho Mail, free)

1. **zoho.com/mail** → Setup → Add your domain `doveryet.com`
2. Add the MX records they show into your DNS
3. Create a user `no-reply@doveryet.com`
4. In Zoho Account → **App Passwords** → generate one for SMTP
5. Paste into Hostinger env vars:
   - `SMTP_HOST=smtp.zoho.in`
   - `SMTP_PORT=587`
   - `SMTP_USER=no-reply@doveryet.com`
   - `SMTP_PASS=<app-password>`
   - `SMTP_FROM=SchoolOS <no-reply@doveryet.com>`
6. Redeploy.

---

## Day-to-day workflow after launch

**Deploy an update:**
```bash
# On your laptop
git add .
git commit -m "Describe the change"
git push origin main
```
Hostinger auto-builds + redeploys. Watch the build log in the panel.

**Hotfix a prod bug:**
Same as above. If you want zero downtime, fix on a branch, test on a preview deploy (Hostinger supports this), merge to main.

**Change env vars:**
Hostinger panel → Environment Variables → edit → **Redeploy** (new values take effect after restart).

**Read production logs:**
Hostinger panel → Web App → **Logs** tab. Keeps ~24h.

---

## Monitoring

### Free uptime monitor (BetterStack)

1. Sign up at **betterstack.com** (free tier)
2. Add a monitor:
   - URL: `https://schoolos.doveryet.com/api/health`
   - Interval: 3 minutes
   - Alert: your email or WhatsApp number

### Error tracking (Sentry, free)

Already supported in the code. Just add `SENTRY_DSN` to Hostinger env vars after creating a Sentry project.

### Database backups

Hostinger backs up MySQL databases automatically — frequency depends on your plan (daily on most). Verify in hPanel → **Files** → **Backups**.

**Belt-and-braces**: dump weekly to R2 via a GitHub Action:
```yaml
# .github/workflows/db-backup.yml
on:
  schedule:
    - cron: "0 20 * * 0"  # Sunday 20:00 UTC = Mon 01:30 IST
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Dump + upload to R2
        env:
          DB_URL: ${{ secrets.DATABASE_URL }}
          R2_KEY: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
        run: |
          sudo apt install -y mysql-client awscli
          # Parse DB_URL: mysql://user:pass@host:3306/dbname
          mysqldump --single-transaction --quick \
            -h <host> -u <user> -p<pass> <dbname> \
            | gzip > backup-$(date +%F).sql.gz
          aws s3 cp backup-*.sql.gz s3://schoolos-backups/ \
            --endpoint-url $R2_ENDPOINT \
            --region auto
```

Requires **Remote MySQL** enabled (Step 1) + GitHub Actions runner IP whitelisted in Hostinger.

---

## Cost — launch tier

| Service | Monthly |
|---|---|
| Hostinger Web App + MySQL (already paid) | — |
| Cloudflare R2 (10 GB free) | ₹0 |
| Zoho Mail (5 users free) | ₹0 |
| BetterStack (free) | ₹0 |
| Sentry (free) | ₹0 |
| Razorpay | 2% of UPI, 0.4% of direct bank — passed through |
| **Fixed infrastructure beyond Hostinger** | **₹0** |

You're already paying for Hostinger (compute + DB). Everything else is zero.

---

## Common issues & fixes

| Symptom | Fix |
|---|---|
| Build fails with `P1001: Can't reach database server at localhost` | Wrong DB name/user/password/host in `DATABASE_URL`. Check phpMyAdmin credentials. For external access use the Remote MySQL hostname, not `localhost`. |
| Build fails with `Access denied for user` | Password URL-encoding — `@` must be `%40`, `#` is `%23`, `/` is `%2F`. |
| Build fails with `Data loss detected` on db push | You removed a column from schema. If intentional, run `prisma db push --accept-data-loss` once locally, then redeploy. |
| Login works locally but fails on Hostinger | Missing `AUTH_TRUST_HOST=true` env var. Add + redeploy. |
| `AUTH_SECRET` warning in logs | Not set. Generate with `openssl rand -base64 32`. |
| Logo upload returns 500 | `R2_PUBLIC_URL` missing or bucket isn't public. Enable public access in R2 bucket settings. |
| App restarts every few mins | Memory limit. Watch RAM graph — consistently >2.5 GB means upgrade. |
| CNAME says "pending" > 30 min | DNS TTL too high. Delete + re-add the record. |
| Build takes >5 min and times out | First deploy with full dep install. Push a trivial commit to retry; second deploy will be fast (cached). |
| `json_type is not a valid default` migration error | Your Hostinger MySQL is < 5.7. Contact Hostinger support to upgrade. |

---

## When to leave Hostinger

Hostinger Web App Hosting handles up to ~50 concurrent active users comfortably. Move to a VPS / Vercel Pro when:

- You hit 30+ schools (~5,000 students combined)
- You need Playwright (certificate PDF rendering with heavy templates — but the current `@react-pdf/renderer` setup avoids this)
- You need SSH access for debugging
- Build time exceeds Hostinger's 5-minute limit

Migration path: push to Vercel or a Hostinger KVM VPS with 2 env var changes. The code works on any Node 20+ host.

---

Powered by Doveryet Technologies.
