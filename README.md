# Hearth

A cozy, personal journaling app designed for long-term use. Track your moods, write your thoughts, and watch your story unfold over years.

## Features

### Writing

- Rich text editor with mood tracking (5 mood levels)
- Doodle canvas for sketches and drawings
- Song/music attachment for entries
- Writing prompts and whispers for inspiration
- Photo polaroid attachments per spread

### Timeline

- **Year/Month Navigation** - Jump to any period instantly
- **Search** - Full-text search across all entries
- **Mood Filters** - Filter entries by mood
- **Infinite Scroll** - Smooth loading as you browse
- **Streak Tracking** - Current and longest writing streaks

### Calendar

- **Month View** - See your mood patterns day by day
- **Year View** - Heatmap showing monthly mood averages
- **Statistics** - Entries count, days written, average mood
- **Streak Display** - Track your consistency

### Letters

- Time-delayed letters to yourself or friends
- Minimum 1 week delay with unlock dates
- Beautiful HTML email delivery via Resend

### Customization

- **10 Themes** - Winter Sunset, Rivendell, Cherry Blossom, Northern Lights, and more
- **8 Custom Cursors** - Golden Orb, Quill Pen, Forest Leaf, Star, Heart, Moon, Feather, Crystal

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Dev JWT (local) / Supabase OAuth (production)
- **Storage**: Local base64 (local) / Supabase Storage (production)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion v12
- **Editor**: TipTap
- **State**: Zustand
- **Email**: Resend
- **Payments**: Lemon Squeezy

---

## Supabase Integration

This section documents everything we set up to connect Hearth to Supabase as the production backend.

### What Supabase Provides

| Feature                 | What it does in Hearth                                      |
| ----------------------- | ----------------------------------------------------------- |
| **PostgreSQL Database** | Stores all journal entries, users, doodles, photos metadata |
| **Auth**                | Google OAuth + email/password login with session management |
| **Storage**             | Stores journal photo attachments (polaroid images)          |

---

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, give the project a name (e.g. `hearth`), set a strong database password, and pick a region
4. Wait for the project to be provisioned (~2 minutes)

**Why:** Supabase gives us a managed PostgreSQL database, auth, and storage all in one place — no need to manage separate services.

---

### Step 2 — Get Supabase Credentials

Go to **Supabase → Project Settings → API** and copy:

- `NEXT_PUBLIC_SUPABASE_URL` — your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (safe to expose in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — secret service role key (server-side only, never expose)

Go to **Supabase → Project Settings → Database → Connection string** and get:

- **Pooler URL** (port 6543) → use as `DATABASE_URL` (for Prisma queries via pgBouncer)
- **Direct URL** (port 5432) → use as `DIRECT_URL` (for Prisma migrations)

Add all of these to your `.env` file (see Environment Variables section below).

**Why:** The pooler URL (6543) handles connection pooling efficiently for many concurrent requests. The direct URL (5432) is needed for schema migrations which require a persistent connection.

---

### Step 3 — Push Database Schema to Supabase

```bash
docker compose exec app npx prisma db push
```

This takes your `prisma/schema.prisma` and creates all the tables in your Supabase PostgreSQL database.

**Why:** Prisma is the ORM that defines the database structure. `db push` syncs the schema without creating migration files — ideal for initial setup.

---

### Step 4 — Create Supabase Storage Bucket

1. Go to **Supabase → Storage**
2. Click **New Bucket**
3. Name it `entry-photos`
4. Set it to **Public** (so photo URLs are directly accessible without auth tokens)
5. Click **Create bucket**

**Why:** Journal entry photos are uploaded here instead of being stored as base64 strings in the database. This keeps the database lean and photos load faster from a CDN.

---

### Step 5 — Set Up Google OAuth

#### In Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Hearth`
   - Support email: your email
   - Click through Next → Next → Next → Save and Continue
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Hearth`
   - Under **Authorized redirect URIs**, add:
     ```
     https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
     ```
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

> **Note:** While the OAuth app is in "Testing" mode, only users added under **OAuth consent screen → Test users** can sign in with Google. To allow anyone, publish the app (requires Google verification).

#### In Supabase:

1. Go to **Supabase → Authentication → Providers → Google**
2. Toggle **Enable Sign in with Google** to ON
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

**Why:** Google OAuth lets users sign in with their existing Google account instead of creating a new username/password. Supabase handles the entire OAuth flow and session management automatically.

---

### Step 6 — Configure Auth URLs

Go to **Supabase → Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3111` (for local dev) or your production domain
- **Redirect URLs**: add `http://localhost:3111/**`

**Why:** After OAuth or email confirmation, Supabase redirects the user back to your app. These settings tell Supabase which URLs are allowed redirect targets, preventing open redirect attacks.

---

### Step 7 — Disable Email Confirmation (Local Dev Only)

Go to **Supabase → Authentication → Providers → Email** → turn OFF **"Confirm email"** → Save.

**Why for local dev:** Supabase's built-in mailer is rate-limited to 4 emails/hour and can be slow. Disabling confirmation lets you sign up and log in immediately without waiting for an email. **Turn this back ON in production.**

---

### Step 8 — Set Up Resend (Email for Letter Delivery)

Resend is used for sending letter delivery emails (not auth emails — that's Supabase's job).

1. Go to [resend.com](https://resend.com) and sign up (free — 3,000 emails/month)
2. Go to **API Keys → Create API Key**
3. Copy the key and add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   ```

**Why:** The letters feature allows writing time-delayed emails to friends. When the unlock date arrives, the daily cron job (`/api/cron/deliver-letters`) uses Resend to send beautifully formatted HTML emails. Supabase cannot send arbitrary custom emails — it only handles auth emails.

---

### Code Changes Made for Supabase Integration

#### 1. `prisma/schema.prisma`

Added `directUrl` to the datasource block to support Supabase's connection pooler:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // ← added
}
```

#### 2. `src/lib/storage.ts` (new file)

Created a storage adapter that switches between local (base64 in DB) and Supabase Storage based on `STORAGE_ADAPTER` env var:

```typescript
// STORAGE_ADAPTER=local  → keeps base64 data URL in the database
// STORAGE_ADAPTER=supabase → uploads to Supabase Storage bucket 'entry-photos'
export async function uploadPhotos(photos, entryId): Promise<photos>;
```

#### 3. `src/middleware.ts`

Replaced simple cookie-name check with proper `@supabase/ssr` session validation:

- Dev mode (`USE_DEV_AUTH=true`): verifies HS256 JWT cookie
- Production (`USE_DEV_AUTH=false`): uses Supabase `createServerClient` → `getUser()` and refreshes session cookies on every request

#### 4. `src/app/api/auth/login/route.ts`

Added multi-action auth routing:

- `email_login` → `supabase.auth.signInWithPassword`
- `email_signup` → `supabase.auth.signUp` (returns OTP step)
- `verify_otp` → `supabase.auth.verifyOtp` + creates user in DB
- Default → Google OAuth via `signInWithOAuth`

#### 5. `src/app/login/page.tsx`

Updated login UI for Supabase mode:

- Email/password form with login/signup toggle
- OTP verification step (6-digit code input)
- "Sign in with Google" button
- Dev mode still shows simple email/password only

#### 6. `src/app/api/entries/route.ts` and `src/app/api/entries/[id]/route.ts`

Added `uploadPhotos()` calls so photos go through the storage adapter before being saved to the database.

---

## Environment Variables

### Local Development (Docker)

```bash
USE_DEV_AUTH=true
NEXT_PUBLIC_USE_DEV_AUTH=true
DEV_JWT_SECRET=<min-64-hex-chars: openssl rand -hex 32>
ENCRYPTION_KEY=<64 hex chars: openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=http://localhost:3111
STORAGE_ADAPTER=local
DATABASE_URL=postgresql://hearth:hearth_secret@db:5432/hearth?schema=public
DIRECT_URL=postgresql://hearth:hearth_secret@db:5432/hearth?schema=public
CRON_SECRET=local-cron-secret
```

### Production (Supabase)

```bash
USE_DEV_AUTH=false
NEXT_PUBLIC_USE_DEV_AUTH=false
ENCRYPTION_KEY=<64 hex chars>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
STORAGE_ADAPTER=supabase
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
CRON_SECRET=<strong random secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Supabase DB (pooler for queries, direct for migrations)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

# Payments
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_VARIANT_MONTHLY=...
LEMONSQUEEZY_VARIANT_YEARLY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

---

## Switching Between Local and Supabase

### To use local Docker DB:

```bash
USE_DEV_AUTH=true
NEXT_PUBLIC_USE_DEV_AUTH=true
STORAGE_ADAPTER=local
DATABASE_URL=postgresql://hearth:hearth_secret@db:5432/hearth?schema=public
DIRECT_URL=postgresql://hearth:hearth_secret@db:5432/hearth?schema=public
```

### To use Supabase:

```bash
USE_DEV_AUTH=false
NEXT_PUBLIC_USE_DEV_AUTH=false
STORAGE_ADAPTER=supabase
DATABASE_URL=postgresql://postgres.<ref>:<password>@...pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<ref>:<password>@...pooler.supabase.com:5432/postgres
```

After changing `.env`, always run:

```bash
docker compose up -d
```

> `docker compose restart` does NOT re-read `.env`. Always use `up -d` to recreate containers with new env vars.

---

## What Still Needs to Be Done for Production

| Task                                  | Details                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Verify domain in Resend**           | Required to send letter emails from a custom address (e.g. `hello@yourdomain.com`) instead of the sandbox address                                                                     |
| **Enable email confirmation**         | Turn ON "Confirm email" in Supabase → Auth → Providers → Email once Resend SMTP is configured                                                                                         |
| **Configure Resend SMTP in Supabase** | Supabase → Project Settings → Auth → SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key — so auth confirmation emails also go through Resend reliably |
| **Publish Google OAuth app**          | Currently in "Testing" mode — only test users can sign in. Submit for Google verification to allow all users                                                                          |
| **Set production Site URL**           | Supabase → Auth → URL Configuration → change Site URL from `localhost:3111` to your real domain                                                                                       |
| **Add production redirect URL**       | Add `https://yourdomain.com/**` to Supabase redirect URLs                                                                                                                             |
| **Set up Lemon Squeezy**              | Add billing env vars for subscription management                                                                                                                                      |
| **Set up cron jobs**                  | (1) Letter delivery — `GET /api/cron/deliver-letters` daily. (2) Reminder push — `GET /api/cron/send-reminders` every 15 minutes. Both use `Authorization: Bearer ${CRON_SECRET}` and are idempotent.                                          |
| **Storage bucket policy**             | Review Supabase Storage RLS policies for `entry-photos` bucket in production                                                                                                          |

---

## Local Development Setup

### Prerequisites

- Docker Desktop installed and running

### Start the app

```bash
docker compose up -d
```

App runs at [http://localhost:3111](http://localhost:3111)

### Database commands

```bash
docker compose exec app npx prisma migrate dev    # Create migration
docker compose exec app npx prisma db push        # Sync schema
docker compose exec app npx prisma studio         # Browse data (port 5555)
docker compose exec app npx tsx prisma/seed.ts    # Seed data
```

### View logs

```bash
docker compose logs -f app
```

### Install packages

```bash
docker compose exec app npm install <package>
```

---

## API Reference

### Entries

#### GET /api/entries

Fetch entries with pagination and filters.

| Parameter   | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| `cursor`    | string  | Entry ID for cursor-based pagination           |
| `limit`     | number  | Max entries to return (default: 20, max: 50)   |
| `month`     | string  | Filter by month (e.g., "2024-02")              |
| `year`      | string  | Filter by year (e.g., "2024")                  |
| `mood`      | string  | Filter by mood(s) (e.g., "3" or "2,3,4")       |
| `search`    | string  | Full-text search query                         |
| `today`     | boolean | Only return today's entries                    |
| `entryType` | string  | Filter by type (normal, letter, unsent_letter) |

#### POST /api/entries

Create a new journal entry.

#### PUT /api/entries/[id]

Update an existing entry. Supports append-only mode for time-locked entries.

#### PATCH /api/entries/[id]

Archive or unarchive an entry.

#### DELETE /api/entries/[id]

Two-step delete: first call archives, second call (with `?force=true`) permanently deletes.

---

## Architecture

### Authentication Flow

```
User visits protected route
        ↓
middleware.ts checks auth mode
        ↓
USE_DEV_AUTH=true          USE_DEV_AUTH=false
        ↓                          ↓
Verify JWT cookie        Supabase createServerClient
(hearth-auth-token)         → getUser()
        ↓                          ↓
    Allowed               Refresh session cookies
                                   ↓
                               Allowed
```

### Storage Flow

```
User adds photo to entry
        ↓
Client sends base64 data URL to API
        ↓
STORAGE_ADAPTER=local      STORAGE_ADAPTER=supabase
        ↓                          ↓
Save base64 in DB          Upload to Supabase Storage
                           → get public CDN URL
                           → save URL in DB
```

## License

Private project.
