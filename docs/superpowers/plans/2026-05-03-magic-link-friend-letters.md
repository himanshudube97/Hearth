# Magic-Link Friend Letters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct-in-email letter delivery for friends with an opaque-token magic link that limits reads (3 reads / 14 days), shows a signup CTA on exhaustion, and is **not E2EE** (server-side encryption only). The compose UI surfaces this clearly so users with E2EE enabled understand the privacy trade-off before sending.

**Architecture:** A new `LetterAccessToken` table stores `{token, letterId, recipientEmail, expiresAt, readsRemaining, readCount, firstReadAt}`. The existing `deliver-letters` cron mints a token per friend letter at delivery time and embeds the URL in the email instead of the full letter content. A public `/letter/[token]` route validates the token, decrements `readsRemaining`, and renders the decrypted (server-side) letter. When the token is exhausted/expired, the page shows a "Sign up to keep your letters" CTA.

**Tech Stack:** Next.js 16 App Router, Prisma + PostgreSQL, Resend, existing AES-256-GCM server-side encryption (`src/lib/encryption.ts`).

---

## File Structure

**Created:**
- `prisma/migrations/<timestamp>_add_letter_access_token/migration.sql` (Prisma generates)
- `src/lib/letter-tokens.ts` — `generateToken()`, `consumeToken()`, `getTokenStatus()` helpers
- `src/app/letter/[token]/page.tsx` — public letter view (no auth)
- `src/app/api/letter/[token]/route.ts` — GET: returns letter + decrements counter
- `src/__tests__/letter-tokens.test.ts` — unit tests for the helper

**Modified:**
- `prisma/schema.prisma` — add `LetterAccessToken` model
- `src/app/api/cron/deliver-letters/route.ts` — mint token for friend letters; pass URL to email template
- `src/lib/email.ts` — change `sendLetterEmail` body to use the magic-link URL instead of full content
- `src/components/letters/compose/ComposeView.tsx` — add "not E2EE" notice when E2EE is enabled and recipient is a friend

---

### Task 1: Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the model**

Append to `prisma/schema.prisma`:

```prisma
model LetterAccessToken {
  id              String    @id @default(cuid())
  token           String    @unique
  letterId        String
  letter          JournalEntry @relation(fields: [letterId], references: [id], onDelete: Cascade)
  recipientEmail  String
  expiresAt       DateTime
  readsRemaining  Int       @default(3)
  readCount       Int       @default(0)
  firstReadAt     DateTime?
  createdAt       DateTime  @default(now())

  @@index([token])
  @@index([letterId])
}
```

In `JournalEntry`, add the back-relation:

```prisma
accessTokens   LetterAccessToken[]
```

- [ ] **Step 2: Generate the migration**

```bash
docker compose exec app npx prisma migrate dev --name add_letter_access_token
```

Expected: migration file written to `prisma/migrations/<timestamp>_add_letter_access_token/`. Prisma client regenerates.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(letters): add LetterAccessToken model"
```

---

### Task 2: Token helper module + tests

**Files:**
- Create: `src/lib/letter-tokens.ts`
- Create: `src/__tests__/letter-tokens.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/letter-tokens.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateToken } from '@/lib/letter-tokens'

describe('generateToken', () => {
  it('returns a URL-safe base64 string of expected length', () => {
    const tok = generateToken()
    expect(typeof tok).toBe('string')
    expect(tok.length).toBeGreaterThan(40)
    expect(tok).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('returns a different value each call', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- letter-tokens`
Expected: FAIL — `Cannot find module '@/lib/letter-tokens'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/letter-tokens.ts`:

```typescript
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

const DEFAULT_READS = 3
const DEFAULT_TTL_DAYS = 14

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createAccessToken(params: {
  letterId: string
  recipientEmail: string
  reads?: number
  ttlDays?: number
}) {
  const token = generateToken()
  const reads = params.reads ?? DEFAULT_READS
  const ttlDays = params.ttlDays ?? DEFAULT_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
  return prisma.letterAccessToken.create({
    data: {
      token,
      letterId: params.letterId,
      recipientEmail: params.recipientEmail,
      readsRemaining: reads,
      expiresAt,
    },
  })
}

export type TokenStatus =
  | { ok: true; tokenRow: Awaited<ReturnType<typeof prisma.letterAccessToken.findUnique>> }
  | { ok: false; reason: 'not_found' | 'expired' | 'exhausted' }

export async function consumeToken(token: string): Promise<TokenStatus> {
  const row = await prisma.letterAccessToken.findUnique({ where: { token } })
  if (!row) return { ok: false, reason: 'not_found' }
  if (row.expiresAt < new Date()) return { ok: false, reason: 'expired' }
  if (row.readsRemaining <= 0) return { ok: false, reason: 'exhausted' }

  const updated = await prisma.letterAccessToken.update({
    where: { token },
    data: {
      readsRemaining: { decrement: 1 },
      readCount: { increment: 1 },
      firstReadAt: row.firstReadAt ?? new Date(),
    },
  })
  return { ok: true, tokenRow: updated }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- letter-tokens`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/letter-tokens.ts src/__tests__/letter-tokens.test.ts
git commit -m "feat(letters): token helpers (generate / create / consume)"
```

---

### Task 3: Hook token creation into delivery cron

**Files:**
- Modify: `src/app/api/cron/deliver-letters/route.ts`
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Read the cron**

Open `src/app/api/cron/deliver-letters/route.ts`. Find the loop that iterates over due letters and sends emails. Identify where it differentiates self-letters from friend letters (likely `entry.recipientEmail` matches the user's own email vs not).

- [ ] **Step 2: Update sendLetterEmail signature**

Open `src/lib/email.ts`. Change `sendLetterEmail` to accept a `magicLinkUrl: string` and replace the body content rendering with a "you have a letter from {senderName}" preview + the link.

Find the existing `sendLetterEmail` function. Replace its body-builder section with:

```typescript
const html = `
  <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #FBF7F0;">
    <h1 style="font-size: 28px; color: #3a2818; margin-bottom: 8px;">A letter for you</h1>
    <p style="color: #6b5849; font-size: 16px; line-height: 1.6;">
      ${escapeHtml(senderName)} wrote you a letter and Hearth held onto it until today.
    </p>
    <div style="margin: 32px 0;">
      <a href="${magicLinkUrl}"
         style="display: inline-block; background: #3a2818; color: #FBF7F0;
                padding: 14px 28px; border-radius: 24px; text-decoration: none;
                font-size: 16px; letter-spacing: 0.5px;">
        Open your letter
      </a>
    </div>
    <p style="color: #8a7560; font-size: 13px; line-height: 1.5; margin-top: 24px;">
      This link can be opened up to 3 times within the next 14 days.
      After that, it expires.
    </p>
  </div>
`
```

(Add `escapeHtml` if not already present — it's a small utility:)

```typescript
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  )
}
```

- [ ] **Step 3: Mint token in the cron**

In `src/app/api/cron/deliver-letters/route.ts`, inside the friend-letter branch, before the `sendLetterEmail` call:

```typescript
import { createAccessToken } from '@/lib/letter-tokens'

// ... inside the loop, in the friend-letter branch:
const tokenRow = await createAccessToken({
  letterId: entry.id,
  recipientEmail: entry.recipientEmail!,
})
const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/letter/${tokenRow.token}`

await sendLetterEmail({
  to: entry.recipientEmail!,
  senderName: senderName,
  magicLinkUrl,
})
```

(Adjust to match the existing `sendLetterEmail` parameter shape — the call site might use a different signature; preserve the existing fields you don't change.)

- [ ] **Step 4: Manual verification**

In dev mode, create a friend letter with `unlockDate` in the past (force via Prisma Studio: `docker compose exec app npx prisma studio`). Trigger the cron:

```bash
curl -X POST http://localhost:3111/api/cron/deliver-letters \
  -H "Authorization: Bearer $CRON_SECRET"
```

Confirm: a `LetterAccessToken` row appears (check Prisma Studio); the email goes out (Resend dashboard or logs) with the magic-link URL.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/deliver-letters/route.ts src/lib/email.ts
git commit -m "feat(letters): mint magic-link token at delivery, email contains link only"
```

---

### Task 4: Public `/api/letter/[token]` GET endpoint

**Files:**
- Create: `src/app/api/letter/[token]/route.ts`

- [ ] **Step 1: Write the endpoint**

Create `src/app/api/letter/[token]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { consumeToken } from '@/lib/letter-tokens'
import { decryptEntryFields } from '@/lib/encryption'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const status = await consumeToken(token)
  if (!status.ok) {
    return NextResponse.json({ error: status.reason }, { status: 410 })
  }

  const entry = await prisma.journalEntry.findUnique({
    where: { id: status.tokenRow!.letterId },
    include: { photos: true, doodles: true },
  })

  if (!entry) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Friend letters use server-side encryption, so we always decrypt here.
  const decrypted = decryptEntryFields(entry)

  return NextResponse.json({
    text: decrypted.text,
    senderName: entry.recipientName ?? null, // adjust to match actual sender field
    createdAt: entry.createdAt,
    photos: entry.photos,
    doodles: entry.doodles,
    readsRemaining: status.tokenRow!.readsRemaining,
  })
}
```

(Adjust field names to match the existing `JournalEntry` schema — verify with `prisma/schema.prisma`. The "sender name" might come from the `User` table via `entry.userId`; if so, join it.)

- [ ] **Step 2: Confirm the route is publicly accessible**

Check `src/middleware.ts` — `/api/letter/` must be allowed without auth. The current `PUBLIC_PATHS` list does NOT include it. Add it:

```typescript
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/webhooks', '/api/webhooks/lemonsqueezy', '/api/letter']
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/letter/[token]/route.ts src/middleware.ts
git commit -m "feat(letters): public token-validating GET endpoint"
```

---

### Task 5: Public `/letter/[token]` page

**Files:**
- Create: `src/app/letter/[token]/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/letter/[token]/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; reason: 'not_found' | 'expired' | 'exhausted' }
  | { kind: 'ok'; text: string; senderName: string | null; readsRemaining: number }

export default function LetterPage() {
  const params = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    async function run() {
      const res = await fetch(`/api/letter/${params.token}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setState({ kind: 'error', reason: data.error ?? 'not_found' })
        return
      }
      const data = await res.json()
      setState({
        kind: 'ok',
        text: data.text ?? '',
        senderName: data.senderName,
        readsRemaining: data.readsRemaining,
      })
    }
    run()
  }, [params.token])

  if (state.kind === 'loading') {
    return <main className="min-h-screen flex items-center justify-center text-stone-500">Opening your letter…</main>
  }

  if (state.kind === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-serif text-stone-800 mb-3">
            {state.reason === 'expired' ? 'This letter has expired' :
             state.reason === 'exhausted' ? 'This letter has been viewed' :
             'Letter not found'}
          </h1>
          <p className="text-stone-600 text-sm mb-6">
            {state.reason === 'exhausted'
              ? 'Sign up for Hearth to keep your letters safe forever.'
              : 'The link may have expired or been opened too many times.'}
          </p>
          <Link
            href="/login"
            className="inline-block bg-stone-800 text-white rounded-full px-6 py-2"
          >
            Sign up for Hearth
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <article className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-10 font-serif">
        <p className="text-sm text-stone-400 mb-6">
          A letter from {state.senderName ?? 'someone who cares about you'}
        </p>
        <div
          className="text-stone-800 leading-relaxed prose prose-stone"
          dangerouslySetInnerHTML={{ __html: state.text }}
        />
        <p className="text-xs text-stone-400 mt-10">
          {state.readsRemaining > 0
            ? `You can open this letter ${state.readsRemaining} more time${state.readsRemaining === 1 ? '' : 's'}.`
            : 'This was your last view of this letter.'}
        </p>
      </article>
    </main>
  )
}
```

- [ ] **Step 2: Add /letter/ to public-path list in middleware**

In `src/middleware.ts`, add `/letter/` to `PUBLIC_PATHS`:

```typescript
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/webhooks', '/api/webhooks/lemonsqueezy', '/api/letter', '/letter']
```

- [ ] **Step 3: Manual verification**

Get a real token from the DB (created by Task 3 verification). Visit `http://localhost:3111/letter/<token>` — letter renders. Refresh — counter decrements. After 3 refreshes, see the "exhausted" view. Wait 14 days... or manually expire by setting `expiresAt` to the past in Prisma Studio, then refresh — see the "expired" view.

- [ ] **Step 4: Commit**

```bash
git add src/app/letter/[token]/page.tsx src/middleware.ts
git commit -m "feat(letters): public magic-link letter page with read counter + signup CTA"
```

---

### Task 6: "Not E2EE" notice on compose UI for friend letters

**Files:**
- Modify: `src/components/letters/compose/ComposeView.tsx`

- [ ] **Step 1: Read ComposeView**

Open `src/components/letters/compose/ComposeView.tsx`. Find where the user picks the recipient (self vs friend, or where they enter the friend's email).

- [ ] **Step 2: Add the notice**

Detect when (a) the user has E2EE enabled (`useE2EEStore(s => s.isEnabled)`) AND (b) the letter is to a friend. When both true, render this notice between the recipient field and the editor:

```tsx
{e2eeEnabled && isFriendLetter && (
  <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm text-amber-900 mb-4">
    <strong>Heads up:</strong> friend letters aren&apos;t end-to-end encrypted.
    To deliver later when you&apos;re offline, Hearth keeps a copy it can read.
    Your own journal stays E2EE.
  </div>
)}
```

(Variable names — `e2eeEnabled`, `isFriendLetter` — should be derived from existing state in the component.)

- [ ] **Step 3: Manual verification**

In dev mode with E2EE enabled: open the letter compose UI, switch recipient to friend → notice appears. Switch back to self → notice disappears.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/compose/ComposeView.tsx
git commit -m "feat(letters): show 'not E2EE' notice when composing friend letters with E2EE on"
```

---

### Task 7: Final integration check

- [ ] **Step 1: Lint + tests + build**

```bash
npm run lint
npm run test
npm run build
```

All must pass.

- [ ] **Step 2: End-to-end smoke test**

In dev mode:
1. Compose a friend letter with `unlockDate` 1 minute from now (force via DB if UI prevents).
2. Wait, then `curl` the cron with `CRON_SECRET`.
3. Check the email (Resend dashboard) — should contain the magic-link URL, NOT the letter text.
4. Open the URL → letter shows. Refresh 2 more times → still shows. 4th refresh → exhaustion screen with signup CTA.

---

## Self-Review Checklist

- [ ] `LetterAccessToken` schema fields match across Tasks 1, 2, 4, 5
- [ ] `consumeToken` return shape consistent in Tasks 2 and 4
- [ ] `magicLinkUrl` parameter is added to `sendLetterEmail` in Task 3 and used in the call
- [ ] `/letter/` and `/api/letter/` are both added to middleware public paths
- [ ] Read-count enforcement happens in `consumeToken` (server-side), not on the client
