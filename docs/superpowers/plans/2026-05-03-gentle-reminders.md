# Gentle Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two complementary engagement features for Hearth — an opt-in nightly browser push reminder with poetic copy and silent auto-pause, plus an in-app comeback moment with three escalating tiers (whisper / card / modal) that greets users returning after an absence.

**Architecture:** Web Push (VAPID + service worker + `web-push` server library) for the nightly reminder; pure client-side computation against `JournalEntry.createdAt` for the comeback moment. One new Prisma model (`PushSubscription`), three additive `User.profile` JSON keys, one new cron route mirroring the existing `deliver-letters` pattern. Reuses `getCurrentUser()`, `CRON_SECRET`, `prisma` singleton.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma + PostgreSQL, vitest (jsdom) for tests, `web-push` npm package, native browser `PushManager` + `ServiceWorker` APIs, Framer Motion for the comeback moment animations.

**Spec:** [docs/superpowers/specs/2026-05-03-gentle-reminders-design.md](../specs/2026-05-03-gentle-reminders-design.md)

---

## File Structure

**New files:**
- `public/sw.js` — service worker (push + notificationclick handlers)
- `prisma/schema.prisma` — add `PushSubscription` model + `pushSubscriptions` relation on `User` (modify)
- `src/lib/reminder-messages.ts` — flat array of ~30 poetic lines
- `src/lib/comeback-messages.ts` — `{ whisper, card, modal }` arrays
- `src/lib/reminder-schedule.ts` — pure functions for hash→slot, target-time, "current 15-min window matches?"
- `src/lib/comeback.ts` — pure function: `gapDays(now, lastEntryAt, tz) → number`, `tierFor(gapDays) → 'whisper' | 'card' | 'modal'`
- `src/hooks/useReminders.ts` — opt-in state machine, exposes `subscribe`, `unsubscribe`, `setReminderTime`, `pushSupported`, `permissionState`
- `src/hooks/useComeback.ts` — runs on mount, decides whether to render a comeback component
- `src/components/reminders/OptInCard.tsx` — dismissible card after first entry
- `src/components/reminders/ReminderControls.tsx` — profile-page controls
- `src/components/reminders/ServiceWorkerRegistrar.tsx` — client-only mount that registers `/sw.js`
- `src/components/comeback/ComebackWhisper.tsx` — 1–2 day tier
- `src/components/comeback/ComebackCard.tsx` — 3–7 day tier
- `src/components/comeback/ComebackModal.tsx` — 8+ day tier
- `src/components/comeback/ComebackHost.tsx` — picks the right component using `useComeback`
- `src/app/api/push/subscribe/route.ts` — `POST` (upsert) and `DELETE`
- `src/app/api/push/test/route.ts` — `POST`, fires a fixed test message to the calling user's most recent subscription
- `src/app/api/cron/send-reminders/route.ts` — `GET` (and `POST` aliased), the scheduler
- `src/app/api/me/profile-flags/route.ts` — `PATCH`, sets one of the additive `User.profile` flags (`reminderTime`, `reminderOptInPromptShownAt`, `lastComebackShownAt`)
- `src/__tests__/reminder-schedule.test.ts`
- `src/__tests__/comeback.test.ts`
- `src/__tests__/api-push-subscribe.test.ts`
- `src/__tests__/api-cron-send-reminders.test.ts`

**Modified files:**
- `prisma/schema.prisma` — see above
- `package.json` — add `web-push` dep
- `src/app/layout.tsx` — mount `<ServiceWorkerRegistrar />` and `<ComebackHost />`
- `src/app/me/page.tsx` — embed `<ReminderControls />`
- `src/hooks/useAutosaveEntry.ts` — emit a window event `hearth:entry-saved` once per save (used by OptInCard trigger logic)
- `src/app/write/page.tsx` (or wherever the desk view lives — confirm path during Task 11) — read `?write=1` and force a fresh new-entry spread; mount `<OptInCard />` host

---

## Task 1: Install web-push and generate VAPID keys

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install the package inside the running container**

```bash
docker compose exec app npm install web-push
docker compose exec app npm install --save-dev @types/web-push
```

- [ ] **Step 2: Generate VAPID keys**

```bash
docker compose exec app npx web-push generate-vapid-keys
```

Copy the printed `Public Key` and `Private Key` into your local `.env`:

```
VAPID_PUBLIC_KEY=<public from output>
VAPID_PRIVATE_KEY=<private from output>
VAPID_SUBJECT=mailto:support@hearth.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same public key, exposed to browser>
```

- [ ] **Step 3: Document the new env vars in `.env.example`**

Add the four lines above to `.env.example` (with placeholder values, not real keys).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add web-push dependency and VAPID env vars"
```

---

## Task 2: Add `PushSubscription` Prisma model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the model and the User relation**

Append to `prisma/schema.prisma`:

```prisma
model PushSubscription {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint            String    @unique
  p256dh              String
  auth                String
  userAgent           String?
  tz                  String    @default("UTC")
  createdAt           DateTime  @default(now())
  lastFiredAt         DateTime?
  consecutiveIgnored  Int       @default(0)
  pausedAt            DateTime?

  @@index([userId])
  @@index([pausedAt, lastFiredAt])
  @@map("push_subscriptions")
}
```

Inside the existing `User` model, add this line near the other relations:

```prisma
  pushSubscriptions PushSubscription[]
```

- [ ] **Step 2: Apply the schema (additive only — safe)**

```bash
docker compose exec app npx prisma db push
```

Expected: "Your database is now in sync with your Prisma schema." No data-loss warnings (this is purely additive).

- [ ] **Step 3: Regenerate the client**

```bash
docker compose exec app npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add PushSubscription model for nightly reminders"
```

---

## Task 3: Pure scheduling functions (TDD)

**Files:**
- Create: `src/lib/reminder-schedule.ts`
- Test: `src/__tests__/reminder-schedule.test.ts`

The cron needs deterministic-but-randomized scheduling. These pure functions are the heart of it — test first.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/reminder-schedule.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { defaultSlotForDay, targetMinutesPastSeven, isCurrentWindowTarget } from '@/lib/reminder-schedule'

describe('defaultSlotForDay', () => {
  it('returns a slot in [0, 11] (12 fifteen-minute slots between 7pm and 10pm)', () => {
    const slot = defaultSlotForDay('user-abc', '2026-05-03')
    expect(slot).toBeGreaterThanOrEqual(0)
    expect(slot).toBeLessThan(12)
  })

  it('is deterministic for the same userId+date', () => {
    const a = defaultSlotForDay('user-abc', '2026-05-03')
    const b = defaultSlotForDay('user-abc', '2026-05-03')
    expect(a).toBe(b)
  })

  it('varies across days for the same user', () => {
    const slots = new Set<number>()
    for (let i = 1; i <= 30; i++) {
      const date = `2026-05-${String(i).padStart(2, '0')}`
      slots.add(defaultSlotForDay('user-abc', date))
    }
    // At least 6 distinct slots across 30 days — extremely high probability
    expect(slots.size).toBeGreaterThanOrEqual(6)
  })
})

describe('targetMinutesPastSeven', () => {
  it('default mode returns slot * 15 minutes past 7pm', () => {
    // slot 0 -> 0 min past 7pm -> 19:00
    // slot 11 -> 165 min -> 21:45 (last slot before 22:00)
    expect(targetMinutesPastSeven({ mode: 'default', userId: 'u', dateStr: '2026-05-03' }))
      .toBeGreaterThanOrEqual(0)
    expect(targetMinutesPastSeven({ mode: 'default', userId: 'u', dateStr: '2026-05-03' }))
      .toBeLessThanOrEqual(165)
  })

  it('override mode returns minutes-past-7pm for HH:MM in [19:00, 21:45]', () => {
    expect(targetMinutesPastSeven({ mode: 'override', time: '19:00' })).toBe(0)
    expect(targetMinutesPastSeven({ mode: 'override', time: '20:30' })).toBe(90)
    expect(targetMinutesPastSeven({ mode: 'override', time: '21:45' })).toBe(165)
  })

  it('override mode allows times outside the default window (returns negative or >180)', () => {
    expect(targetMinutesPastSeven({ mode: 'override', time: '08:00' })).toBe(-660)
    expect(targetMinutesPastSeven({ mode: 'override', time: '23:00' })).toBe(240)
  })
})

describe('isCurrentWindowTarget', () => {
  it('matches when nowLocal is in the same 15-min slot as target', () => {
    // target = 20:00 local (60 min past 7pm)
    // nowLocal = 20:07 local → same 15-min window
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T20:07:00',
      targetMinutesPastSeven: 60,
    })).toBe(true)
  })

  it('does not match when nowLocal is in a different 15-min slot', () => {
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T20:16:00',
      targetMinutesPastSeven: 60,
    })).toBe(false)
  })

  it('does not match when target is 19:00 and nowLocal is 18:59', () => {
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T18:59:00',
      targetMinutesPastSeven: 0,
    })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — they should fail (file doesn't exist)**

```bash
docker compose exec app npm test -- reminder-schedule
```

Expected: FAIL — "Cannot find module '@/lib/reminder-schedule'".

- [ ] **Step 3: Implement the module**

Create `src/lib/reminder-schedule.ts`:

```typescript
import { createHash } from 'crypto'

const DEFAULT_WINDOW_START_HOUR = 19  // 7pm
const SLOT_MINUTES = 15
const SLOTS_IN_WINDOW = 12  // 12 * 15 = 180 min = 3 hours = 7pm-10pm

export function defaultSlotForDay(userId: string, dateStr: string): number {
  const hash = createHash('sha256').update(`${userId}:${dateStr}`).digest('hex')
  const intVal = parseInt(hash.slice(0, 8), 16)
  return intVal % SLOTS_IN_WINDOW
}

export type TargetInput =
  | { mode: 'default'; userId: string; dateStr: string }
  | { mode: 'override'; time: string } // HH:MM

export function targetMinutesPastSeven(input: TargetInput): number {
  if (input.mode === 'default') {
    return defaultSlotForDay(input.userId, input.dateStr) * SLOT_MINUTES
  }
  const [hh, mm] = input.time.split(':').map(Number)
  return (hh - DEFAULT_WINDOW_START_HOUR) * 60 + mm
}

export function isCurrentWindowTarget(args: {
  nowLocalISO: string  // local-wall-clock ISO, e.g. '2026-05-03T20:07:00'
  targetMinutesPastSeven: number
}): boolean {
  const m = args.nowLocalISO.match(/T(\d{2}):(\d{2})/)
  if (!m) return false
  const hh = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  const minutesPastSeven = (hh - DEFAULT_WINDOW_START_HOUR) * 60 + mm

  // Slot boundaries: target lands in slot floor(target/15); now lands in slot floor(now/15)
  return Math.floor(minutesPastSeven / SLOT_MINUTES) ===
         Math.floor(args.targetMinutesPastSeven / SLOT_MINUTES)
}
```

- [ ] **Step 4: Run tests — they should pass**

```bash
docker compose exec app npm test -- reminder-schedule
```

Expected: all assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reminder-schedule.ts src/__tests__/reminder-schedule.test.ts
git commit -m "feat: pure scheduling functions for nightly reminders"
```

---

## Task 4: Reminder messages constants

**Files:**
- Create: `src/lib/reminder-messages.ts`

- [ ] **Step 1: Create the file with placeholder copy (5 lines now, full ~30 lines is a copywriting follow-up)**

```typescript
// Pool of one-line poetic reminders for the nightly push notification.
// Each line should be ≤100 chars so it renders cleanly across OSes without truncation.
// Author the rest of the pool over time; v1 ships with these 5.
export const REMINDER_LINES: readonly string[] = [
  'the evening is quiet. write a line.',
  'hearth is here. one small thing?',
  'before sleep, a sentence about today.',
  'no pressure. just a page that\'s waiting.',
  'the day\'s still warm. tell us how it felt.',
] as const

export function pickReminderLine(): string {
  return REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)]
}

export const REMINDER_TITLE = 'hearth'
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/reminder-messages.ts
git commit -m "feat: reminder message pool (initial 5 lines)"
```

---

## Task 5: `POST /api/push/subscribe` and `DELETE /api/push/subscribe`

**Files:**
- Create: `src/app/api/push/subscribe/route.ts`
- Test: `src/__tests__/api-push-subscribe.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api-push-subscribe.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    pushSubscription: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { POST, DELETE } from '@/app/api/push/subscribe/route'

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no user is logged in', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const res = await POST(makeReq({
      endpoint: 'https://fcm.example/abc',
      keys: { p256dh: 'k1', auth: 'k2' },
      tz: 'Asia/Kolkata',
    }))
    expect(res.status).toBe(401)
  })

  it('upserts the subscription and returns 200', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1', email: 'a@b.c', name: null, avatar: null, provider: 'dev',
    })
    vi.mocked(prisma.pushSubscription.upsert).mockResolvedValue({} as any)
    const res = await POST(makeReq({
      endpoint: 'https://fcm.example/abc',
      keys: { p256dh: 'k1', auth: 'k2' },
      userAgent: 'Chrome',
      tz: 'Asia/Kolkata',
    }))
    expect(res.status).toBe(200)
    expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: 'https://fcm.example/abc' },
      create: {
        userId: 'u1',
        endpoint: 'https://fcm.example/abc',
        p256dh: 'k1',
        auth: 'k2',
        userAgent: 'Chrome',
        tz: 'Asia/Kolkata',
      },
      update: {
        userId: 'u1',
        p256dh: 'k1',
        auth: 'k2',
        userAgent: 'Chrome',
        tz: 'Asia/Kolkata',
        pausedAt: null,
        consecutiveIgnored: 0,
      },
    })
  })

  it('returns 400 on missing endpoint', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1', email: 'a@b.c', name: null, avatar: null, provider: 'dev',
    })
    const res = await POST(makeReq({ keys: { p256dh: 'k1', auth: 'k2' } }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/push/subscribe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: 'https://fcm.example/abc' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('deletes by endpoint and returns 200', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1', email: 'a@b.c', name: null, avatar: null, provider: 'dev',
    })
    vi.mocked(prisma.pushSubscription.delete).mockResolvedValue({} as any)
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: 'https://fcm.example/abc' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { endpoint: 'https://fcm.example/abc' },
    })
  })
})
```

- [ ] **Step 2: Run tests — they should fail**

```bash
docker compose exec app npm test -- api-push-subscribe
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/push/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest | Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth
  const userAgent = body?.userAgent ?? null
  const tz = body?.tz ?? 'UTC'

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh, auth, userAgent, tz },
    update: {
      userId: user.id,
      p256dh,
      auth,
      userAgent,
      tz,
      pausedAt: null,
      consecutiveIgnored: 0,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest | Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const endpoint = body?.endpoint
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests — they should pass**

```bash
docker compose exec app npm test -- api-push-subscribe
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/push/subscribe/route.ts src/__tests__/api-push-subscribe.test.ts
git commit -m "feat: subscribe/unsubscribe API for push reminders"
```

---

## Task 6: Service worker

**Files:**
- Create: `public/sw.js`

The service worker must be plain JS (no TypeScript, no imports, served verbatim from `/sw.js`). Keep it tiny.

- [ ] **Step 1: Create the file**

Create `public/sw.js`:

```javascript
// Hearth service worker — push reminders only (v1).
// Plain JS, no build step. Lives in public/ so it's served at /sw.js.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'hearth', body: '' }
  try {
    payload = event.data.json()
  } catch (_) {
    payload.body = event.data ? event.data.text() : ''
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'hearth', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'hearth-reminder',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = '/?write=1'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing Hearth tab if one is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
```

- [ ] **Step 2: Verify the file is served by Next.js**

```bash
docker compose exec app curl -sf http://localhost:3000/sw.js | head -3
```

Expected: prints the first lines of the file (the comment block). If it 404s, restart the dev server: `docker compose restart app`.

- [ ] **Step 3: Confirm `/icon-192.png` exists in `public/`. If not, copy any existing Hearth icon to `public/icon-192.png`**

```bash
ls -1 /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/public/ | grep -iE '(icon|logo)'
```

If no 192x192 icon exists, the engineer should add one (or use the favicon as a stopgap and note this as a polish-pass item).

- [ ] **Step 4: Commit**

```bash
git add public/sw.js
git commit -m "feat: service worker for push reminders"
```

---

## Task 7: `useReminders` hook

**Files:**
- Create: `src/hooks/useReminders.ts`

This is the client-side state machine. It owns: feature-detection, `Notification.permission`, `PushManager.subscribe()`, talking to `/api/push/subscribe`, and the time-preference setter.

- [ ] **Step 1: Implement the hook**

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'

export type ReminderTimeMode = 'default' | { time: string }  // 'default' = surprise me

export interface UseRemindersResult {
  pushSupported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
  subscribe(): Promise<{ ok: boolean; error?: string }>
  unsubscribe(): Promise<void>
  setReminderTime(mode: ReminderTimeMode): Promise<void>
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Std = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Std)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export function useReminders(): UseRemindersResult {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const pushSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  useEffect(() => {
    if (!pushSupported) return
    setPermission(Notification.permission)
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
  }, [pushSupported])

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!pushSupported) return { ok: false, error: 'unsupported' }

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return { ok: false, error: 'denied' }

    const reg = await navigator.serviceWorker.ready
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapid) return { ok: false, error: 'no-vapid-key' }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    })

    const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        userAgent: navigator.userAgent,
        tz,
      }),
    })
    if (!res.ok) return { ok: false, error: 'server-error' }

    setSubscribed(true)
    return { ok: true }
  }, [pushSupported])

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!pushSupported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) {
      setSubscribed(false)
      return
    }
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {})
    await sub.unsubscribe()
    setSubscribed(false)
  }, [pushSupported])

  const setReminderTime = useCallback(async (mode: ReminderTimeMode) => {
    const reminderTime = mode === 'default' ? null : mode.time
    await fetch('/api/me/profile-flags', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reminderTime }),
    })
  }, [])

  return { pushSupported, permission, subscribed, subscribe, unsubscribe, setReminderTime }
}
```

- [ ] **Step 2: Quick smoke compile**

```bash
docker compose exec app npx tsc --noEmit -p tsconfig.json 2>&1 | grep useReminders || echo "no type errors in useReminders"
```

Expected: prints "no type errors in useReminders".

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useReminders.ts
git commit -m "feat: useReminders hook for opt-in flow"
```

---

## Task 8: `PATCH /api/me/profile-flags` route

**Files:**
- Create: `src/app/api/me/profile-flags/route.ts`

A small endpoint that updates one of the additive `User.profile` JSON keys. Used by `useReminders.setReminderTime`, by `OptInCard` (to mark the prompt shown), and by `useComeback` (to mark `lastComebackShownAt`).

- [ ] **Step 1: Implement**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ALLOWED_KEYS = new Set([
  'reminderTime',
  'reminderOptInPromptShownAt',
  'lastComebackShownAt',
])

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(k)) updates[k] = v
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { profile: true } })
  const existingProfile = (dbUser?.profile as Record<string, unknown> | null) ?? {}
  const nextProfile = { ...existingProfile, ...updates }

  await prisma.user.update({
    where: { id: user.id },
    data: { profile: nextProfile },
  })

  return NextResponse.json({ ok: true, profile: nextProfile })
}
```

- [ ] **Step 2: Manual smoke check**

```bash
# Start the app if not running
docker compose up -d
# In your dev session, log in, then in browser devtools console:
#   await fetch('/api/me/profile-flags', { method: 'PATCH', headers: {'content-type':'application/json'}, body: JSON.stringify({ reminderTime: '21:15' }) }).then(r => r.json())
# Expected: { ok: true, profile: { reminderTime: '21:15', ... } }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/me/profile-flags/route.ts
git commit -m "feat: PATCH /api/me/profile-flags for additive User.profile keys"
```

---

## Task 9: `POST /api/push/test` route

**Files:**
- Create: `src/app/api/push/test/route.ts`

Used by the profile-page "Send a test reminder now" button.

- [ ] **Step 1: Implement**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

let configured = false
function configureVapid() {
  if (configured) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT || 'mailto:support@hearth.app'
  if (!pub || !priv) throw new Error('VAPID keys not configured')
  webpush.setVapidDetails(subj, pub, priv)
  configured = true
}

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    configureVapid()
  } catch (e) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id, pausedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })

  const payload = JSON.stringify({
    title: 'hearth',
    body: 'this is what a gentle nudge feels like.',
  })

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // 410 Gone = subscription expired; clean it up
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
      return NextResponse.json({ error: 'Subscription expired, removed' }, { status: 410 })
    }
    return NextResponse.json({ error: 'Send failed', detail: String(err?.message || err) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/push/test/route.ts
git commit -m "feat: POST /api/push/test sends a test reminder to caller"
```

---

## Task 10: Service worker registrar component

**Files:**
- Create: `src/components/reminders/ServiceWorkerRegistrar.tsx`
- Modify: `src/app/layout.tsx` (mount the component)

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  }, [])
  return null
}
```

- [ ] **Step 2: Mount in `src/app/layout.tsx`**

Find the existing root layout body (it likely already has `<AuthProvider>` and `<LayoutContent>` etc.) and add inside the body element:

```tsx
import ServiceWorkerRegistrar from '@/components/reminders/ServiceWorkerRegistrar'
// ...
<ServiceWorkerRegistrar />
```

The exact location depends on the existing layout structure — placing it as the first child of `<body>` is fine.

- [ ] **Step 3: Manual verification**

Start the app, open the browser devtools → Application → Service Workers. Expect to see `/sw.js` registered and "activated and is running."

- [ ] **Step 4: Commit**

```bash
git add src/components/reminders/ServiceWorkerRegistrar.tsx src/app/layout.tsx
git commit -m "feat: register service worker on app load"
```

---

## Task 11: `OptInCard` component + first-entry trigger

**Files:**
- Create: `src/components/reminders/OptInCard.tsx`
- Modify: `src/hooks/useAutosaveEntry.ts` — emit a window event when the *first ever* entry of the user is saved
- Modify: the desk page (`src/app/write/page.tsx` or whichever file owns the journal surface — confirm by inspecting `src/app/`) — mount `<OptInCard />`

- [ ] **Step 1: Identify the desk page**

```bash
docker compose exec app grep -rln "useAutosaveEntry" src/app | head -5
```

Use the file that contains the active journaling spread. (For the rest of this task, refer to it as `<DESK_PAGE>`.)

- [ ] **Step 2: Emit a window event from `useAutosaveEntry` after a successful create**

Inside `useAutosaveEntry.ts`, locate the code path that handles a successful `POST /api/entries` response (creating the entry for the first time, not the PUT update path). Add this after the state is updated to reflect the new `entryId`:

```typescript
if (typeof window !== 'undefined') {
  window.dispatchEvent(new CustomEvent('hearth:entry-saved', { detail: { entryId: newId, isFirstSaveOfSession: true } }))
}
```

(Engineer: scope the dispatch precisely to the create-path. Do not fire on every PUT.)

- [ ] **Step 3: Create `OptInCard`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReminders } from '@/hooks/useReminders'

interface Props {
  /** Whether the user has already seen the prompt (server-side flag). */
  alreadyShown: boolean
}

export default function OptInCard({ alreadyShown }: Props) {
  const [visible, setVisible] = useState(false)
  const { pushSupported, subscribe } = useReminders()

  useEffect(() => {
    if (alreadyShown || !pushSupported) return
    const handler = () => setVisible(true)
    window.addEventListener('hearth:entry-saved', handler)
    return () => window.removeEventListener('hearth:entry-saved', handler)
  }, [alreadyShown, pushSupported])

  async function dismiss(action: 'yes-default' | 'yes-pick' | 'not-now') {
    setVisible(false)
    // Always mark prompt as shown so it doesn't re-appear
    fetch('/api/me/profile-flags', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reminderOptInPromptShownAt: new Date().toISOString() }),
    }).catch(() => {})

    if (action === 'yes-default' || action === 'yes-pick') {
      const result = await subscribe()
      if (!result.ok) {
        // Permission denied or other failure — silently swallow; user can retry from profile
        return
      }
      if (action === 'yes-pick') {
        // Send the user to profile to pick a time
        window.location.href = '/me#reminders'
      }
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-8 right-8 max-w-sm rounded-xl bg-white/95 backdrop-blur p-5 shadow-xl border border-stone-200 z-50"
          style={{ fontFamily: 'var(--font-playfair, serif)' }}
        >
          <p className="text-stone-800 leading-relaxed">
            Want a gentle reminder in the evening? We can ping you sometime between
            7 and 10pm — or pick a time that fits your day.
          </p>
          <div className="flex gap-2 mt-4 text-sm">
            <button onClick={() => dismiss('yes-default')} className="px-3 py-1.5 rounded bg-stone-800 text-white">
              Surprise me
            </button>
            <button onClick={() => dismiss('yes-pick')} className="px-3 py-1.5 rounded border border-stone-400 text-stone-700">
              Pick a time
            </button>
            <button onClick={() => dismiss('not-now')} className="px-3 py-1.5 text-stone-500">
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Mount on the desk page**

In `<DESK_PAGE>`, fetch the user's profile flags (use existing user-data fetching if present; otherwise add a small client-side fetch to `GET /api/me`). Pass `alreadyShown` based on `profile.reminderOptInPromptShownAt`.

If a profile-fetching mechanism doesn't exist server-side at render time, the simplest option is to fetch in the client when the desk page mounts:

```tsx
'use client'
import OptInCard from '@/components/reminders/OptInCard'
import { useEffect, useState } from 'react'

// inside the desk component:
const [optInShown, setOptInShown] = useState<boolean | null>(null)
useEffect(() => {
  fetch('/api/me/profile-flags').then(r => r.ok ? r.json() : null).then((data) => {
    setOptInShown(Boolean(data?.profile?.reminderOptInPromptShownAt))
  }).catch(() => setOptInShown(true))  // fail-closed: don't show if we can't determine
}, [])

// in JSX:
{optInShown === false && <OptInCard alreadyShown={false} />}
```

(Note: this requires `GET /api/me/profile-flags` to also be supported. Add a quick `GET` handler to that route that returns `{ profile }`.)

- [ ] **Step 5: Add `GET` to `profile-flags` route**

In `src/app/api/me/profile-flags/route.ts`, add:

```typescript
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { profile: true } })
  return NextResponse.json({ profile: dbUser?.profile ?? {} })
}
```

- [ ] **Step 6: Manual verification**

1. Reset your dev user's profile: `docker compose exec app npx prisma studio` → set `reminderOptInPromptShownAt` to `null` in your User row.
2. Open the desk page, write something, wait for autosave (1.5s).
3. The card should appear bottom-right.
4. Click "Not now" → card disappears, refresh page → card does NOT reappear.
5. Reset the flag again, click "Surprise me" → native browser permission prompt fires, accept → card disappears.
6. Check the database: a row exists in `push_subscriptions` for your user.

- [ ] **Step 7: Commit**

```bash
git add src/components/reminders/OptInCard.tsx src/hooks/useAutosaveEntry.ts src/app/api/me/profile-flags/route.ts <DESK_PAGE>
git commit -m "feat: post-first-entry opt-in card for nightly reminders"
```

---

## Task 12: Profile-page reminder controls

**Files:**
- Create: `src/components/reminders/ReminderControls.tsx`
- Modify: `src/app/me/page.tsx`

- [ ] **Step 1: Implement `ReminderControls`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useReminders } from '@/hooks/useReminders'

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
}

export default function ReminderControls() {
  const { pushSupported, permission, subscribed, subscribe, unsubscribe, setReminderTime } = useReminders()
  const [reminderTime, setReminderTimeLocal] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/me/profile-flags')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile?.reminderTime) setReminderTimeLocal(data.profile.reminderTime)
      })
    fetch('/api/me/reminder-status')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPaused(Boolean(data?.paused)))
  }, [])

  if (!pushSupported) {
    if (isIosSafari()) {
      return (
        <section id="reminders" className="space-y-2">
          <h2 className="font-serif text-xl">Gentle reminders</h2>
          <p className="text-stone-600 text-sm">
            To get reminders on iPhone, install Hearth as a PWA: tap Share → Add to Home Screen,
            then open Hearth from your home screen and try again.
          </p>
        </section>
      )
    }
    return (
      <section id="reminders" className="space-y-2">
        <h2 className="font-serif text-xl">Gentle reminders</h2>
        <p className="text-stone-600 text-sm">Your browser doesn't support push notifications.</p>
      </section>
    )
  }

  async function handleEnable() {
    const result = await subscribe()
    if (!result.ok && result.error === 'denied') {
      alert('Notifications are blocked. Open your browser settings → Site settings to allow notifications for Hearth.')
    }
  }

  async function handleTime(value: string) {
    const time = value || null
    setReminderTimeLocal(time)
    await setReminderTime(time === null ? 'default' : { time })
  }

  return (
    <section id="reminders" className="space-y-4">
      <h2 className="font-serif text-xl">Gentle reminders</h2>

      {!subscribed && permission !== 'denied' && (
        <button onClick={handleEnable} className="px-4 py-2 rounded bg-stone-800 text-white">
          Enable nightly reminders
        </button>
      )}

      {!subscribed && permission === 'denied' && (
        <p className="text-stone-600 text-sm">
          Notifications are blocked for Hearth. To re-enable, open your browser's site settings.
        </p>
      )}

      {subscribed && (
        <>
          {paused && (
            <p className="text-amber-700 text-sm">
              Reminders are currently paused (no entries written for a week). Re-enable below to start again.
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm text-stone-700">When should we ping you?</label>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleTime('')}
                className={`px-3 py-1.5 rounded text-sm ${reminderTime === null ? 'bg-stone-800 text-white' : 'border border-stone-300'}`}
              >
                Surprise me (7–10pm)
              </button>
              <span className="text-stone-400">or</span>
              <input
                type="time"
                value={reminderTime ?? ''}
                onChange={(e) => handleTime(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                setTesting(true)
                try {
                  const res = await fetch('/api/push/test', { method: 'POST' })
                  if (!res.ok) alert('Test failed — check the console.')
                } finally { setTesting(false) }
              }}
              disabled={testing}
              className="px-3 py-1.5 rounded border border-stone-400 text-sm"
            >
              {testing ? 'Sending...' : 'Send a test reminder'}
            </button>
            <button onClick={unsubscribe} className="px-3 py-1.5 rounded text-sm text-stone-500">
              Turn off
            </button>
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Add a tiny `GET /api/me/reminder-status` endpoint**

Create `src/app/api/me/reminder-status/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { pausedAt: true, consecutiveIgnored: true },
  })
  return NextResponse.json({
    paused: Boolean(sub?.pausedAt),
    consecutiveIgnored: sub?.consecutiveIgnored ?? 0,
  })
}
```

- [ ] **Step 3: Mount on `/me` page**

Open `src/app/me/page.tsx`, import and embed `<ReminderControls />` somewhere it fits visually. The component is self-contained.

```tsx
import ReminderControls from '@/components/reminders/ReminderControls'
// inside the page JSX:
<ReminderControls />
```

- [ ] **Step 4: Manual verification**

1. Visit `/me`. Reminder section renders.
2. If not subscribed, click "Enable nightly reminders" → permission prompt → accept → row created → subscribed UI appears.
3. Click "Send a test reminder" → notification fires.
4. Set a specific time; refresh the page; the time persists.
5. Click "Surprise me" → time clears.
6. Click "Turn off" → row deleted, "Enable" button reappears.

- [ ] **Step 5: Commit**

```bash
git add src/components/reminders/ReminderControls.tsx src/app/api/me/reminder-status/route.ts src/app/me/page.tsx
git commit -m "feat: profile-page reminder controls (toggle, time, test, iOS fallback)"
```

---

## Task 13: Cron route — `/api/cron/send-reminders` (TDD on the core decision logic)

**Files:**
- Create: `src/app/api/cron/send-reminders/route.ts`
- Test: `src/__tests__/api-cron-send-reminders.test.ts`

The route's logic has three responsibilities: (1) decide which subscriptions are due-this-window, (2) check skip-if-journaled, (3) update the ignored-counter and send. We'll factor the "decide which are due" piece out into a pure helper for testing, and integration-test the route against mocked Prisma + mocked `web-push`.

- [ ] **Step 1: Write tests for the route**

Create `src/__tests__/api-cron-send-reminders.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    pushSubscription: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    journalEntry: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}))

import { prisma } from '@/lib/db'
import webpush from 'web-push'
import { GET } from '@/app/api/cron/send-reminders/route'

const ENV = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...ENV, CRON_SECRET: 'test-secret', VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', VAPID_SUBJECT: 'mailto:x@y.z' }
})

function makeReq() {
  return new Request('http://localhost/api/cron/send-reminders', {
    headers: { authorization: 'Bearer test-secret' },
  })
}

describe('GET /api/cron/send-reminders', () => {
  it('rejects without bearer token', async () => {
    const res = await GET(new Request('http://localhost/api/cron/send-reminders'))
    expect(res.status).toBe(401)
  })

  it('returns 0 fired when no subscriptions match the current window', async () => {
    // Use a target time far from "now" by choosing a user whose hash slot is unlikely to match
    // We control the date via a fake timer
    vi.setSystemTime(new Date('2026-05-03T03:00:00Z'))  // 3am UTC — outside everyone's evening
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        id: 's1', userId: 'u1', endpoint: 'e1', p256dh: 'p', auth: 'a',
        userAgent: null, tz: 'UTC', createdAt: new Date(), lastFiredAt: null,
        consecutiveIgnored: 0, pausedAt: null,
      },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', profile: {} } as any)
    const res = await GET(makeReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.fired).toBe(0)
    expect(webpush.sendNotification).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('skips when user already has an entry today', async () => {
    // Force the override path so we know exactly when it should fire
    vi.setSystemTime(new Date('2026-05-03T20:07:00Z'))  // 20:07 in UTC; tz UTC; override 20:00 → match
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        id: 's1', userId: 'u1', endpoint: 'e1', p256dh: 'p', auth: 'a',
        userAgent: null, tz: 'UTC', createdAt: new Date(), lastFiredAt: null,
        consecutiveIgnored: 0, pausedAt: null,
      },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', profile: { reminderTime: '20:00' } } as any)
    vi.mocked(prisma.journalEntry.findFirst).mockResolvedValue({ id: 'e1' } as any)
    const res = await GET(makeReq())
    const body = await res.json()
    expect(body.fired).toBe(0)
    expect(body.skippedAlreadyJournaled).toBe(1)
    expect(webpush.sendNotification).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('fires when user has not journaled today and current window matches target', async () => {
    vi.setSystemTime(new Date('2026-05-03T20:07:00Z'))
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        id: 's1', userId: 'u1', endpoint: 'e1', p256dh: 'p', auth: 'a',
        userAgent: null, tz: 'UTC', createdAt: new Date(), lastFiredAt: null,
        consecutiveIgnored: 0, pausedAt: null,
      },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', profile: { reminderTime: '20:00' } } as any)
    vi.mocked(prisma.journalEntry.findFirst).mockResolvedValue(null)
    const res = await GET(makeReq())
    const body = await res.json()
    expect(body.fired).toBe(1)
    expect(webpush.sendNotification).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('auto-pauses subscriptions with consecutiveIgnored >= 7', async () => {
    vi.setSystemTime(new Date('2026-05-03T03:00:00Z'))
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.pushSubscription.updateMany).mockResolvedValue({ count: 2 } as any)
    const res = await GET(makeReq())
    const body = await res.json()
    expect(body.paused).toBe(2)
    expect(prisma.pushSubscription.updateMany).toHaveBeenCalledWith({
      where: { pausedAt: null, consecutiveIgnored: { gte: 7 } },
      data: { pausedAt: expect.any(Date) },
    })
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests — they should fail (route doesn't exist)**

```bash
docker compose exec app npm test -- api-cron-send-reminders
```

Expected: FAIL.

- [ ] **Step 3: Implement the route**

Create `src/app/api/cron/send-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/db'
import { isCurrentWindowTarget, targetMinutesPastSeven } from '@/lib/reminder-schedule'
import { pickReminderLine, REMINDER_TITLE } from '@/lib/reminder-messages'

let configured = false
function configureVapid() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@hearth.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  configured = true
}

function localWallClockISO(now: Date, tz: string): string {
  // Build an ISO-like string representing the wall-clock time in the given TZ.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]))
  // 'en-CA' gives YYYY-MM-DD and HH:MM:SS — but hour can be '24' for midnight in some impls
  const hh = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hh}:${parts.minute}:${parts.second}`
}

function localDateStr(now: Date, tz: string): string {
  return localWallClockISO(now, tz).slice(0, 10)
}

function startOfLocalDayUTC(now: Date, tz: string): Date {
  const dateStr = localDateStr(now, tz)
  // Construct midnight in the user's TZ as a UTC instant.
  // Trick: parse "YYYY-MM-DDT00:00:00" as if it were UTC, then offset back by the TZ's offset at that instant.
  // Easier approach: use Intl with a known reference and walk back by the difference.
  const naiveUtc = new Date(`${dateStr}T00:00:00Z`)
  const tzOffsetMinutes = (() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    })
    const parts = fmt.formatToParts(naiveUtc)
    const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00'
    const m = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (!m) return 0
    const sign = m[1] === '+' ? 1 : -1
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
  })()
  return new Date(naiveUtc.getTime() - tzOffsetMinutes * 60_000)
}

export async function GET(request: NextRequest | Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    configureVapid()
  } catch {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 })
  }

  const now = new Date()

  // Step 1: auto-pause anyone at or past 7 ignored
  const pauseResult = await prisma.pushSubscription.updateMany({
    where: { pausedAt: null, consecutiveIgnored: { gte: 7 } },
    data: { pausedAt: now },
  })

  // Step 2: load active subscriptions
  const subs = await prisma.pushSubscription.findMany({
    where: { pausedAt: null },
  })

  let fired = 0
  let skippedAlreadyJournaled = 0
  let skippedNotInWindow = 0
  let skippedAlreadyFiredToday = 0

  for (const sub of subs) {
    const tz = sub.tz || 'UTC'
    const dateStr = localDateStr(now, tz)
    const startOfToday = startOfLocalDayUTC(now, tz)

    // Already fired today? Single-fire-per-day guarantee.
    if (sub.lastFiredAt && sub.lastFiredAt >= startOfToday) {
      skippedAlreadyFiredToday++
      continue
    }

    const userRow = await prisma.user.findUnique({
      where: { id: sub.userId },
      select: { profile: true },
    })
    const profile = (userRow?.profile as Record<string, unknown> | null) ?? {}
    const reminderTime = typeof profile.reminderTime === 'string' ? profile.reminderTime : null

    const target = reminderTime
      ? targetMinutesPastSeven({ mode: 'override', time: reminderTime })
      : targetMinutesPastSeven({ mode: 'default', userId: sub.userId, dateStr })

    const nowLocalISO = localWallClockISO(now, tz)
    if (!isCurrentWindowTarget({ nowLocalISO, targetMinutesPastSeven: target })) {
      skippedNotInWindow++
      continue
    }

    // Skip if user already journaled today
    const todayEntry = await prisma.journalEntry.findFirst({
      where: { userId: sub.userId, createdAt: { gte: startOfToday } },
      select: { id: true },
    })
    if (todayEntry) {
      skippedAlreadyJournaled++
      // Reset ignored counter (they're engaged)
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { consecutiveIgnored: 0 },
      })
      continue
    }

    // Update ignored counter for the *previous* fire
    let nextIgnored = sub.consecutiveIgnored
    if (sub.lastFiredAt) {
      const wroteSinceLastFire = await prisma.journalEntry.findFirst({
        where: { userId: sub.userId, createdAt: { gte: sub.lastFiredAt } },
        select: { id: true },
      })
      nextIgnored = wroteSinceLastFire ? 0 : sub.consecutiveIgnored + 1
    }

    // Send the push
    const payload = JSON.stringify({ title: REMINDER_TITLE, body: pickReminderLine() })
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastFiredAt: now, consecutiveIgnored: nextIgnored },
      })
      fired++
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        // Subscription expired — clean up
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      } else {
        console.error('push send failed', sub.id, err?.message || err)
      }
    }
  }

  return NextResponse.json({
    fired,
    skippedAlreadyJournaled,
    skippedNotInWindow,
    skippedAlreadyFiredToday,
    paused: pauseResult.count,
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
```

- [ ] **Step 4: Run tests — they should pass**

```bash
docker compose exec app npm test -- api-cron-send-reminders
```

Expected: all 5 tests pass.

- [ ] **Step 5: Manual smoke test**

```bash
# Use the test endpoint instead of waiting for cron — cron path is exercised by tests
docker compose exec app curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2)" http://localhost:3000/api/cron/send-reminders
```

Expected: JSON response with counters (likely all 0 unless your local time happens to be in someone's window).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/send-reminders/route.ts src/__tests__/api-cron-send-reminders.test.ts
git commit -m "feat: nightly reminder cron with skip-if-journaled and auto-pause"
```

---

## Task 14: `?write=1` query handling on the home/desk page

**Files:**
- Modify: `<DESK_PAGE>` (the page mounted at the root or wherever the journal lives)

When the user taps the notification, the service worker opens `/?write=1`. The page should detect this and force a fresh new-entry spread.

- [ ] **Step 1: In the desk page, read the query and trigger a fresh entry**

Add at the top of the desk component:

```tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
// ...
const searchParams = useSearchParams()
const router = useRouter()
useEffect(() => {
  if (searchParams.get('write') === '1') {
    // Trigger whatever logic clears the current draft and starts a fresh new-entry spread.
    // The exact API depends on the existing desk store — likely something like:
    //   useDeskStore.getState().startNewEntry()
    // After triggering, clear the query param so a refresh doesn't repeat.
    const url = new URL(window.location.href)
    url.searchParams.delete('write')
    router.replace(url.pathname + (url.search || '') + url.hash)
  }
}, [searchParams, router])
```

The engineer should locate the existing "start new entry" action in `useDeskStore` (or the autosave flush + reset path in `useAutosaveEntry`) and wire that here.

- [ ] **Step 2: Manual verification**

1. Visit `/?write=1` in the browser.
2. Confirm the page lands on a fresh new-entry spread, not on today's existing draft.
3. The URL strips the `?write=1` after handling.

- [ ] **Step 3: Commit**

```bash
git add <DESK_PAGE>
git commit -m "feat: notification click → fresh new-entry spread via ?write=1"
```

---

## Task 15: Comeback messages constants

**Files:**
- Create: `src/lib/comeback-messages.ts`

- [ ] **Step 1: Create the file**

```typescript
// Comeback moment copy. Tier-keyed. Modal lines may include {gapDays} placeholder.
// Author the rest of each pool over time; v1 ships with these starters.
export const COMEBACK_MESSAGES = {
  whisper: [
    'you\'re back.',
    'the page kept your spot.',
  ],
  card: [
    'a few days have passed. glad you\'re here.',
    'hearth missed you a little.',
  ],
  modal: [
    'it\'s been {gapDays} days. no judgment, just glad you\'re here.',
    'long time. take a breath. the page is open.',
  ],
} as const

export type ComebackTier = keyof typeof COMEBACK_MESSAGES

export function pickComebackLine(tier: ComebackTier, gapDays: number): string {
  const pool = COMEBACK_MESSAGES[tier]
  const line = pool[Math.floor(Math.random() * pool.length)]
  return line.replace('{gapDays}', String(gapDays))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/comeback-messages.ts
git commit -m "feat: comeback message pool (initial copy per tier)"
```

---

## Task 16: Comeback tier classifier (TDD)

**Files:**
- Create: `src/lib/comeback.ts`
- Test: `src/__tests__/comeback.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { gapDaysLocal, tierFor, shouldShowComeback } from '@/lib/comeback'

describe('gapDaysLocal', () => {
  it('returns 0 when last entry was earlier today', () => {
    expect(gapDaysLocal({
      now: new Date('2026-05-03T20:00:00Z'),
      lastEntryAt: new Date('2026-05-03T08:00:00Z'),
      tz: 'UTC',
    })).toBe(0)
  })

  it('returns 1 for yesterday', () => {
    expect(gapDaysLocal({
      now: new Date('2026-05-03T20:00:00Z'),
      lastEntryAt: new Date('2026-05-02T20:00:00Z'),
      tz: 'UTC',
    })).toBe(1)
  })

  it('returns 23 for 23 calendar days ago', () => {
    expect(gapDaysLocal({
      now: new Date('2026-05-03T12:00:00Z'),
      lastEntryAt: new Date('2026-04-10T12:00:00Z'),
      tz: 'UTC',
    })).toBe(23)
  })

  it('uses local-calendar comparison, not 24-hour windows', () => {
    // 23:30 yesterday → 00:30 today is 1 calendar day in the same TZ
    expect(gapDaysLocal({
      now: new Date('2026-05-03T00:30:00Z'),
      lastEntryAt: new Date('2026-05-02T23:30:00Z'),
      tz: 'UTC',
    })).toBe(1)
  })

  it('returns Infinity when there is no last entry', () => {
    expect(gapDaysLocal({
      now: new Date(),
      lastEntryAt: null,
      tz: 'UTC',
    })).toBe(Infinity)
  })
})

describe('tierFor', () => {
  it('whisper for 1-2 days', () => {
    expect(tierFor(1)).toBe('whisper')
    expect(tierFor(2)).toBe('whisper')
  })
  it('card for 3-7 days', () => {
    expect(tierFor(3)).toBe('card')
    expect(tierFor(7)).toBe('card')
  })
  it('modal for 8+ days', () => {
    expect(tierFor(8)).toBe('modal')
    expect(tierFor(100)).toBe('modal')
  })
  it('null for 0 days (just journaled today)', () => {
    expect(tierFor(0)).toBeNull()
  })
  it('modal for first-ever visit (Infinity)', () => {
    expect(tierFor(Infinity)).toBe('modal')
  })
})

describe('shouldShowComeback', () => {
  it('false when already shown today (local TZ)', () => {
    expect(shouldShowComeback({
      now: new Date('2026-05-03T20:00:00Z'),
      lastComebackShownAt: new Date('2026-05-03T08:00:00Z'),
      tz: 'UTC',
    })).toBe(false)
  })
  it('true when last shown was yesterday or earlier', () => {
    expect(shouldShowComeback({
      now: new Date('2026-05-03T20:00:00Z'),
      lastComebackShownAt: new Date('2026-05-02T23:00:00Z'),
      tz: 'UTC',
    })).toBe(true)
  })
  it('true when never shown', () => {
    expect(shouldShowComeback({
      now: new Date(),
      lastComebackShownAt: null,
      tz: 'UTC',
    })).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — they should fail**

```bash
docker compose exec app npm test -- comeback
```

- [ ] **Step 3: Implement**

Create `src/lib/comeback.ts`:

```typescript
import type { ComebackTier } from './comeback-messages'

function localDateString(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)  // "YYYY-MM-DD"
}

function daysBetweenLocalDates(a: string, b: string): number {
  // a, b: "YYYY-MM-DD" — treat as UTC-midnight, diff in days
  const aDate = new Date(`${a}T00:00:00Z`).getTime()
  const bDate = new Date(`${b}T00:00:00Z`).getTime()
  return Math.round((aDate - bDate) / 86_400_000)
}

export function gapDaysLocal(args: {
  now: Date
  lastEntryAt: Date | null
  tz: string
}): number {
  if (!args.lastEntryAt) return Infinity
  const today = localDateString(args.now, args.tz)
  const last = localDateString(args.lastEntryAt, args.tz)
  return Math.max(0, daysBetweenLocalDates(today, last))
}

export function tierFor(gapDays: number): ComebackTier | null {
  if (gapDays <= 0) return null
  if (gapDays <= 2) return 'whisper'
  if (gapDays <= 7) return 'card'
  return 'modal'
}

export function shouldShowComeback(args: {
  now: Date
  lastComebackShownAt: Date | null
  tz: string
}): boolean {
  if (!args.lastComebackShownAt) return true
  const today = localDateString(args.now, args.tz)
  const lastShown = localDateString(args.lastComebackShownAt, args.tz)
  return today !== lastShown
}
```

- [ ] **Step 4: Run tests — they should pass**

```bash
docker compose exec app npm test -- comeback
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/comeback.ts src/__tests__/comeback.test.ts
git commit -m "feat: comeback gap classifier and show-once-per-day guard"
```

---

## Task 17: Comeback components (whisper, card, modal)

**Files:**
- Create: `src/components/comeback/ComebackWhisper.tsx`
- Create: `src/components/comeback/ComebackCard.tsx`
- Create: `src/components/comeback/ComebackModal.tsx`

- [ ] **Step 1: Whisper (ambient text, fades over ~3s)**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackWhisper({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('whisper', gapDays))

  useEffect(() => {
    onShown()
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 italic text-stone-600 pointer-events-none z-40"
          style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: '1.5rem' }}
        >
          {line}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Card (3–7 days, dismissible, auto-fade ~6s)**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackCard({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('card', gapDays))

  useEffect(() => {
    onShown()
    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.6 }}
          onClick={() => setVisible(false)}
          className="fixed top-12 left-1/2 -translate-x-1/2 cursor-pointer z-40"
          style={{ fontFamily: 'var(--font-playfair, serif)' }}
        >
          <div className="rounded-full bg-white/90 backdrop-blur px-5 py-2 shadow-lg border border-stone-200 text-stone-800">
            {line}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Modal (8+ days, dismiss on tap)**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackModal({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('modal', gapDays))

  useEffect(() => { onShown() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl px-10 py-12 max-w-md text-center shadow-2xl"
            style={{ fontFamily: 'var(--font-playfair, serif)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl text-stone-800 leading-relaxed">{line}</p>
            <p className="text-sm text-stone-400 mt-6">tap anywhere to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

(The "particle burst from active theme" mentioned in the spec is deferred as a polish item — leaving it out keeps the modal self-contained. If the engineer wants to add it later, hook into the existing `Background.tsx` particle system on mount.)

- [ ] **Step 4: Commit**

```bash
git add src/components/comeback/
git commit -m "feat: comeback whisper / card / modal components"
```

---

## Task 18: `useComeback` hook + `ComebackHost`

**Files:**
- Create: `src/hooks/useComeback.ts`
- Create: `src/components/comeback/ComebackHost.tsx`
- Modify: `src/app/layout.tsx` (mount `<ComebackHost />`)

- [ ] **Step 1: Hook**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { gapDaysLocal, shouldShowComeback, tierFor } from '@/lib/comeback'
import type { ComebackTier } from '@/lib/comeback-messages'

interface ComebackDecision {
  tier: ComebackTier | null
  gapDays: number
  markShown(): Promise<void>
}

export function useComeback(): ComebackDecision | null {
  const [decision, setDecision] = useState<ComebackDecision | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const flagsRes = await fetch('/api/me/profile-flags')
        if (!flagsRes.ok) return
        const flags = await flagsRes.json()
        const lastComebackShownAt = flags?.profile?.lastComebackShownAt
          ? new Date(flags.profile.lastComebackShownAt) : null

        const lastEntryRes = await fetch('/api/me/last-entry')
        if (!lastEntryRes.ok) return
        const lastEntry = await lastEntryRes.json()
        const lastEntryAt = lastEntry?.createdAt ? new Date(lastEntry.createdAt) : null

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        const now = new Date()

        if (!shouldShowComeback({ now, lastComebackShownAt, tz })) return

        const gap = gapDaysLocal({ now, lastEntryAt, tz })
        const tier = tierFor(gap)
        if (!tier) return  // 0 days, nothing to show

        if (cancelled) return
        setDecision({
          tier,
          gapDays: gap === Infinity ? 0 : gap,
          markShown: async () => {
            await fetch('/api/me/profile-flags', {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ lastComebackShownAt: new Date().toISOString() }),
            }).catch(() => {})
          },
        })
      } catch (_) {
        // swallow — comeback is non-critical
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return decision
}
```

- [ ] **Step 2: Add `GET /api/me/last-entry`**

Create `src/app/api/me/last-entry/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entry = await prisma.journalEntry.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  return NextResponse.json(entry ?? { createdAt: null })
}
```

- [ ] **Step 3: Host component**

Create `src/components/comeback/ComebackHost.tsx`:

```tsx
'use client'

import { useComeback } from '@/hooks/useComeback'
import ComebackWhisper from './ComebackWhisper'
import ComebackCard from './ComebackCard'
import ComebackModal from './ComebackModal'

export default function ComebackHost() {
  const decision = useComeback()
  if (!decision || !decision.tier) return null

  if (decision.tier === 'whisper') {
    return <ComebackWhisper gapDays={decision.gapDays} onShown={decision.markShown} />
  }
  if (decision.tier === 'card') {
    return <ComebackCard gapDays={decision.gapDays} onShown={decision.markShown} />
  }
  return <ComebackModal gapDays={decision.gapDays} onShown={decision.markShown} />
}
```

- [ ] **Step 4: Mount in layout**

Add to `src/app/layout.tsx`, near `<ServiceWorkerRegistrar />`:

```tsx
import ComebackHost from '@/components/comeback/ComebackHost'
// inside <body>:
<ComebackHost />
```

- [ ] **Step 5: Manual verification**

1. Open Prisma Studio, set your most recent `JournalEntry.createdAt` to 4 days ago. Clear `User.profile.lastComebackShownAt`.
2. Refresh Hearth → ComebackCard appears.
3. Refresh again → does NOT re-appear (today's flag is set).
4. Set the entry to 15 days ago, clear the flag → ComebackModal appears with `{gapDays}=15` rendered.
5. Set to 1 day ago, clear flag → ComebackWhisper fades in/out.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useComeback.ts src/components/comeback/ComebackHost.tsx src/app/api/me/last-entry/route.ts src/app/layout.tsx
git commit -m "feat: comeback host wires gap classifier to whisper/card/modal"
```

---

## Task 19: External cron wiring (configuration only — no code)

**Files:**
- Modify: `README.md` (or wherever cron setup is documented for `deliver-letters`)

The repo has no `vercel.json` and the existing `deliver-letters` cron is presumably triggered by an external scheduler. Wire `send-reminders` to fire **every 15 minutes** with the same `Authorization: Bearer ${CRON_SECRET}` header.

- [ ] **Step 1: Document the cron**

Find wherever `deliver-letters` cron setup is documented (likely the README or a deployment doc). Add:

> **Reminders cron**: `GET https://<host>/api/cron/send-reminders` every 15 minutes with `Authorization: Bearer ${CRON_SECRET}`. Idempotent and safe to retry.

- [ ] **Step 2: Configure the actual scheduler**

This is an out-of-repo action. Either:
- Vercel: add to `vercel.json` (create the file) under `crons` with `"path": "/api/cron/send-reminders", "schedule": "*/15 * * * *"`.
- External (e.g., cron-job.org, GitHub Actions cron): point at the URL with the bearer header.

Use whatever mechanism `deliver-letters` already uses.

- [ ] **Step 3: Commit doc updates**

```bash
git add README.md   # or whichever doc
git commit -m "docs: document send-reminders cron wiring"
```

---

## Task 20: Final verification & polish pass

**Files:**
- (Verification only — no specific files unless gaps surface)

- [ ] **Step 1: Run the full test suite**

```bash
docker compose exec app npm test
```

Expected: all tests pass. New tests: `reminder-schedule`, `comeback`, `api-push-subscribe`, `api-cron-send-reminders`.

- [ ] **Step 2: Run lint**

```bash
docker compose exec app npm run lint
```

Fix any warnings introduced by new code.

- [ ] **Step 3: Run a production build to catch type errors**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

- [ ] **Step 4: End-to-end manual smoke**

Open the app in Chrome. With a fresh dev user:

1. Write a first entry → OptInCard appears bottom-right after autosave.
2. Click "Surprise me" → permission prompt → accept.
3. Visit `/me` → ReminderControls shows subscribed state with "Surprise me" selected.
4. Click "Send a test reminder" → notification appears within seconds.
5. Tap the notification → opens `/?write=1` → fresh new-entry spread.
6. Set a specific time, refresh → time persists.
7. Click "Turn off" → row deleted, "Enable" button reappears.
8. Set most-recent entry to 4 days ago, clear `lastComebackShownAt`, refresh → ComebackCard fires.
9. Set entry to 15 days ago, clear flag, refresh → ComebackModal with `15 days` in copy.

- [ ] **Step 5: Cross-browser check**

Repeat steps 1-5 in Firefox and Safari (macOS). Note any failures or styling differences in a follow-up issue.

- [ ] **Step 6: Final commit (only if any fixes were needed)**

```bash
git add -A
git commit -m "chore: lint and polish for gentle reminders"
```

---

## Out-of-Scope / Follow-ups

These are explicitly deferred — track separately if needed:

- Author the remaining ~25 reminder lines and ~15 comeback lines.
- Particle burst on the 8+ day comeback modal (tie into `Background.tsx` particle system).
- Email reminder cascade (3/7/20/30 day inactivity).
- iOS PWA install prompt (today the iOS Safari fallback is just a static message).
- "Manage devices" UI (today, all of a user's subscriptions are auto-updated together; no per-device disable).
- Notification action buttons ("Write now" / "Skip tonight").
- Localization beyond English.
