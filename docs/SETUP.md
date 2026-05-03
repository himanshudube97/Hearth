# Hearth Setup Guide

Everything you need to do (mostly outside the codebase) to take this branch from clean checkout to a running production deployment. Reads top-to-bottom: do **dev first** (Steps 1–3) so you can verify locally, then **production** (Steps 4–8) once dev is happy.

The `feat/add_supabase` branch is already wired for all of this — you mainly need to fill in env vars and click some dashboard buttons.

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

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a region closest to your users.
3. Project name: anything (e.g. `hearth-prod`).
4. Set a strong database password (you won't need it day-to-day; Supabase manages the connection).
5. Wait ~1 minute for provisioning.

**After creation, grab three values from Settings → API:**
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose in client code)

**Set up the database connection string for your prod env:**
- Settings → Database → Connection string → **URI**.
- Use the **Connection pooling** URI (port 6543) for `DATABASE_URL`.
- Use the **Direct connection** URI (port 5432) for `DIRECT_URL`. Prisma needs this for migrations.

---

## 5. Supabase: storage bucket (~2 min)

1. Storage → **New bucket** → name it `hearth-photos`.
2. Set **Public**: OFF (this is critical — photos are encrypted ciphertext, but defense in depth).
3. Add to your prod env: `SUPABASE_STORAGE_BUCKET=hearth-photos`, `PHOTO_STORAGE=supabase`.
4. Optional but recommended: Storage → Policies → add a policy that *only* the service role can read/write the bucket. The Hearth backend uses the service role key, so this just removes the surface area if anything else ever connects.

---

## 6. Supabase: auth setup (~10 min)

### 6a. Email/password + verification
- Authentication → **Settings** → ensure **"Confirm email"** is enabled.
- Authentication → **Email Templates** → customize the **"Confirm signup"** and **"Reset Password"** templates with your branding.
- The default Supabase email service sends ~3–4 auth emails/hour on the free tier. Fine for early users; if you outgrow it, set custom SMTP later (you can point it at Resend).

### 6b. URL Configuration
Authentication → **URL Configuration**:
- **Site URL**: `https://hearth.app`
- **Redirect URLs** (add each):
  - `https://hearth.app/api/auth/callback`
  - `https://hearth.app/reset`
  - `http://localhost:3111/api/auth/callback` (local dev)
  - `http://localhost:3111/reset` (local dev)

### 6c. Google OAuth (optional, ~10 min)
Skip if you only want email/password initially.

1. Open [Google Cloud Console](https://console.cloud.google.com) → create or pick a project.
2. **APIs & Services** → **OAuth consent screen** → fill in app name, user support email, dev contact. App type: External (unless you have a Google Workspace).
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → Web application.
4. **Authorized redirect URIs**: add the URI shown in Supabase under **Authentication → Providers → Google** (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
5. Copy the Client ID + Client Secret.
6. Back in Supabase: **Authentication → Providers → Google** → **Enabled** ON, paste Client ID + Secret, save.

---

## 7. Resend (~5 min + DNS wait)

For sending letter emails (and optionally piping Supabase auth emails through it later for one consistent sender).

1. [resend.com](https://resend.com) → sign up.
2. **API Keys → Create API Key** → "Hearth production" → copy.
3. Add to prod env: `RESEND_API_KEY=re_<value>`.
4. **Domains → Add Domain** → enter your sender domain (e.g. `hearth.app`).
5. Resend shows ~3 DNS records (TXT for SPF, DKIM, optional DMARC). Add them at your DNS provider (Cloudflare, Namecheap, Route 53, whatever).
6. Wait 5–30 minutes; click **Verify** in Resend.
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

**⚠ Don't leak `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, or `LEMONSQUEEZY_API_KEY`.** They go in the host's environment-variable settings, never into client code or a public file.

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
3. **Set up cron:** point a scheduler at:
   - `POST /api/cron/deliver-letters` — daily, around 9am UTC works
   - `POST /api/cron/sweep-orphaned-blobs` — every few hours
   Both need the `Authorization: Bearer ${CRON_SECRET}` header.
   Vercel's built-in cron works; Upstash QStash, EasyCron, or a simple GitHub Actions schedule also fine.

---

## 10. Post-deploy smoke test

1. Visit `https://hearth.app/login` — email/password signup works, OTP arrives.
2. Verify the OTP, log in. Try writing an entry. Photo upload should land in your Supabase `hearth-photos` bucket (you'll see encrypted blobs there).
3. Toggle E2EE on, confirm both key files download.
4. Try the forgot-password flow end-to-end.
5. Send yourself a friend letter with an unlock date 1 day out, manually fire the cron once, confirm magic link works.

---

## What's *not* in this guide (and why)

- **Multi-device E2EE sync** — not built. Each device unlocks independently with the daily key or recovery key.
- **Supabase RLS policies on tables** — not needed; all DB access goes through Prisma + your service-role queries are user-scoped at the application layer.
- **CDN / image optimization for photos** — current setup serves Supabase URLs directly. Fine for early-stage; revisit if storage egress gets expensive.
- **Email-deliverability monitoring** — Resend dashboard is your friend. Watch the bounce rate; if you see >2% bounces, your sender domain reputation is at risk.

---

If anything in this list feels surprising or wrong, ping me before doing it. The destructive bits (running migrations on prod data) are the only ones that bite.
