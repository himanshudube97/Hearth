# Hearth Fireplace Memory View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Hearth theme its own Memory view — a cottage-style scene with an arched fireplace, a real Lottie flame inside, and envelope-diamond letters tacked to the brick wall as the clickable memories.

**Architecture:** Add a dark-side dispatcher (`FirelightRenderer`) that mirrors the existing `GardenRenderer`. It switches by `theme.ambience`: `firelight` → new `HearthScene`, default → existing `ConstellationRenderer` (Rivendell unchanged). The new scene composes a static SVG cottage frame with a Lottie fire (with static SVG fallback) and a deterministic 7-slot wall of envelope letters that open the existing `MemoryModal`.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, Framer Motion (already used everywhere), `@lottiefiles/dotlottie-react` (new dep) for the flame. SVG for the cottage and letters. Docker Compose for dev.

**Verification model:** This codebase has no test runner. After every component task: `npm run lint && npm run build` to catch type/lint errors. Visual smoke happens in Docker once the scene is wired into the page (Task 11+). Spec is at [docs/superpowers/specs/2026-05-01-hearth-fireplace-memory-design.md](../specs/2026-05-01-hearth-fireplace-memory-design.md).

**Reference patterns:** This plan mirrors how the rose garden was built (`src/components/constellation/garden/rose/` + `garden/scenes/RoseGardenScene.tsx`). When a step references "the rose pattern," look there.

---

## Task 1: Install Lottie player package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install via Docker exec (matches CLAUDE.md guidance)**

```bash
docker compose exec app npm install @lottiefiles/dotlottie-react
```

Expected: package added to `dependencies`, `package-lock.json` updated, no errors.

- [ ] **Step 2: Verify import resolves**

```bash
docker compose exec app node -e "console.log(require.resolve('@lottiefiles/dotlottie-react'))"
```

Expected: prints a resolved path inside `node_modules` — no module-not-found error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @lottiefiles/dotlottie-react for hearth flame"
```

---

## Task 2: Create `letterHash.ts` (deterministic per-entry placement)

**Files:**
- Create: `src/components/constellation/firelight/letterHash.ts`

- [ ] **Step 1: Create the file**

```typescript
// Mirrors src/components/constellation/garden/rose/roseHash.ts.
// Maps entry id → stable slot/tilt/glow so the same memory always
// sits in the same window when surfaced.

// Number of slots on the desktop cottage wall (must match LetterWall).
export const LETTER_SLOT_COUNT = 7

export interface LetterPlacement {
  slotIndex: number  // 0..LETTER_SLOT_COUNT-1
  tilt: number       // degrees, [-8, +8]
  glow: boolean      // ~1 in 3 letters glow
}

// FNV-1a 32-bit unsigned hash — same primitives as roseHash.ts.
function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function letterPlacementForId(id: string): LetterPlacement {
  const slotIndex = hash(id + '-slot') % LETTER_SLOT_COUNT
  const tiltSeed = hash(id + '-tilt') % 1000
  const tilt = (tiltSeed / 1000) * 16 - 8 // map 0..999 → -8..+8
  const glow = hash(id + '-glow') % 3 === 0
  return { slotIndex, tilt, glow }
}
```

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: passes (no output / exit 0). If you don't have a `tsc --noEmit` script, fall back to `docker compose exec app npm run build` — slower but catches the same errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/letterHash.ts
git commit -m "feat(hearth): add letterHash for deterministic letter placement"
```

---

## Task 3: Create `CottageFrame.tsx` (static SVG silhouette)

**Files:**
- Create: `src/components/constellation/firelight/CottageFrame.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

// Peaked-roof brick cottage with an arched fireplace opening.
// Pure presentational SVG. No props — the parent positions/sizes it.
export function CottageFrame() {
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        {/* Brick texture for the cottage walls */}
        <pattern id="hearth-brick" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#3a2418" />
          <rect x="0" y="0" width="40" height="1" fill="#1a0e08" />
          <rect x="0" y="0" width="1" height="20" fill="#1a0e08" />
          <rect x="20" y="10" width="20" height="1" fill="#1a0e08" />
          <rect x="20" y="10" width="1" height="10" fill="#1a0e08" />
          <rect x="0" y="10" width="20" height="1" fill="#1a0e08" />
        </pattern>

        {/* Warm wash projected onto the wall by the fire */}
        <radialGradient id="hearth-wallglow" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%" stopColor="#fff0b8" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#e8742c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a0604" stopOpacity="0" />
        </radialGradient>

        {/* Dark interior of the fireplace opening (used as the opening fill) */}
        <radialGradient id="hearth-interior" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%" stopColor="#5a2008" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#2a0e04" stopOpacity="1" />
          <stop offset="100%" stopColor="#0a0402" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Cottage silhouette: peaked roof + walls */}
      <path
        d="M 30 160 Q 200 0 370 160 L 370 380 L 30 380 Z"
        fill="url(#hearth-brick)"
        stroke="#0a0604"
        strokeWidth="3"
      />

      {/* Subtle warm wash on the wall */}
      <path
        d="M 30 160 Q 200 0 370 160 L 370 380 L 30 380 Z"
        fill="url(#hearth-wallglow)"
      />

      {/* Arched fireplace opening — empty container; HearthFire/Logs render inside it (positioned absolutely by HearthScene) */}
      <path
        d="M 130 380 L 130 240 Q 200 150 270 240 L 270 380 Z"
        fill="url(#hearth-interior)"
        stroke="#1a0e08"
        strokeWidth="2"
      />
    </svg>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/CottageFrame.tsx
git commit -m "feat(hearth): add CottageFrame SVG with arched fireplace opening"
```

---

## Task 4: Create `Logs.tsx` (stacked logs SVG)

**Files:**
- Create: `src/components/constellation/firelight/Logs.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

// Static stacked logs. Sits inside the fireplace opening,
// underneath the Lottie flame. The parent positions and sizes it.
export function Logs() {
  return (
    <svg
      viewBox="-50 -20 100 40"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Glowing core under the logs */}
      <ellipse cx="0" cy="2" rx="35" ry="6" fill="#ffb84d" opacity="0.8" />
      <ellipse cx="0" cy="2" rx="22" ry="3" fill="#fff0b8" opacity="0.9" />

      {/* Bottom row of logs */}
      <g transform="translate(-22, -4) rotate(8)">
        <rect width="22" height="6" rx="2" fill="#4a2818" />
      </g>
      <g transform="translate(0, -4) rotate(-15)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>

      {/* Top row */}
      <g transform="translate(-30, -10) rotate(-25)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>
      <g transform="translate(-12, -10) rotate(-8)">
        <rect width="22" height="6" rx="2" fill="#4a2818" />
      </g>
      <g transform="translate(6, -10) rotate(15)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>
    </svg>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/Logs.tsx
git commit -m "feat(hearth): add Logs SVG stacked underneath the flame"
```

---

## Task 5: Create `HearthFire.tsx` (Lottie wrapper + fallback)

**Files:**
- Create: `src/components/constellation/firelight/HearthFire.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

// Loaded from /public/lottie/hearth-fire.lottie. The file itself
// is added separately in Task 12 (Himanshu picks a free animation
// from lottiefiles.com). Until then — and any time the file fails
// to load — we render the static fallback below.
const LOTTIE_SRC = '/lottie/hearth-fire.lottie'

export function HearthFire() {
  const [errored, setErrored] = useState(false)

  if (errored) return <FallbackFlame />

  return (
    <div className="absolute inset-0 pointer-events-none">
      <DotLottieReact
        src={LOTTIE_SRC}
        loop
        autoplay
        // Player respects prefers-reduced-motion automatically.
        onError={() => setErrored(true)}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

// Static SVG flame with a soft Framer Motion flicker.
// Used both as the Lottie fallback and before the asset is added.
function FallbackFlame() {
  return (
    <svg
      viewBox="-50 -50 100 100"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <radialGradient id="hearth-fallback-flame" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%" stopColor="#fff0b8" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#ffb84d" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#e8742c" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#5a2008" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.ellipse
        cx="0"
        cy="10"
        rx="22"
        ry="32"
        fill="url(#hearth-fallback-flame)"
        animate={{ scaleY: [1, 1.06, 0.98, 1.04, 1], opacity: [0.85, 1, 0.9, 0.95, 0.85] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass. Build will succeed even though `public/lottie/hearth-fire.lottie` doesn't exist yet — the component handles that case at runtime via `onError`.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/HearthFire.tsx
git commit -m "feat(hearth): add HearthFire Lottie wrapper with static fallback"
```

---

## Task 6: Create `AmbientSparks.tsx` (decorative drifting sparks)

**Files:**
- Create: `src/components/constellation/firelight/AmbientSparks.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Decorative — never clickable. Sits inside the fireplace opening,
// over the flame. Six small sparks rise from the base in a loose stagger.
const SPARK_COUNT = 6

export function AmbientSparks() {
  const reduceMotion = useReducedMotion()
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        id: i,
        x: 30 + ((i * 47) % 40), // 30..70%, spread horizontally
        size: 3 + (i % 3),       // 3..5 px
        duration: 4 + (i % 3),   // 4..6s
        delay: (i * 0.7) % 4,    // staggered start
      })),
    [],
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            bottom: 0,
            width: s.size,
            height: s.size,
            background:
              'radial-gradient(circle, #fff8c8 0%, #ffd070 50%, transparent 100%)',
            boxShadow: '0 0 6px #ffd070',
          }}
          animate={
            reduceMotion
              ? { opacity: 0.6 }
              : {
                  y: [0, -160, -200],
                  opacity: [0, 0.9, 0],
                  x: [0, (s.id % 2 === 0 ? 8 : -8), 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }
          }
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/AmbientSparks.tsx
git commit -m "feat(hearth): add AmbientSparks drifting up inside the fireplace"
```

---

## Task 7: Create `LetterDiamond.tsx` (single envelope letter)

**Files:**
- Create: `src/components/constellation/firelight/LetterDiamond.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { motion } from 'framer-motion'

export interface LetterDiamondProps {
  // Position as percentages of the parent (the cottage scene container).
  leftPct: number
  topPct: number
  tilt: number       // degrees, applied on top of the 45° lozenge rotation
  sealColor: string  // wax-seal color (mood)
  glow: boolean
  delay: number
  ariaLabel: string  // e.g. "Memory from Aug 14, 2025"
  onClick: () => void
}

const SIZE_PX = 36

export function LetterDiamond({
  leftPct,
  topPct,
  tilt,
  sealColor,
  glow,
  delay,
  ariaLabel,
  onClick,
}: LetterDiamondProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="absolute cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 rounded-sm"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: SIZE_PX,
        height: SIZE_PX,
        transform: `translate(-50%, -50%) rotate(${45 + tilt}deg)`,
        transformOrigin: 'center',
        background:
          'linear-gradient(135deg, #f0e5c8 0%, #e0d4b0 50%, #c8b898 100%)',
        border: '1px solid rgba(138,112,80,0.6)',
        boxShadow: glow
          ? '0 3px 8px rgba(0,0,0,0.7), 0 0 16px rgba(255,200,120,0.55), inset 0 1px 2px rgba(255,255,255,0.3)'
          : '0 3px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.25)',
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Envelope flap V — drawn with two stroked lines */}
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <line x1="0" y1="18" x2="18" y2="36" stroke="rgba(138,112,80,0.45)" strokeWidth="1" />
        <line x1="36" y1="18" x2="18" y2="36" stroke="rgba(138,112,80,0.45)" strokeWidth="1" />
        {/* Wax seal */}
        <circle cx="18" cy="18" r="4" fill={sealColor} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
      </svg>
    </motion.button>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/LetterDiamond.tsx
git commit -m "feat(hearth): add LetterDiamond envelope component"
```

---

## Task 8: Create `LetterWall.tsx` (composes letters via letterHash)

**Files:**
- Create: `src/components/constellation/firelight/LetterWall.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../ConstellationRenderer'
import { LetterDiamond } from './LetterDiamond'
import { LETTER_SLOT_COUNT, letterPlacementForId } from './letterHash'

// Slot positions in % of the scene container. Index matches
// LetterPlacement.slotIndex. Tuned to my mockup:
//   0..2 — top row across the peaked roof
//   3,4  — sides (mid-height)
//   5,6  — lower row
const DESKTOP_SLOTS: Array<{ left: number; top: number }> = [
  { left: 32, top: 14 },
  { left: 50, top: 8 },
  { left: 68, top: 14 },
  { left: 18, top: 42 },
  { left: 82, top: 42 },
  { left: 22, top: 62 },
  { left: 78, top: 62 },
]

// Below ~600px we drop the lower row → 5 slots.
const MOBILE_SLOTS: Array<{ left: number; top: number }> = DESKTOP_SLOTS.slice(0, 5)

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

export interface LetterWallProps {
  memoryStars: MemoryStar[]
  theme: Theme
  onSelect: (star: MemoryStar) => void
}

export function LetterWall({ memoryStars, theme, onSelect }: LetterWallProps) {
  const mobile = useIsMobile()
  const slots = mobile ? MOBILE_SLOTS : DESKTOP_SLOTS

  // Resolve placement per memory. If two memories collide on the
  // same slot, the second one bumps to the next free index — keeps
  // the wall tidy without overlapping diamonds.
  const used = new Set<number>()
  const placed = memoryStars.slice(0, slots.length).map((star) => {
    const p = letterPlacementForId(star.id)
    let idx = p.slotIndex % slots.length
    while (used.has(idx)) idx = (idx + 1) % slots.length
    used.add(idx)
    return { star, slot: slots[idx], tilt: p.tilt, glow: p.glow }
  })

  const moodColor = (mood: number) =>
    [theme.moods[0], theme.moods[1], theme.moods[2], theme.moods[3], theme.moods[4]][mood] ??
    theme.accent.primary

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, slot, tilt, glow }) => (
        <LetterDiamond
          key={star.id}
          leftPct={slot.left}
          topPct={slot.top}
          tilt={tilt}
          sealColor={moodColor(star.entry.mood)}
          glow={glow}
          delay={star.delay}
          ariaLabel={`Memory from ${format(new Date(star.entry.createdAt), 'MMM d, yyyy')}`}
          onClick={() => onSelect(star)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/LetterWall.tsx
git commit -m "feat(hearth): add LetterWall composing letters via letterHash"
```

---

## Task 9: Create `HearthScene.tsx` (orchestrator)

**Files:**
- Create: `src/components/constellation/firelight/scenes/HearthScene.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { CottageFrame } from '../CottageFrame'
import { Logs } from '../Logs'
import { HearthFire } from '../HearthFire'
import { AmbientSparks } from '../AmbientSparks'
import { LetterWall } from '../LetterWall'

export interface HearthSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function HearthScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: HearthSceneProps) {
  const moodColor = (mood: number) =>
    [theme.moods[0], theme.moods[1], theme.moods[2], theme.moods[3], theme.moods[4]][mood] ??
    theme.accent.primary

  // Loading
  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          style={{
            color: theme.text.muted,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          stoking the hearth…
        </p>
      </motion.div>
    )
  }

  // Empty
  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SceneFrame theme={theme} />
        <motion.p
          className="relative z-10 mt-8 text-center"
          style={{ color: theme.text.muted, fontFamily: 'var(--font-serif)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          your hearth is waiting for its first letter
        </motion.p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ background: theme.bg.gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <SceneFrame theme={theme}>
        <LetterWall
          memoryStars={memoryStars}
          theme={theme}
          onSelect={setSelectedStar}
        />
      </SceneFrame>

      {/* Subtle title — matches existing scenes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
      >
        <p className="text-sm" style={{ color: `${theme.text.muted}80` }}>
          {memoryStars.length} {memoryStars.length === 1 ? 'memory' : 'memories'} on the hearth tonight
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={moodColor}
      />
    </motion.div>
  )
}

// Composes the cottage + fire + sparks in a centered, responsive container.
// Wrapped so the loading/empty/main branches render the same scaffold.
function SceneFrame({
  theme: _theme,
  children,
}: {
  theme: Theme
  children?: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Centered scene box: 80vw × 80vh on desktop, full bleed on mobile */}
      <div
        className="relative"
        style={{
          width: 'min(90vw, 720px)',
          aspectRatio: '1 / 1',
          maxHeight: '90vh',
        }}
      >
        <CottageFrame />

        {/* Inside-the-opening layer: opening occupies viewBox 130..270 horizontal, 240..380 vertical → ~35%–67% × ~60%–95% of the box */}
        <div
          className="absolute pointer-events-none"
          style={{ left: '32.5%', right: '32.5%', top: '60%', bottom: '5%' }}
        >
          <Logs />
          <HearthFire />
          <AmbientSparks />
        </div>

        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/firelight/scenes/HearthScene.tsx
git commit -m "feat(hearth): add HearthScene orchestrator with loading/empty states"
```

---

## Task 10: Create `FirelightRenderer.tsx` (dark-side dispatcher)

**Files:**
- Create: `src/components/constellation/FirelightRenderer.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

// Dark-side dispatcher — mirrors GardenRenderer for light themes.
// Switches by theme.ambience. Falls back to the original
// ConstellationRenderer (cosmos starfield) for any dark theme that
// doesn't yet have its own scene (today: Rivendell).

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import { ConstellationRenderer, type MemoryStar } from './ConstellationRenderer'
import { HearthScene } from './firelight/scenes/HearthScene'

export interface FirelightRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function FirelightRenderer(props: FirelightRendererProps) {
  switch (props.theme.ambience) {
    case 'firelight':
      return <HearthScene {...props} />
    default:
      return <ConstellationRenderer {...props} />
  }
}
```

- [ ] **Step 2: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/FirelightRenderer.tsx
git commit -m "feat(hearth): add FirelightRenderer dark-side dispatcher"
```

---

## Task 11: Wire `FirelightRenderer` into `ConstellationPage`

**Files:**
- Modify: `src/app/constellation/page.tsx`

- [ ] **Step 1: Read the current file**

Use Read on `src/app/constellation/page.tsx`. Look for line 7 and line 66 — the imports and the dispatcher line.

- [ ] **Step 2: Replace the import**

Find:
```tsx
import { ConstellationRenderer, MemoryStar } from '@/components/constellation/ConstellationRenderer'
import { GardenRenderer } from '@/components/constellation/GardenRenderer'
```

Replace with:
```tsx
import type { MemoryStar } from '@/components/constellation/ConstellationRenderer'
import { GardenRenderer } from '@/components/constellation/GardenRenderer'
import { FirelightRenderer } from '@/components/constellation/FirelightRenderer'
```

(`ConstellationRenderer` is no longer imported here — `FirelightRenderer` references it.)

- [ ] **Step 3: Replace the dispatcher line**

Find:
```tsx
const Renderer = theme.mode === 'light' ? GardenRenderer : ConstellationRenderer
```

Replace with:
```tsx
const Renderer = theme.mode === 'light' ? GardenRenderer : FirelightRenderer
```

- [ ] **Step 4: Lint + build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass. If lint complains about the unused `ConstellationRenderer` import, you forgot to remove it in Step 2.

- [ ] **Step 5: Commit**

```bash
git add src/app/constellation/page.tsx
git commit -m "feat(hearth): route dark themes through FirelightRenderer dispatcher"
```

---

## Task 12: Visual smoke (fallback flame, no Lottie file yet)

This task uses the running app — no new code.

- [ ] **Step 1: Restart the app to pick up changes**

```bash
docker compose restart app && docker compose logs -f app | head -30
```

Expected: server starts cleanly, no compile errors.

- [ ] **Step 2: Open the Memory page on Hearth**

In a browser: open the app (default `http://localhost:3111`), log in, switch to **Hearth** theme, navigate to **Memory**.

Verify, with the Lottie file still absent:
- Cottage silhouette renders centered on the page
- Arched fireplace opening is dark with logs visible
- A static flickering ember-glow flame shows above the logs (fallback path — the Lottie file isn't there yet)
- Ambient sparks rise inside the opening
- 5–7 envelope-diamond letters are tacked around the wall, with at least one glowing
- Mood-colored wax seals visible in the center of each letter
- Clicking a letter opens the existing `MemoryModal` with the right entry
- "N memories on the hearth tonight" subtitle near the top

- [ ] **Step 3: Other-theme regression check**

Switch through Rivendell, Rose, Postal, Sage, Ocean, Linen one by one. Each should render its existing Memory scene unchanged (Rivendell = starfield, Rose = rose garden, Postal = postal scene, Sage/Ocean/Linen = meadow). Nothing should look different from before.

- [ ] **Step 4: Mobile layout check**

Resize the browser to <600px (or use device emulation). Verify the lower-row pair of letters drops away, leaving 5 slots; cottage scales without overflow.

- [ ] **Step 5: Empty state check**

Temporarily mock empty entries (easiest: in DevTools network tab, edit the response of `/api/entries?limit=50` to `{ entries: [], pagination: {} }` and reload). The empty cottage with the line "your hearth is waiting for its first letter" should appear. Revert when done.

- [ ] **Step 6: No commit needed**

Verification only. If anything failed, add a `fix:` commit before moving to Task 13.

---

## Task 13: Add the Lottie fire asset

This is the only step that needs Himanshu's hands — the spec leaves the choice of animation open.

- [ ] **Step 1: Pick a fire animation**

Go to https://lottiefiles.com/ and search "fireplace fire" or "campfire flame." Filter by **Free** license. Pick one that looks like a contained, warm fire (not a wildfire / bonfire explosion). Download as **`.lottie`** (preferred) or **`.json`**.

- [ ] **Step 2: Save it at the fixed path**

```bash
# create the dir if it doesn't exist
mkdir -p /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/public/lottie
# copy your downloaded file in, renaming to the fixed name
cp /path/to/your/download.lottie /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/public/lottie/hearth-fire.lottie
```

If you downloaded `.json` instead of `.lottie`, save it as `hearth-fire.json` and update `LOTTIE_SRC` in `src/components/constellation/firelight/HearthFire.tsx` to `/lottie/hearth-fire.json`.

- [ ] **Step 3: Visual smoke — real flame**

Reload the Memory page on Hearth. The static fallback flicker should be replaced by the Lottie animation playing inside the opening.

- [ ] **Step 4: Force-fallback check**

Temporarily rename the file to confirm fallback still works:

```bash
mv public/lottie/hearth-fire.lottie public/lottie/hearth-fire.lottie.bak
```

Reload the page. Verify the static fallback flame appears and nothing crashes.

```bash
mv public/lottie/hearth-fire.lottie.bak public/lottie/hearth-fire.lottie
```

- [ ] **Step 5: Reduced-motion check**

In macOS System Settings → Accessibility → Display, toggle **Reduce motion** on. Reload the page. The Lottie player should stop animating (single frame), and the ambient sparks should freeze (faded). Toggle off when done.

- [ ] **Step 6: Commit**

```bash
git add public/lottie/hearth-fire.lottie
git commit -m "feat(hearth): add fire Lottie animation asset"
```

---

## Done

After Task 13:
- Hearth Memory view has its own scene (cottage + fireplace + flame + letters)
- Rivendell and other themes are untouched
- The dark-side dispatcher pattern is in place for future themes

Final cleanup — push the branch:

```bash
git status   # confirm clean
git log --oneline -15   # eyeball the commit list
```

Open a PR when ready.
