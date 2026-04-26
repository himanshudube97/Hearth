# Home Parallax & Scroll-to-Open Diary — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personalized welcome zone above the glass diary on `/write`. As the user scrolls, the diary "opens" — a small closed book peeking from the bottom of the hero grows, centers, and its cover swings open to reveal the existing diary spread.

**Architecture:** A new `HomeScrollExperience` orchestrator on `/write` composes a `WelcomeZone` (full viewport hero with greeting, whisper, banners, stats, scroll cue) above a `DiaryStage` (wraps existing `DeskScene` with scroll-driven scale + cover-rotate transforms). One new `GET /api/home` endpoint aggregates stats and banner flags. Framer Motion's `useScroll` + `useTransform` drive the open/close animation against page scroll.

**Tech Stack:** Next.js 16 (App Router), React 19, Framer Motion v12, Prisma, TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-27-home-parallax-design.md`

**Note on testing:** This project has no test framework (only ESLint per `package.json`). Per-task verification is `npm run lint`, `npm run build`, and an in-browser smoke test via Docker. Adding a test framework is out of scope.

**Note on Docker:** All commands run via Docker per `CLAUDE.md`. Hot-reload picks up source changes automatically; `docker compose restart app` is only needed if the dev server gets confused.

**Spec correction (carried into this plan):** The spec referenced "current theme's `whispers` array". Whispers in `src/lib/themes.ts` are actually a global `export const whispers = [...]`, not per-theme. The plan uses the global array. Behavior is unchanged: one whisper per day, deterministic by date.

---

## File Layout

**New:**
- `src/lib/whisperOfTheDay.ts` — deterministic whisper picker (date → index into whispers)
- `src/app/api/home/route.ts` — `GET /api/home` aggregated endpoint
- `src/hooks/useHomeData.ts` — client hook fetching `/api/home`
- `src/components/home/WelcomeZone.tsx` — hero content (full viewport)
- `src/components/home/DiaryStage.tsx` — diary wrapper with scroll-driven transforms
- `src/components/home/HomeScrollExperience.tsx` — orchestrator
- `src/components/home/useIsMobile.ts` — small `useMediaQuery` for `(max-width: 768px)`

**Modify:**
- `src/app/write/page.tsx` — replace `<DeskScene />` with `<HomeScrollExperience />`

**Untouched (reused):**
- `src/components/desk/DeskScene` (the diary itself)
- `src/components/LetterArrivedBanner.tsx`
- `src/components/BirthdayBanner.tsx`
- `src/store/auth.ts`, `src/store/theme.ts`
- `src/lib/themes.ts` (just imports `whispers`)

---

## Task 1: Whisper-of-the-day utility

**Files:**
- Create: `src/lib/whisperOfTheDay.ts`

- [ ] **Step 1: Implement the utility**

```ts
// src/lib/whisperOfTheDay.ts
import { whispers } from './themes'

/**
 * Picks one whisper deterministically based on the given date string (YYYY-MM-DD).
 * Same date → same whisper, regardless of when this is called.
 *
 * Why: gives the welcome zone a stable "whisper of the day" that won't flicker
 * across re-renders or re-mounts within a single calendar day.
 */
export function whisperOfTheDay(dateKey: string): string {
  if (!whispers || whispers.length === 0) {
    return 'What softened today?'
  }
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  }
  return whispers[hash % whispers.length]
}

export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

- [ ] **Step 2: Verify lint passes**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/whisperOfTheDay.ts
git commit -m "Add whisperOfTheDay utility (deterministic by date)"
```

---

## Task 2: GET /api/home endpoint

**Files:**
- Create: `src/app/api/home/route.ts`

This route aggregates everything the welcome zone needs in a single fetch.

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/home/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface HomeStats {
  entriesThisMonth: number
  streak: number          // consecutive days, capped at 365 (shown as "365+")
  sealedLetters: number
}

interface HomeBanners {
  hasUnreadLetter: boolean
  isBirthday: boolean
}

export interface HomeData {
  name: string
  whisperSeed: string
  stats: HomeStats
  banners: HomeBanners
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Stats — run in parallel
    const [entriesThisMonth, sealedLetters, hasUnreadLetter, distinctDays] = await Promise.all([
      prisma.journalEntry.count({
        where: { userId: user.id, createdAt: { gte: startOfMonth } },
      }),
      prisma.journalEntry.count({
        where: { userId: user.id, isSealed: true, isDelivered: false },
      }),
      // Mirror the /api/letters/arrived query: a self-letter that has unlocked
      prisma.journalEntry.count({
        where: {
          userId: user.id,
          entryType: 'letter',
          isSealed: true,
          recipientEmail: null,
          unlockDate: { lte: now },
        },
      }).then(c => c > 0),
      // Streak: pull distinct entry dates from the last 365 days
      prisma.$queryRaw<{ day: Date }[]>`
        SELECT DISTINCT DATE("createdAt") AS day
        FROM "JournalEntry"
        WHERE "userId" = ${user.id}
          AND "createdAt" >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}
        ORDER BY day DESC
      `,
    ])

    // Compute streak — consecutive days ending today (if today has entry) or yesterday
    const streak = computeStreak(distinctDays.map(r => toDayString(r.day)), now)

    // Birthday — User.profile is JSON; expect optional { birthday: 'YYYY-MM-DD' or 'MM-DD' }
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    })
    const isBirthday = isBirthdayToday(dbUser?.profile, now)

    const data: HomeData = {
      name: user.name ?? '',
      whisperSeed: toDayString(now),
      stats: {
        entriesThisMonth,
        streak,
        sealedLetters,
      },
      banners: {
        hasUnreadLetter,
        isBirthday,
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching home data:', error)
    return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 })
  }
}

function toDayString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeStreak(daysDesc: string[], now: Date): number {
  if (daysDesc.length === 0) return 0
  const set = new Set(daysDesc)
  const today = toDayString(now)
  const yesterday = toDayString(new Date(now.getTime() - 24 * 60 * 60 * 1000))

  // Anchor: today if present, else yesterday, else 0
  let cursor: Date
  if (set.has(today)) {
    cursor = new Date(now)
  } else if (set.has(yesterday)) {
    cursor = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  } else {
    return 0
  }

  let count = 0
  while (count < 365 && set.has(toDayString(cursor))) {
    count++
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
  }
  return count
}

function isBirthdayToday(profile: unknown, now: Date): boolean {
  if (!profile || typeof profile !== 'object') return false
  const birthday = (profile as Record<string, unknown>).birthday
  if (typeof birthday !== 'string') return false
  // Accept 'YYYY-MM-DD' or 'MM-DD'
  const mmdd = birthday.length === 10 ? birthday.slice(5) : birthday
  const todayMmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return mmdd === todayMmdd
}
```

- [ ] **Step 2: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Smoke test the endpoint**

With the app running (`docker compose up -d`), open the browser to http://localhost:3111 and sign in. Then in a terminal:

```bash
# Grab the auth cookie from your browser DevTools (Application → Cookies → hearth-auth-token)
# OR use the browser's network tab to test by visiting:
curl -s http://localhost:3111/api/home -b "hearth-auth-token=<token>"
```

Or simpler — just hit the URL in the authenticated browser tab: `http://localhost:3111/api/home`.

Expected: JSON response with `name`, `whisperSeed`, `stats`, `banners`. Look at the values — do they make sense? (e.g., `entriesThisMonth` matches what you've written this month).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/home/route.ts
git commit -m "Add GET /api/home aggregating greeting/stats/banner data"
```

---

## Task 3: useHomeData hook

**Files:**
- Create: `src/hooks/useHomeData.ts`

- [ ] **Step 1: Implement the hook**

```ts
// src/hooks/useHomeData.ts
'use client'

import { useEffect, useState } from 'react'
import type { HomeData } from '@/app/api/home/route'

interface UseHomeData {
  data: HomeData | null
  loading: boolean
  error: Error | null
}

export function useHomeData(): UseHomeData {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/home', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Home data ${r.status}`)
        return (await r.json()) as HomeData
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
```

- [ ] **Step 2: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useHomeData.ts
git commit -m "Add useHomeData hook for /api/home"
```

---

## Task 4: useIsMobile helper

**Files:**
- Create: `src/components/home/useIsMobile.ts`

A small media-query hook used by `HomeScrollExperience` and `DiaryStage` to disable parallax layers on mobile.

- [ ] **Step 1: Implement**

```ts
// src/components/home/useIsMobile.ts
'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(maxWidthPx: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [maxWidthPx])

  return isMobile
}
```

- [ ] **Step 2: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/useIsMobile.ts
git commit -m "Add useIsMobile media-query hook"
```

---

## Task 5: WelcomeZone component (full hero UI)

**Files:**
- Create: `src/components/home/WelcomeZone.tsx`

Renders the full hero: greeting, whisper, conditional banners, stats row, scroll cue. Pulls live data from `useHomeData`. Greeting time-of-day is computed client-side.

- [ ] **Step 1: Implement**

```tsx
// src/components/home/WelcomeZone.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { whisperOfTheDay } from '@/lib/whisperOfTheDay'
import { useHomeData } from '@/hooks/useHomeData'
import LetterArrivedBanner from '@/components/LetterArrivedBanner'
import BirthdayBanner from '@/components/BirthdayBanner'

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeZone() {
  const { theme } = useThemeStore()
  const { data, loading } = useHomeData()

  const greetingPrefix = useMemo(() => greetingForHour(new Date().getHours()), [])
  const whisper = useMemo(() => {
    const seed = data?.whisperSeed ?? new Date().toISOString().slice(0, 10)
    return whisperOfTheDay(seed)
  }, [data?.whisperSeed])

  const name = data?.name?.trim() || ''
  const greeting = name ? `${greetingPrefix}, ${name}` : 'Welcome'

  const stats = data?.stats
  const showStatsRow =
    !!stats &&
    (stats.entriesThisMonth > 0 || stats.streak > 0 || stats.sealedLetters > 0)

  return (
    <section
      className="relative w-full h-full flex flex-col items-center justify-center px-6"
      style={{
        color: theme.text.primary,
      }}
    >
      <div className="flex flex-col items-center text-center max-w-xl gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-serif"
        >
          {greeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg md:text-xl italic"
          style={{ color: theme.text.secondary }}
        >
          &ldquo;{whisper}&rdquo;
        </motion.p>

        {data?.banners.hasUnreadLetter && (
          <div className="w-full">
            <LetterArrivedBanner nickname={name || undefined} />
          </div>
        )}

        {data?.banners.isBirthday && (
          <div className="w-full">
            <BirthdayBanner nickname={name || undefined} />
          </div>
        )}

        {showStatsRow && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm md:text-base"
            style={{ color: theme.text.muted }}
          >
            {formatStats(stats)}
          </motion.div>
        )}

        {loading && (
          <div className="text-xs opacity-60" style={{ color: theme.text.muted }}>
            Loading your day…
          </div>
        )}
      </div>

      <ScrollCue />
    </section>
  )
}

function formatStats(stats: { entriesThisMonth: number; streak: number; sealedLetters: number }) {
  const parts: string[] = []
  if (stats.entriesThisMonth > 0) {
    parts.push(`${stats.entriesThisMonth} ${stats.entriesThisMonth === 1 ? 'entry' : 'entries'} this month`)
  }
  if (stats.streak > 0) {
    const display = stats.streak >= 365 ? '365+' : String(stats.streak)
    parts.push(`${display}-day streak`)
  }
  if (stats.sealedLetters > 0) {
    parts.push(`${stats.sealedLetters} sealed ${stats.sealedLetters === 1 ? 'letter' : 'letters'} waiting`)
  }
  return parts.join(' · ')
}

function ScrollCue() {
  const { theme } = useThemeStore()
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ duration: 1, delay: 0.8 }}
      style={{ color: theme.text.muted }}
    >
      <span className="text-xs tracking-wide uppercase">Scroll to open your diary</span>
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="text-lg"
      >
        ↓
      </motion.span>
    </motion.div>
  )
}
```

- [ ] **Step 2: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/WelcomeZone.tsx
git commit -m "Add WelcomeZone component (greeting, whisper, banners, stats, scroll cue)"
```

---

## Task 6: DiaryStage component (scroll-driven transforms)

**Files:**
- Create: `src/components/home/DiaryStage.tsx`

Wraps the existing `<DeskScene />`. Reads `scrollYProgress` from the parent via prop and applies scale to the diary plus a separately-rotating cover overlay.

- [ ] **Step 1: Implement**

```tsx
// src/components/home/DiaryStage.tsx
'use client'

import { motion, MotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { DeskScene } from '@/components/desk'
import { useThemeStore } from '@/store/theme'

interface DiaryStageProps {
  scrollYProgress: MotionValue<number>
  /** When true (mobile or reduced motion), drop the cover-rotation; cover only fades. */
  simplifiedMotion: boolean
}

export default function DiaryStage({ scrollYProgress, simplifiedMotion }: DiaryStageProps) {
  const { theme } = useThemeStore()
  const reduceMotion = useReducedMotion()
  const dropCoverRotation = simplifiedMotion || !!reduceMotion

  // Diary grows from 0.3 -> 1. Translate-Y moves it from "peeking at bottom" to centered.
  const diaryScale = useTransform(scrollYProgress, [0, 1], [0.3, 1])
  const diaryY = useTransform(scrollYProgress, [0, 1], ['28vh', '0vh'])

  // Cover overlay fades; on full motion it also rotates open.
  const coverOpacity = useTransform(scrollYProgress, [0.7, 1], [1, 0])
  const coverRotate = useTransform(
    scrollYProgress,
    [0.4, 0.9],
    dropCoverRotation ? [0, 0] : [0, -120],
  )

  return (
    <div className="relative w-full h-full">
      <motion.div
        style={{
          scale: diaryScale,
          y: diaryY,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
        }}
      >
        <DeskScene />
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: coverOpacity,
          rotateX: coverRotate,
          transformOrigin: 'top center',
          background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          borderRadius: '8px',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/DiaryStage.tsx
git commit -m "Add DiaryStage with scroll-driven scale and cover-rotation overlay"
```

---

## Task 7: HomeScrollExperience orchestrator + wire into /write

**Files:**
- Create: `src/components/home/HomeScrollExperience.tsx`
- Modify: `src/app/write/page.tsx`

**Layout strategy: sticky-overlay.** The page is `200vh` tall to give us a viewport of scroll space. Inside, a `position: sticky; top: 0; height: 100vh` container holds two layers: the diary at the back (always visible, scaling) and the welcome on top (fades out). This means the user sees the closed-book peek from scroll 0 *and* the welcome content over it — exactly the "diary peeks at hero bottom" effect from the spec. As they scroll, the welcome fades and the diary grows; by scroll = 100vh, the welcome is gone and the diary fills the viewport.

- [ ] **Step 1: Implement HomeScrollExperience**

```tsx
// src/components/home/HomeScrollExperience.tsx
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import WelcomeZone from './WelcomeZone'
import DiaryStage from './DiaryStage'
import { useIsMobile } from './useIsMobile'

export default function HomeScrollExperience() {
  const heroRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  const simplified = isMobile || !!reduceMotion

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Welcome content fade & lift as you scroll.
  const welcomeOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const welcomeY = useTransform(
    scrollYProgress,
    [0, 1],
    simplified ? [0, 0] : [0, -40],
  )
  // Disable pointer events on welcome layer once it's mostly faded so the diary
  // beneath becomes clickable for page-flipping.
  const welcomePointerEvents = useTransform(welcomeOpacity, (v) =>
    v > 0.4 ? 'auto' : 'none',
  )

  return (
    <main className="relative w-full">
      {/* Tall scroll surface — gives 100vh of scroll room. */}
      <section ref={heroRef} className="relative" style={{ height: '200vh' }}>
        {/* Sticky container holds both layers; pinned to viewport during the scroll. */}
        <div
          className="sticky top-0 overflow-hidden"
          style={{ height: '100vh', width: '100%' }}
        >
          {/* Layer 1 — Diary (always visible, scales/cover-rotates with progress) */}
          <div className="absolute inset-0">
            <DiaryStage scrollYProgress={scrollYProgress} simplifiedMotion={simplified} />
          </div>

          {/* Layer 2 — Welcome (fades out and lifts on scroll) */}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: welcomeOpacity,
              y: welcomeY,
              pointerEvents: welcomePointerEvents,
            }}
          >
            <WelcomeZone />
          </motion.div>
        </div>
      </section>
    </main>
  )
}
```

**Why this layout works:**
- `heroRef` is the 200vh tall section. `useScroll` with `offset: ['start start', 'end start']` gives `scrollYProgress` 0 → 1 across that 200vh range, but the user only needs to scroll 100vh to traverse it (since the section is anchored at top and the sticky stays pinned).
- The sticky child stays in viewport throughout scroll progress 0 → 1.
- At progress 1, the section's bottom hits the viewport top and the sticky un-sticks — which is fine, because at that point the diary is at scale 1 and the welcome is fully faded.
- `overflow: hidden` on the sticky container clips the diary while it's scaled down (so the cover overlay sized to the full viewport doesn't bleed).
- **Parallax effect:** the welcome content lifts up via `welcomeY` while the global `Background` (rendered higher up in `layout.tsx`) stays put — that vertical-velocity difference is the parallax. On desktop `welcomeY` goes 0 → -40px; on mobile it stays at 0. No separate ornament layer is needed.

- [ ] **Step 2: Wire into /write**

Replace the contents of `src/app/write/page.tsx`:

```tsx
// src/app/write/page.tsx
'use client'

import HomeScrollExperience from '@/components/home/HomeScrollExperience'

export default function WritePage() {
  return <HomeScrollExperience />
}
```

- [ ] **Step 3: Lint**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 4: Build**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Smoke test in browser**

```bash
docker compose up -d
docker compose restart app
```

Open http://localhost:3111/write and verify:

- Hero is full viewport — greeting, whisper, scroll cue visible.
- Stats row appears if you have entries; banners appear if relevant.
- Scroll down slowly — diary scales up from 0.3 to 1; cover overlay fades and rotates.
- At full scroll — diary fully open, click/tap flips pages (existing behavior).
- Scroll back up — book closes, welcome returns.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/HomeScrollExperience.tsx src/app/write/page.tsx
git commit -m "Wire HomeScrollExperience into /write (replaces direct DeskScene render)"
```

---

## Task 8: Verify reduced-motion and mobile variants

No new code — this task is targeted manual verification of behavior already implemented in earlier tasks.

- [ ] **Step 1: Reduced-motion check**

In Chrome DevTools:
1. Open DevTools → Cmd+Shift+P → "Show Rendering".
2. Under "Emulate CSS media feature prefers-reduced-motion" → select "reduce".
3. Reload http://localhost:3111/write.
4. Scroll down: cover should fade (no rotation), welcome content should not translate up. Diary scale still happens.

- [ ] **Step 2: Mobile check (DevTools mobile mode)**

1. DevTools → Toggle device toolbar (Cmd+Shift+M).
2. Pick iPhone or similar (≤768px wide).
3. Reload `/write`.
4. Verify: welcome content does not parallax-translate (`welcomeY = 0`), background ornament layer doesn't lag. Scroll-open animation still works (diary scales, cover fades).
5. After full scroll, tap to flip diary pages — existing pagination still works.

- [ ] **Step 3: Real-device check (if available)**

Open the URL on an actual phone via `docker compose`'s LAN address. Watch for jank during Mobile Safari address-bar collapse. The cover-fade and diary-scale should look smooth; the absence of `welcomeY` translation should mean no jitter.

- [ ] **Step 4: Commit (if any tweaks needed)**

If the manual checks revealed timing issues (e.g., cover finishes rotating before diary finishes scaling), tune the `useTransform` ranges in `DiaryStage.tsx` and `HomeScrollExperience.tsx`. Commit any tweaks:

```bash
git add src/components/home/
git commit -m "Tune scroll-open timing for mobile/reduced-motion"
```

If no tweaks needed, skip this step.

---

## Task 9: Final verification & cleanup

- [ ] **Step 1: Conditional content matrix**

Test these states (you can fake them by writing rows directly via Prisma Studio or by checking with a fresh user):

| State | Expected |
|---|---|
| New user, 0 entries, 0 letters | Stats row hidden. Banners hidden. Greeting + whisper + scroll cue still render. |
| User with entries this month | Stats row shows entries count. |
| User with active streak | Stats row shows streak. |
| User with sealed letters in flight | Stats row shows "N sealed letters waiting". |
| User with arrived self-letter | LetterArrivedBanner appears in hero. |
| User with `profile.birthday` matching today | BirthdayBanner appears in hero. |

For "no name" state, sign in as a user with `name = null` — greeting reads "Welcome" (no comma).

- [ ] **Step 2: Theme cycling**

Cycle through several of the 10 themes via the existing theme switcher. Confirm:
- Greeting/whisper colors adapt (using `theme.text.*`).
- Cover overlay color adapts (uses `theme.accent.primary` and `theme.accent.secondary`).
- Whisper text remains stable for the day across theme switches (since whispers are global, not theme-specific).

- [ ] **Step 3: Lint + build clean**

```bash
docker compose exec app npm run lint
docker compose exec app npm run build
```

Expected: both clean.

- [ ] **Step 4: Final commit (if anything was tuned)**

```bash
git status
# If any uncommitted changes:
git add -A
git commit -m "Final tuning for home parallax experience"
```

---

## Done

`/write` now greets the user, shows their day's whisper, surfaces a letter or birthday banner if relevant, gives a tasteful stats line, and lets them scroll into the diary as if opening a real book.
