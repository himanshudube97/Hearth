# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

**This project runs in Docker.** Always use Docker commands for development.

### Start the app
```bash
docker compose up -d
```

### Restart after code changes
```bash
docker compose restart app
```

### View logs
```bash
docker compose logs -f app
```

### Stop everything
```bash
docker compose down
```

### Database Commands
```bash
docker compose exec app npx prisma migrate dev    # Create migration
docker compose exec app npx prisma db push        # Sync schema without migration
docker compose exec app npx prisma studio         # Browse data (opens at :5555)
docker compose exec app npx tsx prisma/seed.ts    # Seed data
```

**Important:** Never create migrations that delete data. When modifying schema, use additive changes (new columns with defaults, new optional fields). If Prisma warns about data loss, find an alternative approach.

### Installing Packages
The container has its own `node_modules` volume (separate from host). To install packages:
```bash
docker compose exec app npm install <package-name>
```
Or rebuild after adding to package.json:
```bash
docker compose up -d --build
```

### Build & Lint
```bash
npm run dev      # Turbopack dev server (use Docker instead for full stack)
npm run build    # Production build
npm run lint     # ESLint check
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Editor**: TipTap rich text editor
- **Animations**: Framer Motion v12
- **State**: Zustand stores
- **Payments**: Lemon Squeezy
- **Email**: Resend
- **Auth**: Dev JWT (local) / Supabase OAuth (production)

### Path Alias
`@/*` → `./src/*` (configured in tsconfig.json)

### Key Directories
```
src/
├── app/api/          # API routes (entries, auth, letters, billing, cron)
├── components/       # React components
├── hooks/            # useEntries (cursor pagination), useSubscription
├── lib/              # Core utilities
│   ├── auth/         # getCurrentUser(), dev-auth, supabase clients
│   ├── db.ts         # Prisma singleton
│   ├── encryption.ts # AES-256-GCM encrypt/decrypt
│   ├── themes.ts     # 10 themes with colors, particles, whispers
│   ├── lemonsqueezy.ts
│   └── email.ts      # HTML email templates
└── store/            # Zustand: theme, auth, cursor, journal, profile
```

### Database Models (Prisma)
- **User**: Auth, profile JSON, Lemon Squeezy subscription fields
- **JournalEntry**: Core model with mood (0-4), entryType (normal/letter/unsent_letter/ephemeral), encryption fields, letter-specific fields (recipientEmail, unlockDate, isSealed, isDelivered)
- **Doodle**: Strokes as JSON, linked to entries

### Authentication Flow
- `middleware.ts` protects routes, redirects unauthenticated users
- Public paths: `/`, `/login`, `/pricing`, `/api/auth/*`, `/api/webhooks/*`
- Dev mode (`USE_DEV_AUTH=true`): JWT in `hearth-auth-token` cookie
- Production: Supabase OAuth with auto user creation

### Encryption Pattern
Entry text and letter metadata are encrypted with AES-256-GCM:
- Format: `iv:authTag:encryptedData` (hex)
- Encrypt on save, decrypt on retrieve (see `lib/encryption.ts`)
- Fields: `text`, `textPreview`, letter recipient info

### Letters Feature
Time-delayed letters to self or friends:
- Minimum 1 week delay, stored with `unlockDate` and `isSealed=true`
- Daily cron (`/api/cron/deliver-letters`) processes due letters
- Self letters: notification email + reveal modal on app open
- Friend letters: beautiful HTML email via Resend

### API Patterns
- Entries use cursor-based pagination for scalability
- Stats endpoint provides aggregated year/month data
- Letter delivery processes 50 at a time to avoid timeouts
- All API routes use `getCurrentUser()` from `@/lib/auth` for authentication

### Themes System
10 themes in `lib/themes.ts`, each with:
- Color palette (background, text, accent)
- Particle effects (snow, fireflies, sakura, rain, stars, etc.)
- Theme-specific "whispers" (writing prompts)

### Component Patterns
- `Background.tsx`: Renders theme-specific particles/effects
- `Editor.tsx`: TipTap editor with song embed and doodle support
- `MoodPicker.tsx`: 5-level mood selector (0=Heavy → 4=Radiant)
- Zustand stores persist to localStorage for theme/cursor preferences

### Journal Entry Editing Rules (Append-Only)
Entries follow an **append-only** editing model:
- **New entry**: Full page available for writing. Music/photo/doodle inputs are shown but don't waste space.
- **Saved entries**: Existing content (text, photos, doodles, music) is **read-only and cannot be overwritten**.
- **Empty slots are fillable**: If a saved entry has no song, photo, or doodle, the user can add them later. If empty lines remain on the page, the user can write there.
- **Never overwrite**: Users can only ADD to empty spaces. If a photo exists, it can't be replaced. If lines have text, they can't be edited. Only empty areas are interactive.

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth (pick one)
USE_DEV_AUTH=true
DEV_JWT_SECRET=<min-32-chars>
# OR
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Encryption
ENCRYPTION_KEY=<64 hex chars: openssl rand -hex 32>

# Payments
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_VARIANT_MONTHLY=...
LEMONSQUEEZY_VARIANT_YEARLY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# Email & Cron
RESEND_API_KEY=...
CRON_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3111
```
