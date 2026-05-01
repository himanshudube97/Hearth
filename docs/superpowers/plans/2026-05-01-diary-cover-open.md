# Diary Cover Open Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the diary as **closed** when the user lands on `/write` for the first time in a session; let a trackpad scroll progressively lift the cover open, revealing the existing two-page `BookSpread`. Closing is via a top-right × button.

**Architecture:** A new `DiaryCover` component renders a 650×820 cover element hinged on its left edge. A new `useDiaryCover()` hook owns a single `progress: MotionValue` (0=closed, 1=open) plus a two-state machine `coverState: 'closed' | 'open'`. Cover rotation, wrapper translateX (re-centers the scene as the spread fades in), spread opacity, and cover drop-shadow all derive from `progress` via `useTransform`. Wheel events drive `progress`; an idle-snap timer commits to either fully open or back to closed.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion v12, TypeScript. Existing infra: `useThemeStore` (Zustand), `getGlassDiaryColors()` for theme-derived colors, `ThemeOrnament` SVG component, `useLayoutMode()` for mobile detection. **No test framework** — convention in the desk components is manual browser verification via Docker dev environment.

**Spec:** [docs/superpowers/specs/2026-05-01-diary-cover-open-design.md](docs/superpowers/specs/2026-05-01-diary-cover-open-design.md)

---

## Dev workflow reminders

This project runs in Docker. After every code change:

```bash
docker compose restart app
```

Wait ~5 seconds, then verify in browser: `http://localhost:3111/write`. To check for compile errors:

```bash
docker compose logs --tail=80 app
```

Lint: `npm run lint` (run on host, not in container — node_modules differ).

To reset session state during testing (so you see the closed cover again):

```js
// In browser DevTools console:
sessionStorage.removeItem('hearth-diary-cover-opened')
location.reload()
```

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/hooks/useDiaryCover.ts` | NEW | Owns `coverState`, `progress` MotionValue, derived motion values (`wrapperX`, `spreadOpacity`, `coverOpacity`, `coverRotateY`, `coverShadowBlur`), wheel handler, idle-snap, sessionStorage I/O, `closeCover()`. |
| `src/components/desk/DiaryCover.tsx` | NEW | 650×820 cover element. Receives `progress`, `rotateY`, `coverOpacity`, `shadowBlur` motion values. Renders theme-driven background, inset border, sheen gradient, spine highlight, corner accents, centered `ThemeOrnament`, optional bobbing animation, optional hint text. |
| `src/components/desk/DeskScene.tsx` | MODIFY | Wire `useDiaryCover()`. Wrap existing book block in a `motion.div` with `style={{ x: wrapperX, opacity: spreadOpacity }}`. Mount `<DiaryCover ... />` overlay. Mount full-viewport wheel-capture div when `coverState === 'closed'`. Mount close button when `coverState === 'open'`. Mobile path untouched. |

`BookSpread.tsx`, `MobileJournalEntry.tsx`, `lib/themes.ts`, and `react-pageflip` integration are NOT modified.

---

### Task 1: Create `useDiaryCover` hook scaffold (state + sessionStorage)

Build the state machine and persistence first, with no wheel input or derived motion values yet. We'll verify by adding a temporary debug toggle in Task 3.

**Files:**
- Create: `src/hooks/useDiaryCover.ts`

- [ ] **Step 1: Create the hook file with state machine + sessionStorage**

Create `src/hooks/useDiaryCover.ts`:

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

const STORAGE_KEY = 'hearth-diary-cover-opened'

export type CoverState = 'closed' | 'open'

export interface UseDiaryCoverResult {
  coverState: CoverState
  progress: MotionValue<number>
  closeCover: () => void
  /** Internal: forces coverState to 'open' once the snap completes. */
  markOpen: () => void
}

export function useDiaryCover(): UseDiaryCoverResult {
  // Always start 'closed' on first render so SSR + initial client render match.
  // The real value is hydrated from sessionStorage in the effect below.
  const [coverState, setCoverState] = useState<CoverState>('closed')
  const progress = useMotionValue(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const wasOpened = window.sessionStorage.getItem(STORAGE_KEY) === 'true'
    if (wasOpened) {
      progress.set(1)
      setCoverState('open')
    }
  }, [progress])

  const markOpen = useCallback(() => {
    setCoverState('open')
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  const closeCover = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
    progress.set(0)
    setCoverState('closed')
  }, [progress])

  return { coverState, progress, closeCover, markOpen }
}
```

- [ ] **Step 2: Verify the hook compiles**

Run: `docker compose logs --tail=40 app` after saving (Next.js auto-recompiles).
Expected: no TypeScript errors mentioning `useDiaryCover.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDiaryCover.ts
git commit -m "feat(desk): add useDiaryCover hook scaffold

State machine + sessionStorage persistence for the closed-cover
opening animation. No wheel input or derived motion values yet."
```

---

### Task 2: Create minimal `DiaryCover` component (just a colored rectangle)

A barebones cover with the right size, position, and theme-derived background — enough to verify it lands at the screen center.

**Files:**
- Create: `src/components/desk/DiaryCover.tsx`

- [ ] **Step 1: Create the cover component**

Create `src/components/desk/DiaryCover.tsx`:

```tsx
'use client'

import React from 'react'
import { motion, type MotionValue } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'

interface DiaryCoverProps {
  /** 0 (closed) → 1 (open). Drives all internal transforms. */
  progress: MotionValue<number>
}

const COVER_WIDTH = 650
const COVER_HEIGHT = 820

export default function DiaryCover({ progress: _progress }: DiaryCoverProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  return (
    <motion.div
      style={{
        position: 'absolute',
        // Anchor at the wrapper's horizontal center, extending right.
        // The wrapper translateX is what makes this appear centered on screen
        // when closed (see useDiaryCover wrapperX transform in Task 4).
        left: '50%',
        top: '50%',
        marginTop: -COVER_HEIGHT / 2,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        background: colors.cover,
        border: `1px solid ${colors.coverBorder}`,
        borderRadius: 4,
        // Hinge at the left edge (= the spine when open).
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: 40, // above the BookSpread (zIndex 30 in DeskScene)
      }}
    />
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `docker compose logs --tail=40 app`
Expected: no TypeScript errors. The component is unused so far, so it won't render yet.

- [ ] **Step 3: Commit**

```bash
git add src/components/desk/DiaryCover.tsx
git commit -m "feat(desk): add minimal DiaryCover component

650x820 cover element using theme-derived cover/coverBorder colors
from getGlassDiaryColors, hinged at left edge. No decorations or
animations yet."
```

---

### Task 3: Wire `DiaryCover` into `DeskScene` at static progress=0

Mount the cover and verify the closed-state visual: cover at screen center, BookSpread hidden behind it.

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`

- [ ] **Step 1: Import the hook and component**

In [src/components/desk/DeskScene.tsx](src/components/desk/DeskScene.tsx), add to the imports at the top:

```ts
import DiaryCover from './DiaryCover'
import { useDiaryCover } from '@/hooks/useDiaryCover'
```

- [ ] **Step 2: Wire the hook into the component**

In `DeskScene()`, add immediately after the existing `setScaleForTablet` state declaration (around line 27):

```ts
const { coverState, progress, closeCover: _closeCover, markOpen: _markOpen } = useDiaryCover()
```

The `_` prefixes keep TS happy until later tasks consume them.

- [ ] **Step 3: Wrap the book block with a motion wrapper and add the cover**

Find the existing `<motion.div className="absolute z-30" ...>` block at [DeskScene.tsx:110-122](src/components/desk/DeskScene.tsx#L110-L122) (the one wrapping `<BookSpread />`). Replace just that block with:

```tsx
<motion.div
  className="absolute z-30"
  style={{
    top: 'max(50%, 510px)',
    left: '50%',
    transform: layoutMode === 'tablet'
      ? `translate(-50%, -50%) scale(${scaleForTablet})`
      : 'translate(-50%, -50%)',
    transformOrigin: 'center center',
  }}
>
  {/* Inner motion wrapper — translateX shifts the scene as the cover opens
      so the closed book appears at screen center. Static at 0 for now;
      Task 4 wires it up to progress. */}
  <motion.div
    style={{
      position: 'relative',
      // x: 0  ← becomes wrapperX motion value in Task 4
    }}
  >
    {/* Hide the spread when the cover is closed; Task 4 makes this animated. */}
    <motion.div style={{ opacity: coverState === 'open' ? 1 : 0 }}>
      <BookSpread />
    </motion.div>

    {coverState === 'closed' && <DiaryCover progress={progress} />}
  </motion.div>
</motion.div>
```

- [ ] **Step 4: Verify in browser**

```bash
docker compose restart app
```

Open `http://localhost:3111/write`. In DevTools console, first ensure no stale flag:
```js
sessionStorage.removeItem('hearth-diary-cover-opened'); location.reload()
```

Expected:
- A solid theme-colored rectangle (~650×820) appears, anchored with its left edge at the screen center, extending right.
- The BookSpread is invisible (opacity 0 from the wrapper).
- The cover does NOT appear visually centered yet — it sits to the right of center. That's expected; Task 4 introduces the wrapper translateX that shifts it left to land at screen center.

- [ ] **Step 5: Commit**

```bash
git add src/components/desk/DeskScene.tsx
git commit -m "feat(desk): mount DiaryCover overlay in DeskScene

Wires useDiaryCover hook and renders DiaryCover when closed; BookSpread
is hidden behind it. Wrapper translateX and progress-driven animation
come in the next task."
```

---

### Task 4: Add derived motion values (rotateY, wrapperX, spread opacity, cover opacity, shadow)

Wire `progress` to all the visual outputs. We'll temporarily expose a debug control to verify the animation curves before adding wheel input in Task 5.

**Files:**
- Modify: `src/hooks/useDiaryCover.ts`
- Modify: `src/components/desk/DiaryCover.tsx`
- Modify: `src/components/desk/DeskScene.tsx`

- [ ] **Step 1: Add derived motion values to the hook**

In `src/hooks/useDiaryCover.ts`:

Add to imports:
```ts
import { useMotionValue, useTransform, type MotionValue } from 'framer-motion'
```

Update the `UseDiaryCoverResult` interface:
```ts
export interface UseDiaryCoverResult {
  coverState: CoverState
  progress: MotionValue<number>
  /** Negative offset that shifts the wrapper left so the closed cover
   *  lands at screen center. Eases to 0 as the spread opens up. */
  wrapperX: MotionValue<number>
  /** 0 → 1, drives the spread fade-in behind the lifting cover. */
  spreadOpacity: MotionValue<number>
  /** 1 until progress > 0.95, then linear to 0 at 1.0. */
  coverOpacity: MotionValue<number>
  /** 0° → -180° as progress goes 0 → 1. */
  coverRotateY: MotionValue<number>
  /** Drop-shadow blur radius in px; grows as the cover lifts. */
  coverShadowBlur: MotionValue<number>
  closeCover: () => void
  markOpen: () => void
}
```

In the hook body, add right after `const progress = useMotionValue(0)`:

```ts
const wrapperX = useTransform(progress, [0, 1], [-325, 0])
const spreadOpacity = useTransform(progress, [0.1, 0.7], [0, 1], { clamp: true })
const coverOpacity = useTransform(progress, [0.95, 1], [1, 0], { clamp: true })
const coverRotateY = useTransform(progress, [0, 1], [0, -180])
const coverShadowBlur = useTransform(progress, [0, 1], [16, 64])
```

Update the return statement:
```ts
return {
  coverState,
  progress,
  wrapperX,
  spreadOpacity,
  coverOpacity,
  coverRotateY,
  coverShadowBlur,
  closeCover,
  markOpen,
}
```

- [ ] **Step 2: Update `DiaryCover` to consume the derived values**

In `src/components/desk/DiaryCover.tsx`:

Update the props interface and usage:

```tsx
interface DiaryCoverProps {
  rotateY: MotionValue<number>
  opacity: MotionValue<number>
  shadowBlur: MotionValue<number>
}

export default function DiaryCover({ rotateY, opacity, shadowBlur }: DiaryCoverProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  // Compose the box-shadow CSS string from the motion blur value.
  // useTransform on a string output keeps it reactive on the GPU path.
  const boxShadow = useTransform(
    shadowBlur,
    (b) => `0 ${Math.round(b * 0.5)}px ${Math.round(b)}px rgba(0,0,0,0.45)`
  )
```

Add `useTransform` to the framer-motion import line at the top:
```tsx
import { motion, useTransform, type MotionValue } from 'framer-motion'
```

Replace the rendered `motion.div` style block with:

```tsx
return (
  <motion.div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginTop: -COVER_HEIGHT / 2,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      background: colors.cover,
      border: `1px solid ${colors.coverBorder}`,
      borderRadius: 4,
      transformOrigin: 'left center',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
      zIndex: 40,
      rotateY,
      opacity,
      boxShadow,
    }}
  />
)
```

- [ ] **Step 3: Update `DeskScene` to pass the new motion values + wire wrapperX**

In `src/components/desk/DeskScene.tsx`:

Update the hook destructure:
```ts
const {
  coverState,
  progress: _progress,
  wrapperX,
  spreadOpacity,
  coverOpacity,
  coverRotateY,
  coverShadowBlur,
  closeCover: _closeCover,
  markOpen: _markOpen,
} = useDiaryCover()
```

Update the inner motion wrapper to use `x: wrapperX`:

```tsx
<motion.div
  style={{
    position: 'relative',
    x: wrapperX,
  }}
>
  <motion.div style={{ opacity: spreadOpacity }}>
    <BookSpread />
  </motion.div>

  {coverState === 'closed' && (
    <DiaryCover
      rotateY={coverRotateY}
      opacity={coverOpacity}
      shadowBlur={coverShadowBlur}
    />
  )}
</motion.div>
```

Note the prop change: `<DiaryCover>` no longer takes `progress`; it takes the derived values directly. This keeps it dumb and easier to reason about.

- [ ] **Step 4: Add a temporary debug slider to verify the animation curve**

This is throwaway — we'll remove it in Task 5. Inside `DeskScene`, just before the closing `</div>` of the outer `fixed inset-0` div, add:

```tsx
{coverState === 'closed' && (
  <input
    type="range"
    min={0}
    max={1}
    step={0.01}
    defaultValue={0}
    onChange={(e) => _progress.set(parseFloat(e.target.value))}
    style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: 400,
    }}
  />
)}
```

- [ ] **Step 5: Verify in browser**

```bash
docker compose restart app
```

Open `http://localhost:3111/write`. Reset the session flag in DevTools if needed.

Slowly drag the slider 0 → 1. Expected:
- At slider=0: cover sits at screen center (left of cover at center, extending right). BookSpread is invisible. Wrapper is shifted left by 325px.
- At slider=0.25: cover begins rotating left (negative rotateY). Spread is still ~invisible.
- At slider=0.5: cover at -90° (edge-on, very thin sliver visible). Spread at ~50% opacity. Wrapper shifted to -163px.
- At slider=0.7+: spread fully visible, cover swinging onto the left page area.
- At slider=0.95→1.0: cover fades out as it reaches -180°. At 1.0 the cover unmounts (because `coverState` is still 'closed' but visually fully transparent — note the unmount actually happens via `coverState !== 'closed'` check, which won't flip until Task 5's snap. For this debug step, just observe the fade.)
- Drop-shadow visibly grows as the cover lifts.

If anything looks wrong (e.g., cover rotates the wrong way, wrapper shifts the wrong direction): inspect the transforms in DevTools and fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDiaryCover.ts src/components/desk/DiaryCover.tsx src/components/desk/DeskScene.tsx
git commit -m "feat(desk): drive cover animation from progress motion value

All visual outputs (cover rotateY, wrapper translateX, spread opacity,
cover opacity, drop shadow) derive from a single progress motion value
via useTransform. Includes a temporary debug slider for manual
verification; removed in next task."
```

---

### Task 5: Replace debug slider with wheel handling + idle-snap

This is the gesture itself. After this task the diary opens by trackpad scroll.

**Files:**
- Modify: `src/hooks/useDiaryCover.ts`
- Modify: `src/components/desk/DeskScene.tsx`

- [ ] **Step 1: Add wheel handler + idle-snap to the hook**

In `src/hooks/useDiaryCover.ts`:

Add to imports:
```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
```

Update `UseDiaryCoverResult`:
```ts
export interface UseDiaryCoverResult {
  // ... existing fields
  /** Wheel handler. Typed as native WheelEvent because we attach via
   *  addEventListener with { passive: false } in DeskScene — React's
   *  synthetic wheel handler cannot reliably preventDefault. */
  onWheel: (e: WheelEvent) => void
}
```

Add the wheel logic. Insert this block in the hook body, just before the `return`:

```ts
const SENSITIVITY = 1 / 600
const SNAP_DELAY_MS = 150
const SNAP_THRESHOLD = 0.5

const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const isSnappingRef = useRef(false)

const scheduleSnap = useCallback(() => {
  if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
  snapTimerRef.current = setTimeout(() => {
    if (isSnappingRef.current) return
    isSnappingRef.current = true
    const current = progress.get()
    const target = current >= SNAP_THRESHOLD ? 1 : 0
    animate(progress, target, {
      type: 'spring',
      stiffness: 200,
      damping: 26,
      onComplete: () => {
        isSnappingRef.current = false
        if (target === 1) {
          markOpen()
        }
      },
    })
  }, SNAP_DELAY_MS)
}, [progress, markOpen])

const onWheel = useCallback(
  (e: WheelEvent) => {
    if (isSnappingRef.current) return // ignore wheel while snap animation is running
    e.preventDefault()
    const next = Math.max(0, Math.min(1, progress.get() + e.deltaY * SENSITIVITY))
    progress.set(next)
    scheduleSnap()
  },
  [progress, scheduleSnap]
)

// Cleanup any pending snap on unmount.
useEffect(() => {
  return () => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
  }
}, [])
```

Update the return:
```ts
return {
  coverState,
  progress,
  wrapperX,
  spreadOpacity,
  coverOpacity,
  coverRotateY,
  coverShadowBlur,
  onWheel,
  closeCover,
  markOpen,
}
```

> Note: `markOpen` is now redundant with the inline logic in `scheduleSnap`. Keep it exported for now in case something else needs it; we can remove it in a polish pass.

- [ ] **Step 2: Mount the wheel-capture div and remove the debug slider**

In `src/components/desk/DeskScene.tsx`:

Update the hook destructure to include `onWheel` and drop the leading `_` from `progress` (since we no longer need to drive it manually):

```ts
const {
  coverState,
  wrapperX,
  spreadOpacity,
  coverOpacity,
  coverRotateY,
  coverShadowBlur,
  onWheel,
  closeCover,
  markOpen: _markOpen,
} = useDiaryCover()
```

Drop the `progress` variable entirely from `DeskScene` — it now only flows through the hook.

Delete the temporary debug `<input type="range" ... />` block added in Task 4.

Add the wheel-capture div. Place it inside the outer `fixed inset-0` div, AFTER the existing vignette/desk/ambient overlays but BEFORE the centered book block. Note that `onWheel` in React is a passive listener and `preventDefault` won't actually stop scroll — so we must attach a non-passive listener via a ref:

Actually, **React's `onWheel` IS active in React 19** (passive: false by default for most events) — but Chrome and Safari treat wheel listeners as passive when added via the document/window unless explicitly `{passive: false}`. Since we attach via JSX `onWheel`, React handles it correctly for fixed-position elements. To be safe and survive future React updates, attach via `useEffect` with `addEventListener('wheel', handler, { passive: false })`. We do this in the next step.

For now, add the JSX:

```tsx
{coverState === 'closed' && (
  <div
    ref={wheelCaptureRef}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50, // above the cover's zIndex 40
      // No background — it's invisible. Just intercepts wheel events.
    }}
  />
)}
```

Insert this just before the centered book block (the outer `<motion.div className="absolute z-30">` at the top level of the `<>` fragment).

- [ ] **Step 3: Attach the wheel listener with `{ passive: false }`**

At the top of `DeskScene`, near the other `useState`/`useEffect` hooks, add:

```ts
const wheelCaptureRef = React.useRef<HTMLDivElement | null>(null)

useEffect(() => {
  const el = wheelCaptureRef.current
  if (!el || coverState !== 'closed') return
  el.addEventListener('wheel', onWheel, { passive: false })
  return () => el.removeEventListener('wheel', onWheel)
}, [coverState, onWheel])
```

This ensures `e.preventDefault()` actually works — without `{ passive: false }` the browser ignores it on wheel events.

- [ ] **Step 4: Verify in browser**

```bash
docker compose restart app
```

Open `http://localhost:3111/write`. Reset session: in DevTools, `sessionStorage.removeItem('hearth-diary-cover-opened'); location.reload()`.

Expected:
- Closed cover at center.
- Two-finger scroll up on the trackpad (or scroll wheel up): cover begins rotating, spread fading in.
- Stop scrolling halfway (progress < 0.5): after ~150ms idle, cover springs back to closed.
- Scroll past halfway (progress >= 0.5): after ~150ms idle, cover springs all the way open and unmounts. BookSpread is fully visible and centered.
- Body of the page does NOT scroll while the cover is intercepting (no rubber-banding on Mac Safari).
- DevTools: `sessionStorage.getItem('hearth-diary-cover-opened')` returns `'true'` after fully opening.
- Reload the page (without clearing sessionStorage): the cover should NOT appear; you land directly on the open spread.

If `e.preventDefault()` warnings appear in the console ("Unable to preventDefault inside passive event listener"), the `addEventListener` call in Step 3 isn't firing — verify the ref is attached and `coverState === 'closed'` when the effect runs.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDiaryCover.ts src/components/desk/DeskScene.tsx
git commit -m "feat(desk): trackpad wheel input drives diary cover open

Full-viewport wheel-capture div with non-passive listener; deltas
update progress motion value; 150ms idle-snap commits to either fully
open (>= 0.5) or back to closed. SessionStorage persists the open
state for the rest of the session."
```

---

### Task 6: Add the close button

A small × icon button at the top-right corner; visible only when the cover is open.

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`

- [ ] **Step 1: Add the close button**

In `src/components/desk/DeskScene.tsx`, add this block just before the floating dust particles div (inside the desktop branch of the layout-mode check):

```tsx
{coverState === 'open' && (
  <button
    onClick={closeCover}
    aria-label="Close diary"
    title="Close diary"
    style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 60,
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${theme.accent.warm}40`,
      color: theme.text.primary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      lineHeight: 1,
      transition: 'background 0.2s, border-color 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)'
    }}
  >
    ×
  </button>
)}
```

- [ ] **Step 2: Verify in browser**

```bash
docker compose restart app
```

Open `http://localhost:3111/write`. With the cover already open (after Task 5):

Expected:
- Small circular × button visible top-right, slightly translucent.
- Hovering darkens it slightly.
- Clicking it: cover snaps back to closed instantly (no animation), session flag is cleared, scrolling can re-open it.
- Verify: `sessionStorage.getItem('hearth-diary-cover-opened')` returns `null` after clicking close.

- [ ] **Step 3: Commit**

```bash
git add src/components/desk/DeskScene.tsx
git commit -m "feat(desk): add close-diary button to top-right of /write

Visible only when cover is open; jump-cuts back to closed state and
clears session flag. Uses theme accent.warm for the border."
```

---

### Task 7: Decorate the cover (spine, corners, sheen, ornament)

Replace the plain colored rectangle with a real-feeling diary cover.

**Files:**
- Modify: `src/components/desk/DiaryCover.tsx`

- [ ] **Step 1: Add cover decorations**

In `src/components/desk/DiaryCover.tsx`:

Add to imports:
```tsx
import ThemeOrnament from './decorations/ThemeOrnament'
```

Add `themeName` to the destructured store:
```tsx
const { theme, themeName } = useThemeStore()
```

Replace the rendered output (the single `<motion.div ... />`) with:

```tsx
return (
  <motion.div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginTop: -COVER_HEIGHT / 2,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      background: colors.cover,
      border: `1px solid ${colors.coverBorder}`,
      borderRadius: 4,
      transformOrigin: 'left center',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
      zIndex: 40,
      rotateY,
      opacity,
      boxShadow,
      overflow: 'hidden',
    }}
  >
    {/* Inner inset border for depth */}
    <div
      style={{
        position: 'absolute',
        inset: 12,
        border: `1px solid ${colors.coverBorder}`,
        borderRadius: 2,
        pointerEvents: 'none',
      }}
    />

    {/* Sheen — diagonal highlight to suggest leather */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg,
          rgba(255,255,255,0.06) 0%,
          rgba(255,255,255,0) 30%,
          rgba(0,0,0,0) 70%,
          rgba(0,0,0,0.12) 100%)`,
        pointerEvents: 'none',
      }}
    />

    {/* Subtle grain via SVG noise */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.06,
        mixBlendMode: 'overlay',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: '200px 200px',
        pointerEvents: 'none',
      }}
    />

    {/* Spine highlight on the left edge */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: `linear-gradient(90deg, ${theme.accent.warm}30, transparent)`,
        pointerEvents: 'none',
      }}
    />

    {/* Four corner accents */}
    {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
      const size = 28
      const inset = 14
      const positionMap = {
        tl: { top: inset, left: inset },
        tr: { top: inset, right: inset },
        bl: { bottom: inset, left: inset },
        br: { bottom: inset, right: inset },
      }
      const transformMap = {
        tl: 'rotate(0deg)',
        tr: 'rotate(90deg)',
        bl: 'rotate(-90deg)',
        br: 'rotate(180deg)',
      }
      return (
        <div
          key={corner}
          style={{
            position: 'absolute',
            ...positionMap[corner],
            width: size,
            height: size,
            transform: transformMap[corner],
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 1,
              background: theme.accent.warm,
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: 1,
              background: theme.accent.warm,
              opacity: 0.55,
            }}
          />
        </div>
      )
    })}

    {/* Center ornament */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 80,
        height: 80,
        color: theme.accent.warm,
        opacity: 0.85,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 32 32" width="100%" height="100%">
        <ThemeOrnament themeName={themeName} color={theme.accent.warm} />
      </svg>
    </div>
  </motion.div>
)
```

Note: This block assumes `<ThemeOrnament>` accepts `themeName` and `color`. Confirm the API in [src/components/desk/decorations/ThemeOrnament.tsx](src/components/desk/decorations/ThemeOrnament.tsx) — if the prop is named differently, adjust accordingly.

- [ ] **Step 2: Verify in browser**

```bash
docker compose restart app
```

Open `http://localhost:3111/write` (reset session if needed).

Expected:
- Closed cover now has visible inset border, subtle sheen highlight in the top-left, faint grain texture, four small corner accents in `accent.warm` color, a centered ornament matching the current theme.
- Spine highlight is a very thin warm gradient along the left edge.
- Try changing themes via the theme switcher (existing UI in `DeskSettingsPanel` or wherever it lives) — the cover colors update live.
- All decorations rotate with the cover during opening (they're inside the rotating element).

- [ ] **Step 3: Commit**

```bash
git add src/components/desk/DiaryCover.tsx
git commit -m "feat(desk): decorate diary cover with sheen, grain, corners, ornament

Adds inset border, diagonal sheen gradient, SVG-noise grain, spine
highlight along the left edge, four corner accents in accent.warm,
and a centered ThemeOrnament. All decorations are theme-reactive."
```

---

### Task 8: Add the bobbing animation and "Scroll to open" hint

The closed cover should gently bob to invite interaction; a hint text fades in below.

**Files:**
- Modify: `src/components/desk/DiaryCover.tsx`
- Modify: `src/components/desk/DeskScene.tsx`

- [ ] **Step 1: Add the idle bobbing animation**

In `src/components/desk/DiaryCover.tsx`, modify the props interface and component to accept an `isIdle` flag:

```tsx
interface DiaryCoverProps {
  rotateY: MotionValue<number>
  opacity: MotionValue<number>
  shadowBlur: MotionValue<number>
  /** When true, the cover gently bobs to suggest interactivity.
   *  Should be true while the user hasn't started scrolling. */
  isIdle: boolean
}

export default function DiaryCover({ rotateY, opacity, shadowBlur, isIdle }: DiaryCoverProps) {
```

Wrap the existing rotated `motion.div` with an outer bobbing wrapper. The complete final return statement should look like this (the full rendered JSX, not a fragment to splice in — replace the entire `return (...)` block from Task 7):

```tsx
return (
  <motion.div
    animate={isIdle ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
    transition={isIdle ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginTop: -COVER_HEIGHT / 2,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      transformOrigin: 'left center',
      zIndex: 40,
    }}
  >
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        background: colors.cover,
        border: `1px solid ${colors.coverBorder}`,
        borderRadius: 4,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        rotateY,
        opacity,
        boxShadow,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Inset border for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 12,
          border: `1px solid ${colors.coverBorder}`,
          borderRadius: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Diagonal sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0) 30%,
            rgba(0,0,0,0) 70%,
            rgba(0,0,0,0.12) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* SVG-noise grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: '200px 200px',
          pointerEvents: 'none',
        }}
      />

      {/* Spine highlight */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: `linear-gradient(90deg, ${theme.accent.warm}30, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Four corner accents */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
        const size = 28
        const inset = 14
        const positionMap = {
          tl: { top: inset, left: inset },
          tr: { top: inset, right: inset },
          bl: { bottom: inset, left: inset },
          br: { bottom: inset, right: inset },
        }
        const transformMap = {
          tl: 'rotate(0deg)',
          tr: 'rotate(90deg)',
          bl: 'rotate(-90deg)',
          br: 'rotate(180deg)',
        }
        return (
          <div
            key={corner}
            style={{
              position: 'absolute',
              ...positionMap[corner],
              width: size,
              height: size,
              transform: transformMap[corner],
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 1,
                background: theme.accent.warm,
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: 1,
                background: theme.accent.warm,
                opacity: 0.55,
              }}
            />
          </div>
        )
      })}

      {/* Center ornament */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80,
          height: 80,
          color: theme.accent.warm,
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <ThemeOrnament themeName={themeName} color={theme.accent.warm} />
        </svg>
      </div>
    </motion.div>
  </motion.div>
)
```

> Implementation detail: the outer wrapper handles the bob (gentle ±1.5° rotation), the inner element handles the cover open (rotateY around left edge). Both pivot at left-center, so the bobbing reads as a closed book rocking gently on a desk.

- [ ] **Step 2: Compute `isIdle` in `DeskScene` and pass it**

Idle = cover is closed AND user hasn't started scrolling yet (progress is still ~0). Easiest signal: `coverState === 'closed' && progress.get() < 0.02` — but `.get()` doesn't trigger re-renders. Use Framer's `useMotionValueEvent` to set a React state when progress crosses the threshold.

In `src/hooks/useDiaryCover.ts`, update the framer-motion import line to include `useMotionValueEvent`. The full final import line should be:

```ts
import { animate, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion'
```

In the hook body, after `const progress = useMotionValue(0)`:

```ts
const [isIdle, setIsIdle] = useState(true)
useMotionValueEvent(progress, 'change', (v) => {
  setIsIdle(v < 0.02)
})
```

Add `isIdle` to the result interface and the return:

```ts
export interface UseDiaryCoverResult {
  // ... existing fields
  isIdle: boolean
}
```

```ts
return {
  // ... existing fields
  isIdle,
}
```

In `DeskScene.tsx`, destructure and pass:

```ts
const {
  coverState,
  wrapperX,
  spreadOpacity,
  coverOpacity,
  coverRotateY,
  coverShadowBlur,
  isIdle,
  onWheel,
  closeCover,
  markOpen: _markOpen,
} = useDiaryCover()
```

```tsx
<DiaryCover
  rotateY={coverRotateY}
  opacity={coverOpacity}
  shadowBlur={coverShadowBlur}
  isIdle={isIdle}
/>
```

- [ ] **Step 3: Add the hint text below the cover**

In `DeskScene.tsx`, just after the centered book block (still inside the desktop branch), add:

```tsx
{coverState === 'closed' && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: isIdle ? 0.55 : 0 }}
    transition={{ duration: 1.2, delay: isIdle ? 1 : 0 }}
    style={{
      position: 'fixed',
      bottom: '12%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 45,
      pointerEvents: 'none',
      color: theme.text.primary,
      fontSize: 13,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 300,
    }}
  >
    Scroll to open
  </motion.div>
)}
```

- [ ] **Step 4: Verify in browser**

```bash
docker compose restart app
```

Reset session, open `/write`.

Expected:
- After ~1s, hint "SCROLL TO OPEN" fades in below the cover.
- Cover gently rocks ±1.5° on a 4s loop.
- Start scrolling: hint fades out, bobbing stops smoothly, cover begins rotating open.
- After cover snaps back to closed (mid-scroll release): bobbing resumes, hint reappears.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDiaryCover.ts src/components/desk/DiaryCover.tsx src/components/desk/DeskScene.tsx
git commit -m "feat(desk): add idle bobbing animation and scroll hint

Closed cover gently rocks ±1.5° to invite interaction; a 'Scroll to
open' hint fades in below after 1s. Both stop the moment the user
starts scrolling and resume if the snap returns the cover to closed."
```

---

### Task 9: Cross-theme + mobile sanity check

Final verification pass. No code expected unless a regression turns up.

**Files:**
- None (verification only). Any fixes go into the appropriate file from earlier tasks.

- [ ] **Step 1: Test all themes**

For each of the 7 themes (rivendell, hearth, rose, sage, ocean, postal, linen):

1. Reset session: `sessionStorage.removeItem('hearth-diary-cover-opened'); location.reload()`
2. Switch to the theme via the existing theme switcher.
3. Verify cover background, border, corners, ornament, and spine highlight all read correctly. The cover should look "right" in the theme — never washed out or invisible.
4. Open the diary fully and verify the spread renders normally (no regression to existing functionality).
5. Click the close button and re-open.

If any theme has a cover that looks wrong (e.g., near-black on a dark theme): adjust `getGlassDiaryColors` in [src/lib/glassDiaryColors.ts:89](src/lib/glassDiaryColors.ts#L89) to fall back differently, OR add an explicit `cover` field to that theme in [src/lib/themes.ts](src/lib/themes.ts). Prefer the latter — single-theme tweak rather than changing the shared formula.

- [ ] **Step 2: Mobile sanity check**

Open `http://localhost:3111/write` in a phone-width viewport (DevTools device toolbar, e.g. iPhone 14 Pro).

Expected:
- The existing `MobileJournalEntry` flow renders. NO cover is shown.
- No console errors related to the cover hook.

The hook still runs on mobile (it's at the top of `DeskScene`), but its outputs are unused on the mobile branch. SessionStorage write may still happen if mobile somehow scrolls — but mobile never reaches the cover-rendering code, so this is fine. If you want to be strict, gate the wheel listener effect on `layoutMode !== 'mobile'`. Optional polish.

- [ ] **Step 3: Tablet sanity check**

DevTools device toolbar → tablet width (e.g. iPad).

Expected:
- Cover renders, scaled along with the book per the existing `scaleForTablet` logic.
- Opens normally.
- Note: the tablet scale is applied to the OUTER `motion.div` containing the wrapper, so the wrapper translateX (in book coordinates, -325px) is scaled as well. Visually-centered closed cover should still land at screen center.

- [ ] **Step 4: Lint + build**

```bash
npm run lint
docker compose exec app npm run build
```

Expected: both pass with no errors related to the new files.

- [ ] **Step 5: Commit any fixes**

```bash
# Only if Steps 1-4 surfaced issues:
git add <fixed files>
git commit -m "fix(desk): <specific issue found in cross-theme/mobile review>"
```

If no fixes were needed, no commit for this task. The plan is complete.

---

## Summary of files

| File | Action |
|---|---|
| `src/hooks/useDiaryCover.ts` | Created (Tasks 1, 4, 5, 8) |
| `src/components/desk/DiaryCover.tsx` | Created (Tasks 2, 4, 7, 8) |
| `src/components/desk/DeskScene.tsx` | Modified (Tasks 3, 4, 5, 6, 8) |

Total: 2 new files (~200 lines combined), 1 modified file (~+50 lines).
