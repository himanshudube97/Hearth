# Moonlit Parallax Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Moonlit" theme to Hearth that renders a 5-layer cursor-driven parallax scene of a moon over still water, fully isolated from all existing themes.

**Architecture:** Register the new theme in the existing `ThemeName` registry, satisfying all `Record<ThemeName, ...>` exhaustiveness sites with simple entries. Build a self-contained `MoonlitScene` component that owns all parallax DOM, the mousemove listener, and a single `requestAnimationFrame` loop. Hook it into `Background.tsx` via a one-line early return so every other theme's render path is byte-identical to today.

**Tech Stack:** Next.js 16, React 19, TypeScript, inline SVG, raw `requestAnimationFrame`, CSS keyframes (no new dependencies).

---

## Project notes for the implementer

- **No test framework is installed.** This project has no jest/vitest/playwright and no `*.test.*` files in `src/`. Verification is `npm run lint`, `npm run build`, and manual visual QA via Docker. Do not invent a test infrastructure.
- **All commands run in Docker.** Use `docker compose up -d`, `docker compose restart app`, `docker compose logs -f app`. Lint runs inside the container too: `docker compose exec app npm run lint`.
- **Path alias:** `@/*` → `./src/*`.
- **TypeScript strictness:** `Record<ThemeName, X>` exists in 5+ files. Adding `'moonlit'` to `ThemeName` will surface compile errors at every one of those sites — that's expected and lists all the places that need an entry.
- **Existing rendering logic in `Background.tsx`** uses `theme.particles === '<value>'` checks. The new `'moonlit'` particle sentinel is intentionally *not* added to any existing branch — the early-return short-circuits before any of them run.

---

## File structure

**New files**
- `src/components/MoonlitScene.tsx` — the entire parallax scene. ~250 LOC including inline SVG paths and CSS keyframes.

**Modified files (all minimal additive changes)**
- `src/lib/themes.ts` — extend `ThemeName`, `Theme.particles`, `Theme.ambience` unions; export `moonlitTheme`; register in `themes` map.
- `src/lib/sounds.ts` — add `moonlit: null` to `ambientSources`.
- `src/components/Background.tsx` — add early-return branch above all existing render paths.
- `src/components/ThemeSwitcher.tsx` — add `moonlit` entry in `themeIcons` Record.
- `src/components/desk/DeskSettingsPanel.tsx` — add `moonlit` entry in `themeIcons` Record.
- `src/components/desk/decorations/ThemeOrnament.tsx` — add `moonlit` entry in `ornaments` Record (simple SVG moon).
- `src/components/LetterArrivedBanner.tsx` — add `moonlit` entry in `themeStamps` Record.
- `src/lib/scrapbook.ts` — add `moonlit` entry in `PAPER_PRESETS` Record.
- `src/components/landing/ThemeShowcase.tsx` — add `{ key: 'moonlit', emoji: '🌙' }` to the displayed list (optional but consistent).

**Untouched by design**
- All existing branches in `Background.tsx`, every existing particle config function, every existing theme's data, every component not listed above.

---

## Task 1: Register the new theme

**Goal:** Make `'moonlit'` a valid `ThemeName` with a complete palette, satisfying every TypeScript site that requires exhaustiveness. After this task, the theme appears in the switcher and selecting it renders solid colors (no parallax yet — `Background.tsx` still falls through to its default).

**Files:**
- Modify: `src/lib/themes.ts`
- Modify: `src/lib/sounds.ts`
- Modify: `src/components/ThemeSwitcher.tsx`
- Modify: `src/components/desk/DeskSettingsPanel.tsx`
- Modify: `src/components/desk/decorations/ThemeOrnament.tsx`
- Modify: `src/components/LetterArrivedBanner.tsx`
- Modify: `src/lib/scrapbook.ts`
- Modify: `src/components/landing/ThemeShowcase.tsx`

- [ ] **Step 1.1: Extend types in `src/lib/themes.ts`**

In `src/lib/themes.ts`, modify the `ThemeName` union (around line 3-10):

```ts
export type ThemeName =
  | 'rivendell'
  | 'hearth'
  | 'rose'
  | 'sage'
  | 'ocean'
  | 'postal'
  | 'linen'
  | 'moonlit'
```

In the same file, modify the `Theme.particles` union (around line 46):

```ts
particles: 'fireflies' | 'embers' | 'goldFlecks' | 'leaves' | 'sakura' | 'sunbeam' | 'foam' | 'mist' | 'dust' | 'moonlit'
```

And the `Theme.ambience` union (around line 47):

```ts
ambience: 'forest' | 'firelight' | 'rose' | 'sage' | 'ocean' | 'postal' | 'linen' | 'moonlit'
```

- [ ] **Step 1.2: Add `moonlitTheme` definition in `src/lib/themes.ts`**

Add this export immediately after `linenTheme` (around line 329, before the `themes` map):

```ts
// Moonlit — moon over still water, parallax depth scene
export const moonlitTheme: Theme = {
  name: 'Moonlit',
  description: 'Moon over still water',
  mode: 'dark',
  bg: {
    primary: '#0A0E1A',
    secondary: '#14182A',
    gradient: 'linear-gradient(180deg, #0A0E1A 0%, #141A2C 50%, #0E1422 100%)',
  },
  text: {
    primary: '#E4E8F0',
    secondary: '#A8B2C8',
    muted: '#6E7890',
  },
  accent: {
    primary: '#7B8FB8',
    secondary: '#5E72A0',
    warm: '#E8DCA8',
    highlight: '#F4E8B8',
  },
  glass: {
    bg: 'rgba(20, 26, 44, 0.55)',
    border: 'rgba(123, 143, 184, 0.15)',
    blur: '28px',
  },
  moods: {
    0: '#3E4258',
    1: '#5E6680',
    2: '#7B8FB8',
    3: '#A8B6D0',
    4: '#E8DCA8',
  },
  moodEmojis: ['🌑', '🌒', '🌓', '🌔', '🌕'],
  moodLabels: ['New', 'Waxing', 'Half', 'Gibbous', 'Full'],
  particles: 'moonlit',
  ambience: 'moonlit',
  cover: '#1F2A44',
}
```

- [ ] **Step 1.3: Register in the `themes` map**

In `src/lib/themes.ts`, modify the `themes` const (around line 331):

```ts
export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
  hearth: hearthTheme,
  rose: roseTheme,
  sage: sageTheme,
  ocean: oceanTheme,
  postal: postalTheme,
  linen: linenTheme,
  moonlit: moonlitTheme,
}
```

- [ ] **Step 1.4: Add `moonlit: null` to ambient sources in `src/lib/sounds.ts`**

Modify the `ambientSources` record (around line 3). Add this line in the appropriate alphabetical-ish position with the others:

```ts
  moonlit: null,
```

The full block should now contain entries for: `forest`, `firelight`, `rose`, `sage`, `ocean`, `postal`, `linen`, `moonlit`. The `null` means no ambient audio file — silent for this theme.

- [ ] **Step 1.5: Add icon entry in `src/components/ThemeSwitcher.tsx`**

Modify the `themeIcons` record (around line 8-16):

```ts
const themeIcons: Record<ThemeName, string> = {
  rivendell: '🌲',
  hearth: '🔥',
  rose: '🌸',
  sage: '🌿',
  ocean: '🌊',
  postal: '✉️',
  linen: '🕊️',
  moonlit: '🌙',
}
```

- [ ] **Step 1.6: Add icon entry in `src/components/desk/DeskSettingsPanel.tsx`**

Modify the `themeIcons` record there (around line 13-20). Add `moonlit: '🌙',` to the record so it has all 8 keys.

- [ ] **Step 1.7: Add ornament entry in `src/components/desk/decorations/ThemeOrnament.tsx`**

In the `ornaments` record (starts around line 3), add a `moonlit` key. Use a minimal crescent-moon SVG so it renders identically to other themes' ornament shapes:

```tsx
  moonlit: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonlitGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4E8B8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8DCA8" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="28" fill="url(#moonlitGlow)" />
      <circle cx="58" cy="46" r="24" fill="#0A0E1A" />
    </svg>
  ),
```

- [ ] **Step 1.8: Add stamp entry in `src/components/LetterArrivedBanner.tsx`**

Modify the `themeStamps` record (around line 28-36). Add:

```ts
  moonlit: { icon: '🌙', color: '#7B8FB8' },
```

- [ ] **Step 1.9: Add paper preset in `src/lib/scrapbook.ts`**

In the `PAPER_PRESETS` record (around line 457-507), add this entry alongside the others. The `PaperPreset` shape is `{ base, grain, highlight, shadow }` — paper itself stays paper-toned (never saturated); the highlight/shadow values give the page warm/cool depth:

```ts
  // cool cream — moonlight-tinted paper for the moonlit palette
  moonlit: {
    base: '#d8d4be',
    grain: 'rgba(60, 70, 90, 0.06)',
    highlight: 'rgba(232, 220, 168, 0.40)',
    shadow: 'rgba(40, 50, 70, 0.10)',
  },
```

- [ ] **Step 1.10: Add to landing showcase in `src/components/landing/ThemeShowcase.tsx`**

Add an entry to the array (around line 9-15):

```ts
  { key: 'moonlit', emoji: '🌙' },
```

Place it near `ocean` / `postal` so the marketing list stays grouped sensibly.

- [ ] **Step 1.11: Verify lint and build pass**

Run:

```bash
docker compose exec app npm run lint
docker compose exec app npm run build
```

Expected: both succeed with no TypeScript errors. If a `Record<ThemeName, ...>` site was missed, the build will fail with `Property 'moonlit' is missing in type ...` — find the file, add the entry, rerun.

- [ ] **Step 1.12: Manual smoke check**

```bash
docker compose restart app
docker compose logs -f app
```

Open the app, click the theme switcher (bottom-right), confirm "Moonlit" appears with the 🌙 icon and selecting it shifts the page to deep navy. The journal background will fall through to the default rendering branch in `Background.tsx` — that's expected at this stage, parallax is wired up later.

- [ ] **Step 1.13: Commit**

```bash
git add src/lib/themes.ts src/lib/sounds.ts src/components/ThemeSwitcher.tsx src/components/desk/DeskSettingsPanel.tsx src/components/desk/decorations/ThemeOrnament.tsx src/components/LetterArrivedBanner.tsx src/lib/scrapbook.ts src/components/landing/ThemeShowcase.tsx
git commit -m "feat(themes): register moonlit theme palette and registry entries"
```

---

## Task 2: Build static MoonlitScene with all five layers

**Goal:** A new component renders the full visual scene — sky, stars, moon, water, reeds — as a static fixed-position background. No animation yet. Not yet wired into `Background.tsx`; mounted directly for visual verification.

**Files:**
- Create: `src/components/MoonlitScene.tsx`

- [ ] **Step 2.1: Create the component skeleton**

Create `src/components/MoonlitScene.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'

const STAR_COUNT = 80

type Star = { cx: number; cy: number; r: number; opacity: number; delay: number; duration: number }

function generateStars(): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      cx: Math.random() * 100,
      cy: Math.random() * 55,
      r: 0.4 + Math.random() * 1.4,
      opacity: 0.4 + Math.random() * 0.6,
      delay: Math.random() * 6,
      duration: 2 + Math.random() * 4,
    })
  }
  return stars
}

export default function MoonlitScene() {
  const skyRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<SVGSVGElement>(null)
  const moonRef = useRef<SVGSVGElement>(null)
  const waterRef = useRef<SVGSVGElement>(null)
  const reedsRef = useRef<SVGSVGElement>(null)

  const starsRef2 = useRef<Star[] | null>(null)
  if (starsRef2.current === null) starsRef2.current = generateStars()
  const stars = starsRef2.current

  return (
    <div className="moonlit-root fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Layer 1: sky */}
      <div
        ref={skyRef}
        className="moonlit-layer absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0A0E1A 0%, #141A2C 50%, #0E1422 100%)',
        }}
      />

      {/* Faint nebula wash on top of sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 70% 30%, rgba(123, 143, 184, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 2: stars */}
      <svg
        ref={starsRef}
        className="moonlit-layer absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#F4E8B8"
            opacity={s.opacity}
            className="moonlit-twinkle"
            style={{
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </svg>

      {/* Layer 3: moon + halo */}
      <svg
        ref={moonRef}
        className="moonlit-layer absolute"
        viewBox="0 0 200 200"
        style={{
          top: '12%',
          left: '50%',
          width: '180px',
          height: '180px',
          transform: 'translateX(-50%)',
        }}
      >
        <defs>
          <radialGradient id="moonHaloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4E8B8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#E8DCA8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#E8DCA8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonBodyGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FBF4D8" />
            <stop offset="60%" stopColor="#E8DCA8" />
            <stop offset="100%" stopColor="#C8BC88" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#moonHaloGrad)" />
        <circle cx="100" cy="100" r="50" fill="url(#moonBodyGrad)" />
      </svg>

      {/* Layer 4: water */}
      <svg
        ref={waterRef}
        className="moonlit-layer absolute inset-x-0"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
        style={{ bottom: 0, height: '50%', width: '100%' }}
      >
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0E1422" />
            <stop offset="100%" stopColor="#060810" />
          </linearGradient>
          <linearGradient id="moonReflect" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8DCA8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#E8DCA8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="50" fill="url(#waterGrad)" />
        {/* Vertical moon-path reflection stripe centered horizontally */}
        <rect x="46" y="0" width="8" height="50" fill="url(#moonReflect)" />
        {/* Faint horizontal shimmer lines */}
        <line x1="0" y1="6" x2="100" y2="6" stroke="#7B8FB8" strokeOpacity="0.08" strokeWidth="0.2" />
        <line x1="0" y1="14" x2="100" y2="14" stroke="#7B8FB8" strokeOpacity="0.06" strokeWidth="0.2" />
        <line x1="0" y1="24" x2="100" y2="24" stroke="#7B8FB8" strokeOpacity="0.04" strokeWidth="0.2" />
      </svg>

      {/* Layer 5: foreground reeds */}
      <svg
        ref={reedsRef}
        className="moonlit-layer absolute inset-x-0"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        style={{ bottom: 0, height: '24%', width: '100%' }}
      >
        <path d="M 8 30 Q 9 18 7 4" fill="none" stroke="#03060C" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 16 30 Q 15 16 17 2" fill="none" stroke="#03060C" strokeWidth="0.4" strokeLinecap="round" />
        <path d="M 22 30 Q 23 22 21 12" fill="none" stroke="#03060C" strokeWidth="0.45" strokeLinecap="round" />
        <path d="M 78 30 Q 77 14 79 0" fill="none" stroke="#03060C" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 86 30 Q 87 18 85 6" fill="none" stroke="#03060C" strokeWidth="0.4" strokeLinecap="round" />
        <path d="M 92 30 Q 91 22 93 14" fill="none" stroke="#03060C" strokeWidth="0.45" strokeLinecap="round" />
      </svg>

      <style jsx>{`
        .moonlit-twinkle {
          animation-name: moonlit-twinkle-kf;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-direction: alternate;
        }
        @keyframes moonlit-twinkle-kf {
          0% { opacity: 0.2; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```

Note the `aria-hidden` on the root — this is purely decorative.

- [ ] **Step 2.2: Temporarily mount the scene to verify it renders**

For visual verification *only*, temporarily import and render `MoonlitScene` from a top-level component. The simplest spot: add this to the top of `src/components/Background.tsx`'s `BackgroundComponent` body, immediately after the existing hooks block, gated by a debug flag:

```tsx
// TEMP: visual verification of MoonlitScene during plan task 2 — remove in task 6
if (process.env.NEXT_PUBLIC_MOONLIT_DEBUG === '1') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MoonlitScene = require('./MoonlitScene').default
  return <MoonlitScene />
}
```

Set `NEXT_PUBLIC_MOONLIT_DEBUG=1` in `.env` (or `.env.local`), restart the container, open the app. **Important:** do not commit this debug branch — it gets removed in task 6.

```bash
docker compose restart app
```

Verify visually: navy sky, stars visible (already twinkling — the keyframes work right away), large moon upper-third, dark water lower-half with a vertical bright stripe centered, six thin reed silhouettes along the bottom corners. No mouse interaction yet.

- [ ] **Step 2.3: Lint check**

```bash
docker compose exec app npm run lint
```

Expected: no errors.

- [ ] **Step 2.4: Commit**

Remove the temp debug block from `Background.tsx` *only if* you committed it accidentally — otherwise the temp lives only in your worktree and is removed in task 6.

```bash
git add src/components/MoonlitScene.tsx
git commit -m "feat(moonlit): static parallax scene with sky, stars, moon, water, reeds"
```

---

## Task 3: Wire mousemove + rAF easing for parallax shift

**Goal:** Cursor movement smoothly shifts each layer by a per-layer multiplier. No ambient drift yet — only cursor-driven motion.

**Files:**
- Modify: `src/components/MoonlitScene.tsx`

- [ ] **Step 3.1: Add the mousemove handler and rAF loop**

In `src/components/MoonlitScene.tsx`, add this `useEffect` inside `MoonlitScene` (after the existing hooks, before the `return`):

```tsx
useEffect(() => {
  const layers: Array<{ ref: React.RefObject<HTMLElement | SVGSVGElement | null>; shift: number }> = [
    { ref: skyRef as React.RefObject<HTMLElement | null>, shift: 0 },
    { ref: starsRef, shift: 6 },
    { ref: moonRef, shift: 14 },
    { ref: waterRef, shift: 22 },
    { ref: reedsRef, shift: 36 },
  ]

  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let rafId = 0
  const moonBaseTransform = 'translateX(-50%)' // moon SVG has a baked-in centering transform

  function onMove(e: MouseEvent) {
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    targetX = (e.clientX / w) * 2 - 1   // [-1, +1]
    targetY = (e.clientY / h) * 2 - 1
  }

  function tick() {
    currentX += (targetX - currentX) * 0.08
    currentY += (targetY - currentY) * 0.08

    for (const { ref, shift } of layers) {
      const el = ref.current
      if (!el) continue
      const tx = currentX * shift
      const ty = currentY * shift * 0.5
      // Moon has its own centering transform; preserve it.
      if (ref === moonRef) {
        el.style.transform = `${moonBaseTransform} translate3d(${tx}px, ${ty}px, 0)`
      } else {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  rafId = requestAnimationFrame(tick)

  return () => {
    window.removeEventListener('mousemove', onMove)
    cancelAnimationFrame(rafId)
  }
}, [])
```

(`React` is already imported via the `useEffect` import; if needed, add `import type React from 'react'` at the top of the file.)

- [ ] **Step 3.2: Adjust the moon's inline `transform` to coexist**

The moon `<svg>` currently has `transform: 'translateX(-50%)'` in its inline style. The rAF loop now overwrites it via `moonBaseTransform`. Leave the inline `style.transform` as-is for the initial paint — the loop will replace it on the first frame. No code change needed.

- [ ] **Step 3.3: Lint and visual verify**

```bash
docker compose exec app npm run lint
docker compose restart app
```

With `NEXT_PUBLIC_MOONLIT_DEBUG=1` still set, open the app and move the cursor. Expected: layers shift in the cursor's direction with depth — reeds move noticeably, stars barely. Sky is anchored (no movement). Motion eases (no jitter) and feels soft.

- [ ] **Step 3.4: Commit**

```bash
git add src/components/MoonlitScene.tsx
git commit -m "feat(moonlit): cursor-driven parallax with per-layer easing"
```

---

## Task 4: Add ambient sine drift

**Goal:** Even with the cursor still, each layer continuously drifts on a small sine wave so the scene never freezes. Star twinkle is already running from task 2.

**Files:**
- Modify: `src/components/MoonlitScene.tsx`

- [ ] **Step 4.1: Add per-layer drift parameters and apply them in the rAF loop**

In `src/components/MoonlitScene.tsx`, modify the layers array and `tick` function inside the existing `useEffect`:

```tsx
const layers: Array<{
  ref: React.RefObject<HTMLElement | SVGSVGElement | null>
  shift: number
  driftAmp: number
  driftSpeed: number
  driftPhase: number
}> = [
  { ref: skyRef as React.RefObject<HTMLElement | null>, shift: 0, driftAmp: 0, driftSpeed: 0, driftPhase: 0 },
  { ref: starsRef, shift: 6, driftAmp: 1, driftSpeed: 0.0003, driftPhase: 0 },
  { ref: moonRef, shift: 14, driftAmp: 1.5, driftSpeed: 0.0005, driftPhase: 1.3 },
  { ref: waterRef, shift: 22, driftAmp: 2, driftSpeed: 0.0007, driftPhase: 2.1 },
  { ref: reedsRef, shift: 36, driftAmp: 2, driftSpeed: 0.0009, driftPhase: 3.4 },
]

function tick(t: number) {
  currentX += (targetX - currentX) * 0.08
  currentY += (targetY - currentY) * 0.08

  for (const { ref, shift, driftAmp, driftSpeed, driftPhase } of layers) {
    const el = ref.current
    if (!el) continue
    const drift = driftAmp === 0 ? 0 : Math.sin(t * driftSpeed + driftPhase) * driftAmp
    const tx = currentX * shift + drift
    const ty = currentY * shift * 0.5
    if (ref === moonRef) {
      el.style.transform = `${moonBaseTransform} translate3d(${tx}px, ${ty}px, 0)`
    } else {
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
    }
  }
  rafId = requestAnimationFrame(tick)
}
```

(Note: `tick` now takes `t: number` — `requestAnimationFrame`'s callback receives the high-resolution timestamp, so this works automatically.)

- [ ] **Step 4.2: Lint and visual verify**

```bash
docker compose exec app npm run lint
docker compose restart app
```

Park the mouse in one spot. Expected: the moon, water stripe, and reeds all show a barely-perceptible horizontal drift. Stars have minimal drift but are also twinkling (CSS keyframe).

- [ ] **Step 4.3: Commit**

```bash
git add src/components/MoonlitScene.tsx
git commit -m "feat(moonlit): per-layer ambient sine drift"
```

---

## Task 5: Add reduced-motion, touch, and animations-disabled guards

**Goal:** Respect `prefers-reduced-motion`, disable cursor parallax on coarse pointers, and respect the existing in-app `animationsEnabled` toggle. When any of these signal "no motion," the scene renders fully static; when only "no cursor" is signaled, ambient drift continues.

**Files:**
- Modify: `src/components/MoonlitScene.tsx`

- [ ] **Step 5.1: Read the existing animationsEnabled signal**

`useDeskSettings` already provides `animationsEnabled` (used in `Background.tsx` line 775). Wire the same store into `MoonlitScene`. At the top of the component:

```tsx
import { useDeskSettings } from '@/store/deskSettings'
```

And inside the component (before the `useEffect`):

```tsx
const animationsEnabled = useDeskSettings((s) => s.animationsEnabled)
```

- [ ] **Step 5.2: Detect reduced motion and pointer:fine via state**

Add `useState` to the existing `react` import at the top of `MoonlitScene.tsx`, then inside the component (above the parallax `useEffect`) add:

```tsx
const [reduceMotion, setReduceMotion] = useState(false)
const [pointerFine, setPointerFine] = useState(true)

useEffect(() => {
  setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  setPointerFine(window.matchMedia('(pointer: fine)').matches)
}, [])
```

Using `useState` (not `useRef`) means the parallax effect re-runs when these values flip, so the gating below is always applied with current values — no effect-ordering race.

- [ ] **Step 5.3: Gate the rAF loop and mousemove listener**

Replace the parallax `useEffect` with the version below. This shows the **complete effect body** including the unchanged layers array and onMove handler from earlier tasks — overwrite the whole effect:

```tsx
useEffect(() => {
  // Hard-stop: no motion of any kind.
  const noMotion = !animationsEnabled || reduceMotion
  if (noMotion) return

  const cursorEnabled = pointerFine

  const layers: Array<{
    ref: React.RefObject<HTMLElement | SVGSVGElement | null>
    shift: number
    driftAmp: number
    driftSpeed: number
    driftPhase: number
  }> = [
    { ref: skyRef as React.RefObject<HTMLElement | null>, shift: 0, driftAmp: 0, driftSpeed: 0, driftPhase: 0 },
    { ref: starsRef, shift: 6, driftAmp: 1, driftSpeed: 0.0003, driftPhase: 0 },
    { ref: moonRef, shift: 14, driftAmp: 1.5, driftSpeed: 0.0005, driftPhase: 1.3 },
    { ref: waterRef, shift: 22, driftAmp: 2, driftSpeed: 0.0007, driftPhase: 2.1 },
    { ref: reedsRef, shift: 36, driftAmp: 2, driftSpeed: 0.0009, driftPhase: 3.4 },
  ]

  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let rafId = 0
  const moonBaseTransform = 'translateX(-50%)'

  function onMove(e: MouseEvent) {
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    targetX = (e.clientX / w) * 2 - 1
    targetY = (e.clientY / h) * 2 - 1
  }

  function tick(t: number) {
    if (cursorEnabled) {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
    } else {
      // Ease toward 0 so any prior offset decays smoothly.
      currentX += (0 - currentX) * 0.08
      currentY += (0 - currentY) * 0.08
    }

    for (const { ref, shift, driftAmp, driftSpeed, driftPhase } of layers) {
      const el = ref.current
      if (!el) continue
      const drift = driftAmp === 0 ? 0 : Math.sin(t * driftSpeed + driftPhase) * driftAmp
      const tx = currentX * shift + drift
      const ty = currentY * shift * 0.5
      if (ref === moonRef) {
        el.style.transform = `${moonBaseTransform} translate3d(${tx}px, ${ty}px, 0)`
      } else {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  if (cursorEnabled) {
    window.addEventListener('mousemove', onMove, { passive: true })
  }
  rafId = requestAnimationFrame(tick)

  return () => {
    if (cursorEnabled) window.removeEventListener('mousemove', onMove)
    cancelAnimationFrame(rafId)
  }
}, [animationsEnabled, reduceMotion, pointerFine])
```

- [ ] **Step 5.4: Pause star twinkle when motion is off**

Modify the `<style jsx>` block to add a paused state that activates when a `data-no-motion` attribute is set on the root:

```tsx
<style jsx>{`
  .moonlit-twinkle {
    animation-name: moonlit-twinkle-kf;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    animation-direction: alternate;
  }
  .moonlit-root[data-no-motion='1'] .moonlit-twinkle {
    animation-play-state: paused;
  }
  @keyframes moonlit-twinkle-kf {
    0% { opacity: 0.2; }
    100% { opacity: 1; }
  }
`}</style>
```

And on the root `<div>`, add the data attribute (note: read from the `reduceMotion` state, not a ref):

```tsx
<div
  className="moonlit-root fixed inset-0 overflow-hidden pointer-events-none"
  aria-hidden
  data-no-motion={!animationsEnabled || reduceMotion ? '1' : '0'}
>
```

- [ ] **Step 5.5: Lint and verify each guard**

```bash
docker compose exec app npm run lint
docker compose restart app
```

Manual checks:
1. Default (animations on, fine pointer, no reduce-motion): cursor parallax + drift + twinkle all run. ✅ from earlier tasks.
2. macOS System Settings → Accessibility → Display → "Reduce motion" ON: scene is fully static. Stars don't twinkle, no drift, no parallax.
3. Open the desk settings panel and toggle off animations: scene is fully static.
4. Use browser devtools "Toggle device toolbar" → simulate a touch device: cursor parallax disabled, but ambient drift + twinkle continue.

- [ ] **Step 5.6: Commit**

```bash
git add src/components/MoonlitScene.tsx
git commit -m "feat(moonlit): respect reduced-motion, touch devices, and animations toggle"
```

---

## Task 6: Hook MoonlitScene into Background.tsx and remove debug branch

**Goal:** Replace the debug branch (and any remaining temp gating) with a clean early-return in `Background.tsx`. The Moonlit theme now activates the scene through normal theme-switching, and no other theme is touched.

**Files:**
- Modify: `src/components/Background.tsx`

- [ ] **Step 6.1: Remove the temporary debug branch (if present)**

If you committed the `NEXT_PUBLIC_MOONLIT_DEBUG` branch by accident, remove it now. Otherwise it lives only in your local worktree — discard those edits before continuing:

```bash
git diff src/components/Background.tsx
```

If unintended changes are present, restore the file:

```bash
git restore src/components/Background.tsx
```

- [ ] **Step 6.2: Add the import**

In `src/components/Background.tsx`, add at the top of the file (with the other component imports):

```tsx
import MoonlitScene from './MoonlitScene'
```

- [ ] **Step 6.3: Add the early return**

In `src/components/Background.tsx`, locate the `BackgroundComponent` function (around line 771). Find the line `if (!mounted) return null` (around line 800). Add the moonlit early-return *immediately after* that line, before any of the `isMistyMountains` / `isCherryBlossom` / etc. flags are computed:

```tsx
  if (!mounted) return null

  // Moonlit theme owns its own full background scene — bypass all
  // tsParticles + theme-specific decoration branches below.
  if (theme.particles === 'moonlit') return <MoonlitScene />

  const isMistyMountains = theme.particles === 'mist'
  // ... rest unchanged ...
```

This single branch is the only edit to `Background.tsx`. Every other code path is byte-identical.

- [ ] **Step 6.4: Lint, build, and verify isolation**

```bash
docker compose exec app npm run lint
docker compose exec app npm run build
docker compose restart app
```

Verification matrix — open the app and switch through each theme using the bottom-right switcher:

| Theme         | Expected                                                                  |
|---------------|---------------------------------------------------------------------------|
| rivendell     | Forest gradient + fireflies + decorative vines (UNCHANGED from before)    |
| hearth        | Firelight gradient + embers + warm glow (UNCHANGED)                       |
| rose          | Blush gradient + sakura petals (UNCHANGED)                                |
| sage          | Cream gradient + leaves (UNCHANGED)                                       |
| ocean         | Misty dawn + foam + clouds + mountains (UNCHANGED)                        |
| postal        | Parchment + dust motes (UNCHANGED)                                        |
| linen         | Linen gradient + dust motes (UNCHANGED)                                   |
| **moonlit**   | **Navy sky + stars + moon + water + reeds + cursor parallax + drift**     |

If any other theme's appearance changes vs. before this branch, the early return is in the wrong place — move it earlier, never later.

- [ ] **Step 6.5: Remove the debug env var if present**

```bash
grep -n "NEXT_PUBLIC_MOONLIT_DEBUG" .env .env.local 2>/dev/null
```

If present, remove the line. The debug gate is no longer needed.

- [ ] **Step 6.6: Commit**

```bash
git add src/components/Background.tsx
git commit -m "feat(background): mount MoonlitScene for moonlit theme via early return"
```

---

## Task 7: Final verification and polish

**Goal:** Confirm the full feature works, every other theme is unchanged, and the build is clean.

- [ ] **Step 7.1: Full lint + build**

```bash
docker compose exec app npm run lint
docker compose exec app npm run build
```

Expected: both pass with zero errors.

- [ ] **Step 7.2: Smoke-test the journal flow**

```bash
docker compose restart app
```

In the browser:
1. Switch to Moonlit. Confirm scene renders.
2. Open a journal entry — confirm the cream paper spread is readable against the navy background.
3. Type into the entry — autosave should still work normally (Moonlit changes nothing about the editor).
4. Open the letter sidebar. Confirm UI legibility.
5. Switch back to another theme. Confirm scene tears down (no orphaned listeners — check devtools Performance tab if suspicious; you should see CPU drop to idle).
6. Switch to Moonlit again. Confirm scene re-mounts cleanly.

- [ ] **Step 7.3: Reduced-motion + touch sanity**

- macOS: System Settings → Accessibility → Display → Reduce motion → ON. Refresh. Scene is fully static. Toggle OFF.
- Devtools → Toggle device toolbar → simulate iPhone. Scene shows drift + twinkle but no cursor parallax. Switch back to desktop.

- [ ] **Step 7.4: Confirm no behavior change in other themes**

Run a final visual sweep across rivendell / hearth / rose / sage / ocean / postal / linen. None should look or behave any differently than they did before this branch.

- [ ] **Step 7.5: Performance sanity (optional)**

Open devtools → Performance → record 5 seconds while on Moonlit with cursor in motion. Expected: 60 FPS sustained, ~1ms scripting per frame, GPU-composited transforms (no layout/paint columns lighting up). If FPS drops on a low-end machine, lower `STAR_COUNT` from 80 to 40 in `MoonlitScene.tsx` and re-test.

- [ ] **Step 7.6: Final commit (only if anything was tweaked)**

If step 7.5 led to a tuning change, commit it:

```bash
git add src/components/MoonlitScene.tsx
git commit -m "perf(moonlit): tune star count for low-end devices"
```

Otherwise nothing to commit — this task is verification only.

---

## Spec coverage check

| Spec section / requirement                                     | Implemented in              |
|----------------------------------------------------------------|-----------------------------|
| 5-layer scene composition                                      | Task 2                      |
| Per-layer mouse shift values (0/6/14/22/36 px)                 | Task 3 + Task 4             |
| Y-axis dampened to 50%                                         | Task 3 + Task 4             |
| Soft easing (0.08 lerp)                                        | Task 3                      |
| Ambient sine drift                                             | Task 4                      |
| Star twinkle (CSS keyframes)                                   | Task 2 (plus pause in 5)    |
| `moonlit` palette and Theme entry                              | Task 1.1 – 1.3              |
| `particles: 'moonlit'` sentinel                                | Task 1.1 / 1.2              |
| `MoonlitScene` self-contained component                        | Task 2                      |
| Single-line early return in `Background.tsx`                   | Task 6                      |
| ThemeSwitcher entry                                             | Task 1.5                    |
| All `Record<ThemeName, ...>` exhaustiveness sites              | Task 1.4 – 1.10             |
| Isolation guarantees (cleanup, no globals)                     | Task 3 (cleanup), Task 5    |
| `prefers-reduced-motion` freeze                                | Task 5                      |
| Touch / coarse pointer disables cursor parallax only           | Task 5                      |
| `animationsEnabled` toggle respected                           | Task 5                      |
| Other themes unchanged (verification matrix)                   | Task 6 + Task 7             |
| Performance budget (single rAF, GPU composited)                | Task 3 / Task 7.5           |

No gaps.
