# Landing Page Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `FeaturesSection` on the marketing landing page with an 8-spread interactive diary featuring 3D page flips, hover-corner-bend, and a live theme-switcher polaroid grid.

**Architecture:** A new `DiarySection` mounts between the existing `HeroSection` and `FooterCTA` in `src/app/page.tsx`. Inside it, a perspective-stage `DiaryBook` renders the current spread; spread content is data-driven from `spreads.ts`. Navigation state lives in `useDiaryNav`; user can flip via Prev/Next buttons, arrow keys, page-pip clicks, swipe on touch, or by clicking a peeled corner. Spread #6 is special — it renders live theme polaroids and calls `useThemeStore.setTheme()` on click, with the diary capturing the original theme for a "reset" link.

**Tech Stack:** Next.js 16 (App Router), React 19, Framer Motion v12, Zustand, TypeScript, Tailwind. No new packages.

**Verification model:** Hearth's convention is to skip unit tests for UI work and verify manually in the dev environment. Each task ends with a docker compose restart, browser verification, and commit. Tests are written only when the saved feedback memory `feedback_skip_tests.md` is overridden by the user for a given piece of work.

**Spec:** `docs/superpowers/specs/2026-05-06-landing-diary-design.md`

---

## File Map

**New files (under `src/components/landing/`):**

| File | Responsibility |
|---|---|
| `spreads.ts` | Type definitions + ordered `SPREADS` data array (8 entries) |
| `useDiaryNav.ts` | Hook: currentSpread, flipNext/Prev/jumpTo, keyboard binding via IntersectionObserver |
| `DiarySection.tsx` | Section wrapper. Owns theme-override snapshot, renders Book + Nav |
| `DiaryBook.tsx` | 3D perspective stage: paper, spine, deckled edges, vignette |
| `DiaryCover.tsx` | Spread #1: closed front cover with cover-open / cover-close animation |
| `DiarySpread.tsx` | Generic two-page renderer for feature spreads (#2–5, #7) |
| `DiaryPageFlip.tsx` | Reusable flipping leaf with front/back faces (used by Spread + Cover) |
| `DiaryCornerPeel.tsx` | Hover-corner-bend layer (4 hot-zones per spread) |
| `DiaryNav.tsx` | Prev/Next buttons + page-pip indicator + sound toggle |
| `DiaryPolaroidGrid.tsx` | Spread #6 right-page: 7 polaroids + reset link |
| `DiaryThemePolaroid.tsx` | Single live theme polaroid (mini gradient + particles + label) |
| `DiaryCTASpread.tsx` | Spread #8 right-page: closing prose + Begin button |

**Modified:**
- `src/app/page.tsx` — drop `FeaturesSection` and `WhisperGallery`, mount `<DiarySection />`

**Left in place (un-rendered) for SVG re-export, deleted in a follow-up:**
- `src/components/landing/FeaturesSection.tsx` — its `Illustration` component is imported by `DiarySpread`

**Asset paths (provided by user later, placeholders work in the meantime):**
- `public/landing/diary/journal-entry.png`
- `public/landing/diary/letter-sealed.png`
- `public/landing/diary/scrapbook.png`
- `public/landing/diary/memory-constellation.png`
- `public/landing/diary/master-key.png`
- `public/landing/diary/placeholder.svg` — temporary, used until real screenshots are added

---

## Task 1: Spread data + nav hook foundation

**Files:**
- Create: `src/components/landing/spreads.ts`
- Create: `src/components/landing/useDiaryNav.ts`

This task adds the data + state management that everything else builds on. Nothing visible yet; verification is just a clean TypeScript compile.

- [ ] **Step 1: Write `spreads.ts`**

```ts
// src/components/landing/spreads.ts

export type CoverSpread = {
  kind: 'cover'
  title: string
  subtitle: string
}

export type FeatureSpread = {
  kind: 'feature'
  numeral: string
  title: string
  copy: string
  marginalia: string
  illustration?: 'journal' | 'letters' | 'scrapbook' | 'memory'
  imagePath: string
  imageAlt: string
  caption: string
}

export type ThemesSpread = {
  kind: 'themes'
  numeral: string
  title: string
  copy: string
  marginalia: string
}

export type CtaSpread = {
  kind: 'cta'
  text: string
  buttonLabel: string
  buttonHref: string
}

export type SpreadDef = CoverSpread | FeatureSpread | ThemesSpread | CtaSpread

export const SPREADS: SpreadDef[] = [
  {
    kind: 'cover',
    title: 'HEARTH',
    subtitle: 'A small house for the days.',
  },
  {
    kind: 'feature',
    numeral: 'I',
    title: 'The page that listens',
    copy: 'Words, doodles, a song, a mood — left exactly where you set them down. The page holds them as you wrote them, no edits asked.',
    marginalia: '— for later',
    illustration: 'journal',
    imagePath: '/landing/diary/journal-entry.png',
    imageAlt: 'A written entry on the desk: text, a photo, an embedded song, a soft mood mark.',
    caption: 'words. a photo. a song. a mood.',
  },
  {
    kind: 'feature',
    numeral: 'II',
    title: 'Letters that wait',
    copy: 'Seal one to your future self, or to a friend. It returns when the time is right — a week from now, a year from now, on a date you choose.',
    marginalia: '— sealed and waiting',
    illustration: 'letters',
    imagePath: '/landing/diary/letter-sealed.png',
    imageAlt: 'A letter being sealed with a wax stamp.',
    caption: 'a wax stamp. a date you choose.',
  },
  {
    kind: 'feature',
    numeral: 'III',
    title: 'Small things, kept',
    copy: 'A scrapbook for photographs, scraps, and quiet keepsakes you don’t want to lose. Drag them where they want to live; pin them in place.',
    marginalia: '— pinned in place',
    illustration: 'scrapbook',
    imagePath: '/landing/diary/scrapbook.png',
    imageAlt: 'A populated scrapbook canvas with photos, notes, and stickers.',
    caption: 'photographs. scraps. keepsakes.',
  },
  {
    kind: 'feature',
    numeral: 'IV',
    title: 'Where memory grows',
    copy: 'A constellation, a garden, a small firelight — your year takes shape as something you can wander through. Every entry leaves a small light.',
    marginalia: '— look up',
    illustration: 'memory',
    imagePath: '/landing/diary/memory-constellation.png',
    imageAlt: 'A constellation of points, each a remembered day, drawn across a dark sky.',
    caption: 'a year, drawn out.',
  },
  {
    kind: 'themes',
    numeral: 'V',
    title: 'A house with many windows',
    copy: 'Seven weathers — fireflies, embers, sakura, mist, more. Pick the one that matches today; click any to feel it now.',
    marginalia: '— pick your weather',
  },
  {
    kind: 'feature',
    numeral: 'VI',
    title: 'Yours alone',
    copy: 'Encrypted with a key only you hold. Not us, not anyone. Lose the key, lose the diary. That’s the deal — and the point.',
    marginalia: '— only yours',
    imagePath: '/landing/diary/master-key.png',
    imageAlt: 'The master-key unlock screen.',
    caption: 'a key only you hold.',
  },
  {
    kind: 'cta',
    text: 'The page is yours.',
    buttonLabel: 'Begin Writing',
    buttonHref: '/write',
  },
]
```

- [ ] **Step 2: Write `useDiaryNav.ts`**

```ts
// src/components/landing/useDiaryNav.ts
'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { SPREADS } from './spreads'

const TOTAL = SPREADS.length

export type FlipDirection = 'forward' | 'backward'

export function useDiaryNav(containerRef: RefObject<HTMLElement | null>) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const flipDirectionRef = useRef<FlipDirection>('forward')

  const flipNext = useCallback(() => {
    if (isFlipping) return
    if (currentSpread >= TOTAL - 1) return
    flipDirectionRef.current = 'forward'
    setIsFlipping(true)
    setCurrentSpread((s) => s + 1)
  }, [isFlipping, currentSpread])

  const flipPrev = useCallback(() => {
    if (isFlipping) return
    if (currentSpread <= 0) return
    flipDirectionRef.current = 'backward'
    setIsFlipping(true)
    setCurrentSpread((s) => s - 1)
  }, [isFlipping, currentSpread])

  const jumpTo = useCallback((index: number) => {
    if (isFlipping) return
    if (index === currentSpread || index < 0 || index >= TOTAL) return
    flipDirectionRef.current = index > currentSpread ? 'forward' : 'backward'
    setIsFlipping(true)
    setCurrentSpread(index)
  }, [isFlipping, currentSpread])

  const onFlipComplete = useCallback(() => {
    setIsFlipping(false)
  }, [])

  // Keyboard navigation, only while the diary is on screen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let visible = false
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0.3 }
    )
    io.observe(el)

    const onKey = (e: KeyboardEvent) => {
      if (!visible) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        flipNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        flipPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [containerRef, flipNext, flipPrev])

  return {
    currentSpread,
    total: TOTAL,
    isFlipping,
    flipDirection: flipDirectionRef.current,
    flipNext,
    flipPrev,
    jumpTo,
    onFlipComplete,
    canGoForward: currentSpread < TOTAL - 1,
    canGoBack: currentSpread > 0,
  }
}
```

- [ ] **Step 3: Restart container and verify clean compile**

```bash
docker compose restart app
docker compose logs --tail=80 app
```

Expected: no TypeScript errors. Visit `http://localhost:3111/` — page should load exactly as before (we haven't wired anything in yet).

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/spreads.ts src/components/landing/useDiaryNav.ts
git commit -m "feat(landing): diary spread data + navigation hook"
```

---

## Task 2: Diary section shell + minimal nav

**Files:**
- Create: `src/components/landing/DiarySection.tsx`
- Create: `src/components/landing/DiaryNav.tsx`
- Modify: `src/app/page.tsx`

This task wires a stub diary section into the page so we can flip through spreads and see content as plain text. The visuals come later; first we want navigation working end-to-end.

- [ ] **Step 1: Create `DiaryNav.tsx`**

```tsx
// src/components/landing/DiaryNav.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

type Props = {
  total: number
  current: number
  canGoForward: boolean
  canGoBack: boolean
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export default function DiaryNav({ total, current, canGoForward, canGoBack, onPrev, onNext, onJump }: Props) {
  const { theme } = useThemeStore()

  const baseBtn =
    'w-9 h-9 rounded-full flex items-center justify-center font-serif text-lg transition-opacity'

  return (
    <div className="mt-10 flex items-center justify-center gap-6 select-none">
      <button
        aria-label="Previous page"
        onClick={onPrev}
        disabled={!canGoBack}
        className={`${baseBtn} ${canGoBack ? '' : 'opacity-30 cursor-not-allowed'}`}
        style={{
          background: `${theme.accent.warm}20`,
          color: theme.text.primary,
          border: `1px solid ${theme.text.muted}40`,
        }}
      >
        ‹
      </button>

      <div className="flex items-center gap-2" role="tablist" aria-label="Diary pages">
        {Array.from({ length: total }).map((_, i) => (
          <motion.button
            key={i}
            aria-label={`Page ${i + 1}`}
            aria-current={i === current ? 'page' : undefined}
            onClick={() => onJump(i)}
            className="rounded-full"
            initial={false}
            animate={{
              width: i === current ? 18 : 6,
              height: 6,
              opacity: i === current ? 1 : 0.4,
              backgroundColor: i === current ? theme.accent.primary : theme.text.muted,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      <button
        aria-label="Next page"
        onClick={onNext}
        disabled={!canGoForward}
        className={`${baseBtn} ${canGoForward ? '' : 'opacity-30 cursor-not-allowed'}`}
        style={{
          background: `${theme.accent.warm}20`,
          color: theme.text.primary,
          border: `1px solid ${theme.text.muted}40`,
        }}
      >
        ›
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `DiarySection.tsx` (stub-content version)**

```tsx
// src/components/landing/DiarySection.tsx
'use client'

import { useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 min-h-[80vh] flex flex-col items-center justify-center"
      style={{ color: theme.text.primary }}
    >
      <div
        className="w-full max-w-4xl mx-auto p-12 rounded-md"
        style={{
          background: `color-mix(in srgb, #fbf4e3, ${theme.accent.primary} 8%)`,
          color: '#3a3128',
          fontFamily: 'var(--font-serif, Georgia), serif',
        }}
      >
        <p className="text-xs uppercase tracking-[0.3em] opacity-50 mb-4">
          spread {nav.currentSpread + 1} / {nav.total}
        </p>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(spread, null, 2)}</pre>
      </div>

      <DiaryNav
        total={nav.total}
        current={nav.currentSpread}
        canGoForward={nav.canGoForward}
        canGoBack={nav.canGoBack}
        onPrev={nav.flipPrev}
        onNext={nav.flipNext}
        onJump={nav.jumpTo}
      />
    </section>
  )
}
```

- [ ] **Step 3: Mount in `page.tsx`**

In `src/app/page.tsx`, replace the import and render of `FeaturesSection` (and remove the in-file `WhisperGallery` rendering):

```tsx
// At top of file:
import DiarySection from '@/components/landing/DiarySection'

// In the returned JSX, REPLACE these three lines:
//     <WhisperGallery />
//     <FeaturesSection />
// with:
      <DiarySection />
```

Also remove the now-unused `import FeaturesSection from '@/components/landing/FeaturesSection'` line and delete the entire `function WhisperGallery() { ... }` block at the bottom of `page.tsx`.

The final return should look like:

```tsx
return (
  <main
    className="relative"
    style={{
      background: theme.bg.gradient,
      color: theme.text.primary,
    }}
  >
    {/* Ambient Background - only shows below the fold */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ top: '100vh' }}>
      {/* ... existing motion.divs unchanged ... */}
    </div>

    <StickyHeader />
    <HeroSection />
    <DiarySection />
    <FooterCTA />
  </main>
)
```

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
docker compose logs --tail=60 app
```

Visit `http://localhost:3111/`. Verify:
- Hero looks unchanged
- Below the hero, a cream-tinted box shows raw spread JSON for "spread 1 / 8"
- Prev/Next buttons appear, with Prev disabled
- Clicking Next advances to "spread 2 / 8" and shows the journal spread JSON
- Clicking dots jumps to that spread
- Pressing → and ← keys flips when the section is on screen
- WhisperGallery (floating italic whispers between sections) is gone

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiarySection.tsx src/components/landing/DiaryNav.tsx src/app/page.tsx
git commit -m "feat(landing): mount diary section shell with prev/next/pip nav"
```

---

## Task 3: 3D book stage with paper, spine, vignette

**Files:**
- Create: `src/components/landing/DiaryBook.tsx`
- Modify: `src/components/landing/DiarySection.tsx`

This task replaces the JSON-stub box with a real diary visual: cream paper tinted by theme, faint paper grain, deckled edges, a center spine, and a stage vignette around it. No flip animation yet — just a static spread that shows the current spread's title and copy on the left, and a placeholder block on the right.

- [ ] **Step 1: Create the SVG paper-grain filter (used by DiaryBook)**

Add this to `src/app/globals.css` near the bottom:

```css
/* Paper grain filter for the diary */
.diary-paper-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-size: 160px 160px;
}
```

- [ ] **Step 2: Create `DiaryBook.tsx`**

```tsx
// src/components/landing/DiaryBook.tsx
'use client'

import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/theme'

type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
}

export default function DiaryBook({ leftPage, rightPage }: Props) {
  const { theme } = useThemeStore()

  // Tinted paper: cream base, theme accent at 8%
  const paper = `color-mix(in srgb, #fbf4e3, ${theme.accent.primary} 8%)`
  // Cover stock for the spine shadow
  const ink = '#3a3128'

  return (
    <div
      className="relative w-full max-w-[1100px] aspect-[16/10] mx-auto"
      style={{ perspective: '2400px' }}
    >
      {/* Stage vignette */}
      <div
        className="absolute -inset-12 pointer-events-none rounded-[40px]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      <div
        className="relative w-full h-full flex"
        style={{
          transformStyle: 'preserve-3d',
          background: paper,
          color: ink,
          borderRadius: '4px',
          boxShadow:
            '0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.04)',
          fontFamily: 'var(--font-serif, Georgia), serif',
          // Deckled edge: slightly irregular polygon clip
          clipPath:
            'polygon(0% 0.3%, 0.3% 0%, 99.7% 0%, 100% 0.3%, 100% 99.7%, 99.7% 100%, 0.3% 100%, 0% 99.7%)',
        }}
      >
        {/* Paper grain overlay */}
        <div className="diary-paper-grain" />

        {/* Left page */}
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {leftPage}
        </div>

        {/* Spine */}
        <div
          className="relative pointer-events-none"
          style={{
            width: '20px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.04))',
          }}
        />

        {/* Right page */}
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {rightPage}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `DiarySection.tsx` to render DiaryBook with stub pages and theme-aware surroundings**

Replace the inner cream-box JSX with a `DiaryBook`. Stub the pages for now — Task 4 builds the proper spread renderer. The section gets the theme's `bg.gradient` as its background and renders Hearth's existing `Background` component (the particle layer used elsewhere in the app) so the surroundings react to the active theme — when the theme is "Sage" the section drifts leaves, when it's "Hearth" it has embers, etc.

```tsx
// src/components/landing/DiarySection.tsx
'use client'

import { useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 overflow-hidden"
      style={{
        background: theme.bg.gradient,
        color: theme.text.primary,
      }}
    >
      {/* Theme-aware particle layer behind the diary */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <Background />
      </div>

      <DiaryBook
        leftPage={
          <div>
            <p className="font-serif italic text-3xl md:text-4xl opacity-40 leading-none mb-3">
              {'numeral' in spread ? spread.numeral : ''}
            </p>
            <h3 className="font-serif italic text-2xl md:text-3xl mb-4">
              {'title' in spread ? spread.title : 'Cover'}
            </h3>
            {'copy' in spread && (
              <p className="text-base leading-relaxed max-w-[36ch]" style={{ opacity: 0.85 }}>
                {spread.copy}
              </p>
            )}
          </div>
        }
        rightPage={
          <div className="w-full h-full flex items-center justify-center text-sm italic opacity-40">
            (right page — coming next)
          </div>
        }
      />

      <DiaryNav
        total={nav.total}
        current={nav.currentSpread}
        canGoForward={nav.canGoForward}
        canGoBack={nav.canGoBack}
        onPrev={nav.flipPrev}
        onNext={nav.flipNext}
        onJump={nav.jumpTo}
      />
    </section>
  )
}
```

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and verify:
- The diary now appears as a cream open book with a center spine
- Paper looks faintly grainy (look closely)
- A subtle vignette darkens the area around the book
- The section *behind* the diary takes the current theme's full gradient and shows the theme's particles drifting (firelies / embers / sakura / etc.) — same particle layer the app's desk view uses
- Theme tint is visible — switching the theme via the existing app theme picker (or `localStorage.setItem('hearth-theme', JSON.stringify({state:{themeName:'rose',theme:{}},version:0})); location.reload()`) shifts both the surrounding gradient/particles and the cream paper tint
- Roman numeral, title, and copy display on the left page for spreads II–VI
- Cover (spread 1) and CTA (spread 8) show empty/odd content but don't crash — those are wired in Tasks 7 and 9

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiaryBook.tsx src/components/landing/DiarySection.tsx src/app/globals.css
git commit -m "feat(landing): 3d diary stage with theme-tinted paper, spine, vignette"
```

---

## Task 4: Generic two-page spread renderer

**Files:**
- Create: `src/components/landing/DiarySpread.tsx`
- Create: `public/landing/diary/placeholder.svg`
- Modify: `src/components/landing/DiarySection.tsx`

This task adds the proper layout for feature spreads (#2, 3, 4, 5, 7): roman numeral + title + copy + marginalia + tiny illustration on the left; framed polaroid screenshot + caption on the right. Until the user provides real screenshots, all images render the placeholder SVG.

- [ ] **Step 1: Create the placeholder SVG**

```bash
mkdir -p public/landing/diary
```

Create `public/landing/diary/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d2bfa1"/>
      <stop offset="100%" stop-color="#a3886a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-style="italic" font-size="48" fill="rgba(255,255,255,0.85)">screenshot coming</text>
</svg>
```

- [ ] **Step 2: Create `DiarySpread.tsx`**

The component imports the existing `Illustration` SVG component out of `FeaturesSection.tsx` (kept un-rendered but exported). First make the export available — open `src/components/landing/FeaturesSection.tsx` and change the line `function Illustration({ kind }: { kind: Feature['illustration'] }) {` to `export function Illustration({ kind }: { kind: 'journal' | 'letters' | 'scrapbook' | 'memory' }) {`.

Then create the spread:

```tsx
// src/components/landing/DiarySpread.tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { FeatureSpread } from './spreads'
import { Illustration } from './FeaturesSection'

type Props = { spread: FeatureSpread; spreadIndex: number }

export default function DiarySpread({ spread, spreadIndex }: Props) {
  // Alternate polaroid tilt by spread index for variety
  const tilt = spreadIndex % 2 === 0 ? 1.5 : -1.5

  return {
    left: (
      <div className="h-full flex flex-col">
        <p className="font-serif italic text-3xl md:text-4xl leading-none mb-3" style={{ opacity: 0.4 }}>
          {spread.numeral}
        </p>
        <h3 className="font-serif italic text-2xl md:text-3xl mb-5 leading-snug">
          {spread.title}
        </h3>
        <p className="text-base leading-relaxed max-w-[36ch] mb-8" style={{ opacity: 0.85 }}>
          {spread.copy}
        </p>

        {spread.illustration && (
          <div className="opacity-70 mb-auto">
            <Illustration kind={spread.illustration} />
          </div>
        )}

        <motion.p
          className="font-serif italic text-xs mt-auto"
          style={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {spread.marginalia}
        </motion.p>
      </div>
    ),
    right: (
      <div className="h-full flex flex-col items-center justify-center">
        <motion.div
          className="relative bg-white p-3 pb-10"
          style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)',
          }}
          animate={{ rotate: [tilt, tilt - 0.4, tilt], y: [0, -1.5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative w-[min(38vw,420px)] aspect-[4/3] overflow-hidden">
            <Image
              src={spread.imagePath}
              alt={spread.imageAlt}
              fill
              sizes="(max-width: 768px) 80vw, 420px"
              className="object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = '/landing/diary/placeholder.svg'
              }}
            />
          </div>
        </motion.div>
        <p className="font-serif italic text-sm mt-4 opacity-60">
          {spread.caption}
        </p>
      </div>
    ),
  } as { left: React.ReactNode; right: React.ReactNode } as unknown as React.ReactElement // narrowed below
}
```

Wait — that pattern returns an object, which doesn't work as a React component. Replace the implementation with two named exports instead:

```tsx
// src/components/landing/DiarySpread.tsx (correct version)
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { FeatureSpread } from './spreads'
import { Illustration } from './FeaturesSection'

export function DiarySpreadLeft({ spread }: { spread: FeatureSpread }) {
  return (
    <div className="h-full flex flex-col">
      <p className="font-serif italic text-3xl md:text-4xl leading-none mb-3" style={{ opacity: 0.4 }}>
        {spread.numeral}
      </p>
      <h3 className="font-serif italic text-2xl md:text-3xl mb-5 leading-snug">
        {spread.title}
      </h3>
      <p className="text-base leading-relaxed max-w-[36ch] mb-8" style={{ opacity: 0.85 }}>
        {spread.copy}
      </p>

      {spread.illustration && (
        <div className="opacity-70 mb-auto">
          <Illustration kind={spread.illustration} />
        </div>
      )}

      <motion.p
        className="font-serif italic text-xs mt-auto"
        style={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {spread.marginalia}
      </motion.p>
    </div>
  )
}

export function DiarySpreadRight({ spread, spreadIndex }: { spread: FeatureSpread; spreadIndex: number }) {
  const tilt = spreadIndex % 2 === 0 ? 1.5 : -1.5
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <motion.div
        className="relative bg-white p-3 pb-10"
        style={{
          boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)',
        }}
        animate={{ rotate: [tilt, tilt - 0.4, tilt], y: [0, -1.5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-[min(38vw,420px)] aspect-[4/3] overflow-hidden">
          <Image
            src={spread.imagePath}
            alt={spread.imageAlt}
            fill
            sizes="(max-width: 768px) 80vw, 420px"
            className="object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = '/landing/diary/placeholder.svg'
            }}
          />
        </div>
      </motion.div>
      <p className="font-serif italic text-sm mt-4 opacity-60">
        {spread.caption}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Update `DiarySection.tsx` to dispatch by spread kind**

```tsx
// src/components/landing/DiarySection.tsx
'use client'

import { useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'
import { DiarySpreadLeft, DiarySpreadRight } from './DiarySpread'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  let left: React.ReactNode = null
  let right: React.ReactNode = null

  if (spread.kind === 'feature') {
    left = <DiarySpreadLeft spread={spread} />
    right = <DiarySpreadRight spread={spread} spreadIndex={nav.currentSpread} />
  } else if (spread.kind === 'cover') {
    left = (
      <div className="h-full flex items-center justify-center">
        <h2 className="font-serif italic text-4xl tracking-[0.3em]">{spread.title}</h2>
      </div>
    )
    right = <div className="h-full flex items-center justify-center text-sm italic opacity-40">(cover wired in Task 7)</div>
  } else if (spread.kind === 'themes') {
    left = (
      <div className="h-full flex flex-col">
        <p className="font-serif italic text-3xl md:text-4xl leading-none mb-3" style={{ opacity: 0.4 }}>{spread.numeral}</p>
        <h3 className="font-serif italic text-2xl md:text-3xl mb-5 leading-snug">{spread.title}</h3>
        <p className="text-base leading-relaxed max-w-[36ch]" style={{ opacity: 0.85 }}>{spread.copy}</p>
        <p className="font-serif italic text-xs mt-auto" style={{ opacity: 0.5 }}>{spread.marginalia}</p>
      </div>
    )
    right = <div className="h-full flex items-center justify-center text-sm italic opacity-40">(polaroids wired in Task 8)</div>
  } else {
    // cta
    left = <div className="h-full flex items-center justify-center font-serif italic text-2xl">{spread.text}</div>
    right = <div className="h-full flex items-center justify-center text-sm italic opacity-40">(CTA wired in Task 9)</div>
  }

  return (
    <section ref={sectionRef} className="relative py-24 px-6" style={{ color: theme.text.primary }}>
      <DiaryBook leftPage={left} rightPage={right} />
      <DiaryNav
        total={nav.total}
        current={nav.currentSpread}
        canGoForward={nav.canGoForward}
        canGoBack={nav.canGoBack}
        onPrev={nav.flipPrev}
        onNext={nav.flipNext}
        onJump={nav.jumpTo}
      />
    </section>
  )
}
```

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and verify:
- Spreads II–IV and VI show: roman numeral, italic title, copy, marginalia (subtle pulsing opacity), tiny SVG illustration (where applicable) on the left
- Right page shows the placeholder SVG framed as a polaroid (white border, slight rotation, subtle drift), with italic caption beneath
- Spread V (themes) shows copy on left, placeholder note on right
- Spread VIII (CTA) shows simple "the page is yours" text
- Cover (spread I) shows just the title text

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiarySpread.tsx src/components/landing/DiarySection.tsx src/components/landing/FeaturesSection.tsx public/landing/diary/placeholder.svg
git commit -m "feat(landing): generic two-page diary spread with polaroid screenshots"
```

---

## Task 5: 3D page-flip animation

**Files:**
- Create: `src/components/landing/DiaryPageFlip.tsx`
- Modify: `src/components/landing/DiaryBook.tsx`
- Modify: `src/components/landing/DiarySection.tsx`

This task replaces the static spread swap with a real 3D page-flip — the right page rotates around the spine showing both faces. The flipping leaf renders the *next* spread on its back so mid-flip you can see it coming.

- [ ] **Step 1: Create `DiaryPageFlip.tsx`**

```tsx
// src/components/landing/DiaryPageFlip.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  spreadKey: string | number
  /** The currently visible right page */
  current: ReactNode
  /** The page that should appear after the flip (back face) */
  upcoming: ReactNode
  /** Direction of motion: forward = right page peels left over the spine */
  direction: 'forward' | 'backward'
  isFlipping: boolean
  onComplete: () => void
}

export default function DiaryPageFlip({
  spreadKey,
  current,
  upcoming,
  direction,
  isFlipping,
  onComplete,
}: Props) {
  // The flipping leaf only renders while a flip is in flight.
  // It overlays the right half of the book and rotates around its inner edge.
  return (
    <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
      {/* The settled right page */}
      <div className="absolute inset-0">{current}</div>

      <AnimatePresence>
        {isFlipping && (
          <motion.div
            key={`flip-${spreadKey}`}
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: direction === 'forward' ? 'left center' : 'right center',
              backfaceVisibility: 'hidden',
            }}
            initial={{ rotateY: direction === 'forward' ? 0 : -180 }}
            animate={{ rotateY: direction === 'forward' ? -180 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0.0, 0.2, 1] }}
            onAnimationComplete={onComplete}
          >
            {/* Front face of the flipping leaf — what we're flipping FROM */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {direction === 'forward' ? current : upcoming}
            </div>

            {/* Back face — what's revealed after the flip */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {direction === 'forward' ? upcoming : current}
            </div>

            {/* Subtle shadow that deepens at 90° */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.18), transparent 30%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.7, ease: 'easeInOut', times: [0, 0.5, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Update `DiaryBook.tsx` to accept a flip overlay for the right page**

```tsx
// Modify DiaryBook.tsx — add optional `rightFlipOverlay` prop, render it on top of the right page

type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
  rightFlipOverlay?: ReactNode
}

export default function DiaryBook({ leftPage, rightPage, rightFlipOverlay }: Props) {
  // ... existing setup ...
  return (
    <div className="relative w-full max-w-[1100px] aspect-[16/10] mx-auto" style={{ perspective: '2400px' }}>
      {/* ... vignette ... */}
      <div className="relative w-full h-full flex" style={{ /* ...existing... */ }}>
        <div className="diary-paper-grain" />
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">{leftPage}</div>
        <div className="relative pointer-events-none" style={{ width: '20px', /* ...spine gradient... */ }} />
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {rightPage}
          {rightFlipOverlay && (
            <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
              {rightFlipOverlay}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire the flip in `DiarySection.tsx`**

Track the previous spread to render as the "from" face during a flip:

```tsx
// In DiarySection.tsx, add state for previous-spread snapshot:
import { useEffect, useMemo, useRef, useState } from 'react'
// ...
const [prevSpreadIndex, setPrevSpreadIndex] = useState(0)

useEffect(() => {
  if (!nav.isFlipping) {
    setPrevSpreadIndex(nav.currentSpread)
  }
}, [nav.isFlipping, nav.currentSpread])

const prevSpread = SPREADS[prevSpreadIndex]
const renderRight = (s: typeof spread) => {
  if (s.kind === 'feature') return <DiarySpreadRight spread={s} spreadIndex={nav.currentSpread} />
  // (use the same placeholder right pages as before for cover/themes/cta — they get replaced in later tasks)
  return <div className="h-full flex items-center justify-center text-sm italic opacity-40">…</div>
}

// Then pass to DiaryBook:
<DiaryBook
  leftPage={left}
  rightPage={renderRight(spread)}
  rightFlipOverlay={
    <DiaryPageFlip
      spreadKey={`${prevSpreadIndex}-${nav.currentSpread}`}
      current={renderRight(prevSpread)}
      upcoming={renderRight(spread)}
      direction={nav.flipDirection}
      isFlipping={nav.isFlipping}
      onComplete={nav.onFlipComplete}
    />
  }
/>
```

(The exact merge into `DiarySection` follows the dispatch pattern already in place — keep the spread-kind switch for the `left` and call `renderRight` for both `current` and `upcoming` faces.)

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and verify:
- Click Next: the right page rotates 180° around the spine over ~700ms, revealing the next spread
- During the flip, the back of the rotating page briefly shows the upcoming content
- A soft shadow sweeps across the spine mid-flip
- Click Prev: the same animation runs in reverse
- Clicking dots also triggers a flip (forward or backward depending on direction)
- Pressing Next while a flip is in progress is ignored (no double-trigger)

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiaryPageFlip.tsx src/components/landing/DiaryBook.tsx src/components/landing/DiarySection.tsx
git commit -m "feat(landing): 3d page-flip animation between diary spreads"
```

---

## Task 6: Hover-corner-bend (the must-have effect)

**Files:**
- Create: `src/components/landing/DiaryCornerPeel.tsx`
- Modify: `src/components/landing/DiaryBook.tsx`

The four corners of the open book react to mouse proximity: top-right and bottom-right peel toward the next page, top-left and bottom-left toward the previous page. Click a peeled corner to commit the flip.

- [ ] **Step 1: Create `DiaryCornerPeel.tsx`**

```tsx
// src/components/landing/DiaryCornerPeel.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

type Props = {
  corner: Corner
  onCommit: () => void
  enabled: boolean
}

const HOT_RADIUS = 120 // px from corner where peel starts to track mouse
const MAX_PEEL_DEG = 42

export default function DiaryCornerPeel({ corner, onCommit, enabled }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0) // 0..1

  useEffect(() => {
    if (!enabled) return
    const el = ref.current?.parentElement // the page (bookHalf)
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      // anchor is the corner of the parent
      const anchorX = corner === 'tl' || corner === 'bl' ? rect.left : rect.right
      const anchorY = corner === 'tl' || corner === 'tr' ? rect.top : rect.bottom
      const dx = e.clientX - anchorX
      const dy = e.clientY - anchorY
      const dist = Math.hypot(dx, dy)
      const next = Math.max(0, Math.min(1, 1 - dist / HOT_RADIUS))
      setProgress(next)
    }
    const onLeave = () => setProgress(0)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [corner, enabled])

  if (!enabled) return null

  // Each corner has its own transform-origin and rotate axis
  const positionClasses: Record<Corner, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }

  // Direction of peel — diagonal away from the page
  const rotateAxes: Record<Corner, [number, number, number]> = {
    tl: [1, -1, 0],
    tr: [1, 1, 0],
    bl: [-1, -1, 0],
    br: [-1, 1, 0],
  }

  const origins: Record<Corner, string> = {
    tl: '0% 0%',
    tr: '100% 0%',
    bl: '0% 100%',
    br: '100% 100%',
  }

  const peel = progress * MAX_PEEL_DEG
  const [rx, ry, rz] = rotateAxes[corner]

  return (
    <div
      ref={ref}
      onClick={() => progress > 0.5 && onCommit()}
      className={`absolute ${positionClasses[corner]} pointer-events-auto`}
      style={{
        width: HOT_RADIUS,
        height: HOT_RADIUS,
        zIndex: 10,
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          transformOrigin: origins[corner],
          transform: `rotate3d(${rx}, ${ry}, ${rz}, ${peel}deg)`,
          background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.4) 60%, rgba(0,0,0,0.18) 100%)',
          boxShadow: progress > 0.1 ? '-2px -2px 12px rgba(0,0,0,0.16)' : 'none',
          transition: 'box-shadow 200ms',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `DiaryBook.tsx` to host corner-peel hot zones**

Add four `DiaryCornerPeel` components — two on the left page (peel back), two on the right page (peel forward). The `enabled` prop should be controlled by the parent so reduced-motion and mobile disable them.

```tsx
// In DiaryBook.tsx, add to props:
type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
  rightFlipOverlay?: ReactNode
  cornersEnabled?: boolean
  onPeelNext?: () => void
  onPeelPrev?: () => void
}

// Then inside the left page wrapper:
<div className="relative flex-1 p-10 md:p-14 overflow-hidden">
  {leftPage}
  <DiaryCornerPeel corner="tl" enabled={!!cornersEnabled} onCommit={() => onPeelPrev?.()} />
  <DiaryCornerPeel corner="bl" enabled={!!cornersEnabled} onCommit={() => onPeelPrev?.()} />
</div>

// And inside the right page wrapper:
<div className="relative flex-1 p-10 md:p-14 overflow-hidden">
  {rightPage}
  {rightFlipOverlay /* ... */}
  <DiaryCornerPeel corner="tr" enabled={!!cornersEnabled} onCommit={() => onPeelNext?.()} />
  <DiaryCornerPeel corner="br" enabled={!!cornersEnabled} onCommit={() => onPeelNext?.()} />
</div>
```

- [ ] **Step 3: Pass `cornersEnabled` and handlers from `DiarySection.tsx`**

```tsx
// In DiarySection.tsx, detect reduced motion and touch:
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const cornersEnabled = !reducedMotion && !isTouch && !nav.isFlipping

// Pass to DiaryBook:
<DiaryBook
  leftPage={left}
  rightPage={renderRight(spread)}
  rightFlipOverlay={/* ...as before... */}
  cornersEnabled={cornersEnabled}
  onPeelNext={nav.flipNext}
  onPeelPrev={nav.flipPrev}
/>
```

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/`. Verify:
- Move the cursor toward any of the 4 corners — the corner curls up in 3D, more as you get closer
- Move away — the corner settles back smoothly
- Click a peeled corner (when curled past about halfway) — page flips
- Top-right / bottom-right = next; top-left / bottom-left = prev
- On a touch device or with `prefers-reduced-motion`, the peel hot zones don't appear (test by emulating in dev tools → Rendering → Emulate CSS media feature)

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiaryCornerPeel.tsx src/components/landing/DiaryBook.tsx src/components/landing/DiarySection.tsx
git commit -m "feat(landing): hover-corner-bend on diary pages"
```

---

## Task 7: Cover spread + cover-open animation

**Files:**
- Create: `src/components/landing/DiaryCover.tsx`
- Modify: `src/components/landing/DiarySection.tsx`

Spread #1 is special — it's a closed book cover with a debossed title and gold-foil stroke. Going from #1 → #2 plays a slower, more ceremonial cover-open animation; #2 → #1 plays the reverse.

- [ ] **Step 1: Create `DiaryCover.tsx`**

```tsx
// src/components/landing/DiaryCover.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { CoverSpread } from './spreads'

type Props = {
  spread: CoverSpread
  /** When true, render the cover OPENING (forward). When false, the cover is closed and visible. */
  opening: boolean
  /** Animation completion handler */
  onComplete?: () => void
}

export default function DiaryCover({ spread, opening, onComplete }: Props) {
  const { theme } = useThemeStore()

  // Cover stock — darker theme-tinted card stock
  const coverStock = `color-mix(in srgb, ${theme.accent.primary}, #2a2218 55%)`
  const foil = theme.accent.warm

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: coverStock,
        borderRadius: '4px',
        boxShadow:
          '0 24px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.4)',
        transformOrigin: 'right center',
        transformStyle: 'preserve-3d',
      }}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: opening ? -170 : 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
      onAnimationComplete={() => opening && onComplete?.()}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ backfaceVisibility: 'hidden', color: '#f4ede1' }}
      >
        <h2
          className="font-serif italic tracking-[0.4em] text-5xl md:text-6xl"
          style={{
            color: 'transparent',
            WebkitTextStroke: `1px ${foil}`,
            textShadow: `0 0 24px ${foil}40`,
          }}
        >
          {spread.title}
        </h2>
        <p className="font-serif italic mt-6 opacity-70 max-w-[24ch]">
          {spread.subtitle}
        </p>

        {/* Subtle embossed border */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '14px',
            borderRadius: '3px',
            border: `1px solid ${foil}30`,
            boxShadow: `inset 0 0 24px ${foil}10`,
          }}
        />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Wire the cover into `DiarySection.tsx`**

When `currentSpread === 0`, render the closed cover overlaid on the book stage. When transitioning from spread 0 to 1 (forward) or 1 to 0 (backward), play the cover-open animation.

```tsx
// In DiarySection.tsx — add state to track cover state:
const [coverOpening, setCoverOpening] = useState(false)

// When user is on spread 0 and clicks Next:
const handleNext = () => {
  if (nav.currentSpread === 0) {
    setCoverOpening(true)
    // Defer the actual flipNext until the cover-open animation finishes,
    // OR call flipNext immediately and let the cover animate alongside.
    nav.flipNext()
  } else {
    nav.flipNext()
  }
}

// Wrap the diary book so we can overlay the cover:
<div className="relative">
  <DiaryBook ... />

  {/* Show the cover whenever we're on spread 0, or animating away from/toward it */}
  {(nav.currentSpread === 0 || coverOpening) && SPREADS[0].kind === 'cover' && (
    <div className="absolute inset-0 pointer-events-none" style={{ perspective: '2400px' }}>
      <div className="relative w-full max-w-[1100px] aspect-[16/10] mx-auto" style={{ transformStyle: 'preserve-3d' }}>
        <DiaryCover
          spread={SPREADS[0] as CoverSpread}
          opening={coverOpening}
          onComplete={() => setCoverOpening(false)}
        />
      </div>
    </div>
  )}
</div>
```

Also: when navigating *back* to spread 0 (i.e. nav.currentSpread changed to 0), reset the cover to closed (set `coverOpening` to false). And replace `nav.flipNext` references in `DiaryNav` and `onPeelNext` to use `handleNext`.

For prev navigation, no special handling — when arriving at spread 0 the cover is rendered closed by default.

- [ ] **Step 3: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and verify:
- On first load, the diary appears as a closed book — dark theme-tinted cover, "HEARTH" embossed in gold-foil-stroke serif italic
- Clicking Next: the cover swings open from the right (slower than a page flip — about 0.9s), revealing spread II underneath
- After the cover opens, normal page flips resume
- Clicking Prev all the way back: arriving on spread 0 shows the cover closed again
- Clicking Next from spread 0 again replays the cover-open animation

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/DiaryCover.tsx src/components/landing/DiarySection.tsx
git commit -m "feat(landing): diary cover with cover-open animation"
```

---

## Task 8: Live theme polaroid grid (spread #6)

**Files:**
- Create: `src/components/landing/DiaryThemePolaroid.tsx`
- Create: `src/components/landing/DiaryPolaroidGrid.tsx`
- Modify: `src/components/landing/DiarySection.tsx`

Spread #6's right page is a 4-on-top / 3-on-bottom cluster of polaroids. Each polaroid is a live mini preview of one of the 7 themes. Click switches the diary's theme via `useThemeStore`. A reset link reverts to the original theme.

- [ ] **Step 1: Create `DiaryThemePolaroid.tsx`**

```tsx
// src/components/landing/DiaryThemePolaroid.tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme, ThemeName } from '@/lib/themes'

type Props = {
  themeName: ThemeName
  theme: Theme
  active: boolean
  rotation: number
  hasTape: boolean
  onClick: () => void
}

export default function DiaryThemePolaroid({ themeName, theme, active, rotation, hasTape, onClick }: Props) {
  // Deterministic particle positions per theme name (avoid Math.random for SSR safety)
  const seed = themeName.charCodeAt(0)
  const dots = [
    { x: 18 + (seed % 8), y: 24 + (seed % 12) },
    { x: 60 + ((seed * 3) % 12), y: 60 + ((seed * 5) % 14) },
    { x: 78 - ((seed * 7) % 18), y: 30 + ((seed * 2) % 14) },
  ]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Try ${theme.name} theme`}
      aria-pressed={active}
      className="relative bg-white p-2 pb-6 cursor-pointer focus:outline-none"
      style={{
        boxShadow: active
          ? `0 0 0 2px ${theme.accent.primary}, 0 12px 28px rgba(0,0,0,0.18)`
          : '0 8px 20px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
        rotate: `${rotation}deg`,
      }}
      whileHover={{ y: -6, rotate: rotation - 2, scale: 1.04, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.97 }}
    >
      {hasTape && (
        <span
          className="absolute -top-2 left-3 w-10 h-3 -rotate-12 pointer-events-none"
          style={{ background: 'rgba(255, 235, 130, 0.55)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
          aria-hidden
        />
      )}

      <div
        className="relative w-[112px] h-[88px] overflow-hidden"
        style={{ background: theme.bg.gradient }}
      >
        {dots.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: 3,
              height: 3,
              background: theme.text.muted,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <p
        className="font-serif italic text-xs mt-2 text-center"
        style={{ color: '#3a3128', opacity: 0.8 }}
      >
        {theme.name}
      </p>
    </motion.button>
  )
}
```

- [ ] **Step 2: Create `DiaryPolaroidGrid.tsx`**

```tsx
// src/components/landing/DiaryPolaroidGrid.tsx
'use client'

import { themes, type ThemeName } from '@/lib/themes'
import DiaryThemePolaroid from './DiaryThemePolaroid'

type Props = {
  current: ThemeName
  hasOverridden: boolean
  onPick: (name: ThemeName) => void
  onReset: () => void
}

const ORDER: ThemeName[] = ['rivendell', 'hearth', 'rose', 'sage', 'ocean', 'postal', 'linen']
// Deterministic per-index rotation (degrees) so the cluster looks scattered but stable
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1.5, -2.5]
// Tape strips on a few cards
const TAPE = [true, false, true, false, false, true, false]

export default function DiaryPolaroidGrid({ current, hasOverridden, onPick, onReset }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 max-w-[480px]">
        {ORDER.slice(0, 4).map((name, i) => (
          <DiaryThemePolaroid
            key={name}
            themeName={name}
            theme={themes[name]}
            active={current === name}
            rotation={ROTATIONS[i]}
            hasTape={TAPE[i]}
            onClick={() => onPick(name)}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 max-w-[360px] mt-3">
        {ORDER.slice(4).map((name, i) => (
          <DiaryThemePolaroid
            key={name}
            themeName={name}
            theme={themes[name]}
            active={current === name}
            rotation={ROTATIONS[i + 4]}
            hasTape={TAPE[i + 4]}
            onClick={() => onPick(name)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 font-serif italic text-xs underline-offset-4 hover:underline"
        style={{ opacity: hasOverridden ? 0.7 : 0, pointerEvents: hasOverridden ? 'auto' : 'none' }}
      >
        ← reset to my theme
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Wire spread #6 in `DiarySection.tsx`**

```tsx
// In DiarySection.tsx, capture original theme on mount and track override state:
import { themes, type ThemeName } from '@/lib/themes'
import DiaryPolaroidGrid from './DiaryPolaroidGrid'

const { theme, setTheme, themeName } = useThemeStore()
// Note: confirm the actual theme store API names — adjust if different.

const originalThemeRef = useRef<ThemeName | null>(null)
const [hasOverridden, setHasOverridden] = useState(false)
useEffect(() => {
  if (originalThemeRef.current === null) {
    originalThemeRef.current = themeName
  }
}, [themeName])

const handlePick = (name: ThemeName) => {
  setTheme(name)
  if (name !== originalThemeRef.current) {
    setHasOverridden(true)
  } else {
    setHasOverridden(false)
  }
}

const handleResetTheme = () => {
  if (originalThemeRef.current) {
    setTheme(originalThemeRef.current)
    setHasOverridden(false)
  }
}

// Update the renderRight dispatch:
const renderRight = (s: SpreadDef) => {
  if (s.kind === 'feature') return <DiarySpreadRight spread={s} spreadIndex={nav.currentSpread} />
  if (s.kind === 'themes') {
    return (
      <DiaryPolaroidGrid
        current={themeName}
        hasOverridden={hasOverridden}
        onPick={handlePick}
        onReset={handleResetTheme}
      />
    )
  }
  // cover & cta still placeholders for now (cta in Task 9)
  return <div className="h-full flex items-center justify-center text-sm italic opacity-40">…</div>
}
```

(`useThemeStore` exposes `themeName`, `theme`, and `setTheme` — confirmed in `src/store/theme.ts`.)

- [ ] **Step 4: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and navigate to spread V (themes). Verify:
- Right page shows 7 polaroid cards in a 4 + 3 cluster, each tilted slightly differently
- Each polaroid shows that theme's gradient as the photo, 3 small particle dots, and the theme's display name in italic
- A few polaroids have a yellow tape strip on the top-left
- Hover any polaroid: it lifts and tilts toward the camera
- Click any polaroid: the entire diary background, paper tint, and surrounding section gradient transition to that theme over ~600ms (whatever transition is already wired in `useThemeStore`)
- The clicked polaroid gets a thin glow ring (the active state)
- A small "← reset to my theme" link appears below the grid once the user has clicked a non-original polaroid; clicking it reverts the theme

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/DiaryThemePolaroid.tsx src/components/landing/DiaryPolaroidGrid.tsx src/components/landing/DiarySection.tsx
git commit -m "feat(landing): live theme polaroid grid on diary spread V"
```

---

## Task 9: Closing CTA spread (#8)

**Files:**
- Create: `src/components/landing/DiaryCTASpread.tsx`
- Modify: `src/components/landing/DiarySection.tsx`

Spread #8 is the final beat — short closing prose on the left, and a styled "Begin Writing" CTA button on the right that links to `/write`.

- [ ] **Step 1: Create `DiaryCTASpread.tsx`**

```tsx
// src/components/landing/DiaryCTASpread.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { CtaSpread } from './spreads'

export function DiaryCtaLeft({ spread }: { spread: CtaSpread }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <p className="font-serif italic text-2xl md:text-3xl leading-snug max-w-[20ch]">
        {spread.text}
      </p>
      <p className="font-serif italic text-xs mt-6 opacity-50">— close the book gently</p>
    </div>
  )
}

export function DiaryCtaRight({ spread }: { spread: CtaSpread }) {
  const { theme } = useThemeStore()
  return (
    <div className="h-full flex items-center justify-center">
      <Link href={spread.buttonHref}>
        <motion.button
          type="button"
          className="relative px-10 py-4 rounded-full text-lg font-medium overflow-hidden"
          style={{
            background: theme.accent.primary,
            color: theme.bg.primary,
            boxShadow: `0 0 40px ${theme.accent.primary}30`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: theme.accent.warm }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">{spread.buttonLabel}</span>
        </motion.button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Wire in `DiarySection.tsx`**

```tsx
// In renderRight:
if (s.kind === 'cta') return <DiaryCtaRight spread={s} />

// In the left dispatch (update the cta branch):
if (spread.kind === 'cta') {
  left = <DiaryCtaLeft spread={spread} />
}
```

- [ ] **Step 3: Restart and verify**

```bash
docker compose restart app
```

Visit `http://localhost:3111/` and navigate to the final spread. Verify:
- Left: italic "The page is yours." with a small marginalia note below
- Right: a themed pulsing "Begin Writing" button matching the hero's CTA style
- Clicking the button navigates to `/write`

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/DiaryCTASpread.tsx src/components/landing/DiarySection.tsx
git commit -m "feat(landing): closing cta spread with themed begin-writing button"
```

---

## Task 10: Mobile fallback (single-page mode under 720px)

**Files:**
- Modify: `src/components/landing/DiarySection.tsx`
- Modify: `src/components/landing/DiaryBook.tsx`
- Modify: `src/components/landing/DiarySpread.tsx` (add a third export for stacked mobile view)
- Modify: `src/components/landing/DiaryPolaroidGrid.tsx` (carousel on small viewports)

Below 720px, the open spread collapses into a single page that holds the *entire* spread content stacked vertically: numeral, title, copy, illustration, photo, caption, marginalia. Swipe to flip. Hover-corner-bend disabled.

- [ ] **Step 1: Add a viewport-size hook in `DiarySection.tsx`**

```tsx
// In DiarySection.tsx
const [isNarrow, setIsNarrow] = useState(false)
useEffect(() => {
  const mq = window.matchMedia('(max-width: 720px)')
  const onChange = () => setIsNarrow(mq.matches)
  onChange()
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}, [])
```

- [ ] **Step 2: Render a single-page layout when `isNarrow`**

For each spread kind, render a stacked single-page version. Easiest is to add a third exported component to `DiarySpread.tsx`:

```tsx
// src/components/landing/DiarySpread.tsx — add:
export function DiarySpreadMobile({ spread, spreadIndex }: { spread: FeatureSpread; spreadIndex: number }) {
  const tilt = spreadIndex % 2 === 0 ? 1.5 : -1.5
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-serif italic text-2xl leading-none mb-2" style={{ opacity: 0.4 }}>
          {spread.numeral}
        </p>
        <h3 className="font-serif italic text-2xl mb-3 leading-snug">{spread.title}</h3>
        <p className="text-base leading-relaxed" style={{ opacity: 0.85 }}>{spread.copy}</p>
      </div>

      <motion.div
        className="relative bg-white p-2 pb-7 self-center"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)' }}
        animate={{ rotate: [tilt, tilt - 0.4, tilt] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-[280px] aspect-[4/3]">
          <Image
            src={spread.imagePath}
            alt={spread.imageAlt}
            fill
            sizes="280px"
            className="object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = '/landing/diary/placeholder.svg'
            }}
          />
        </div>
      </motion.div>

      <p className="font-serif italic text-sm text-center opacity-60 -mt-2">{spread.caption}</p>
      <p className="font-serif italic text-xs mt-2" style={{ opacity: 0.5 }}>{spread.marginalia}</p>
    </div>
  )
}
```

- [ ] **Step 3: Render a stacked book in narrow mode**

In `DiarySection.tsx`, branch on `isNarrow`:

```tsx
if (isNarrow) {
  return (
    <section ref={sectionRef} className="relative py-16 px-6">
      <SinglePageBook>{renderMobile(spread, nav.currentSpread)}</SinglePageBook>
      <DiaryNav ... />
    </section>
  )
}
```

`SinglePageBook` is a small inline component in `DiarySection.tsx` that renders one cream-paper page (no spine, no two-page flex), and `renderMobile(spread, idx)` dispatches by `spread.kind`:
- `cover` → centered title + subtitle on a closed-cover-style background
- `feature` → `DiarySpreadMobile`
- `themes` → polaroid grid (full width, horizontal-scroll variant)
- `cta` → centered text + button stacked

- [ ] **Step 4: Add swipe support in narrow mode**

```tsx
// In SinglePageBook (or DiarySection narrow branch), wire pointer events:
const startX = useRef<number | null>(null)

<div
  onPointerDown={(e) => { startX.current = e.clientX }}
  onPointerUp={(e) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) nav.flipNext()
      else nav.flipPrev()
    }
    startX.current = null
  }}
>
  ...
</div>
```

- [ ] **Step 5: Make the polaroid grid scroll horizontally on narrow viewports**

In `DiaryPolaroidGrid.tsx`, accept an optional `compact?: boolean` prop. When compact, render all 7 polaroids in a single row inside an overflow-x: auto container with snap points. Pass `compact={isNarrow}` from `DiarySection.tsx`.

- [ ] **Step 6: Restart and verify**

```bash
docker compose restart app
```

In dev tools, switch to a phone viewport (< 720px). Verify:
- The diary collapses into a single cream page
- Each spread shows numeral, title, copy, illustration, framed photo, caption, marginalia stacked vertically
- Prev/Next buttons + dot indicator still work
- Swipe left = next spread, swipe right = previous
- Spread V (themes) becomes a horizontally-scrolling row of polaroids; clicking still switches the theme
- Cover, CTA, all 4 feature spreads display cleanly
- Hover-corner-peel hot zones don't appear (they're already gated by `(pointer: coarse)`)

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/DiarySection.tsx src/components/landing/DiaryBook.tsx src/components/landing/DiarySpread.tsx src/components/landing/DiaryPolaroidGrid.tsx
git commit -m "feat(landing): single-page diary fallback for narrow viewports"
```

---

## Task 11: Reduced motion + dynamic load + WhisperGallery cleanup + sound toggle

**Files:**
- Modify: `src/components/landing/DiarySection.tsx`
- Modify: `src/components/landing/DiaryPageFlip.tsx`
- Modify: `src/components/landing/DiaryNav.tsx`
- Modify: `src/app/page.tsx`
- Add: `public/sounds/page-flip.ogg` (asset only, dropped in by user separately)

Final pass — reduced-motion handling, dynamic import of the diary section so 3D code doesn't bloat first paint, sound toggle, and the WhisperGallery deletion confirmed.

- [ ] **Step 1: Honor `prefers-reduced-motion` in page flips**

In `DiaryPageFlip.tsx`, detect the preference and short-circuit to a 150ms cross-fade:

```tsx
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

return (
  <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
    <div className="absolute inset-0">{current}</div>
    <AnimatePresence>
      {isFlipping && (
        reduce ? (
          <motion.div
            key={`fade-${spreadKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onAnimationComplete={onComplete}
          >
            {upcoming}
          </motion.div>
        ) : (
          // existing 3D flip block
          <motion.div /* ... */>{/* ... */}</motion.div>
        )
      )}
    </AnimatePresence>
  </div>
)
```

Also: in `DiaryCover.tsx` similarly check `prefers-reduced-motion` and use `transition={{ duration: 0.15 }}` instead of 0.9.

- [ ] **Step 2: Dim particles + freeze idle animations under reduced motion**

In `DiarySection.tsx`, when `reducedMotion` is true:
- Don't render the section's surrounding particles (or render them at 30% opacity, frozen)
- Pass `reducedMotion` down so `DiarySpreadRight`'s `motion.p` marginalia and the polaroid hover/click ripples skip animation (use `animate={false}` or just don't apply the looping `animate={{ ... }}`)

(Implementation: add a `useReducedMotion` boolean to `DiarySection`, pass to children that need it, and have those children conditionally disable looping animations.)

- [ ] **Step 3: Dynamically import `DiarySection` in `page.tsx`**

```tsx
// src/app/page.tsx
import dynamic from 'next/dynamic'

const DiarySection = dynamic(() => import('@/components/landing/DiarySection'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '80vh' }} />,
})
```

(Replace the existing static `import DiarySection from '@/components/landing/DiarySection'`.)

- [ ] **Step 4: Diary breathing + page flutter idle micro-animations**

In `DiaryBook.tsx`, wrap the inner book element so it gently breathes (1 → 1.005 → 1 over 8s) and the top edge of each page flutters (a tiny ~1px lift at random intervals between 8 and 14 seconds). Both must skip when reduced motion is on.

```tsx
// In DiaryBook.tsx — add a `reducedMotion` prop and wrap the inner book in framer motion:
import { motion } from 'framer-motion'

type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
  rightFlipOverlay?: ReactNode
  cornersEnabled?: boolean
  onPeelNext?: () => void
  onPeelPrev?: () => void
  reducedMotion?: boolean
}

// Replace the existing book wrapper div with a motion.div:
<motion.div
  className="relative w-full h-full flex"
  style={{ /* ...existing inline styles... */ }}
  animate={reducedMotion ? undefined : { scale: [1, 1.005, 1] }}
  transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
>
  {/* ...children unchanged... */}
</motion.div>
```

For the page flutter, add a motion strip at the top of each page wrapper:

```tsx
// Inside each page wrapper (the .relative.flex-1.p-10 divs), prepend:
{!reducedMotion && (
  <motion.div
    className="absolute inset-x-2 top-0 h-1 pointer-events-none"
    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.04), transparent)', transformOrigin: 'top center' }}
    animate={{ y: [0, -1, 0] }}
    transition={{ duration: 10, repeat: Infinity, ease: 'easeOut', repeatDelay: 4 }}
  />
)}
```

In `DiarySection.tsx`, pass `reducedMotion` down: `<DiaryBook ... reducedMotion={reducedMotion} />`.

- [ ] **Step 5: Sound toggle in `DiaryNav`**

Extend `DiaryNav` props with `soundOn: boolean` and `onToggleSound: () => void`. Add a small icon button next to the page-pip indicator that flips the value.

In `DiarySection.tsx`, manage sound state:

```tsx
const [soundOn, setSoundOn] = useState(false)

useEffect(() => {
  try {
    const stored = localStorage.getItem('hearth:diary-sound')
    if (stored === '1') setSoundOn(true)
  } catch {}
}, [])

const handleToggleSound = () => {
  setSoundOn((on) => {
    const next = !on
    try { localStorage.setItem('hearth:diary-sound', next ? '1' : '0') } catch {}
    return next
  })
}

// Audio: a single ref-held HTMLAudioElement
const audioRef = useRef<HTMLAudioElement | null>(null)
useEffect(() => {
  audioRef.current = new Audio('/sounds/page-flip.ogg')
  audioRef.current.volume = 0.35
}, [])

// Play on each flip:
useEffect(() => {
  if (!nav.isFlipping) return
  if (!soundOn || reducedMotion) return
  audioRef.current?.play().catch(() => {})
}, [nav.isFlipping, soundOn, reducedMotion])
```

Pass `soundOn` and `handleToggleSound` to `DiaryNav`. The icon: `🔊 / 🔇` rendered as text in the same baseBtn style.

The sound asset will be added by the user as `public/sounds/page-flip.ogg`. Until then, `.play()` will simply fail silently due to the `.catch(() => {})`.

- [ ] **Step 6: Verify WhisperGallery is gone**

Confirm `src/app/page.tsx` no longer contains a `WhisperGallery` reference. Confirm the import of `FeaturesSection` is also gone. Run:

```bash
grep -n "WhisperGallery\|FeaturesSection" src/app/page.tsx
```

Expected: no matches.

- [ ] **Step 7: Final restart and end-to-end verification**

```bash
docker compose restart app
docker compose logs --tail=80 app
```

Visit `http://localhost:3111/` and run through the full flow:
- Hero loads unchanged
- Below the hero: closed diary cover with debossed HEARTH title
- Click Next: cover swings open ceremonially (~0.9s) → spread II (Journal)
- Hover any corner: corner curls in 3D → click commits the flip
- Flip through all 7 inner spreads via Next, Prev, arrow keys, dot indicator (jump), peel-and-click, and the spread V theme polaroids
- Click a polaroid on spread V: diary tint, paper, surrounding background all transition to that theme over ~600ms; reset link reverts
- Spread VIII shows "the page is yours" + a working "Begin Writing" link to `/write`
- Sound toggle in nav: click — next flip plays a quiet rustle (only if you've dropped `page-flip.ogg` into `public/sounds/`)
- Resize to mobile width: diary collapses to single-page, swipe works, polaroids horizontal-scroll
- DevTools → Rendering → Emulate "prefers-reduced-motion: reduce": all 3D flips become fast cross-fades, hover-corner-peel disabled, idle animations frozen
- WhisperGallery is gone
- The diary itself breathes very subtly (you have to watch for it; ~8s cycle)

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/DiarySection.tsx src/components/landing/DiaryPageFlip.tsx src/components/landing/DiaryCover.tsx src/components/landing/DiaryNav.tsx src/app/page.tsx
git commit -m "feat(landing): reduced-motion + dynamic load + sound toggle, drop whisper gallery"
```

---

## Follow-up (out of scope for this plan)

- Delete `src/components/landing/FeaturesSection.tsx` once the diary has shipped and no other importer remains. Move the `Illustration` component to `src/components/landing/SpreadIllustration.tsx` first to keep the landing diary working.
- Drop in real screenshots at `public/landing/diary/{journal-entry,letter-sealed,scrapbook,memory-constellation,master-key}.png` — supplied by the user.
- Drop in `public/sounds/page-flip.ogg` — supplied by the user.
- (Optional) Analytics events for diary navigation — explicitly out of scope.
