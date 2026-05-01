# Letters Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/letters` flat-grid UI with a postal-themed two-surface experience (combined `letters` tab with desk + postbox + reveal ceremony, and a year-tabbed `sent` stamp album) per the design spec at `docs/superpowers/specs/2026-05-01-letters-redesign-design.md`.

**Architecture:** Tab-based page (`/letters`) hosts two views — `InboxView` (combined write CTA on left + postbox/lamp on right with month/year placards, fanout, and a first-time reveal modal) and `SentView` (year-tabbed single-viewport stamp album with a receipt modal). All visuals are CSS + inline SVG, theme-driven via `theme.bg.gradient` / `theme.accent.*`. The compose flow is refactored into a full-screen modal (envelope flip + write + fold & seal). Schema gets one new nullable column (`letterPeekedAt`); the existing `isViewed` boolean tracks the unread/read state for the reveal ceremony.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma + PostgreSQL, Framer Motion, Zustand, TipTap. Project runs in Docker — all package/build/migrate commands prefix with `docker compose exec app`.

**Visual contract:** `/tmp/hearth-letters-demo.html` (single self-contained HTML — open in browser to inspect any visual detail, copy CSS verbatim where indicated). **Task 0** copies this into the repo so it's stable.

---

## File structure

### Files to create

```
src/components/letters/
├── LettersNav.tsx                    # [letters · sent] tab pills
├── inbox/
│   ├── InboxView.tsx                 # root: layout + scene + state
│   ├── PostalSky.tsx                 # sun, hills, village, particles (background ambience)
│   ├── Lamp.tsx                      # ported lamp SVG (re-exports markup; reuses LeftLamp visual)
│   ├── Postbox.tsx                   # dome+brim+body+hood+slot+pincode+bands+swoosh+base shell
│   ├── PostboxControls.tsx           # year + month placards (◁ 2026 ▷ / ◁ MAY ▷)
│   ├── LetterFanout.tsx              # letters that emerge from the slot, click to open
│   ├── WriteCard.tsx                 # left-side begin-a-letter card
│   ├── TopHint.tsx                   # persistent hint banner with 'N new' badge
│   ├── NewLetterTag.tsx              # dangling 'N new ✦' tag from the slot when month has unread
│   └── RevealModal.tsx               # first-time reveal ceremony (sealed → wax cracks → unfurl)
├── sent/
│   ├── SentView.tsx                  # root: header + year tabs + album grid
│   ├── YearTabs.tsx                  # year-tab pills with counts
│   ├── StampGrid.tsx                 # single-viewport grid (auto-fill 108px)
│   ├── Stamp.tsx                     # individual postage stamp + corner mounts
│   └── ReceiptModal.tsx              # receipt modal + 'peek at letter' affordance
├── compose/
│   ├── ComposeModal.tsx              # full-screen modal: envelope flip + steps
│   ├── EnvelopeFront.tsx             # address step (recipient toggle, name, unlock-when pills)
│   └── LetterInside.tsx              # writing step (refactor of existing LetterPaper)
└── lettersData.ts                    # client-side helpers: groupByMonth, groupByYear, unread filters

src/app/api/letters/
├── inbox/route.ts                    # GET — letters where unlockDate has passed, grouped by month
├── sent/route.ts                     # GET — letters the user sent, grouped by year
└── [id]/
    ├── read/route.ts                 # POST — sets isViewed = true (idempotent)
    └── peek/route.ts                 # POST — sets letterPeekedAt; returns decrypted body

prisma/migrations/<timestamp>_add_letter_peeked_at/migration.sql

docs/letters-redesign-demo.html       # stable copy of /tmp/hearth-letters-demo.html
```

### Files to modify

```
prisma/schema.prisma                  # add letterPeekedAt
src/app/letters/page.tsx              # rewrite as tabs orchestrator (LettersNav + InboxView + SentView)
src/components/letters/letterTypes.ts # add InboxLetter + SentStamp types if not already covered
```

### Files to delete (Stage 8 — final cleanup)

```
src/components/letters/SealedLetterList.tsx
src/components/letters/SealedLetterTile.tsx
src/components/letters/LetterWriteView.tsx
src/components/letters/RecipientSidebar.tsx
src/components/LetterReveal.tsx                # superseded by inbox/RevealModal.tsx
src/components/LetterArrivedBanner.tsx         # superseded by TopHint badge
```

`src/components/letters/LetterPaper.tsx` and `src/components/letters/TuckedIn.tsx` are absorbed into `compose/LetterInside.tsx` and may be deleted at end of Stage 7.

---

## Project commands cheat-sheet

```bash
# Restart app after code changes
docker compose restart app

# Logs
docker compose logs -f app

# Type-check (we use this in lieu of unit tests for most front-end work)
docker compose exec app npm run build

# Lint
docker compose exec app npm run lint

# Prisma migrations
docker compose exec app npx prisma migrate dev --name <name>
docker compose exec app npx prisma generate

# Seed (if needed during dev)
docker compose exec app npx tsx prisma/seed.ts
```

**Project policy on commits (from CLAUDE.md):** Never commit unless the user explicitly approves. Each stage below ends with a "Stage commit checkpoint" — a ready-to-run commit message; **ask the user before running it**.

---

# Stage 0 — Anchor the visual contract

The demo HTML at `/tmp/hearth-letters-demo.html` is in a temp directory and could be wiped. Move it into the repo as the authoritative reference for visuals during implementation.

### Task 0.1: Stabilize the demo file

**Files:**
- Create: `docs/letters-redesign-demo.html`

- [ ] **Step 1: Copy demo into the repo**

```bash
cp /tmp/hearth-letters-demo.html /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/docs/letters-redesign-demo.html
```

- [ ] **Step 2: Verify it renders**

```bash
open /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/docs/letters-redesign-demo.html
```

Expected: same demo opens (rose theme, 2 new letters in May, etc.). Theme switcher, month/year placards, reveal ceremony, sent year tabs, receipt modal — all working.

- [ ] **Step 3: Stage commit checkpoint** (ask user before running)

```bash
git add docs/letters-redesign-demo.html docs/superpowers/specs/2026-05-01-letters-redesign-design.md docs/superpowers/plans/2026-05-01-letters-redesign.md
git commit -m "$(cat <<'EOF'
docs(letters): add letters redesign spec, plan, and visual demo

Spec captures the design decisions from brainstorming. Demo HTML is the
visual contract for implementation — open in any browser to inspect
postbox/lamp/fanout/reveal/sent ceremony details.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Stage 1 — Schema + API foundation

Backend-only changes that make `inbox`/`sent` queries possible and let the client mark letters as read or peeked. No UI work in this stage.

### Task 1.1: Schema migration — add `letterPeekedAt`

**Files:**
- Modify: `prisma/schema.prisma:42-93` (the `JournalEntry` model)
- Create: `prisma/migrations/<timestamp>_add_letter_peeked_at/migration.sql` (Prisma generates)

- [ ] **Step 1: Add the field to the schema**

In `prisma/schema.prisma`, inside `model JournalEntry`, add a new line just below the existing `isViewed` line (~line 68):

```prisma
  isViewed       Boolean   @default(false) // Has the user viewed this letter after it arrived
  letterPeekedAt DateTime? // Set when user breaks seal early via the 'peek' affordance from /sent
```

- [ ] **Step 2: Generate the migration**

```bash
docker compose exec app npx prisma migrate dev --name add_letter_peeked_at
```

Expected output: `Your database is now in sync with your schema.` and a new migration file under `prisma/migrations/<timestamp>_add_letter_peeked_at/migration.sql`.

- [ ] **Step 3: Verify the migration file is additive (no DROP)**

```bash
cat prisma/migrations/*add_letter_peeked_at/migration.sql
```

Expected: a single `ALTER TABLE "journal_entries" ADD COLUMN "letterPeekedAt" TIMESTAMP(3);` statement. **If you see any DROP or `NOT NULL` without a default, stop and fix.** (Per project rules, never create migrations that destroy data.)

- [ ] **Step 4: Confirm Prisma client regenerated**

```bash
docker compose exec app npx prisma generate
```

Expected: `Generated Prisma Client` message. Type `letterPeekedAt?: Date | null` should now appear in any `JournalEntry` type.

### Task 1.2: Inbox API endpoint

**Files:**
- Create: `src/app/api/letters/inbox/route.ts`

- [ ] **Step 1: Write the route handler**

```ts
// src/app/api/letters/inbox/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

interface InboxLetter {
  id: string
  recipientName: string | null   // 'future me' for self-letters; recipient name for friend-letters
  sealedAt: string                // createdAt ISO
  unlockDate: string | null       // ISO
  isViewed: boolean
  // Body is NOT included — it's only fetched on open via /api/entries/[id]
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Letters that have unlocked AND are addressed to the current user.
  // Self-letters: entryType in ('letter','unsent_letter') AND userId = user
  // Friend letters received: isReceivedLetter = true AND userId = user
  const now = new Date()
  const letters = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      OR: [
        // self-sealed letters that have hit their unlock date
        { entryType: 'letter', isSealed: true, unlockDate: { lte: now } },
        // friend-letters that arrived in this user's account (isReceivedLetter set on insert by cron)
        { isReceivedLetter: true },
      ],
    },
    orderBy: { unlockDate: 'desc' },
    select: {
      id: true,
      recipientName: true,
      createdAt: true,
      unlockDate: true,
      isViewed: true,
      encryptionType: true,
    },
  })

  // recipientName is encrypted at rest for friend-letters; decrypt for display.
  const result: InboxLetter[] = letters.map(l => ({
    id: l.id,
    recipientName: l.recipientName && l.encryptionType === 'server'
      ? safeDecrypt(l.recipientName)
      : l.recipientName,
    sealedAt: l.createdAt.toISOString(),
    unlockDate: l.unlockDate ? l.unlockDate.toISOString() : null,
    isViewed: l.isViewed,
  }))

  return NextResponse.json({ letters: result })
}

function safeDecrypt(s: string): string {
  try { return decrypt(s) } catch { return s }
}
```

- [ ] **Step 2: Verify build + type-check**

```bash
docker compose exec app npm run build
```

Expected: build succeeds. If it fails on `getCurrentUser` or `decrypt` paths, check imports against `src/lib/auth/index.ts` and `src/lib/encryption.ts`.

- [ ] **Step 3: Smoke-test in browser** (after `docker compose up -d`)

Visit http://localhost:3111/api/letters/inbox in a logged-in browser tab. Expected: JSON `{ letters: [...] }` with letters that have already unlocked, no body content.

### Task 1.3: Sent API endpoint

**Files:**
- Create: `src/app/api/letters/sent/route.ts`

- [ ] **Step 1: Write the route handler**

```ts
// src/app/api/letters/sent/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

interface SentStamp {
  id: string
  recipientName: string | null
  sealedAt: string                // createdAt ISO
  unlockDate: string | null
  isDelivered: boolean
  letterPeekedAt: string | null
  // Stamp metadata only — content stays sealed until delivery.
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const letters = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      isSealed: true,
      entryType: { in: ['letter', 'unsent_letter'] },
      // Exclude letters that arrived in this account from someone else
      isReceivedLetter: false,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      recipientName: true,
      createdAt: true,
      unlockDate: true,
      isDelivered: true,
      letterPeekedAt: true,
      encryptionType: true,
    },
  })

  const result: SentStamp[] = letters.map(l => ({
    id: l.id,
    recipientName: l.recipientName && l.encryptionType === 'server'
      ? safeDecrypt(l.recipientName)
      : l.recipientName,
    sealedAt: l.createdAt.toISOString(),
    unlockDate: l.unlockDate ? l.unlockDate.toISOString() : null,
    isDelivered: l.isDelivered,
    letterPeekedAt: l.letterPeekedAt ? l.letterPeekedAt.toISOString() : null,
  }))

  return NextResponse.json({ stamps: result })
}

function safeDecrypt(s: string): string {
  try { return decrypt(s) } catch { return s }
}
```

- [ ] **Step 2: Verify build**

```bash
docker compose exec app npm run build
```

Expected: succeeds.

- [ ] **Step 3: Smoke-test**

Visit http://localhost:3111/api/letters/sent. Expected: `{ stamps: [...] }` with sent letters in reverse-chronological order.

### Task 1.4: Mark-as-read endpoint

**Files:**
- Create: `src/app/api/letters/[id]/read/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/letters/[id]/read/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Only mark letters owned by this user. updateMany returns count instead of throwing.
  const result = await prisma.journalEntry.updateMany({
    where: { id, userId: user.id, isViewed: false },
    data: { isViewed: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
```

- [ ] **Step 2: Verify build**

```bash
docker compose exec app npm run build
```

- [ ] **Step 3: Smoke-test with curl**

```bash
# In a logged-in browser, copy the value of the 'hearth-auth-token' cookie, then:
curl -X POST http://localhost:3111/api/letters/<some-real-letter-id>/read \
  -H "Cookie: hearth-auth-token=<your-token>"
```

Expected: `{ "ok": true, "updated": 1 }` first time; `{ "ok": true, "updated": 0 }` on repeat (idempotent).

### Task 1.5: Peek-at-sealed endpoint

**Files:**
- Create: `src/app/api/letters/[id]/peek/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/letters/[id]/peek/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const letter = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id, isSealed: true },
    select: { id: true, text: true, encryptionType: true, letterPeekedAt: true },
  })
  if (!letter) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Mark first peek (idempotent — leave existing timestamp alone).
  if (!letter.letterPeekedAt) {
    await prisma.journalEntry.update({
      where: { id },
      data: { letterPeekedAt: new Date() },
    })
  }

  const body = letter.encryptionType === 'server' ? safeDecrypt(letter.text) : letter.text
  return NextResponse.json({ body })
}

function safeDecrypt(s: string): string {
  try { return decrypt(s) } catch { return s }
}
```

- [ ] **Step 2: Build + smoke-test**

```bash
docker compose exec app npm run build
curl -X POST http://localhost:3111/api/letters/<id>/peek \
  -H "Cookie: hearth-auth-token=<your-token>"
```

Expected: `{ "body": "<plaintext letter content>" }`. Run twice — `letterPeekedAt` gets set the first time and stays unchanged the second.

### Task 1.6: Stage commit checkpoint

- [ ] **Step 1: Ask user to confirm commit**

> "Stage 1 (schema + API) is done. Tested locally? Should I commit?"

- [ ] **Step 2: On approval, commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/app/api/letters/
git commit -m "$(cat <<'EOF'
feat(letters): add inbox/sent endpoints and read/peek tracking

Adds GET /api/letters/inbox (received letters that have unlocked) and
GET /api/letters/sent (sent stamps with delivery status). New POST
endpoints mark letters read on first reveal and peeked when the user
breaks the seal early. Schema gets one nullable letterPeekedAt column;
the existing isViewed boolean tracks read state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Stage 2 — Letters page shell + tab nav

Establish the new `/letters` page structure with two tabs: `letters` (default) and `sent`. The two tab views are placeholder shells in this stage; we fill them in Stages 3–7.

### Task 2.1: Type definitions

**Files:**
- Modify: `src/components/letters/letterTypes.ts`

- [ ] **Step 1: Add new types at the bottom of the file**

Append to `src/components/letters/letterTypes.ts`:

```ts
// === New v2 types ===

export interface InboxLetter {
  id: string
  recipientName: string | null
  sealedAt: string       // ISO
  unlockDate: string | null
  isViewed: boolean
}

export interface SentStamp {
  id: string
  recipientName: string | null
  sealedAt: string
  unlockDate: string | null
  isDelivered: boolean
  letterPeekedAt: string | null
}

export type LettersTab = 'inbox' | 'sent'
```

- [ ] **Step 2: Verify build**

```bash
docker compose exec app npm run build
```

### Task 2.2: Tab nav component

**Files:**
- Create: `src/components/letters/LettersNav.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/letters/LettersNav.tsx
'use client'

import type { LettersTab } from './letterTypes'

interface Props {
  active: LettersTab
  onChange: (t: LettersTab) => void
  newCount?: number   // count of unread inbox letters; shown on the 'letters' tab
}

export default function LettersNav({ active, onChange, newCount = 0 }: Props) {
  return (
    <nav
      className="
        fixed top-[18px] left-1/2 -translate-x-1/2 z-[80]
        flex items-center gap-1
        rounded-full p-[5px]
        bg-[var(--paper-1)] border border-[var(--paper-2)]
        shadow-[0_10px_30px_rgba(0,0,0,0.12)]
      "
    >
      {(['inbox', 'sent'] as LettersTab[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`
            px-[22px] py-[7px] pb-[9px] rounded-full
            font-serif text-[14px] tracking-wide lowercase
            transition-colors
            ${active === t
              ? 'bg-[var(--accent-primary)] text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)] font-medium'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--paper-2)]'}
          `}
        >
          {t === 'inbox' ? 'letters' : 'sent'}
          {t === 'inbox' && newCount > 0 && (
            <span
              className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs"
              style={{
                background: active === 'inbox' ? 'rgba(255,255,255,0.25)' : 'var(--accent-primary)',
                color: '#fff',
                fontFamily: 'var(--font-caveat), Caveat, cursive',
              }}
            >
              {newCount} new
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
docker compose exec app npm run build
```

### Task 2.3: Rewrite the page

**Files:**
- Modify: `src/app/letters/page.tsx`

- [ ] **Step 1: Replace contents**

```tsx
// src/app/letters/page.tsx
'use client'

import { useState } from 'react'
import LettersNav from '@/components/letters/LettersNav'
import InboxView from '@/components/letters/inbox/InboxView'
import SentView from '@/components/letters/sent/SentView'
import type { LettersTab } from '@/components/letters/letterTypes'

export default function LettersPage() {
  const [tab, setTab] = useState<LettersTab>('inbox')
  const [newCount, setNewCount] = useState(0)

  return (
    <>
      <LettersNav active={tab} onChange={setTab} newCount={newCount} />
      {tab === 'inbox'
        ? <InboxView onUnreadCountChange={setNewCount} />
        : <SentView />}
    </>
  )
}
```

- [ ] **Step 2: Create stub `InboxView` and `SentView` so the page renders**

Create `src/components/letters/inbox/InboxView.tsx`:

```tsx
'use client'
interface Props { onUnreadCountChange: (n: number) => void }
export default function InboxView(_props: Props) {
  return <div style={{ padding: 120, textAlign: 'center' }}>InboxView (stub)</div>
}
```

Create `src/components/letters/sent/SentView.tsx`:

```tsx
'use client'
export default function SentView() {
  return <div style={{ padding: 120, textAlign: 'center' }}>SentView (stub)</div>
}
```

- [ ] **Step 3: Visually verify**

```bash
docker compose restart app
```

Visit http://localhost:3111/letters. Expected: a top tab pill bar with `letters` and `sent`. Clicking switches between the two stubs.

### Task 2.4: Stage commit checkpoint

- [ ] **Step 1: Ask user**

> "Stage 2 (page shell + nav) is done. Tabs switch between stubs. Should I commit?"

- [ ] **Step 2: On approval**

```bash
git add src/app/letters/page.tsx src/components/letters/LettersNav.tsx src/components/letters/letterTypes.ts src/components/letters/inbox/InboxView.tsx src/components/letters/sent/SentView.tsx
git commit -m "feat(letters): add letters/sent tab nav and page shell

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 3 — Inbox view: ambience + lamp + postbox shell

Build the right-zone scene: theme-tinted sky, hills, drifting particles, the ported Victorian lamp, and the Indian-pillar postbox shell. No data fetching yet, no fanout, no controls — just the scenery.

### Task 3.1: Theme-driven CSS variables

**Files:**
- Modify: `src/app/letters/page.tsx` (or a new `src/components/letters/letters-tokens.tsx` — see step 1)

We need the CSS variables (`--paper-1`, `--postbox-1/2/3`, `--shelf`, etc.) the demo uses. They derive from the active theme. We'll inject them via inline `<style>` driven by `useThemeStore`.

- [ ] **Step 1: Create a Tokens component**

Create `src/components/letters/LettersTokens.tsx`:

```tsx
// src/components/letters/LettersTokens.tsx
'use client'

import { useThemeStore } from '@/store/theme'
import { useMemo } from 'react'

/**
 * Injects CSS variables that the letters surfaces consume. Derived from
 * the active theme — keeps the demo's palette names but always tracks the
 * real theme. Mount once at the top of LettersPage.
 */
export default function LettersTokens() {
  const theme = useThemeStore(s => s.theme)
  const css = useMemo(() => {
    const a = theme.accent
    const t = theme.text
    return `:root {
      --bg-1: ${theme.bg.primary};
      --bg-2: ${theme.bg.secondary};
      --text-primary: ${t.primary};
      --text-secondary: ${t.secondary};
      --text-muted: ${t.muted};
      --accent-primary: ${a.primary};
      --accent-secondary: ${a.secondary};
      --accent-warm: ${a.warm};
      --accent-highlight: ${a.highlight};
      --paper-1: color-mix(in oklab, ${theme.bg.primary} 80%, white);
      --paper-2: ${theme.bg.secondary};
      --paper-album: color-mix(in oklab, ${theme.bg.secondary} 70%, ${theme.bg.primary});
      --shelf: ${theme.cover};
      --postbox-1: ${a.warm};
      --postbox-2: ${a.primary};
      --postbox-3: ${a.secondary};
    }`
  }, [theme])
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
```

- [ ] **Step 2: Mount it in the page**

In `src/app/letters/page.tsx`, add `<LettersTokens />` just after the opening fragment:

```tsx
import LettersTokens from '@/components/letters/LettersTokens'
// ...
return (
  <>
    <LettersTokens />
    <LettersNav .../>
    {/* ... */}
  </>
)
```

- [ ] **Step 3: Verify in browser**

Restart, visit `/letters`, open devtools → Elements → `<html>` → check that the variables show up under computed styles. Switch the theme via your settings panel — variables should change.

### Task 3.2: Background ambience

**Files:**
- Create: `src/components/letters/inbox/PostalSky.tsx`

- [ ] **Step 1: Create the component**

Use the demo's ambient scene as reference — sun, hills, village, particles. The CSS for `.sun`, `.hills`, `.village`, `.village-windows`, `.ground-line`, `.particle` all live in `docs/letters-redesign-demo.html`. Port them verbatim into a `<style jsx>` block (or a co-located CSS module).

```tsx
// src/components/letters/inbox/PostalSky.tsx
'use client'

import { useThemeStore } from '@/store/theme'
import { useEffect, useRef } from 'react'

export default function PostalSky() {
  const particlesKind = useThemeStore(s => s.theme.particles)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const host = ref.current
    host.innerHTML = ''  // clear previous theme particles on theme change
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div')
      p.className = `particle p-${particlesKind}`
      p.style.left = `${Math.random() * 100}vw`
      p.style.top = `${-10 + Math.random() * 30}vh`
      p.style.animationDelay = `${-Math.random() * 22}s`
      p.style.animationDuration = `${16 + Math.random() * 14}s`
      host.appendChild(p)
    }
  }, [particlesKind])

  return (
    <>
      <div className="ps-sun" />
      <div className="ps-hills" />
      <div className="ps-village" />
      <div className="ps-village-windows" />
      <div className="ps-ground-line" />
      <div ref={ref} aria-hidden />
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           The styles named .sun, .hills, .village, .village-windows,
           .ground-line, .particle, @keyframes drift — but rename
           the class selectors to .ps-* to scope them to this component. */
      `}</style>
    </>
  )
}
```

> **Engineer note:** copy the CSS blocks for `.sun`, `.hills`, `.village`, `.village-windows`, `.ground-line`, `.particle`, `@keyframes drift`, plus the three `.particle` body styles in the demo's `respawnParticles` function (sakura petal / leaf / ocean foam) from `docs/letters-redesign-demo.html`. Rename the selectors to `.ps-*` to scope them. The `.particle` body styles can be expressed as `.p-sakura`, `.p-leaves`, `.p-foam` (or whatever theme.particles values exist — read from `themes.ts` for the full set).

- [ ] **Step 2: Mount the sky in the InboxView stub**

Replace `InboxView.tsx` body:

```tsx
'use client'
import PostalSky from './PostalSky'

interface Props { onUnreadCountChange: (n: number) => void }
export default function InboxView(_props: Props) {
  return (
    <section className="relative min-h-screen overflow-hidden"
             style={{ background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))' }}>
      <PostalSky />
    </section>
  )
}
```

- [ ] **Step 3: Visually verify**

Restart. Visit `/letters`. Expected: a soft sun-glow at top-left, theme-tinted hills with faint window-glows, particles drifting. Switch themes via settings — ambience changes.

### Task 3.3: Lamp component

**Files:**
- Create: `src/components/letters/inbox/Lamp.tsx`

The existing `src/components/constellation/garden/LeftLamp.tsx` has the lamp SVG with parallax. Copy its SVG markup but drop the parallax wrapper and stretch the height to 580px.

- [ ] **Step 1: Create the component**

```tsx
// src/components/letters/inbox/Lamp.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

/**
 * Standalone lamp for the letters inbox. Visually identical to the
 * constellation/garden LeftLamp (same SVG path data + halo layers),
 * but taller (580px) and without parallax.
 */
export default function Lamp() {
  const theme = useThemeStore(s => s.theme)
  return (
    <div className="relative w-[180px] h-[580px] pointer-events-none">
      {/* halo layers — same gradients as LeftLamp */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '5%', width: 280, height: 280, marginLeft: -140,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}55 0%,
            ${theme.accent.warm}33 25%,
            ${theme.accent.warm}11 50%,
            transparent 75%)`,
          filter: 'blur(4px)',
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '8%', width: 140, height: 140, marginLeft: -70,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}88 0%,
            ${theme.accent.highlight}22 50%,
            transparent 75%)`,
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      {/* SVG: copy verbatim from src/components/constellation/garden/LeftLamp.tsx
          (the <svg viewBox="0 0 220 800" ...> through </svg> block, lines 71-150).
          Replace the <motion.circle> motion-anims with <circle><animate> SMIL or keep motion. */}
    </div>
  )
}
```

> **Engineer note:** The lamp SVG is nontrivial. Open `src/components/constellation/garden/LeftLamp.tsx`, lines 71–150, and copy the inner `<svg>...</svg>` markup into the placeholder above. The two `<motion.circle>` bulb animations can stay as motion components or become SMIL `<animate>` tags — both work.

- [ ] **Step 2: Render it in InboxView**

Replace `InboxView` body:

```tsx
import Lamp from './Lamp'

return (
  <section className="relative min-h-screen overflow-hidden"
           style={{ background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))' }}>
    <PostalSky />
    <div className="relative z-[5] flex items-end justify-center w-full pt-[8%] pb-[8%]" style={{ minHeight: '100vh' }}>
      <Lamp />
    </div>
  </section>
)
```

- [ ] **Step 3: Visually verify**

Restart. Expected: tall lamp on the page with warm halo glow + flickering bulb. Switch themes — halo color changes.

### Task 3.4: Postbox shell (no controls yet)

**Files:**
- Create: `src/components/letters/inbox/Postbox.tsx`

- [ ] **Step 1: Create the structure**

Render the postbox layers (dome, brim, body, slot-hood, slot, pincode, mid band, swoosh, base). All visual details come from the demo. Don't include controls in this task — leave a slot for them.

```tsx
// src/components/letters/inbox/Postbox.tsx
'use client'

import { ReactNode } from 'react'

interface Props {
  /** Slot for PostboxControls (year/month placards). */
  children?: ReactNode
  onClick?: () => void
}

export default function Postbox({ children, onClick }: Props) {
  return (
    <div className="postbox-wrap relative cursor-pointer">
      <div className="postbox" onClick={onClick}>
        <div className="dome" />
        <div className="brim" />
        <div className="body" />
        <div className="slot-hood"><span>letters</span></div>
        <div className="slot" />
        <div className="pincode">HEARTH · 1</div>
        <div className="band-mid" />
        <div className="swoosh-area">
          <svg viewBox="0 0 56 16" width="44" height="13" aria-hidden>
            <path d="M3,11 Q11,2 19,9 Q27,15 35,5 Q43,1 53,9"
                  stroke="var(--accent-warm)" strokeWidth="3"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="53" cy="9" r="2.2" fill="var(--accent-warm)" />
          </svg>
          <span className="label">hearth post</span>
        </div>

        {/* Year + month placards inject here */}
        {children}

        <div className="band-base" />
      </div>
      <div className="pulse" />
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html === */
        /* The block of CSS rules from .postbox-wrap through @keyframes pulse,
           plus the .pb-controls / .pb-pill / .pb-arrow / .pb-value / @keyframes pbFlip.
           Search the demo for "Indian-pillar postbox parts" header — that's the start. */
      `}</style>
    </div>
  )
}
```

> **Engineer note:** copy CSS verbatim from `docs/letters-redesign-demo.html`: the section comment `/* ── Indian-pillar postbox parts ── */` and everything from `.postbox-wrap`, `.postbox`, `.dome`, `.brim`, `.body`, `.slot-hood`, `.slot`, `.pincode`, `.band-mid`, `.swoosh-area`, `.band-base`, `.pulse`, `@keyframes pulse`, `.pb-controls`, `.pb-pill`, `.pb-arrow`, `.pb-value`, `@keyframes pbFlip`. Paste into the `<style jsx>` block.

- [ ] **Step 2: Render it in InboxView next to the lamp**

```tsx
return (
  <section ...>
    <PostalSky />
    <div className="relative z-[5] flex items-end justify-center w-full pt-[8%] pb-[8%]" style={{ minHeight: '100vh' }}>
      <div className="flex items-end gap-[60px]">
        <Lamp />
        <Postbox />
      </div>
    </div>
  </section>
)
```

- [ ] **Step 3: Visually verify**

Restart. Expected: lamp + postbox side by side; pillar with letters hood, swoosh, dark bands. Compare against the demo (open `docs/letters-redesign-demo.html` side-by-side) — pixel-similar in proportions.

### Task 3.5: Stage commit checkpoint

- [ ] **Step 1: Ask user; on approval**

```bash
git add src/components/letters/inbox/ src/components/letters/LettersTokens.tsx src/app/letters/page.tsx
git commit -m "feat(letters): inbox scenery — sky, lamp, postbox shell

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 4 — Postbox controls + write card + data fetching

Hook the postbox up to real data. Add the year/month placards on the postbox face, the write card on the left, the top hint banner, and fetch from `/api/letters/inbox`.

### Task 4.1: Data utilities

**Files:**
- Create: `src/components/letters/lettersData.ts`

- [ ] **Step 1: Write the helpers**

```ts
// src/components/letters/lettersData.ts
import type { InboxLetter, SentStamp } from './letterTypes'

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const
export const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'] as const

/** Group inbox letters by `unlockDate` into year → month → letters[]. */
export function groupInboxByMonth(letters: InboxLetter[]) {
  const out: Record<number, Record<typeof MONTHS[number], InboxLetter[]>> = {}
  for (const l of letters) {
    if (!l.unlockDate) continue
    const d = new Date(l.unlockDate)
    const y = d.getFullYear()
    const m = MONTHS[d.getMonth()]
    if (!out[y]) out[y] = {} as Record<typeof MONTHS[number], InboxLetter[]>
    if (!out[y][m]) out[y][m] = []
    out[y][m].push(l)
  }
  return out
}

/** Group sent stamps by year of `sealedAt`. */
export function groupSentByYear(stamps: SentStamp[]) {
  const out: Record<number, SentStamp[]> = {}
  for (const s of stamps) {
    const y = new Date(s.sealedAt).getFullYear()
    if (!out[y]) out[y] = []
    out[y].push(s)
  }
  return out
}

/** Total unread (across all months/years). */
export function countUnread(letters: InboxLetter[]) {
  return letters.filter(l => !l.isViewed).length
}
```

- [ ] **Step 2: Verify build**

```bash
docker compose exec app npm run build
```

### Task 4.2: PostboxControls (year/month placards)

**Files:**
- Create: `src/components/letters/inbox/PostboxControls.tsx`

- [ ] **Step 1: Component implementation**

```tsx
// src/components/letters/inbox/PostboxControls.tsx
'use client'

import { useEffect, useState } from 'react'
import { MONTHS } from '../lettersData'

interface Props {
  year: number
  monthIdx: number
  yearMin: number
  yearMax: number
  /** highest selectable month in the current year (0-11). For the current real year, this is `today.getMonth()`. */
  monthMaxForCurrentYear: number
  onYearChange: (y: number) => void
  onMonthChange: (m: number) => void
}

export default function PostboxControls(p: Props) {
  const [yFlip, setYFlip] = useState(false)
  const [mFlip, setMFlip] = useState(false)

  useEffect(() => { setYFlip(true); const t = setTimeout(() => setYFlip(false), 320); return () => clearTimeout(t) }, [p.year])
  useEffect(() => { setMFlip(true); const t = setTimeout(() => setMFlip(false), 320); return () => clearTimeout(t) }, [p.monthIdx])

  const monthMax = p.year === p.yearMax ? p.monthMaxForCurrentYear : 11

  return (
    <div className="pb-controls" onClick={e => e.stopPropagation()}>
      <div className="pb-pill">
        <button className="pb-arrow"
                disabled={p.year <= p.yearMin}
                onClick={() => p.onYearChange(p.year - 1)}>◁</button>
        <span className={`pb-value${yFlip ? ' flip' : ''}`}>{p.year}</span>
        <button className="pb-arrow"
                disabled={p.year >= p.yearMax}
                onClick={() => p.onYearChange(p.year + 1)}>▷</button>
      </div>
      <div className="pb-pill">
        <button className="pb-arrow"
                disabled={p.monthIdx <= 0}
                onClick={() => p.onMonthChange(p.monthIdx - 1)}>◁</button>
        <span className={`pb-value${mFlip ? ' flip' : ''}`}>{MONTHS[p.monthIdx].toUpperCase()}</span>
        <button className="pb-arrow"
                disabled={p.monthIdx >= monthMax}
                onClick={() => p.onMonthChange(p.monthIdx + 1)}>▷</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into Postbox**

The `Postbox` component already accepts `children` (placards inject there). No changes needed to `Postbox.tsx`.

- [ ] **Step 3: Verify build**

### Task 4.3: WriteCard (left side)

**Files:**
- Create: `src/components/letters/inbox/WriteCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/inbox/WriteCard.tsx
'use client'

interface Props {
  onBegin: () => void
}

export default function WriteCard({ onBegin }: Props) {
  return (
    <div className="write-card flex-[0_0_360px] mb-[60px] text-left">
      <div className="icon-row text-[56px] tracking-[14px] mb-[14px]"
           style={{ color: 'var(--accent-primary)' }}>
        ✉ ✦ ✉
      </div>
      <h2 className="font-[var(--font-caveat),Caveat,cursive] font-medium text-[44px] mb-[8px]"
          style={{ color: 'var(--text-primary)' }}>
        start a letter
      </h2>
      <p className="italic text-[16px] leading-[1.6] mb-[30px]"
         style={{ color: 'var(--text-secondary)' }}>
        address the envelope, turn it over to write — then fold &amp; seal.<br />
        a stamp will land in your album. the letter will arrive on its day.
      </p>
      <button
        onClick={onBegin}
        className="rounded-full px-[28px] py-[12px] pb-[14px] text-[22px] font-[var(--font-caveat),Caveat,cursive] tracking-wide cursor-pointer text-white border-0"
        style={{ background: 'var(--accent-primary)', boxShadow: '0 8px 22px rgba(0,0,0,0.20)' }}
      >
        begin a letter →
      </button>
      <div className="mt-[30px] italic text-[13px]"
           style={{ color: 'var(--text-muted)' }}>
        or pick a recipient: <strong className="font-[var(--font-caveat),Caveat,cursive] not-italic text-[16px]"
                                       style={{ color: 'var(--text-primary)' }}>
          future me · someone close
        </strong>
      </div>
    </div>
  )
}
```

### Task 4.4: TopHint banner

**Files:**
- Create: `src/components/letters/inbox/TopHint.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/inbox/TopHint.tsx
'use client'

interface Props { newCount: number }

export default function TopHint({ newCount }: Props) {
  return (
    <div className="absolute top-[76px] left-1/2 -translate-x-1/2 z-[9] text-center pointer-events-none"
         style={{
           fontFamily: 'Cormorant Garamond, serif',
           fontStyle: 'italic',
           fontSize: 14,
           color: 'var(--text-secondary)',
           letterSpacing: 0.6,
           textShadow: '0 1px 2px rgba(255,255,255,0.5)',
         }}>
      {newCount > 0 && (
        <span
          className="new-badge"
          style={{
            display: 'inline-block', marginRight: 8,
            background: 'var(--accent-primary)', color: '#fff',
            fontStyle: 'normal',
            fontFamily: 'var(--font-caveat), Caveat, cursive',
            fontSize: 14, padding: '2px 10px 3px', borderRadius: 999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            verticalAlign: 'middle',
            animation: 'badgePulse 2.4s ease-in-out infinite',
          }}>
          {newCount} new
        </span>
      )}
      {newCount > 0 ? 'click the postbox to reveal your letters'
                    : 'click the postbox · pick a month with the arrows'}
      <style jsx>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 2px 6px rgba(0,0,0,0.18); }
          50%      { transform: scale(1.06); box-shadow: 0 4px 12px color-mix(in oklab, var(--accent-primary) 60%, transparent); }
        }
      `}</style>
    </div>
  )
}
```

### Task 4.5: NewLetterTag (dangling tag)

**Files:**
- Create: `src/components/letters/inbox/NewLetterTag.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/inbox/NewLetterTag.tsx
'use client'

interface Props { count: number }

export default function NewLetterTag({ count }: Props) {
  return (
    <div className={`new-tag${count > 0 ? ' show' : ''}`} aria-hidden>
      <div className="string" />
      <div className="label">{count} new ✦</div>
      <style jsx>{`
        .new-tag {
          position: absolute; top: 134px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none; z-index: 5;
          opacity: 0; transition: opacity .4s ease;
        }
        .new-tag.show { opacity: 1; }
        .string { width: 1px; height: 16px; background: rgba(0,0,0,0.5); }
        .label {
          background: var(--accent-primary); color: #fff;
          padding: 3px 9px 4px; border-radius: 2px;
          font-family: 'Caveat', cursive; font-size: 13px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          transform: rotate(-3deg);
          border: 1px solid color-mix(in oklab, var(--accent-secondary) 60%, transparent);
          white-space: nowrap;
          animation: tagSway 4s ease-in-out infinite;
          transform-origin: top center;
        }
        @keyframes tagSway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  )
}
```

### Task 4.6: Wire data fetching in InboxView

**Files:**
- Modify: `src/components/letters/inbox/InboxView.tsx`

- [ ] **Step 1: Replace InboxView with full implementation**

```tsx
// src/components/letters/inbox/InboxView.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import PostalSky from './PostalSky'
import Lamp from './Lamp'
import Postbox from './Postbox'
import PostboxControls from './PostboxControls'
import WriteCard from './WriteCard'
import TopHint from './TopHint'
import NewLetterTag from './NewLetterTag'
import { MONTHS, MONTH_NAMES, groupInboxByMonth, countUnread } from '../lettersData'
import type { InboxLetter } from '../letterTypes'

interface Props {
  onUnreadCountChange: (n: number) => void
}

export default function InboxView({ onUnreadCountChange }: Props) {
  const [letters, setLetters] = useState<InboxLetter[]>([])
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [monthIdx, setMonthIdx] = useState(today.getMonth())

  useEffect(() => {
    let cancelled = false
    fetch('/api/letters/inbox')
      .then(r => r.json())
      .then(d => { if (!cancelled) setLetters(d.letters || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => groupInboxByMonth(letters), [letters])

  // bounds for the dial
  const yearsWithLetters = Object.keys(grouped).map(Number)
  const yearMin = yearsWithLetters.length ? Math.min(...yearsWithLetters) : today.getFullYear()
  const yearMax = today.getFullYear()
  const monthMaxForCurrentYear = today.getMonth()

  // current month's letters
  const currentLetters: InboxLetter[] =
    grouped[year]?.[MONTHS[monthIdx]] ?? []

  const newCountTotal = countUnread(letters)
  const newInCurrent = currentLetters.filter(l => !l.isViewed).length

  useEffect(() => { onUnreadCountChange(newCountTotal) }, [newCountTotal, onUnreadCountChange])

  return (
    <section className="relative min-h-screen overflow-hidden"
             style={{ background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))' }}>
      <PostalSky />
      <TopHint newCount={newCountTotal} />

      <div className="relative z-[5] flex items-end justify-center w-full pt-[8%] pb-[8%]"
           style={{ minHeight: '100vh' }}>
        <div className="flex items-end gap-[60px] w-full px-[80px] justify-center">
          <WriteCard onBegin={() => alert('compose flow — Stage 7')} />

          <div className="flex items-end gap-[80px]">
            <Lamp />
            <Postbox onClick={() => {/* triggers fanout — Stage 5 */}}>
              <PostboxControls
                year={year}
                monthIdx={monthIdx}
                yearMin={yearMin}
                yearMax={yearMax}
                monthMaxForCurrentYear={monthMaxForCurrentYear}
                onYearChange={setYear}
                onMonthChange={setMonthIdx}
              />
              <NewLetterTag count={newInCurrent} />
            </Postbox>
          </div>
        </div>
      </div>

      {/* caption */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-center italic"
           style={{ fontFamily: 'Cormorant Garamond, serif',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    letterSpacing: 1.2 }}>
        — {MONTH_NAMES[monthIdx]} · {year} · {captionFor(currentLetters)} —
      </div>
    </section>
  )
}

function captionFor(letters: InboxLetter[]) {
  const total = letters.length
  const newC = letters.filter(l => !l.isViewed).length
  if (total === 0) return 'the box was empty'
  if (newC === total) return `${newC} new letter${newC === 1 ? '' : 's'} ✦ unread`
  if (newC > 0)      return `${newC} new · ${total - newC} read`
  return `${total} letter${total === 1 ? '' : 's'} arrived`
}
```

- [ ] **Step 2: Visually verify**

Restart. Visit `/letters`. Expected:
- Top hint banner shows badge + text
- Left: write card with "start a letter" + CTA
- Right: lamp + postbox with year/month placards
- Click placard arrows: year/month flip
- Caption beneath shows current month with count

Switch theme — everything re-tints.

### Task 4.7: Stage commit checkpoint

- [ ] **Step 1: Ask user; on approval**

```bash
git add src/components/letters/
git commit -m "feat(letters): inbox controls, write card, top hint, data fetch

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 5 — Letter fanout + reveal ceremony

The interactive heart of the inbox: letters fan out from the slot when the user clicks the postbox or picks a month, and clicking an unread letter triggers the first-time reveal ceremony.

### Task 5.1: LetterFanout component

**Files:**
- Create: `src/components/letters/inbox/LetterFanout.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/inbox/LetterFanout.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { InboxLetter } from '../letterTypes'

interface Props {
  letters: InboxLetter[]
  /** Triggered when a fanned letter is clicked — pass it back to InboxView for reveal modal. */
  onLetterClick: (l: InboxLetter) => void
  /** Bumped to re-trigger the fan animation (e.g. on month change). */
  triggerKey: number
}

const TILTS = [-3, 4, -5, 2, -1, 3]

export default function LetterFanout({ letters, onLetterClick, triggerKey }: Props) {
  const fanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fan = fanRef.current
    if (!fan) return
    fan.innerHTML = ''
    if (letters.length === 0) return

    letters.forEach((l, i) => {
      const isUnread = !l.isViewed
      const tilt = TILTS[i % TILTS.length]
      const el = document.createElement('div')
      el.className = `fan-letter${isUnread ? ' unread' : ''}`
      const sub = `${isUnread ? '✦ unread · ' : ''}arrived ${formatMonthDay(l.unlockDate)}`
      el.innerHTML = `
        <div class="addr">${escape(l.recipientName ?? 'future me')}<small>${sub}</small></div>
        <div class="seal"></div>
        <div class="arrived">${isUnread ? 'sealed' : 'arrived'}</div>
      `
      el.style.left = '-65px'
      el.style.bottom = '120px'
      el.style.transform = 'translate(-50%, 50%) rotate(0deg) scale(0.4)'
      el.style.opacity = '0'
      const offset = i - (letters.length - 1) / 2
      const finalRot = offset * 14 + tilt
      const finalX = -65 + offset * 80
      const finalY = -40 - Math.abs(offset) * 12
      const dur = isUnread ? 1.4 : 0.9
      const stagger = isUnread ? 280 : 180

      fan.appendChild(el)
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.transition = `transform ${dur}s cubic-bezier(.25,.7,.4,1), opacity 0.7s ease`
          el.style.transform = `translateY(${finalY}px) translateX(${finalX}px) rotate(${finalRot}deg) scale(1)`
          el.style.opacity = '1'
        }, i * stagger)
      })
      el.addEventListener('click', () => onLetterClick(l))
    })
  }, [letters, triggerKey, onLetterClick])

  return (
    <div ref={fanRef} className="fanout" aria-hidden={letters.length === 0}>
      <style jsx>{`
        .fanout {
          position: absolute; left: 50%; bottom: 28%;
          transform: translateX(-50%);
          width: 0; height: 0; z-index: 9; pointer-events: none;
        }
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .fan-letter, .fan-letter .seal, .fan-letter .addr, .fan-letter .arrived,
           .fan-letter.unread (and its glow / pulse keyframes), @keyframes unreadGlow,
           @keyframes sealPulse */
      `}</style>
    </div>
  )
}

function escape(s: string) { return s.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'} as any)[c]) }
function formatMonthDay(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}
```

> **Engineer note:** copy fanout-related CSS verbatim from the demo: `.fan-letter`, `.fan-letter .seal`, `.fan-letter .addr`, `.fan-letter .arrived`, `.fan-letter.unread`, `@keyframes unreadGlow`, `.fan-letter.unread .seal`, `@keyframes sealPulse`.

### Task 5.2: Mount fanout in InboxView

**Files:**
- Modify: `src/components/letters/inbox/InboxView.tsx`

- [ ] **Step 1: Add fanout state and component**

```tsx
// inside InboxView
import LetterFanout from './LetterFanout'

// state
const [fanTriggerKey, setFanTriggerKey] = useState(0)
const [revealLetter, setRevealLetter] = useState<InboxLetter | null>(null)

// re-fan when month/year/letters change
useEffect(() => { setFanTriggerKey(k => k + 1) }, [year, monthIdx, letters.length])

// inside JSX, just before the closing </section>:
<LetterFanout
  letters={currentLetters}
  triggerKey={fanTriggerKey}
  onLetterClick={setRevealLetter}
/>
```

Pass `onClick={() => setFanTriggerKey(k => k + 1)}` to `<Postbox>` so clicking the box re-fans.

- [ ] **Step 2: Visually verify**

Restart. Pick May (or whatever month has letters). Letters should fan out from the slot. Read letters cascade in 0.9s; unread letters cascade slower (1.4s) with a glow ring + pulsing seal. Click an unread letter → state change happens but no UI yet (next task wires the modal).

### Task 5.3: RevealModal — sealed envelope state

**Files:**
- Create: `src/components/letters/inbox/RevealModal.tsx`

- [ ] **Step 1: Component scaffolding**

```tsx
// src/components/letters/inbox/RevealModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { InboxLetter } from '../letterTypes'

interface Props {
  letter: InboxLetter | null
  onClose: () => void
  /** Called once when the user breaks the seal on an unread letter. Triggers /api/letters/[id]/read. */
  onMarkRead: (id: string) => void
}

export default function RevealModal({ letter, onClose, onMarkRead }: Props) {
  const [phase, setPhase] = useState<'sealed' | 'breaking' | 'opening' | 'shown'>('sealed')
  const [body, setBody] = useState<string>('')

  useEffect(() => {
    if (!letter) return
    // Reset phases each time a letter is opened.
    setPhase(letter.isViewed ? 'shown' : 'sealed')
    setBody('')
    // Always fetch the body when opening (we never embed in inbox API).
    fetch(`/api/entries/${letter.id}`)
      .then(r => r.json())
      .then(d => setBody(d?.entry?.text || d?.text || ''))
      .catch(() => setBody(''))
  }, [letter])

  if (!letter) return null

  function break_() {
    if (phase !== 'sealed') return
    setPhase('breaking')
    setTimeout(() => setPhase('opening'), 700)
    setTimeout(() => setPhase('shown'), 1500)
    if (!letter!.isViewed) onMarkRead(letter!.id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="reveal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <button className="reveal-close" onClick={onClose} aria-label="close">×</button>
      <div className="reveal-stage">
        <div className="reveal-meta">
          a letter <span className="from">from past you</span> · sealed {sealedLabel(letter.sealedAt)}
        </div>

        <div className={`reveal-env phase-${phase}`} onClick={break_}>
          <div className="env-back" />
          <div className={`env-letter${phase === 'shown' ? ' shown' : ''}`}>
            <div className="letter-salutation">{salutationFor(letter)}</div>
            <div className="letter-body">{body}</div>
            <div className="letter-sig">yours, <span style={{ textDecoration: 'underline dotted' }}>me</span></div>
          </div>
          <div className={`env-flap${phase !== 'sealed' && phase !== 'breaking' ? ' opened' : ''}`} />
          <div className={`env-seal${phase !== 'sealed' ? ' broken' : ''}`}>
            <div className={`wax-half left${phase !== 'sealed' ? ' broken' : ''}`} />
            <div className={`wax-half right${phase !== 'sealed' ? ' broken' : ''}`} />
            <div className="seal-mark">✦</div>
          </div>
        </div>

        {phase === 'sealed' && <div className="reveal-prompt">tap to break the seal</div>}
      </div>

      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           All rules under the comment "FIRST-TIME LETTER REVEAL":
           .reveal-overlay, .reveal-stage, .reveal-meta, .reveal-meta .from,
           @keyframes fadeIn, .reveal-env, @keyframes floatUp, .reveal-env::before,
           @keyframes haloPulse, .env-back, .env-flap, .env-flap.opened,
           .env-seal, .env-seal .wax-half, .env-seal .wax-half.left,
           .env-seal .wax-half.right, .env-seal .wax-half.broken.left,
           .env-seal .wax-half.broken.right, .env-seal .seal-mark,
           .env-seal.broken .seal-mark, .env-letter, .env-letter.shown,
           .env-letter .letter-salutation, .env-letter .letter-body,
           .env-letter .letter-sig, .reveal-prompt, .reveal-prompt.gone,
           @keyframes bob, .reveal-close.
           */
      `}</style>
    </div>
  )
}

function sealedLabel(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function salutationFor(l: InboxLetter): string {
  const r = l.recipientName ?? 'future me'
  if (r.startsWith('to ')) return `Dear ${r.slice(3)},`
  return r === 'future me' ? 'Dear future me,' : `Dear ${r},`
}
```

- [ ] **Step 2: Wire it in InboxView**

```tsx
// At bottom of InboxView's JSX:
<RevealModal
  letter={revealLetter}
  onClose={() => setRevealLetter(null)}
  onMarkRead={(id) => {
    fetch(`/api/letters/${id}/read`, { method: 'POST' }).catch(() => {})
    setLetters(ls => ls.map(l => l.id === id ? { ...l, isViewed: true } : l))
  }}
/>
```

- [ ] **Step 3: Visually verify**

Restart. Click an unread May letter. Expected:
- Overlay fades in
- Caption: *"a letter from past you · sealed [date]"*
- Sealed envelope appears with red wax seal
- Prompt: *"tap to break the seal"*
- Click envelope: wax halves fly apart, flap opens, letter slides up + scales, content visible
- Close (× or Escape): modal dismisses, letter is now `read` — orange glow gone, badge count drops

Click an already-read April letter: modal opens with seal already broken, content immediately visible.

### Task 5.4: Wax-particle burst (polish)

**Files:**
- Modify: `src/components/letters/inbox/RevealModal.tsx`

- [ ] **Step 1: Add particle burst on `break_`**

In `break_()`, after `setPhase('breaking')`:

```tsx
function break_() {
  if (phase !== 'sealed') return
  setPhase('breaking')
  emitWaxParticles()  // NEW
  setTimeout(() => setPhase('opening'), 700)
  setTimeout(() => setPhase('shown'), 1500)
  if (!letter!.isViewed) onMarkRead(letter!.id)
}

function emitWaxParticles() {
  const env = document.querySelector('.reveal-env')
  if (!env) return
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div')
    p.className = 'wax-particle fly'
    const angle = (i / 8) * Math.PI * 2
    const dist = 40 + Math.random() * 30
    p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`)
    env.appendChild(p)
    setTimeout(() => p.remove(), 1000)
  }
}
```

- [ ] **Step 2: Add the `.wax-particle` CSS** to the `<style jsx>` block (copy from demo: `.wax-particle`, `.wax-particle.fly`, `@keyframes particleFly`).

- [ ] **Step 3: Visually verify**

Click an unread letter. The wax break now sprays 8 small particles in a radial pattern.

### Task 5.5: Stage commit checkpoint

- [ ] **Step 1: Ask user; on approval**

```bash
git add src/components/letters/inbox/
git commit -m "feat(letters): fanout + first-time reveal ceremony

Letters emerge from the postbox slot with a fanned cascade. Unread letters
arrive slower with a warm glow. Clicking an unread letter opens a sealed
envelope; tapping breaks the wax seal (radial particle burst), the flap
rotates open, and the letter slides up and unfurls. Re-reads skip the
ceremony and show content immediately. Marking-as-read posts to the new
endpoint and updates local state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 6 — Sent surface (year-tabbed stamp album)

Build the `sent` view: year-tabbed single-viewport stamp album with corner-mounted stamps and a receipt modal. No scrolling.

### Task 6.1: YearTabs

**Files:**
- Create: `src/components/letters/sent/YearTabs.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/sent/YearTabs.tsx
'use client'

interface Props {
  years: number[]
  active: number
  countByYear: Record<number, number>
  onChange: (y: number) => void
}

export default function YearTabs({ years, active, countByYear, onChange }: Props) {
  return (
    <div className="year-tabs">
      {years.map(y => (
        <button
          key={y}
          className={`year-tab${y === active ? ' active' : ''}`}
          onClick={() => onChange(y)}
        >
          {y} <span className="yt-count">{countByYear[y] ?? 0}</span>
        </button>
      ))}
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .year-tabs, .year-tab, .year-tab:hover, .year-tab.active, .year-tab .yt-count */
      `}</style>
    </div>
  )
}
```

### Task 6.2: Stamp component

**Files:**
- Create: `src/components/letters/sent/Stamp.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/sent/Stamp.tsx
'use client'

import type { SentStamp } from '../letterTypes'

interface Props {
  stamp: SentStamp
  onClick: (s: SentStamp) => void
}

const ICONS = ['✦','✿','❀','☽','☼','✻','♡']
const TINTS = ['s-1','s-2','s-3','s-4'] as const

/** Deterministic tint/icon/tilt from the stamp ID so a stamp keeps its look across renders. */
function variantFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const tint  = TINTS[Math.abs(h)       % TINTS.length]
  const icon  = ICONS[Math.abs(h >> 4)  % ICONS.length]
  const tilt  = ((Math.abs(h >> 8) % 50) - 25) / 10  // -2.5 to +2.5
  return { tint, icon, tilt }
}

export default function Stamp({ stamp, onClick }: Props) {
  const v = variantFor(stamp.id)
  const denom = denomFor(stamp)
  const date = new Date(stamp.sealedAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className="mount" onClick={() => onClick(stamp)}>
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div className={`stamp ${v.tint}${stamp.isDelivered ? ' delivered' : ''}`}
           style={{ '--tilt': `${v.tilt}deg` } as React.CSSProperties}>
        <div className="frame">
          <div className="denom">{denom}</div>
          <div className="icon">{v.icon}</div>
          <div>
            <div className="country">hearth · evening post</div>
            <div className="denom-bottom">{date}</div>
          </div>
        </div>
      </div>
      <div className="caption">
        <strong>{stamp.recipientName ?? 'to future me'}</strong>
        {captionLine(stamp)}
      </div>
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .mount, .mount:hover, .mount .corner.*, .stamp, .stamp .frame,
           .stamp .denom, .stamp .icon, .stamp .country, .stamp .denom-bottom,
           .stamp.delivered .frame::after, .stamp.delivered::after,
           .stamp.s-1 / s-2 / s-3 / s-4, .mount .caption, .mount .caption strong */
      `}</style>
    </div>
  )
}

function denomFor(s: SentStamp): string {
  if (!s.unlockDate) return '∞'
  const sealed = new Date(s.sealedAt).getTime()
  const unlock = new Date(s.unlockDate).getTime()
  const months = Math.round((unlock - sealed) / (1000 * 60 * 60 * 24 * 30))
  if (months >= 12 && months % 12 === 0) return `${months / 12}y`
  if (months > 0) return `${months}m`
  return '—'
}

function captionLine(s: SentStamp): string {
  if (s.isDelivered) {
    const d = new Date(s.unlockDate ?? s.sealedAt)
    return `delivered ${d.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`
  }
  if (!s.unlockDate) return 'someday'
  return `opens ${new Date(s.unlockDate).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`
}
```

### Task 6.3: StampGrid

**Files:**
- Create: `src/components/letters/sent/StampGrid.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/sent/StampGrid.tsx
'use client'

import Stamp from './Stamp'
import type { SentStamp } from '../letterTypes'

interface Props {
  stamps: SentStamp[]
  onStampClick: (s: SentStamp) => void
}

export default function StampGrid({ stamps, onStampClick }: Props) {
  return (
    <div className="stamp-grid">
      {stamps.map(s => <Stamp key={s.id} stamp={s} onClick={onStampClick} />)}
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .stamp-grid */
      `}</style>
    </div>
  )
}
```

### Task 6.4: ReceiptModal

**Files:**
- Create: `src/components/letters/sent/ReceiptModal.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/letters/sent/ReceiptModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { SentStamp } from '../letterTypes'

interface Props {
  stamp: SentStamp | null
  onClose: () => void
}

export default function ReceiptModal({ stamp, onClose }: Props) {
  const [peeked, setPeeked] = useState<string | null>(null)

  useEffect(() => {
    setPeeked(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stamp, onClose])

  if (!stamp) return null

  async function peek() {
    if (!confirm('this breaks the seal early.\nare you sure you want to read it now?')) return
    const res = await fetch(`/api/letters/${stamp!.id}/peek`, { method: 'POST' })
    const data = await res.json()
    setPeeked(data.body || '')
  }

  return (
    <div className="receipt-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="receipt">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>{stamp.recipientName ?? 'to future me'}</h3>
        <div className="field">
          <span>sealed</span>
          <span>{new Date(stamp.sealedAt).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
        </div>
        {stamp.unlockDate && (
          <div className="field">
            <span>opens</span>
            <span>{new Date(stamp.unlockDate).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
          </div>
        )}
        <div className={`seal-status${stamp.isDelivered ? ' delivered' : ''}`}>
          {stamp.isDelivered ? '✓ delivered' : '✦ still sealed'}
        </div>

        {!stamp.isDelivered && !peeked && (
          <div className="peek" onClick={peek}>peek at this letter · breaks the seal</div>
        )}
        {peeked && (
          <div className="peek-content" style={{
            marginTop: 18, padding: 14, background: 'var(--paper-2)',
            borderRadius: 4, textAlign: 'left',
            fontFamily: 'var(--font-caveat), Caveat, cursive', fontSize: 16, color: 'var(--text-primary)'
          }}>
            {peeked}
          </div>
        )}
      </div>
      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .receipt-overlay, .receipt-overlay.open, .receipt, .receipt::before,
           .receipt h3, .receipt .field, .receipt .field span:first-child,
           .receipt .field span:last-child, .receipt .seal-status,
           .receipt .seal-status.delivered, .receipt .peek, .receipt .close-btn */
      `}</style>
    </div>
  )
}
```

### Task 6.5: Wire SentView

**Files:**
- Modify: `src/components/letters/sent/SentView.tsx`

- [ ] **Step 1: Replace stub with full implementation**

```tsx
// src/components/letters/sent/SentView.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import YearTabs from './YearTabs'
import StampGrid from './StampGrid'
import ReceiptModal from './ReceiptModal'
import { groupSentByYear } from '../lettersData'
import type { SentStamp } from '../letterTypes'

export default function SentView() {
  const [stamps, setStamps] = useState<SentStamp[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [open, setOpen] = useState<SentStamp | null>(null)

  useEffect(() => {
    fetch('/api/letters/sent')
      .then(r => r.json())
      .then(d => setStamps(d.stamps || []))
  }, [])

  const grouped = useMemo(() => groupSentByYear(stamps), [stamps])
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)
  const countByYear = Object.fromEntries(years.map(y => [y, grouped[y].length]))
  useEffect(() => { if (year === null && years.length) setYear(years[0]) }, [years, year])

  const totalSealed   = stamps.filter(s => !s.isDelivered).length
  const totalDelivered = stamps.filter(s => s.isDelivered).length

  return (
    <section className="sent" style={{ height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, var(--paper-1), transparent 60%), linear-gradient(180deg, var(--bg-1), var(--bg-2))',
      padding: '90px 56px 40px',
      display: 'flex', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-caveat), Caveat, cursive',
          fontSize: 36, margin: 0, color: 'var(--text-primary)' }}>
          letters i&rsquo;ve sent
        </h2>
        <p style={{ margin: '4px 0 0', fontStyle: 'italic',
          color: 'var(--text-secondary)', fontSize: 13 }}>
          {totalSealed} sealed · {totalDelivered} delivered · the rest <em>are still on their way</em>
        </p>
      </header>

      {year !== null && (
        <YearTabs years={years} active={year} countByYear={countByYear} onChange={setYear} />
      )}

      <div className="album">
        <StampGrid
          stamps={year !== null ? (grouped[year] || []) : []}
          onStampClick={setOpen}
        />
        <style jsx>{`
          /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
             .album, .album::before */
        `}</style>
      </div>

      <ReceiptModal stamp={open} onClose={() => setOpen(null)} />
    </section>
  )
}
```

- [ ] **Step 2: Visually verify**

Restart. Click `sent` tab. Expected:
- Header with summary line
- Year tabs (e.g. `2026 · 8`, `2025 · 5`)
- Album page with stamps in a grid; tilts / icons / tints vary
- Delivered stamps have postmark cancellation lines + a circular DELIVERED mark
- Click a stamp → receipt modal with date fields + seal status
- For sealed stamps: *"peek at this letter · breaks the seal"* link → confirm prompt → reveals content
- No vertical scroll on the page

### Task 6.6: Stage commit checkpoint

- [ ] **Step 1: Ask user; on approval**

```bash
git add src/components/letters/sent/
git commit -m "feat(letters): sent surface — year-tabbed stamp album

Single-viewport sent album with year tabs (no scroll). Each sent letter
renders as a postage stamp with deterministic tint/icon/tilt. Delivered
stamps get a postmark cancellation. Click for a receipt modal; an
explicit 'peek at this letter' affordance breaks the seal early via
the new POST /api/letters/[id]/peek endpoint.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 7 — Compose modal refactor

Migrate the current write flow into a full-screen modal triggered from `WriteCard`. The modal has the envelope-flip ritual: address → flip → write → fold & seal.

### Task 7.1: ComposeModal shell

**Files:**
- Create: `src/components/letters/compose/ComposeModal.tsx`

- [ ] **Step 1: Component scaffold**

```tsx
// src/components/letters/compose/ComposeModal.tsx
'use client'

import { useState } from 'react'
import EnvelopeFront from './EnvelopeFront'
import LetterInside from './LetterInside'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'

interface Props {
  open: boolean
  onClose: () => void
  onSealed: () => void
}

type Recipient = 'future_me' | 'someone_close'
type Unlock    = '1month' | '6months' | '1year' | 'someday'

export default function ComposeModal({ open, onClose, onSealed }: Props) {
  const [flipped, setFlipped]     = useState(false)
  const [recipient, setRecipient] = useState<Recipient>('future_me')
  const [recipientName, setRecipientName] = useState('')
  const [unlock, setUnlock]       = useState<Unlock>('1year')
  const [body, setBody]           = useState('')

  const autosave = useAutosaveEntry()
  // (The existing autosave hook handles entry creation + updates; reuse verbatim.)

  if (!open) return null

  return (
    <div className="compose-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <button className="close-x" onClick={onClose}>×</button>
      <div className={`compose-card${flipped ? ' flipped' : ''}`}>
        <EnvelopeFront
          recipient={recipient} onRecipientChange={setRecipient}
          recipientName={recipientName} onRecipientNameChange={setRecipientName}
          unlock={unlock} onUnlockChange={setUnlock}
          onTurnOver={() => setFlipped(true)}
        />
        <LetterInside
          recipient={recipient} recipientName={recipientName}
          body={body} onBodyChange={setBody}
          onBack={() => setFlipped(false)}
          onSeal={() => { /* see Task 7.4 */ }}
        />
      </div>

      <style jsx>{`
        /* === COPY VERBATIM FROM docs/letters-redesign-demo.html ===
           .compose-overlay (and .open), .compose-card, .compose-card.flipped,
           .face, .face.front, .face.front .stamp-large, .face.front .label,
           .face.front .to-line, .face.front .to-line input, .face.front .options,
           .pill, .pill:hover, .pill.active, .face.front .footer, .face.front .hint,
           .btn-ghost, .btn-primary, .face.back, .face.back .topline,
           .face.back .salutation, .face.back .body, .face.back .body[contenteditable]:empty::before,
           .face.back .signature, .face.back .actions, .seal-anim, .seal-anim.show,
           .fold-page, .fold-third1, .fold-third2, .fold-third3, .seal-blob,
           .seal-blob.dropped, .seal-blob::after, .seal-toast, .seal-toast.show,
           .close-x, .recipient-toggle, .recipient-toggle button, .recipient-toggle button.active */
      `}</style>
    </div>
  )
}
```

### Task 7.2: EnvelopeFront

**Files:**
- Create: `src/components/letters/compose/EnvelopeFront.tsx`

- [ ] **Step 1: Component**

The envelope front step is structurally similar to the demo's `.face.front` — a recipient toggle, a "Dear ___," input, the stamp placeholder, unlock-when pills, and the *"turn over →"* button.

```tsx
// src/components/letters/compose/EnvelopeFront.tsx
'use client'

interface Props {
  recipient: 'future_me' | 'someone_close'
  onRecipientChange: (r: 'future_me' | 'someone_close') => void
  recipientName: string
  onRecipientNameChange: (s: string) => void
  unlock: '1month' | '6months' | '1year' | 'someday'
  onUnlockChange: (u: '1month' | '6months' | '1year' | 'someday') => void
  onTurnOver: () => void
}

export default function EnvelopeFront(p: Props) {
  return (
    <div className="face front">
      <div className="label">addressing</div>
      <div className="recipient-toggle">
        <button className={p.recipient === 'future_me' ? 'active' : ''}
                onClick={() => { p.onRecipientChange('future_me'); p.onRecipientNameChange('future me') }}>
          future me
        </button>
        <button className={p.recipient === 'someone_close' ? 'active' : ''}
                onClick={() => { p.onRecipientChange('someone_close'); p.onRecipientNameChange('') }}>
          someone close
        </button>
      </div>

      <div className="to-line">
        Dear <input
          value={p.recipientName}
          placeholder={p.recipient === 'future_me' ? 'future me' : 'their name'}
          onChange={e => p.onRecipientNameChange(e.target.value)}
        />,
      </div>

      <div className="stamp-large">
        <div>
          <strong>✦</strong>
          hearth<br />
          <em>sealed today</em>
        </div>
      </div>

      <div className="label" style={{ marginTop: 32 }}>opens · when</div>
      <div className="options">
        {(['1month','6months','1year','someday'] as const).map(u => (
          <button key={u}
                  className={`pill${p.unlock === u ? ' active' : ''}`}
                  onClick={() => p.onUnlockChange(u)}>
            {u === '1month' ? '1 month' :
             u === '6months' ? '6 months' :
             u === '1year' ? '1 year' : 'someday'}
          </button>
        ))}
      </div>

      <div className="footer">
        <span className="hint">turn it over to write</span>
        <button className="btn-primary" onClick={p.onTurnOver}>turn over →</button>
      </div>
    </div>
  )
}
```

### Task 7.3: LetterInside

**Files:**
- Create: `src/components/letters/compose/LetterInside.tsx`

- [ ] **Step 1: Component (TipTap, lined paper, signature)**

Adapt the existing `LetterPaper.tsx` — keep the TipTap setup but render the writing surface as `.face.back` from the demo.

```tsx
// src/components/letters/compose/LetterInside.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { format } from 'date-fns'

interface Props {
  recipient: 'future_me' | 'someone_close'
  recipientName: string
  body: string
  onBodyChange: (html: string) => void
  onBack: () => void
  onSeal: () => void
}

export default function LetterInside(p: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'i wanted to tell you something…' })],
    content: p.body,
    onUpdate: ({ editor }) => p.onBodyChange(editor.getHTML()),
    editorProps: { attributes: { class: 'body', contenteditable: 'true' } as Record<string, string> },
  })

  return (
    <div className="face back">
      <div className="topline">
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.32em', fontSize: 11, fontStyle: 'normal' }}>a letter</span>
        <span>{format(new Date(), "EEEE, MMM d · 'evening'")}</span>
      </div>
      <div className="salutation">
        Dear <span style={{ textDecoration: 'underline dotted' }}>
          {p.recipient === 'future_me' ? 'future me' : (p.recipientName || '…')}
        </span>,
      </div>
      <EditorContent editor={editor} />
      <div className="signature">yours, <span style={{ textDecoration: 'underline dotted' }}>me</span></div>
      <div className="actions">
        <button className="btn-ghost" onClick={p.onBack}>← back to envelope</button>
        <button className="btn-primary" onClick={p.onSeal}>fold &amp; seal ✦</button>
      </div>
    </div>
  )
}
```

### Task 7.4: Wire seal flow + autosave

**Files:**
- Modify: `src/components/letters/compose/ComposeModal.tsx` and `src/components/letters/inbox/WriteCard.tsx`

- [ ] **Step 1: Adapt the existing autosave from `LetterWriteView`**

Reuse the `useAutosaveEntry` flow that the old `LetterWriteView.tsx` had: trigger on body/recipient/unlock changes, flush on seal, then `POST /api/entries/[id]/seal`. Reference the original file before deleting.

In `ComposeModal`:

```tsx
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import { useEffect } from 'react'

// inside component:
const autosave = useAutosaveEntry()
const [createdAt] = useState(() => new Date())

useEffect(() => {
  const isFriend = recipient === 'someone_close'
  autosave.trigger({
    text: body,
    mood: 2,
    song: null,
    photos: [],
    doodles: [],
    entryType: isFriend ? 'unsent_letter' : 'letter',
    recipientEmail: null,
    recipientName: isFriend ? recipientName : null,
    unlockDate: resolveUnlockDate(unlock, createdAt)?.toISOString() ?? null,
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [body, recipient, recipientName, unlock])

async function handleSeal() {
  await autosave.flush()
  const id = autosave.entryId
  if (!id) return
  await fetch(`/api/entries/${id}/seal`, { method: 'POST' })
  // Brief success animation can run here (existing wax-drop in demo)
  onSealed()
  onClose()
}

function resolveUnlockDate(u: typeof unlock, base: Date): Date | null {
  const d = new Date(base)
  if (u === '1month')  d.setMonth(d.getMonth() + 1)
  if (u === '6months') d.setMonth(d.getMonth() + 6)
  if (u === '1year')   d.setFullYear(d.getFullYear() + 1)
  if (u === 'someday') return null
  return d
}
```

Pass `handleSeal` into `LetterInside` as `onSeal`.

- [ ] **Step 2: Wire WriteCard to open the modal**

In `InboxView.tsx`, add modal state:

```tsx
const [composing, setComposing] = useState(false)
// ...
<WriteCard onBegin={() => setComposing(true)} />
// ...
<ComposeModal
  open={composing}
  onClose={() => setComposing(false)}
  onSealed={() => {
    setComposing(false)
    // Refetch sent stamps would happen on switching to sent tab.
    // Refetch inbox to update — though the new letter won't appear here until its unlock date.
  }}
/>
```

- [ ] **Step 3: Visually verify**

Restart. Click `begin a letter →`. Expected:
- Modal opens, envelope front shows
- Pick recipient → input updates
- Pick unlock window pill
- Click *turn over →* → 3D flip to writing surface
- Type a letter
- Click *← back to envelope* → flips back
- Click *fold & seal ✦* → modal closes, autosave + seal POST fires
- Switch to `sent` tab — new stamp appears for the just-sealed letter

### Task 7.5: Stage commit checkpoint

- [ ] **Step 1: Ask user; on approval**

```bash
git add src/components/letters/compose/ src/components/letters/inbox/WriteCard.tsx src/components/letters/inbox/InboxView.tsx
git commit -m "feat(letters): compose modal — envelope flip + fold-and-seal

Begin-a-letter from the inbox now opens a full-screen modal that fronts
the envelope (addressing + unlock-when), flips on 'turn over →', and lets
you write inside on lined paper. Fold & seal flushes autosave and posts
to the existing /api/entries/[id]/seal endpoint, producing a stamp in
the sent album.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Stage 8 — Cleanup, theme verification, migration sanity

Final pass: delete the old letter components, verify all themes, confirm existing users don't see all old letters as new.

### Task 8.1: Delete obsolete files

**Files:**
- Delete:
  - `src/components/letters/SealedLetterList.tsx`
  - `src/components/letters/SealedLetterTile.tsx`
  - `src/components/letters/LetterWriteView.tsx`
  - `src/components/letters/RecipientSidebar.tsx`
  - `src/components/letters/LetterPaper.tsx`
  - `src/components/letters/TuckedIn.tsx`
  - `src/components/LetterReveal.tsx`
  - `src/components/LetterArrivedBanner.tsx`

- [ ] **Step 1: Search for any remaining imports**

```bash
grep -rn "SealedLetterList\|SealedLetterTile\|LetterWriteView\|RecipientSidebar\|LetterPaper\|TuckedIn\|LetterReveal\|LetterArrivedBanner" src/ --include="*.ts" --include="*.tsx"
```

Expected: no matches outside the files about to be deleted. If there are matches in OTHER files, fix those imports before deleting.

- [ ] **Step 2: Delete**

```bash
rm src/components/letters/SealedLetterList.tsx \
   src/components/letters/SealedLetterTile.tsx \
   src/components/letters/LetterWriteView.tsx \
   src/components/letters/RecipientSidebar.tsx \
   src/components/letters/LetterPaper.tsx \
   src/components/letters/TuckedIn.tsx \
   src/components/LetterReveal.tsx \
   src/components/LetterArrivedBanner.tsx
```

- [ ] **Step 3: Verify build still passes**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

### Task 8.2: Verify all themes

**Files:** none — visual verification only.

- [ ] **Step 1: Cycle through every theme**

For each theme in `src/lib/themes.ts` (Rivendell Sunset, Hearth, Rose, Sage, Ocean, Postal, Linen):
1. Open settings panel, switch theme.
2. Visit `/letters`. Confirm: postbox, lamp halo, hills, particles all theme-tinted; nothing renders as a hard-coded color that conflicts.
3. Click a postbox month → fanout works; unread glow uses theme accent.
4. Click `sent` tab → year tabs + stamps work.
5. Open compose modal → envelope and writing surface read clearly.

- [ ] **Step 2: Note dark themes**

Dark themes (Rivendell Sunset, Hearth, Postal) may need contrast tweaks because the demo was tuned to light themes. If text-on-paper is too light or postbox-on-bg is too dark, capture screenshots and report back — adjustments live in `LettersTokens.tsx` (e.g. `--paper-1` definition).

### Task 8.3: Confirm existing letters aren't shown as 'new'

**Files:** none — data check only.

- [ ] **Step 1: Check the database state for an existing user**

```bash
docker compose exec app npx prisma studio
```

Open `journal_entries`, filter `entryType = 'letter' AND isSealed = true AND isDelivered = true AND isViewed = false`. **If results > 0**, those letters will appear as "new" in the new inbox even though the user has seen them before.

- [ ] **Step 2: One-off backfill (only if step 1 found rows)**

```bash
docker compose exec app npx prisma db execute --stdin <<'SQL'
UPDATE journal_entries
SET "isViewed" = TRUE
WHERE "entryType" IN ('letter', 'unsent_letter')
  AND "isSealed" = TRUE
  AND "isDelivered" = TRUE
  AND "isViewed" = FALSE;
SQL
```

Re-check Prisma Studio: those rows should now have `isViewed = true`.

> **Note:** This is a one-off, non-destructive backfill (only flips a boolean). Confirm with user before running on production.

- [ ] **Step 3: Confirm reload behavior**

In a logged-in browser, hard-reload `/letters`. Old letters that the user had already viewed before should *not* appear with the orange "unread" glow. Only genuinely-unseen letters should show as new.

### Task 8.4: Final stage commit

- [ ] **Step 1: Ask user; on approval**

```bash
git add -A
git commit -m "chore(letters): remove obsolete components, finalize migration

Deletes SealedLetterList, SealedLetterTile, LetterWriteView,
RecipientSidebar, LetterPaper, TuckedIn, LetterReveal, and
LetterArrivedBanner — all superseded by the new postbox-themed
inbox/sent surfaces. Backfills isViewed for already-delivered
letters so existing users don't see their archive as new mail.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage:**

| Spec section | Implemented in |
|---|---|
| Two-surface model (letters + sent) | Stage 2 |
| Top hint with new-count badge | Stage 4 (Task 4.4) |
| Postbox: dome / brim / body / hood / slot / pincode / mid band / swoosh / base | Stage 3 (Task 3.4) |
| Year + month placards (◁ value ▷) | Stage 4 (Task 4.2) |
| Lamp from `LeftLamp.tsx`, stretched to 580px | Stage 3 (Task 3.3) |
| Theme-driven palette (rose / sage / ocean / others) | Stage 3 (Task 3.1) |
| Drifting particles by `theme.particles` | Stage 3 (Task 3.2) |
| Letter fanout from slot | Stage 5 (Task 5.1) |
| Unread state — orange glow / pulsing seal | Stage 5 (Task 5.1, fanout CSS) |
| Dangling 'N new ✦' tag from slot | Stage 4 (Task 4.5) |
| First-time reveal ceremony (sealed → wax cracks → unfurl) | Stage 5 (Tasks 5.3-5.4) |
| Mark-as-read on first reveal | Stage 5 (Task 5.3, hooks `/api/letters/[id]/read`) |
| Re-reads skip ceremony | Stage 5 (Task 5.3, `phase = letter.isViewed ? 'shown' : 'sealed'`) |
| Sent: year tabs, single viewport | Stage 6 (Task 6.5) |
| Stamps with deterministic tilt/icon/tint | Stage 6 (Task 6.2) |
| Delivered postmark cancellation | Stage 6 (Task 6.2 CSS) |
| Receipt modal | Stage 6 (Task 6.4) |
| Peek-the-seal affordance with confirmation | Stage 6 (Task 6.4) |
| Compose modal: address → flip → write → fold & seal | Stage 7 |
| Schema: `letterPeekedAt` only (reusing existing `isViewed`) | Stage 1 (Task 1.1) |
| API endpoints (inbox, sent, read, peek) | Stage 1 (Tasks 1.2-1.5) |
| Backfill existing letters as read | Stage 8 (Task 8.3) |
| Delete old components | Stage 8 (Task 8.1) |

**Placeholder scan:**
- No "TBD" / "TODO" / "implement later" markers
- "COPY VERBATIM FROM docs/letters-redesign-demo.html" appears in CSS-heavy tasks — this is *intentional*: the demo is the visual contract, copying CSS verbatim is the action, and the engineer note describes which selectors. Not a placeholder.
- Lamp SVG in Task 3.3 references `src/components/constellation/garden/LeftLamp.tsx:71-150` — concrete.
- All API routes have full code.
- All Prisma migrations have explicit ALTER statements.

**Type consistency:**
- `InboxLetter` and `SentStamp` are defined in Task 2.1 and used consistently across stages.
- `LettersTab = 'inbox' | 'sent'` consistent.
- Component prop types match between definition and use sites.
- The `phase` enum in `RevealModal` is `'sealed' | 'breaking' | 'opening' | 'shown'` — consistent.

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-01-letters-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for this plan because tasks are visual-heavy and each one has a clear "verify in browser" checkpoint that benefits from independent eyes.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?
