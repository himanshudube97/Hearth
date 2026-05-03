# A Small Light — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project convention (from CLAUDE.md memory):** Hearth skips formal unit tests by default. Each task ends with implement → commit → manual verify in `docker compose` dev. Don't add Vitest/Jest test files for this feature.

**Goal:** Ship "A Small Light" — a Letters-page feature where any user can, once per day, write a short paper note and send it anonymously to a random other user, who can reply once with 20 words, burn it, or do nothing. Notes auto-delete 24h after delivery; only counters persist.

**Spec:** [`docs/superpowers/specs/2026-05-03-stranger-notes-design.md`](../specs/2026-05-03-stranger-notes-design.md)

**Architecture:** New `StrangerNote` and `StrangerReply` Prisma models with hard-delete lifecycle; six API routes under `/api/stranger-notes/`; one new cron route under `/api/cron/expire-stranger-notes`; new `LightsView` rendered as a third tab in the existing Letters page nav. Encryption uses the existing `lib/encryption.ts` helper. Daily rate limit uses the existing `X-User-TZ` header pattern. The compose UI uses warmth-framed placeholder copy as soft moderation; real moderation pipeline is a deferred follow-up and the feature stays internal until it ships.

**Tech Stack:** Next.js 16 App Router, Prisma + PostgreSQL, AES-256-GCM via `crypto`, Framer Motion, Zustand (existing), Tailwind. Docker for all dev commands.

**Out of scope (explicit):** moderation, push notifications, block lists, premium gating, any second outgoing per day, any second reply.

---

## File Structure

**Create:**
- `prisma/migrations/<timestamp>_add_stranger_notes/migration.sql` — new models + user fields
- `src/lib/stranger-notes.ts` — content validation, daily-rate-limit check using `X-User-TZ`, encrypt/decrypt wrappers, response shaping
- `src/lib/stranger-matcher.ts` — pick a random eligible recipient and atomically transition a queued note to delivered
- `src/app/api/stranger-notes/route.ts` — POST send
- `src/app/api/stranger-notes/inbox/route.ts` — GET inbox payload
- `src/app/api/stranger-notes/[id]/read/route.ts` — POST mark a received note as read
- `src/app/api/stranger-notes/[id]/reply/route.ts` — POST reply
- `src/app/api/stranger-notes/[id]/burn/route.ts` — POST burn received note
- `src/app/api/stranger-notes/replies/[id]/burn/route.ts` — POST burn received reply
- `src/app/api/cron/expire-stranger-notes/route.ts` — cron sweep + queued retry
- `src/hooks/useStrangerNotes.ts` — client data hook (fetch inbox, send, reply, burn)
- `src/components/letters/lights/LightsView.tsx` — top-level view for the new tab
- `src/components/letters/lights/Mailbox.tsx` — visual mailbox (lantern), glows when unread
- `src/components/letters/lights/ComposePaper.tsx` — paper for composing a note
- `src/components/letters/lights/ReadPaper.tsx` — paper for reading received notes (+ inline reply input + burn)
- `src/components/letters/lights/ReplyCard.tsx` — smaller card for replies received to your sent notes

**Modify:**
- `prisma/schema.prisma` — add models + user fields
- `src/components/letters/letterTypes.ts` — extend `LettersTab` union to include `'lights'`
- `src/components/letters/LettersNav.tsx` — add third tab
- `src/app/letters/page.tsx` — render `LightsView` when `tab === 'lights'`

---

## Task 1: Schema migration — add models and user fields

**Files:**
- Modify: `prisma/schema.prisma`
- Create (auto-generated): `prisma/migrations/<timestamp>_add_stranger_notes/migration.sql`

- [ ] **Step 1: Add three new fields to `User` model**

In `prisma/schema.prisma`, inside `model User`, after the `pushSubscriptions` line (around line 24), add:

```prisma
  // A Small Light counters & rate limit (anonymous notes to strangers)
  strangerNotesSent       Int       @default(0)
  strangerNotesReceived   Int       @default(0)
  lastStrangerNoteSentAt  DateTime?

  sentStrangerNotes       StrangerNote[] @relation("SentStrangerNotes")
  receivedStrangerNotes   StrangerNote[] @relation("ReceivedStrangerNotes")
```

- [ ] **Step 2: Add `StrangerNote` and `StrangerReply` models**

At the end of `prisma/schema.prisma`, add:

```prisma
model StrangerNote {
  id          String   @id @default(cuid())

  senderId    String
  sender      User     @relation("SentStrangerNotes", fields: [senderId], references: [id], onDelete: Cascade)

  recipientId String?
  recipient   User?    @relation("ReceivedStrangerNotes", fields: [recipientId], references: [id], onDelete: Cascade)

  // AES-256-GCM ciphertext (iv:authTag:encryptedData hex), see src/lib/encryption.ts
  content     String   @db.Text

  // queued | delivered | replied
  // After matchedAt+24h or burn, the row is hard-deleted by cron / API.
  status      String   @default("queued")

  createdAt   DateTime  @default(now())
  matchedAt   DateTime?
  readAt      DateTime?

  reply       StrangerReply?

  @@index([recipientId, status])
  @@index([status, matchedAt])
  @@map("stranger_notes")
}

model StrangerReply {
  id          String   @id @default(cuid())

  noteId      String       @unique
  note        StrangerNote @relation(fields: [noteId], references: [id], onDelete: Cascade)

  // AES-256-GCM ciphertext; max 20 words enforced before encryption (src/lib/stranger-notes.ts)
  content     String   @db.Text

  createdAt   DateTime  @default(now())
  readAt      DateTime?

  @@index([createdAt])
  @@map("stranger_replies")
}
```

- [ ] **Step 3: Generate the migration**

Run:

```bash
docker compose exec app npx prisma migrate dev --name add_stranger_notes
```

Expected: a new folder `prisma/migrations/<timestamp>_add_stranger_notes/` is created. Migration applies cleanly. Prisma Client regenerates.

If Prisma warns about data loss, stop and investigate — the new fields are all nullable or have defaults, so there should be no warning. If you see one, do **not** use `--accept-data-loss`. Re-read the schema diff and fix the schema before re-running.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(stranger-notes): add StrangerNote, StrangerReply models + user counters"
```

- [ ] **Step 5: Verify**

Run:

```bash
docker compose exec app npx prisma studio
```

Open `users` — should have new columns `strangerNotesSent` (0), `strangerNotesReceived` (0), `lastStrangerNoteSentAt` (null) on existing users. Open `stranger_notes` and `stranger_replies` — both empty tables present.

---

## Task 2: Library — `src/lib/stranger-notes.ts`

**Files:**
- Create: `src/lib/stranger-notes.ts`

- [ ] **Step 1: Write the helper module**

Create `src/lib/stranger-notes.ts`:

```typescript
import { encrypt, decrypt } from '@/lib/encryption'

// Min/max char length for outgoing note body (after trim).
export const MIN_NOTE_CHARS = 10
export const MAX_NOTE_CHARS = 200

// Max words for a reply.
export const MAX_REPLY_WORDS = 20

// 24h lifetime once delivered (note) or once written (reply).
export const NOTE_LIFETIME_MS = 24 * 60 * 60 * 1000
export const REPLY_LIFETIME_MS = 24 * 60 * 60 * 1000

export type NoteValidationError =
  | 'empty'
  | 'too_short'
  | 'too_long'

export type ReplyValidationError =
  | 'empty'
  | 'too_many_words'

export function validateNoteContent(raw: string): { ok: true; trimmed: string } | { ok: false; error: NoteValidationError } {
  const trimmed = (raw ?? '').trim()
  if (trimmed.length === 0) return { ok: false, error: 'empty' }
  if (trimmed.length < MIN_NOTE_CHARS) return { ok: false, error: 'too_short' }
  if (trimmed.length > MAX_NOTE_CHARS) return { ok: false, error: 'too_long' }
  return { ok: true, trimmed }
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export function validateReplyContent(raw: string): { ok: true; trimmed: string } | { ok: false; error: ReplyValidationError } {
  const trimmed = (raw ?? '').trim()
  if (trimmed.length === 0) return { ok: false, error: 'empty' }
  if (countWords(trimmed) > MAX_REPLY_WORDS) return { ok: false, error: 'too_many_words' }
  return { ok: true, trimmed }
}

/**
 * Returns true if the user is allowed to send a note now.
 * Rule: at most one note per calendar day in the user's timezone.
 *
 * `lastSentAt` is the User.lastStrangerNoteSentAt field.
 * `userTz` should come from the X-User-TZ request header (IANA name); falls back to UTC.
 */
export function canSendToday(lastSentAt: Date | null | undefined, userTz: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastSentAt) return true
  const tz = userTz && userTz.length > 0 ? userTz : 'UTC'
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    return fmt.format(lastSentAt) !== fmt.format(now)
  } catch {
    // Invalid TZ — fall back to UTC behavior
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
    return fmt.format(lastSentAt) !== fmt.format(now)
  }
}

export function encryptStrangerContent(plaintext: string): string {
  return encrypt(plaintext)
}

export function decryptStrangerContent(ciphertext: string): string {
  return decrypt(ciphertext)
}

/**
 * Compute the absolute expiry instant for a delivered note (24h from matchedAt).
 */
export function noteExpiresAt(matchedAt: Date): Date {
  return new Date(matchedAt.getTime() + NOTE_LIFETIME_MS)
}

/**
 * Compute the absolute expiry instant for a reply (24h from createdAt).
 */
export function replyExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + REPLY_LIFETIME_MS)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stranger-notes.ts
git commit -m "feat(stranger-notes): validation, rate-limit, encryption helpers"
```

---

## Task 3: Library — `src/lib/stranger-matcher.ts`

**Files:**
- Create: `src/lib/stranger-matcher.ts`

- [ ] **Step 1: Write the matcher**

Create `src/lib/stranger-matcher.ts`:

```typescript
import { prisma } from '@/lib/db'

/**
 * Try to find an eligible random recipient for a stranger note from `senderId`.
 * Eligibility v1: any other user that exists.
 *
 * Uses a single SQL query with ORDER BY random() to keep selection cheap and
 * uniformly random at our scale. Revisit if user count crosses ~100k.
 *
 * Returns the recipient user id, or null if no eligible user exists.
 */
export async function pickRandomRecipient(senderId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM users
    WHERE id <> ${senderId}
    ORDER BY random()
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

/**
 * Atomically transition a queued note to delivered, assigning a recipient and
 * stamping matchedAt = now(). Bumps the recipient's strangerNotesReceived counter.
 *
 * Returns true if the note was matched, false if it was already non-queued
 * (e.g., raced by a concurrent matcher).
 */
export async function deliverNoteToRecipient(noteId: string, recipientId: string): Promise<boolean> {
  const result = await prisma.$transaction(async (tx) => {
    const update = await tx.strangerNote.updateMany({
      where: { id: noteId, status: 'queued' },
      data: { recipientId, matchedAt: new Date(), status: 'delivered' },
    })
    if (update.count === 0) return false
    await tx.user.update({
      where: { id: recipientId },
      data: { strangerNotesReceived: { increment: 1 } },
    })
    return true
  })
  return result
}

/**
 * Convenience wrapper — try to match an existing queued note. Returns true on
 * delivery; false if no eligible recipient or the note was no longer queued.
 */
export async function tryDeliverQueued(noteId: string, senderId: string): Promise<boolean> {
  const recipientId = await pickRandomRecipient(senderId)
  if (!recipientId) return false
  return deliverNoteToRecipient(noteId, recipientId)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stranger-matcher.ts
git commit -m "feat(stranger-notes): random matcher with atomic queued→delivered transition"
```

---

## Task 4: API — `POST /api/stranger-notes` (send)

**Files:**
- Create: `src/app/api/stranger-notes/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  validateNoteContent,
  encryptStrangerContent,
  canSendToday,
} from '@/lib/stranger-notes'
import { tryDeliverQueued } from '@/lib/stranger-matcher'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const validation = validateNoteContent(body.content)
  if (!validation.ok) {
    const map: Record<typeof validation.error, string> = {
      empty: 'Write something first.',
      too_short: 'A little longer — at least 10 characters.',
      too_long: 'A little shorter — at most 200 characters.',
    }
    return NextResponse.json({ error: map[validation.error] }, { status: 400 })
  }

  // Daily rate limit (per user, per local calendar day).
  const userTz = req.headers.get('X-User-TZ')
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastStrangerNoteSentAt: true },
  })
  if (!canSendToday(userRow?.lastStrangerNoteSentAt ?? null, userTz)) {
    return NextResponse.json(
      { error: 'Your light is on its way. Come back tomorrow.' },
      { status: 429 }
    )
  }

  // TODO BLOCKER before public launch: run validation.trimmed through a
  // moderation API here. Reject (status 400) if flagged. Keep this comment
  // until the moderation spec ships.

  const ciphertext = encryptStrangerContent(validation.trimmed)

  const note = await prisma.strangerNote.create({
    data: {
      senderId: user.id,
      content: ciphertext,
      status: 'queued',
    },
    select: { id: true },
  })

  // Bump sender counter and rate-limit timestamp.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      strangerNotesSent: { increment: 1 },
      lastStrangerNoteSentAt: new Date(),
    },
  })

  // Try to deliver immediately. If no eligible recipient, leave queued for cron.
  const delivered = await tryDeliverQueued(note.id, user.id)

  return NextResponse.json(
    { id: note.id, status: delivered ? 'delivered' : 'queued' },
    { status: 201 }
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/route.ts
git commit -m "feat(stranger-notes): POST /api/stranger-notes (send + immediate match)"
```

- [ ] **Step 3: Verify in dev**

```bash
docker compose restart app
docker compose logs -f app
```

In another terminal, hit the route with a logged-in dev session (use the existing dev login flow). Or use Prisma Studio to inspect — after sending one note, `users.strangerNotesSent` increments and a row appears in `stranger_notes` (status `delivered` if any other user exists, else `queued`).

If you have only one user, status will stay `queued` — that's the correct behavior.

---

## Task 5: API — `GET /api/stranger-notes/inbox`

**Files:**
- Create: `src/app/api/stranger-notes/inbox/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/inbox/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  decryptStrangerContent,
  canSendToday,
  noteExpiresAt,
  replyExpiresAt,
} from '@/lib/stranger-notes'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userTz = req.headers.get('X-User-TZ')

  // Notes I have received (delivered or replied; not yet expired).
  const received = await prisma.strangerNote.findMany({
    where: {
      recipientId: user.id,
      status: { in: ['delivered', 'replied'] },
    },
    include: { reply: true },
    orderBy: { matchedAt: 'desc' },
  })

  // Replies to notes I sent.
  const replies = await prisma.strangerReply.findMany({
    where: {
      note: { senderId: user.id },
    },
    include: { note: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      lastStrangerNoteSentAt: true,
      strangerNotesSent: true,
      strangerNotesReceived: true,
    },
  })

  return NextResponse.json({
    receivedNotes: received.map((n) => ({
      id: n.id,
      content: decryptStrangerContent(n.content),
      matchedAt: n.matchedAt,
      expiresAt: n.matchedAt ? noteExpiresAt(n.matchedAt) : null,
      readAt: n.readAt,
      myReply: n.reply ? decryptStrangerContent(n.reply.content) : null,
    })),
    receivedReplies: replies.map((r) => ({
      id: r.id,
      content: decryptStrangerContent(r.content),
      createdAt: r.createdAt,
      expiresAt: replyExpiresAt(r.createdAt),
      readAt: r.readAt,
    })),
    canSendToday: canSendToday(userRow?.lastStrangerNoteSentAt ?? null, userTz),
    counters: {
      sent: userRow?.strangerNotesSent ?? 0,
      received: userRow?.strangerNotesReceived ?? 0,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/inbox/route.ts
git commit -m "feat(stranger-notes): GET /api/stranger-notes/inbox"
```

---

## Task 6: API — `POST /api/stranger-notes/[id]/read`

**Files:**
- Create: `src/app/api/stranger-notes/[id]/read/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/[id]/read/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const note = await prisma.strangerNote.findUnique({
    where: { id },
    select: { recipientId: true, readAt: true },
  })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (note.readAt) return NextResponse.json({ ok: true })

  await prisma.strangerNote.update({
    where: { id },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/\[id\]/read/route.ts
git commit -m "feat(stranger-notes): POST /api/stranger-notes/[id]/read"
```

---

## Task 7: API — `POST /api/stranger-notes/[id]/reply`

**Files:**
- Create: `src/app/api/stranger-notes/[id]/reply/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/[id]/reply/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  validateReplyContent,
  encryptStrangerContent,
} from '@/lib/stranger-notes'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const validation = validateReplyContent(body.content)
  if (!validation.ok) {
    const map: Record<typeof validation.error, string> = {
      empty: 'Write something first.',
      too_many_words: 'Twenty words at most.',
    }
    return NextResponse.json({ error: map[validation.error] }, { status: 400 })
  }

  const note = await prisma.strangerNote.findUnique({
    where: { id },
    select: { recipientId: true, status: true, reply: { select: { id: true } } },
  })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (note.status !== 'delivered') {
    return NextResponse.json({ error: 'This note can no longer be replied to.' }, { status: 409 })
  }
  if (note.reply) {
    return NextResponse.json({ error: 'You have already replied.' }, { status: 409 })
  }

  // TODO BLOCKER before public launch: moderation pre-check on reply text too.

  const ciphertext = encryptStrangerContent(validation.trimmed)

  await prisma.$transaction([
    prisma.strangerReply.create({
      data: { noteId: id, content: ciphertext },
    }),
    prisma.strangerNote.update({
      where: { id },
      data: { status: 'replied' },
    }),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/\[id\]/reply/route.ts
git commit -m "feat(stranger-notes): POST /api/stranger-notes/[id]/reply"
```

---

## Task 8: API — `POST /api/stranger-notes/[id]/burn`

**Files:**
- Create: `src/app/api/stranger-notes/[id]/burn/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/[id]/burn/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const note = await prisma.strangerNote.findUnique({
    where: { id },
    select: { recipientId: true },
  })
  if (!note) return NextResponse.json({ ok: true })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.strangerNote.delete({ where: { id } })
  // Cascade deletes any attached reply via Prisma relation onDelete.

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/\[id\]/burn/route.ts
git commit -m "feat(stranger-notes): POST /api/stranger-notes/[id]/burn (recipient deletes)"
```

---

## Task 9: API — `POST /api/stranger-notes/replies/[id]/burn`

**Files:**
- Create: `src/app/api/stranger-notes/replies/[id]/burn/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/stranger-notes/replies/[id]/burn/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const reply = await prisma.strangerReply.findUnique({
    where: { id },
    select: { note: { select: { senderId: true } } },
  })
  if (!reply) return NextResponse.json({ ok: true })
  if (reply.note.senderId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.strangerReply.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stranger-notes/replies/\[id\]/burn/route.ts
git commit -m "feat(stranger-notes): POST /api/stranger-notes/replies/[id]/burn"
```

---

## Task 10: Cron — `/api/cron/expire-stranger-notes`

**Files:**
- Create: `src/app/api/cron/expire-stranger-notes/route.ts`

- [ ] **Step 1: Write the route (mirror the deliver-letters auth pattern)**

Create `src/app/api/cron/expire-stranger-notes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { tryDeliverQueued } from '@/lib/stranger-matcher'
import { NOTE_LIFETIME_MS, REPLY_LIFETIME_MS } from '@/lib/stranger-notes'

export async function GET(request: NextRequest) {
  // Cron auth — same pattern as /api/cron/deliver-letters
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const noteCutoff = new Date(now.getTime() - NOTE_LIFETIME_MS)
  const replyCutoff = new Date(now.getTime() - REPLY_LIFETIME_MS)

  // 1) Hard-delete delivered/replied notes whose 24h is up.
  const deletedNotes = await prisma.strangerNote.deleteMany({
    where: {
      status: { in: ['delivered', 'replied'] },
      matchedAt: { lt: noteCutoff },
    },
  })

  // 2) Hard-delete replies older than 24h (independent — a reply may outlive
  // its parent note if the recipient burned it; here we ensure the reply also
  // dies on schedule).
  const deletedReplies = await prisma.strangerReply.deleteMany({
    where: { createdAt: { lt: replyCutoff } },
  })

  // 3) Retry queued notes — try to match them now.
  const queued = await prisma.strangerNote.findMany({
    where: { status: 'queued' },
    select: { id: true, senderId: true },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })

  let matched = 0
  for (const note of queued) {
    const ok = await tryDeliverQueued(note.id, note.senderId)
    if (ok) matched += 1
  }

  return NextResponse.json({
    deletedNotes: deletedNotes.count,
    deletedReplies: deletedReplies.count,
    queuedScanned: queued.length,
    matched,
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cron/expire-stranger-notes/route.ts
git commit -m "feat(stranger-notes): cron expire + queued retry"
```

- [ ] **Step 3: Document the cron schedule**

Open the existing setup doc at [`docs/SETUP.md`](docs/SETUP.md). In the cron section (alongside `deliver-letters` and `send-reminders`), add a one-line entry:

```
- POST /api/cron/expire-stranger-notes — every 15 minutes
  Bearer token: $CRON_SECRET
  Sweeps expired notes/replies and retries queued matches.
```

(If the existing doc uses a different format, match it. The one-line description is what matters.)

Commit:

```bash
git add docs/SETUP.md
git commit -m "docs(setup): document expire-stranger-notes cron (every 15 min)"
```

---

## Task 11: Client hook — `src/hooks/useStrangerNotes.ts`

**Files:**
- Create: `src/hooks/useStrangerNotes.ts`

- [ ] **Step 1: Write the hook**

Create `src/hooks/useStrangerNotes.ts`:

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ReceivedNote {
  id: string
  content: string
  matchedAt: string | null
  expiresAt: string | null
  readAt: string | null
  myReply: string | null
}

export interface ReceivedReply {
  id: string
  content: string
  createdAt: string
  expiresAt: string
  readAt: string | null
}

export interface InboxPayload {
  receivedNotes: ReceivedNote[]
  receivedReplies: ReceivedReply[]
  canSendToday: boolean
  counters: { sent: number; received: number }
}

const TZ_HEADER = 'X-User-TZ'

function userTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set(TZ_HEADER, userTz())
  const res = await fetch(input, { ...init, headers, credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return data as T
}

export function useStrangerNotes() {
  const [data, setData] = useState<InboxPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const inbox = await jsonFetch<InboxPayload>('/api/stranger-notes/inbox')
      setData(inbox)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const send = useCallback(
    async (content: string) => {
      await jsonFetch('/api/stranger-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      await refresh()
    },
    [refresh]
  )

  const reply = useCallback(
    async (noteId: string, content: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      await refresh()
    },
    [refresh]
  )

  const burnNote = useCallback(
    async (noteId: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/burn`, {
        method: 'POST',
      })
      await refresh()
    },
    [refresh]
  )

  const burnReply = useCallback(
    async (replyId: string) => {
      await jsonFetch(`/api/stranger-notes/replies/${encodeURIComponent(replyId)}/burn`, {
        method: 'POST',
      })
      await refresh()
    },
    [refresh]
  )

  const markRead = useCallback(
    async (noteId: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/read`, {
        method: 'POST',
      }).catch(() => {})
    },
    []
  )

  return { data, loading, error, refresh, send, reply, burnNote, burnReply, markRead }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useStrangerNotes.ts
git commit -m "feat(stranger-notes): useStrangerNotes client hook"
```

---

## Task 12: Add the third tab to the Letters nav

**Files:**
- Modify: `src/components/letters/letterTypes.ts`
- Modify: `src/components/letters/LettersNav.tsx`
- Modify: `src/app/letters/page.tsx`

- [ ] **Step 1: Read the existing tab type and nav component first**

Run:

```bash
cat src/components/letters/letterTypes.ts
cat src/components/letters/LettersNav.tsx
```

Note exactly how the existing tabs are typed and rendered. The next step assumes the union is `'inbox' | 'sent'` and the nav renders both visually. **If the file uses different wording (e.g., `'received' | 'sent'`), adjust the new value and the page accordingly** — the third value is `'lights'` and its label is `"A Small Light"` for now (final copy is a separate pass).

- [ ] **Step 2: Extend `LettersTab` union**

In `src/components/letters/letterTypes.ts`, change:

```typescript
export type LettersTab = 'inbox' | 'sent'
```

to:

```typescript
export type LettersTab = 'inbox' | 'sent' | 'lights'
```

(If the file has more types or different existing values, leave them alone; only add `'lights'` to the union.)

- [ ] **Step 3: Add the tab button to `LettersNav.tsx`**

In `src/components/letters/LettersNav.tsx`, add a third tab button alongside the existing two. Mirror the visual treatment of the existing buttons. The new button's value is `'lights'` and its label is `"A Small Light"`. If the existing nav supports a `newCount` badge, do **not** wire it for `lights` yet — unread state for the lights tab is rendered inside the LightsView itself (see Task 14, mailbox glow).

If the existing component is small (under ~80 lines), you may simply duplicate the button JSX with the new value/label. If it's a list-driven render, add `{ value: 'lights', label: 'A Small Light' }` to the list. Pick whichever matches the existing style.

- [ ] **Step 4: Render `LightsView` from the page**

In `src/app/letters/page.tsx`, replace the body with:

```typescript
'use client'

import { useState } from 'react'
import LettersTokens from '@/components/letters/LettersTokens'
import LettersNav from '@/components/letters/LettersNav'
import InboxView from '@/components/letters/inbox/InboxView'
import SentView from '@/components/letters/sent/SentView'
import LightsView from '@/components/letters/lights/LightsView'
import type { LettersTab } from '@/components/letters/letterTypes'

export default function LettersPage() {
  const [tab, setTab] = useState<LettersTab>('inbox')
  const [newCount, setNewCount] = useState(0)

  return (
    <>
      <LettersTokens />
      <LettersNav active={tab} onChange={setTab} newCount={newCount} />
      {tab === 'inbox' && <InboxView onUnreadCountChange={setNewCount} />}
      {tab === 'sent' && <SentView />}
      {tab === 'lights' && <LightsView />}
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/letters/letterTypes.ts src/components/letters/LettersNav.tsx src/app/letters/page.tsx
git commit -m "feat(stranger-notes): add 'A Small Light' tab to Letters page"
```

- [ ] **Step 6: Verify in dev**

```bash
docker compose restart app
```

Open http://localhost:3111/letters in a logged-in browser. The new tab "A Small Light" appears in the nav. Clicking it currently throws because `LightsView` doesn't exist yet — that's expected. The next tasks build it.

---

## Task 13: `LightsView` shell

**Files:**
- Create: `src/components/letters/lights/LightsView.tsx`

This component is the shell. It owns layout and pulls data from `useStrangerNotes`. Sub-components (Mailbox, ComposePaper, ReadPaper, ReplyCard) are stitched in as they're built. For this task, render placeholders so the route works end-to-end.

- [ ] **Step 1: Write the shell**

Create `src/components/letters/lights/LightsView.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useStrangerNotes } from '@/hooks/useStrangerNotes'
import Mailbox from './Mailbox'
import ComposePaper from './ComposePaper'
import ReadPaper from './ReadPaper'
import ReplyCard from './ReplyCard'

type Mode = 'idle' | 'composing' | 'reading-note' | 'reading-reply'

export default function LightsView() {
  const { data, loading, error, send, reply, burnNote, burnReply, markRead } = useStrangerNotes()
  const [mode, setMode] = useState<Mode>('idle')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

  if (loading && !data) {
    return <div className="p-6 text-sm opacity-70">Loading…</div>
  }
  if (error && !data) {
    return <div className="p-6 text-sm text-red-500">{error}</div>
  }
  if (!data) return null

  const activeNote = data.receivedNotes.find((n) => n.id === activeNoteId) ?? null
  const activeReply = data.receivedReplies.find((r) => r.id === activeReplyId) ?? null

  const unreadNoteCount = data.receivedNotes.filter((n) => !n.readAt).length
  const unreadReplyCount = data.receivedReplies.filter((r) => !r.readAt).length

  return (
    <div className="relative flex flex-col items-center gap-8 p-6 sm:p-10">
      <div className="text-center max-w-md">
        <p className="text-sm opacity-70">
          You&apos;ve sent {data.counters.sent} small lights.
          {' '}
          {data.counters.received} have come back as quiet visitors.
        </p>
      </div>

      <Mailbox
        unreadCount={unreadNoteCount + unreadReplyCount}
        canSendToday={data.canSendToday}
        onCompose={() => setMode('composing')}
        receivedNotes={data.receivedNotes}
        receivedReplies={data.receivedReplies}
        onPickNote={(id) => {
          setActiveNoteId(id)
          setMode('reading-note')
          markRead(id)
        }}
        onPickReply={(id) => {
          setActiveReplyId(id)
          setMode('reading-reply')
        }}
      />

      {mode === 'composing' && (
        <ComposePaper
          canSend={data.canSendToday}
          onCancel={() => setMode('idle')}
          onSend={async (content) => {
            await send(content)
            setMode('idle')
          }}
        />
      )}

      {mode === 'reading-note' && activeNote && (
        <ReadPaper
          note={activeNote}
          onClose={() => {
            setMode('idle')
            setActiveNoteId(null)
          }}
          onBurn={async () => {
            await burnNote(activeNote.id)
            setMode('idle')
            setActiveNoteId(null)
          }}
          onReply={async (text) => {
            await reply(activeNote.id, text)
          }}
        />
      )}

      {mode === 'reading-reply' && activeReply && (
        <ReplyCard
          reply={activeReply}
          onClose={() => {
            setMode('idle')
            setActiveReplyId(null)
          }}
          onBurn={async () => {
            await burnReply(activeReply.id)
            setMode('idle')
            setActiveReplyId(null)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/letters/lights/LightsView.tsx
git commit -m "feat(stranger-notes): LightsView shell wiring data hook to sub-components"
```

The build will fail at this point until the four sub-components exist. The next four tasks build them in order. You can defer the dev-server restart until they're all in.

---

## Task 14: `Mailbox` component

**Files:**
- Create: `src/components/letters/lights/Mailbox.tsx`

The mailbox is the entry point. It shows a small lantern (visual), glows softly when there's an unread item, and reveals a list of received notes / replies on tap. Below it is the "Send a small light" button (disabled if `!canSendToday`).

- [ ] **Step 1: Write the component**

Create `src/components/letters/lights/Mailbox.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { ReceivedNote, ReceivedReply } from '@/hooks/useStrangerNotes'

interface Props {
  unreadCount: number
  canSendToday: boolean
  onCompose: () => void
  receivedNotes: ReceivedNote[]
  receivedReplies: ReceivedReply[]
  onPickNote: (id: string) => void
  onPickReply: (id: string) => void
}

export default function Mailbox({
  unreadCount,
  canSendToday,
  onCompose,
  receivedNotes,
  receivedReplies,
  onPickNote,
  onPickReply,
}: Props) {
  const { theme } = useThemeStore()
  const [open, setOpen] = useState(false)

  const hasItems = receivedNotes.length > 0 || receivedReplies.length > 0

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        type="button"
        onClick={() => hasItems && setOpen((v) => !v)}
        className="relative w-32 h-40 rounded-xl flex items-center justify-center text-5xl"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
          backdropFilter: `blur(${theme.glass.blur})`,
          color: theme.text.primary,
          cursor: hasItems ? 'pointer' : 'default',
          opacity: hasItems ? 1 : 0.6,
        }}
        whileHover={hasItems ? { scale: 1.03 } : {}}
        animate={
          unreadCount > 0
            ? {
                boxShadow: [
                  `0 0 12px ${theme.accent.warm}40`,
                  `0 0 24px ${theme.accent.warm}80`,
                  `0 0 12px ${theme.accent.warm}40`,
                ],
              }
            : { boxShadow: 'none' }
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Lantern of stranger notes"
      >
        <span aria-hidden>🪔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: theme.accent.primary, color: theme.bg.primary }}
          >
            {unreadCount}
          </span>
        )}
      </motion.button>

      {open && hasItems && (
        <div
          className="w-full max-w-sm rounded-xl p-3 flex flex-col gap-2"
          style={{
            background: theme.glass.bg,
            border: `1px solid ${theme.glass.border}`,
            backdropFilter: `blur(${theme.glass.blur})`,
          }}
        >
          {receivedNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.text.muted }}>
                For you
              </p>
              {receivedNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="text-left text-sm py-2 px-3 rounded-md hover:opacity-80 transition-opacity"
                  style={{
                    color: theme.text.secondary,
                    background: n.readAt ? 'transparent' : `${theme.accent.warm}15`,
                  }}
                  onClick={() => onPickNote(n.id)}
                >
                  {n.content.slice(0, 60)}
                  {n.content.length > 60 ? '…' : ''}
                </button>
              ))}
            </div>
          )}
          {receivedReplies.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.text.muted }}>
                A warmth back
              </p>
              {receivedReplies.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="text-left text-sm py-2 px-3 rounded-md hover:opacity-80 transition-opacity"
                  style={{
                    color: theme.text.secondary,
                    background: r.readAt ? 'transparent' : `${theme.accent.primary}15`,
                  }}
                  onClick={() => onPickReply(r.id)}
                >
                  {r.content}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCompose}
        disabled={!canSendToday}
        className="px-6 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: theme.accent.primary,
          color: theme.bg.primary,
        }}
      >
        {canSendToday ? 'Send a small light' : 'Your light is on its way. Come back tomorrow.'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/letters/lights/Mailbox.tsx
git commit -m "feat(stranger-notes): Mailbox component (lantern + unread glow + reveal)"
```

---

## Task 15: `ComposePaper` component

**Files:**
- Create: `src/components/letters/lights/ComposePaper.tsx`

A paper-styled compose surface with the warmth-framed placeholder, a char counter, send/cancel.

- [ ] **Step 1: Write the component**

Create `src/components/letters/lights/ComposePaper.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { MAX_NOTE_CHARS, MIN_NOTE_CHARS } from '@/lib/stranger-notes'

interface Props {
  canSend: boolean
  onCancel: () => void
  onSend: (content: string) => Promise<void>
}

export default function ComposePaper({ canSend, onCancel, onSend }: Props) {
  const { theme } = useThemeStore()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const trimmed = text.trim()
  const okLength = trimmed.length >= MIN_NOTE_CHARS && trimmed.length <= MAX_NOTE_CHARS
  const canSubmit = canSend && okLength && !busy

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-md p-6 rounded-2xl flex flex-col gap-4"
      style={{
        background: theme.glass.bg,
        border: `1px solid ${theme.glass.border}`,
        backdropFilter: `blur(${theme.glass.blur})`,
        fontFamily: 'var(--font-playfair, serif)',
      }}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_NOTE_CHARS + 50))}
        placeholder="a gratitude, a wish, a kindness — anything gentle you'd send to a stranger."
        rows={6}
        className="w-full bg-transparent outline-none resize-none text-base leading-relaxed"
        style={{ color: theme.text.primary }}
      />

      <div className="flex items-center justify-between text-xs" style={{ color: theme.text.muted }}>
        <span>
          {trimmed.length}/{MAX_NOTE_CHARS}
          {trimmed.length < MIN_NOTE_CHARS && trimmed.length > 0 && (
            <span className="ml-2 opacity-70">a little longer…</span>
          )}
        </span>
        <span>one per day</span>
      </div>

      {err && <p className="text-sm" style={{ color: '#c44' }}>{err}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 rounded-full text-sm transition-opacity disabled:opacity-50"
          style={{ color: theme.text.muted }}
        >
          Close
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            setBusy(true)
            setErr(null)
            try {
              await onSend(trimmed)
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Failed to send.')
            } finally {
              setBusy(false)
            }
          }}
          className="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          style={{ background: theme.accent.primary, color: theme.bg.primary }}
        >
          {busy ? 'Sending…' : 'Send into the world'}
        </button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/letters/lights/ComposePaper.tsx
git commit -m "feat(stranger-notes): ComposePaper with warmth-framed placeholder"
```

---

## Task 16: `ReadPaper` component (received note + reply input + burn)

**Files:**
- Create: `src/components/letters/lights/ReadPaper.tsx`

Renders a received note with its three actions: Reply (opens 20-word input), Burn (with confirm), Close.

- [ ] **Step 1: Write the component**

Create `src/components/letters/lights/ReadPaper.tsx`:

```typescript
'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { MAX_REPLY_WORDS, countWords } from '@/lib/stranger-notes'
import type { ReceivedNote } from '@/hooks/useStrangerNotes'

interface Props {
  note: ReceivedNote
  onClose: () => void
  onBurn: () => Promise<void>
  onReply: (text: string) => Promise<void>
}

export default function ReadPaper({ note, onClose, onBurn, onReply }: Props) {
  const { theme } = useThemeStore()
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingBurn, setConfirmingBurn] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const words = useMemo(() => countWords(text), [text])
  const overWordLimit = words > MAX_REPLY_WORDS
  const canSubmitReply = !busy && text.trim().length > 0 && !overWordLimit

  const expiresIn = note.expiresAt ? humanizeFromNow(new Date(note.expiresAt)) : null
  const alreadyReplied = note.myReply !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-md p-6 rounded-2xl flex flex-col gap-4"
      style={{
        background: theme.glass.bg,
        border: `1px solid ${theme.glass.border}`,
        backdropFilter: `blur(${theme.glass.blur})`,
        fontFamily: 'var(--font-playfair, serif)',
      }}
    >
      <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: theme.text.primary }}>
        {note.content}
      </p>

      {expiresIn && (
        <p className="text-xs italic" style={{ color: theme.text.muted }}>
          fades away in {expiresIn}
        </p>
      )}

      {alreadyReplied && (
        <div className="text-sm rounded-md p-3" style={{ background: `${theme.accent.primary}10`, color: theme.text.secondary }}>
          You replied: <span style={{ color: theme.text.primary }}>{note.myReply}</span>
        </div>
      )}

      {!alreadyReplied && replying && (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="send a warmth back — 20 words"
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{ color: theme.text.primary, borderTop: `1px solid ${theme.glass.border}` }}
          />
          <div className="flex items-center justify-between text-xs" style={{ color: overWordLimit ? '#c44' : theme.text.muted }}>
            <span>{words}/{MAX_REPLY_WORDS} words</span>
            <button
              type="button"
              disabled={!canSubmitReply}
              onClick={async () => {
                setBusy(true)
                setErr(null)
                try {
                  await onReply(text.trim())
                  setReplying(false)
                  setText('')
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Failed to send.')
                } finally {
                  setBusy(false)
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50"
              style={{ background: theme.accent.primary, color: theme.bg.primary }}
            >
              {busy ? 'Sending…' : 'Send warmth'}
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-sm" style={{ color: '#c44' }}>{err}</p>}

      <div className="flex items-center justify-end gap-3 mt-1">
        {!alreadyReplied && !replying && (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="px-4 py-2 rounded-full text-sm"
            style={{ background: theme.accent.primary, color: theme.bg.primary }}
          >
            Reply
          </button>
        )}
        {!confirmingBurn ? (
          <button
            type="button"
            onClick={() => setConfirmingBurn(true)}
            disabled={busy}
            className="px-3 py-2 rounded-full text-sm transition-opacity disabled:opacity-50"
            style={{ color: theme.text.muted }}
          >
            Burn
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.text.secondary }}>
            Let this go?
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onBurn()
                } finally {
                  setBusy(false)
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: '#c44', color: 'white' }}
            >
              Yes, burn
            </button>
            <button
              type="button"
              onClick={() => setConfirmingBurn(false)}
              className="px-3 py-1 rounded-full text-xs"
              style={{ color: theme.text.muted }}
            >
              No
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-full text-sm"
          style={{ color: theme.text.muted }}
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}

function humanizeFromNow(target: Date): string | null {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return null
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'}`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr} hour${diffHr === 1 ? '' : 's'}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/letters/lights/ReadPaper.tsx
git commit -m "feat(stranger-notes): ReadPaper with reply input and burn confirm"
```

---

## Task 17: `ReplyCard` component (the warmth-back you receive)

**Files:**
- Create: `src/components/letters/lights/ReplyCard.tsx`

Smaller card for the 20-word reply received to a note you sent. Two actions: Burn, Close.

- [ ] **Step 1: Write the component**

Create `src/components/letters/lights/ReplyCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { ReceivedReply } from '@/hooks/useStrangerNotes'

interface Props {
  reply: ReceivedReply
  onClose: () => void
  onBurn: () => Promise<void>
}

export default function ReplyCard({ reply, onClose, onBurn }: Props) {
  const { theme } = useThemeStore()
  const [confirmingBurn, setConfirmingBurn] = useState(false)
  const [busy, setBusy] = useState(false)

  const expiresIn = humanizeFromNow(new Date(reply.expiresAt))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-sm p-5 rounded-2xl flex flex-col gap-3"
      style={{
        background: theme.glass.bg,
        border: `1px solid ${theme.glass.border}`,
        backdropFilter: `blur(${theme.glass.blur})`,
        fontFamily: 'var(--font-playfair, serif)',
      }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: theme.text.muted }}>
        a warmth back
      </p>
      <p className="text-base leading-relaxed" style={{ color: theme.text.primary }}>
        {reply.content}
      </p>
      {expiresIn && (
        <p className="text-xs italic" style={{ color: theme.text.muted }}>
          fades in {expiresIn}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 mt-1">
        {!confirmingBurn ? (
          <button
            type="button"
            onClick={() => setConfirmingBurn(true)}
            disabled={busy}
            className="px-3 py-2 rounded-full text-sm transition-opacity disabled:opacity-50"
            style={{ color: theme.text.muted }}
          >
            Burn
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.text.secondary }}>
            Let it go?
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try { await onBurn() } finally { setBusy(false) }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: '#c44', color: 'white' }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmingBurn(false)}
              className="px-3 py-1 rounded-full text-xs"
              style={{ color: theme.text.muted }}
            >
              No
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-full text-sm"
          style={{ color: theme.text.muted }}
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}

function humanizeFromNow(target: Date): string | null {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return null
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'}`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr} hour${diffHr === 1 ? '' : 's'}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/letters/lights/ReplyCard.tsx
git commit -m "feat(stranger-notes): ReplyCard for received warmth-back"
```

---

## Task 18: Restart, lint, and verify the full flow end-to-end in dev

**Files:**
- (no code changes; verification only)

- [ ] **Step 1: Restart and lint**

```bash
docker compose restart app
docker compose exec app npm run lint
```

Fix any lint errors introduced. The `lights/` files are the most likely place to lint-fail (unused imports, etc.).

- [ ] **Step 2: Manual verification — single-user case**

With only one logged-in user (yourself):

1. Open `/letters` → click the "A Small Light" tab.
2. Counter line reads "You've sent 0 small lights. 0 have come back as quiet visitors."
3. Mailbox shows the lantern, no glow, no badge.
4. Click "Send a small light" → ComposePaper appears.
5. Try sending fewer than 10 chars → button is disabled.
6. Type a 50-char note → counter shows. Click Send into the world.
7. Compose closes. Send button now reads "Your light is on its way. Come back tomorrow." Counter shows "You've sent 1 small lights. 0 have come back as quiet visitors."
8. In Prisma Studio: a `stranger_notes` row exists with status `queued`, `recipientId` null. (No other user available.)

- [ ] **Step 3: Manual verification — two-user case**

Create a second test user via the dev login flow (different email). Open a second browser / incognito session for that user.

1. As user A: send a small light (today's allowance).
2. In Prisma Studio: the row should now have `status='delivered'`, `recipientId=B`, `matchedAt` set. User B's `strangerNotesReceived` is 1.
3. As user B: open `/letters` → the "A Small Light" tab should show the lantern with a glow + a "1" badge.
4. Click the lantern → the note appears in the "For you" zone.
5. Click the note preview → ReadPaper opens with the full text. "fades away in N hours" is shown.
6. Click Reply → input opens. Try entering more than 20 words → counter goes red, send disabled.
7. Type a 5-word reply, send. Reply card slides off; ReadPaper now shows "You replied: …".
8. As user A: reload `/letters`/A Small Light tab → mailbox glows, "A warmth back" zone shows. Click the reply preview → ReplyCard opens with B's 20-word reply.
9. Click Burn → confirm → ReplyCard closes, the row in `stranger_replies` is gone in Prisma Studio.

- [ ] **Step 4: Manual verification — 24h cron sweep**

Don't wait 24h. Instead, simulate by manually pushing `matchedAt` back in time:

```bash
docker compose exec app npx prisma studio
```

Find a `delivered` note row. Edit `matchedAt` to a timestamp 25 hours ago. Save.

Then trigger the cron route:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3111/api/cron/expire-stranger-notes
```

Expected response: `{ "deletedNotes": 1, "deletedReplies": 0 or N, "queuedScanned": 0, "matched": 0 }`. The row is gone from `stranger_notes`. The recipient's mailbox no longer shows that note.

Repeat the same trick on a `stranger_replies` row (push `createdAt` back 25h, hit the cron — row deleted).

- [ ] **Step 5: Manual verification — daily rate limit honors timezone**

In Prisma Studio, set the active user's `lastStrangerNoteSentAt` to a timestamp from "yesterday in your timezone" (e.g., 23:00 yesterday local). Reload `/letters`/A Small Light → "Send a small light" should be enabled (different calendar day). Send a note — succeeds. Try to send a second one — 429 returned, button shows "Your light is on its way."

- [ ] **Step 6: Commit anything that needed lint fixes**

If step 1 surfaced any fixes:

```bash
git add -u
git commit -m "chore(stranger-notes): lint cleanup after end-to-end verify"
```

If nothing needed fixing, skip the commit.

---

## Out-of-scope reminder (do NOT implement in this plan)

The following are explicitly deferred. They will not be built as part of this plan, regardless of how natural they may feel while you're in the code:

- **Moderation pipeline** (AI content check, regex strip, report button, blocklist, shadow-ban). The send and reply routes both contain a `// TODO BLOCKER before public launch` comment where the pre-encrypt moderation hook will attach. **Do not delete those comments.** When this plan finishes, the feature should be behind an internal-only / friend-test environment and not exposed in marketing.
- **Push notifications** for new delivery / reply arrival.
- **Profile setting to opt out of receiving stranger notes.**
- **Premium gating.**
- **Multiple sends per day, multiple replies, threaded back-and-forth.**
- **Non-English / language-aware matching.**
- **Final naming finalize and visual treatment polish on the mailbox.** Working name "A Small Light" and lantern emoji are placeholders; a separate visual pass picks the final lantern/box/can artwork.

---

## Self-review notes (writing-plans skill)

This plan was checked against [`docs/superpowers/specs/2026-05-03-stranger-notes-design.md`](../specs/2026-05-03-stranger-notes-design.md):

- **Schema** (spec § Data model) — Task 1.
- **`POST /api/stranger-notes` send** (spec § API endpoints) — Task 4.
- **`GET /api/stranger-notes/inbox`** — Task 5.
- **`POST .../[id]/read`** — Task 6.
- **`POST .../[id]/reply`** — Task 7.
- **`POST .../[id]/burn`** — Task 8.
- **`POST .../replies/[id]/burn`** — Task 9.
- **Cron expire + queued retry** (spec § Lifecycle & cleanup) — Task 10.
- **Daily rate limit honors `X-User-TZ`** (spec § Counters) — Tasks 2, 4, 5; verified in Task 18 step 5.
- **Encryption uses `lib/encryption.ts`** (spec § Data model "Encryption") — Tasks 2, 4, 7.
- **One-shot reply** (spec § UX flow > recipient) — Task 7 enforces by reading existing `note.reply` row and 409-ing.
- **Anonymity** (spec § Privacy) — no API ever returns sender or recipient identity to the other side. `inbox` route returns only content + my-reply text + timestamps. Confirmed in Task 5.
- **Soft warmth framing** (spec § Goals) — placeholder in Task 15 (`ComposePaper`) and Task 16 (`ReadPaper` reply input) carries the warmth copy.
- **Counters** (spec § Counters) — Task 4 increments sent; Task 3 (matcher) increments received on delivery.
- **Hard delete on burn / expiry** — Tasks 8, 9, 10 use Prisma `delete`/`deleteMany`, no soft-delete.
- **Moderation deferred but flagged** — `// TODO BLOCKER before public launch` comments present in Tasks 4 and 7. Out-of-scope reminder section at end of plan repeats the gate.

No spec requirement is unimplemented. Type names (`ReceivedNote`, `ReceivedReply`, `InboxPayload`) used in components match those exported from `useStrangerNotes` in Task 11.
