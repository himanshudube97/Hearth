# Hearth Setup Guide

Everything you need to do (mostly outside the codebase) to take this branch from clean checkout to a running production deployment. Reads top-to-bottom: do **dev first** (Steps 1–3) so you can verify locally, then **production** (Steps 4–9) once dev is happy.

The `feat/add_supabase` branch is already wired for all of this — you mainly need to fill in env vars and click some dashboard buttons. **No CLI linking step is needed.** The codebase reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` from env at runtime and creates the clients lazily — that's the entire wiring.

---

## Quick checklist (track as you go)

```
DEV
[ ]  1. Docker app running locally
[ ]  2. .env has DATABASE_URL, DIRECT_URL, DEV_JWT_SECRET, ENCRYPTION_KEY, CRON_SECRET
[ ]  3. Verified /forgot, /reset, /verify, E2EE setup, magic link

SUPABASE
[ ]  4. Project created, 3 keys copied (URL, anon, service_role)
[ ]  4. Database connection strings copied (pooler 6543 + direct 5432)
[ ]  5. Storage bucket "hearth-photos" created, set Private
[ ]  6. Auth: Confirm-email enabled, email templates branded
[ ]  6. Auth: Site URL + Redirect URLs added
[ ]  6. (optional) Google OAuth provider configured

EMAIL + DOMAIN
[ ]  7. Resend account, API key created
[ ]  7. Sender domain added in Resend, DNS records published, verified

WEB PUSH (gentle reminders)
[ ]  7b. VAPID keypair generated, all four VAPID env vars set on the host

DEPLOY
[ ]  8. Production env vars set on hosting target
[ ]  9. prisma migrate deploy run against prod database
[ ]  9. cron-job.org account + 3 cronjobs created:
        - daily   /api/cron/deliver-letters
        - 15-min  /api/cron/send-reminders
        - few-hr  /api/cron/sweep-orphaned-blobs
[ ] 10. Post-deploy smoke test passes (incl. test reminder from /me)
```

---

## 0. Prerequisites

- Docker Desktop running
- A real domain you own (for production sender emails + OAuth redirects). Use `hearth.app` placeholder below — replace with yours.
- ~30–45 minutes of your time

---

## 1. Local dev: get the app running

You probably already have this. Skim and confirm.

```bash
git pull
docker compose up -d
docker compose logs -f app   # watch for "Ready in N ms"
```

Visit [http://localhost:3111/login](http://localhost:3111/login). In dev mode, click **Fill Dev Creds** and submit — any email creates an account.

If the build fails because the Prisma client is stale (e.g. you just pulled this branch), rebuild it inside the container:

```bash
docker compose exec \
  -e DATABASE_URL="postgresql://hearth:hearth_secret@db:5432/hearth?schema=public" \
  -e DIRECT_URL="postgresql://hearth:hearth_secret@db:5432/hearth?schema=public" \
  app npx prisma migrate dev
```

The two env-var overrides exist because the `.env` `DATABASE_URL` uses `localhost` (works for the host) and inside the container you need `db` (the docker-compose service name).

> **Add this once and forget it:** make sure `.env` contains `DIRECT_URL="postgresql://hearth:hearth_secret@localhost:5432/hearth?schema=public"`. Without it, Prisma migrations fail with "Environment variable not found: DIRECT_URL". (Already added by me, but if you reset .env from .env.example, redo this.)

---

## 2. Local dev: env-var quick reference

Your `.env` needs these to do anything meaningful in dev. The bolded ones are what I noticed missing during my work:

```
# Database (already present)
DATABASE_URL="postgresql://hearth:hearth_secret@localhost:5432/hearth?schema=public"
DIRECT_URL="postgresql://hearth:hearth_secret@localhost:5432/hearth?schema=public"

# Auth — dev mode
USE_DEV_AUTH=true
NEXT_PUBLIC_USE_DEV_AUTH=true
DEV_JWT_SECRET="<any string ≥ 32 chars>"

# Encryption (server-side AES-256-GCM)
ENCRYPTION_KEY="<64 hex chars; generate with: openssl rand -hex 32>"

# Storage
PHOTO_STORAGE=local       # dev: blobs in Postgres; prod: switch to "supabase"

# Supabase (for Step 4 — needed in prod, harmless in dev with USE_DEV_AUTH=true)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>

# **CRON_SECRET** ← generate one now even for dev
CRON_SECRET="<openssl rand -hex 32>"

# **RESEND_API_KEY** ← optional in dev (only needed if you want letter emails to actually send)
RESEND_API_KEY=re_<from Resend dashboard>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3111
```

After editing `.env`, restart the app:

```bash
docker compose restart app
```

---

## 3. Local dev: verify the new flows work

End-to-end checks for what shipped on this branch. All work in `USE_DEV_AUTH=true` mode without external services.

**Auth pages render:**
- [/forgot](http://localhost:3111/forgot) — email input form
- [/reset](http://localhost:3111/reset) — password reset form
- [/verify](http://localhost:3111/verify) — verify-email landing
- Login page shows "Forgot password?" link

**E2EE flow:**
1. Log in → `/me` → enable E2EE.
2. Two `.txt` files should download automatically (`hearth-daily-key-YYYY-MM-DD.txt`, `hearth-recovery-key-YYYY-MM-DD.txt`).
3. Log out → check DevTools → Application → confirm `hearth-e2ee-master-key` is removed from both Local Storage and Session Storage.
4. Log back in, unlock — the "Trust this device for 7 days" checkbox should be there. Uncheck it, unlock, close tab, reopen — should prompt for unlock again. Recheck it next time, key persists 7 days.
5. On `/security`, rotate the recovery key — new file should download.

**Magic-link letters (dev test):**
```bash
# Replace <CRON> with your CRON_SECRET value from .env
/usr/bin/curl -X POST http://localhost:3111/api/cron/deliver-letters \
  -H "Authorization: Bearer <CRON>"
```
Compose a friend letter with an unlock date in the past (force via Prisma Studio: `docker compose exec app npx prisma studio`), then run the curl. Open the magic-link URL — letter renders. Refresh 3 times → exhaustion screen.

---

## 4. Supabase: create the project (~5 min)

1. Go to [supabase.com/dashboard/projects](https://supabase.com/dashboard/projects) → **New project**.
2. Pick a region closest to your users.
3. Project name: anything (e.g. `hearth-prod`).
4. Set a strong database password (you won't need it day-to-day; Supabase manages the connection).
5. Wait ~1 minute for provisioning.

**After creation, grab three values from [the API settings page](https://supabase.com/dashboard/project/_/settings/api)** *(the `_` in that URL auto-routes to your active project — every link below works the same way)*:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose in client code)

**Database connection strings** — open [Settings → Database](https://supabase.com/dashboard/project/_/settings/database):
- Scroll to **Connection string** → **URI** tab.
- Toggle **Use connection pooling**: ON → copy → that's your `DATABASE_URL` (port 6543).
- Toggle **Use connection pooling**: OFF → copy → that's your `DIRECT_URL` (port 5432). Prisma needs both: pooler for the app, direct for migrations.

> **No CLI linking command runs.** You are not running `supabase link` or `supabase init` — those are for projects that use Supabase migrations (we use Prisma instead). Env vars are the only wiring.

---

## 5. Supabase: storage bucket (~2 min)

Open [Storage](https://supabase.com/dashboard/project/_/storage/buckets):

1. Click **New bucket** → name it `hearth-photos`.
2. **Public bucket**: OFF (critical — even though photos are encrypted ciphertext, public access is unnecessary surface area).
3. **File size limit**: 50 MB is plenty for compressed photos.
4. Click **Save**.
5. Add to your prod env: `SUPABASE_STORAGE_BUCKET=hearth-photos`, `PHOTO_STORAGE=supabase`.
6. Optional but recommended: open [Storage → Policies](https://supabase.com/dashboard/project/_/storage/policies) → New policy → restrict reads/writes to the service role only. The Hearth backend uses the service-role key, so this is purely defense in depth.

---

## 6. Supabase: auth setup (~10 min)

### 6a. Email/password + verification
- Open [Authentication → Providers](https://supabase.com/dashboard/project/_/auth/providers) → confirm **Email** is enabled, with **Confirm email** ON.
- Open [Authentication → Email Templates](https://supabase.com/dashboard/project/_/auth/templates) → customize the **Confirm signup** and **Reset Password** templates with your branding.
- The default Supabase email service sends ~3–4 auth emails/hour on the free tier. Fine for early users; if you outgrow it, set custom SMTP later (you can point it at Resend).

### 6b. URL Configuration
Open [Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):
- **Site URL**: `https://hearth.app` (replace with your domain)
- **Redirect URLs** (add each on its own line):
  - `https://hearth.app/api/auth/callback`
  - `https://hearth.app/reset`
  - `http://localhost:3111/api/auth/callback` (local dev)
  - `http://localhost:3111/reset` (local dev)

### 6c. Google OAuth (optional, ~10 min)
Skip if you only want email/password initially.

1. Open [Google Cloud Console](https://console.cloud.google.com) → create or pick a project.
2. [APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) → fill in app name, user support email, dev contact. App type: **External** (unless you have a Google Workspace).
3. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → **Create Credentials** → **OAuth client ID** → Web application.
4. **Authorized redirect URIs**: add the URI shown in [Supabase → Auth → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers) (it looks like `https://<project-ref>.supabase.co/auth/v1/callback`). Copy that URI from Supabase, paste into Google.
5. Click **Create**, copy the Client ID + Client Secret.
6. Back in [Supabase → Auth → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers) → toggle **Enabled** ON → paste Client ID + Secret → Save.

---

## 7. Resend (~5 min + DNS wait)

For sending letter emails (and optionally piping Supabase auth emails through it later for one consistent sender).

1. Sign up at [resend.com](https://resend.com).
2. Open [API Keys](https://resend.com/api-keys) → **Create API Key** → name it "Hearth production" → permissions: **Sending access** → copy. Save it now; Resend won't show it again.
3. Add to prod env: `RESEND_API_KEY=re_<value>`.
4. Open [Domains](https://resend.com/domains) → **Add Domain** → enter your sender domain (e.g. `hearth.app`).
5. Resend shows ~3 DNS records (TXT for SPF, DKIM, optional DMARC). Add them at your DNS provider (Cloudflare, Namecheap, Route 53, whatever).
6. Wait 5–30 minutes for propagation; click **Verify** in Resend.
7. Until DNS verifies, you can still test by sending **only to your own email** from the default `onboarding@resend.dev` sender. The code uses `letters@hearth.app` — change once verified, or change the sender in [src/lib/email.ts](src/lib/email.ts) for your domain.

---

## 8. Production env vars (final list)

When you deploy (Vercel, Railway, your VPS, etc.), set these env vars on the production host:

```
# Database — Supabase pooler (6543) and direct (5432) URIs
DATABASE_URL=postgresql://postgres:<pw>@<ref>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:<pw>@<ref>.supabase.co:5432/postgres

# Auth — production (Supabase, NOT dev JWT)
USE_DEV_AUTH=false
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role — server only>

# Encryption (server-side at-rest for non-E2EE entries)
ENCRYPTION_KEY=<64 hex chars — keep this safe, losing it means data loss>

# Storage
PHOTO_STORAGE=supabase
SUPABASE_STORAGE_BUCKET=hearth-photos

# Email
RESEND_API_KEY=re_<value>

# Cron — auth header for /api/cron/* routes
CRON_SECRET=<openssl rand -hex 32>

# Web Push (VAPID) — for gentle nightly reminders
# Generate with: docker compose exec app npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=<base64url public key>
VAPID_PRIVATE_KEY=<base64url private key — server only>
VAPID_SUBJECT=mailto:support@hearth.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY, exposed to browser>

# Lemon Squeezy (optional — only if you're charging for it)
LEMONSQUEEZY_API_KEY=<...>
LEMONSQUEEZY_STORE_ID=<...>
LEMONSQUEEZY_VARIANT_MONTHLY=<...>
LEMONSQUEEZY_VARIANT_YEARLY=<...>
LEMONSQUEEZY_WEBHOOK_SECRET=<...>

# App
NEXT_PUBLIC_APP_URL=https://hearth.app

# Optional dev-mode JWT secret — leave it set in case you need to flip
# USE_DEV_AUTH back on for debugging
DEV_JWT_SECRET=<any string ≥ 32 chars>
```

**⚠ Don't leak `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`, or `LEMONSQUEEZY_API_KEY`.** They go in the host's environment-variable settings, never into client code or a public file. (`VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` are intentionally public.)

---

## 9. Deploy + first migration

After env vars are set on the host:

1. Deploy the branch (Vercel: connect repo, push branch). The build should produce a Next.js app.
2. **Run migrations against prod once:**
   - Locally, with prod env vars temporarily set:
     ```bash
     DATABASE_URL="<prod pooler url>" \
     DIRECT_URL="<prod direct url>" \
     npx prisma migrate deploy
     ```
   - This applies all migrations in `prisma/migrations/` in order, including the `remove_mood_from_entry` migration. **If you have any production data with mood values you want to keep, don't run this — back up first.** Otherwise you're fine, this branch's migrations are: `add_letter_access_token`, `add_orphaned_blob`, `remove_mood_from_entry`.
3. **Set up cron** — see Section 9b below.

---

## 9b. Cron jobs via cron-job.org (~10 min, free)

The app has three cron endpoints. All three need `Authorization: Bearer ${CRON_SECRET}` and are idempotent (safe to retry).

| Endpoint | Cadence | Why |
|---|---|---|
| `/api/cron/deliver-letters` | daily | Sends time-delayed friend letters whose `unlockDate` has arrived. |
| `/api/cron/send-reminders` | every 15 min | Fires per-user nightly push reminders inside their evening window. The 15-min cadence is load-bearing — coarser means missed slots. |
| `/api/cron/sweep-orphaned-blobs` | every few hours | Garbage-collects encrypted photo blobs whose entries were deleted. |

**Why not Vercel Cron?** Hobby tier only allows once/day; the reminder cron needs 15-min cadence which requires Vercel Pro. cron-job.org is free, supports per-minute precision, and lets you stay on Vercel Hobby. (If you're already on Pro, use [vercel.json](https://vercel.com/docs/cron-jobs) instead.)

### Step 1: Smoke-test each route from your laptop first
```bash
# Replace <HOST> and <CRON> with your real values
curl -i -H "Authorization: Bearer <CRON>" https://<HOST>/api/cron/deliver-letters
curl -i -H "Authorization: Bearer <CRON>" https://<HOST>/api/cron/send-reminders
curl -i -H "Authorization: Bearer <CRON>" https://<HOST>/api/cron/sweep-orphaned-blobs
```
Expect `200` with a JSON body. `401` = secret mismatch. `500 "VAPID not configured"` on `send-reminders` = VAPID env vars missing on the host.

### Step 2: Create an account at cron-job.org
Free, email verification only. https://cron-job.org

### Step 3: Create three cronjobs

For each one, click **Create cronjob** and fill:

**A. send-reminders (every 15 min)**
- **Title**: `hearth send-reminders`
- **URL**: `https://<HOST>/api/cron/send-reminders`
- **Schedule** (Common tab): "every 15 minutes" — or Advanced: `Minutes: */15`, others `*`
- **Advanced → Request method**: `GET`
- **Advanced → HTTP headers**: add one
  - Name: `Authorization`
  - Value: `Bearer <your-cron-secret>` (literal "Bearer " + the secret)
- **Notifications**: enable "notify on failure" (recommended)
- Save.

**B. deliver-letters (daily)**
- **Title**: `hearth deliver-letters`
- **URL**: `https://<HOST>/api/cron/deliver-letters`
- **Schedule** (Advanced): `Minutes: 0, Hours: 9` (= 9am UTC daily — pick whatever suits)
- Same `Authorization` header as above.
- Save.

**C. sweep-orphaned-blobs (every 4 hours)**
- **Title**: `hearth sweep-orphaned-blobs`
- **URL**: `https://<HOST>/api/cron/sweep-orphaned-blobs`
- **Schedule** (Advanced): `Minutes: 0, Hours: */4`
- Same `Authorization` header.
- Save.

### Step 4: Verify
- Click "Execute now" on each — execution history should show `200` with a JSON body.
- After 30 minutes, check the history for `send-reminders` — there should be ~2 entries, both `200`. Most will report `0 fired` until a real user's evening window matches.

### What can go wrong
- **Header pasted wrong**: cron-job.org will show `401` in execution history. Re-check that the value starts with the literal word `Bearer ` (with the trailing space).
- **URL has typo**: shows `404`. Double-check the path.
- **App not yet deployed / DNS not propagated**: shows connection error. Wait for the deploy to finish.
- **`send-reminders` returns `500` with "VAPID not configured"**: the four `VAPID_*` env vars aren't set on the host. Add them in your hosting provider's dashboard, redeploy, retry.

---

## 10. Post-deploy smoke test

1. Visit `https://hearth.app/login` — email/password signup works, OTP arrives.
2. Verify the OTP, log in. Try writing an entry. Photo upload should land in your Supabase `hearth-photos` bucket (you'll see encrypted blobs there).
3. Toggle E2EE on, confirm both key files download.
4. Try the forgot-password flow end-to-end.
5. Send yourself a friend letter with an unlock date 1 day out, manually fire the cron once, confirm magic link works.
6. **Reminders**: write your first entry → opt-in card appears → click "Surprise me" → permission prompt → accept. Visit `/me` → "Send a test reminder" → notification fires within seconds. Tap it → opens `/write?write=1` and lands on a fresh new-entry spread.

---

## What's *not* in this guide (and why)

- **Multi-device E2EE sync** — not built. Each device unlocks independently with the daily key or recovery key.
- **Supabase RLS policies on tables** — not needed; all DB access goes through Prisma + your service-role queries are user-scoped at the application layer.
- **CDN / image optimization for photos** — current setup serves Supabase URLs directly. Fine for early-stage; revisit if storage egress gets expensive.
- **Email-deliverability monitoring** — Resend dashboard is your friend. Watch the bounce rate; if you see >2% bounces, your sender domain reputation is at risk.

---

If anything in this list feels surprising or wrong, ping me before doing it. The destructive bits (running migrations on prod data) are the only ones that bite.
