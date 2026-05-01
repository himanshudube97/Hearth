# Ocean Harbour Memory View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the ocean theme its own `/constellation` scene — a sunset harbour with a wooden dock and 7 clickable paper-boat memories — by adding a third light-side branch to the existing `GardenRenderer` dispatcher.

**Architecture:** Create a new `OceanHarbourScene` composed of small SVG/CSS layer components (sky, silhouettes, water, dock, boats), then wire it into `GardenRenderer`'s switch on `theme.ambience`. Click handling reuses the existing `MemoryModal`. The pattern mirrors `RoseGardenScene`.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, Framer Motion v12 for animation, inline SVG/CSS for all scene art, Docker Compose for the dev stack. No automated test framework — visual changes are manually verified in the browser per project convention.

**Spec:** `docs/superpowers/specs/2026-05-01-ocean-harbour-memory-design.md`

---

## File Structure

**Created:**
- `src/components/constellation/garden/scenes/OceanHarbourScene.tsx` — orchestrator
- `src/components/constellation/garden/ocean/HarbourSky.tsx`
- `src/components/constellation/garden/ocean/HorizonSilhouettes.tsx`
- `src/components/constellation/garden/ocean/WaterAndReflections.tsx`
- `src/components/constellation/garden/ocean/Dock.tsx`
- `src/components/constellation/garden/ocean/PaperBoat.tsx`
- `src/components/constellation/garden/ocean/PaperBoats.tsx`
- `src/components/constellation/garden/ocean/oceanHash.ts`

**Modified:**
- `src/components/constellation/GardenRenderer.tsx` — add `'ocean'` case to the switch

**Unchanged:**
- `src/components/constellation/MemoryModal.tsx`
- `src/components/constellation/ConstellationRenderer.tsx`
- `src/app/constellation/page.tsx`
- All other scenes and dark-side renderer

---

## Convention notes for the implementer

- **Dev stack runs in Docker.** Restart with `docker compose restart app` after touching code; tail logs with `docker compose logs -f app`. The app is served on `http://localhost:3111`.
- **Theme switching** for manual verification: click the theme dot in the header (`ThemeSwitcher`) and pick the **Ocean** theme. Then navigate to **Memory** in the nav.
- **Path alias** `@/*` → `./src/*`. All imports use the alias.
- **No unit tests.** Each task ends with a manual browser verification step. Read carefully — if the verification doesn't match, the task isn't done.
- **Reference component for shape and idioms:** `src/components/constellation/garden/rose/` and `src/components/constellation/garden/scenes/RoseGardenScene.tsx`. Mirror that style.

---

## Task 1: Create `oceanHash.ts`

**Goal:** Deterministic hash from `entry.id` to `{ slotIndex, tilt, scale, glow }`.

**Files:**
- Create: `src/components/constellation/garden/ocean/oceanHash.ts`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/oceanHash.ts`

```ts
// Simple deterministic string hash → unsigned 32-bit int.
// Mirrors the FNV-1a hash used in `roseHash.ts`.
function hash(id: string, salt = ''): number {
  let h = 2166136261
  const s = id + salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface OceanBoatHash {
  /** Slot 0..6 in PaperBoats. PaperBoats handles mobile fallback. */
  slotIndex: number
  /** Rotation in degrees, in [-4, +4]. */
  tilt: number
  /** Size multiplier, in [0.85, 1.0]. */
  scale: number
  /** True for ~1 in 3 boats. */
  glow: boolean
}

export function oceanHashForId(id: string): OceanBoatHash {
  const slotIndex = hash(id, '-slot') % 7
  const tilt = ((hash(id, '-tilt') % 1000) / 1000) * 8 - 4 // [-4, +4]
  const scale = 0.85 + ((hash(id, '-scale') % 1000) / 1000) * 0.15 // [0.85, 1.0]
  const glow = hash(id, '-glow') % 3 === 0 // ~1 in 3
  return { slotIndex, tilt, scale, glow }
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/oceanHash.ts
git commit -m "feat(ocean): deterministic boat hash for slot/tilt/scale/glow"
```

---

## Task 2: Create `HarbourSky.tsx`

**Goal:** Full-bleed sunset gradient with sun disc on the horizon and 4 cloud streaks.

**Files:**
- Create: `src/components/constellation/garden/ocean/HarbourSky.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/HarbourSky.tsx`

```tsx
'use client'

export function HarbourSky() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg,
          #2A1F3A 0%,
          #5A3258 18%,
          #B04860 38%,
          #E07848 56%,
          #F0B070 70%,
          #F8D090 78%,
          #4A5878 80%,
          #3A4868 90%,
          #1C2840 100%
        )`,
      }}
    >
      {/* Sun disc on the horizon */}
      <div
        className="absolute"
        style={{
          left: '58%',
          top: '70%',
          width: 70,
          height: 70,
          background:
            'radial-gradient(circle, #FFF4D8 0%, #FFD890 30%, #FF9858 65%, rgba(255,150,80,0.3) 90%, transparent 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 60px rgba(255,180,100,0.6)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Cloud streaks */}
      <div
        className="absolute"
        style={{
          left: '8%',
          top: '20%',
          width: 140,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '30%',
          top: '14%',
          width: 100,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '55%',
          top: '24%',
          width: 120,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '75%',
          top: '18%',
          width: 80,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/HarbourSky.tsx
git commit -m "feat(ocean): sunset sky with sun disc and cloud streaks"
```

---

## Task 3: Create `HorizonSilhouettes.tsx`

**Goal:** Cliff silhouette on the left, lighthouse with a softly pulsing lamp, two far-distant sailboat silhouettes near the horizon.

**Files:**
- Create: `src/components/constellation/garden/ocean/HorizonSilhouettes.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/HorizonSilhouettes.tsx`

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'

const SILHOUETTE = '#1A1620'

export function HorizonSilhouettes() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Cliff (left ~30% of frame, from y=60% down to horizon ~78%) */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '60%',
          width: '30%',
          height: '18%',
          background: `linear-gradient(180deg, ${SILHOUETTE} 0%, #1A1620 100%)`,
          clipPath:
            'polygon(0 100%, 0 50%, 18% 30%, 35% 38%, 60% 25%, 78% 20%, 100% 30%, 100% 100%)',
        }}
      />

      {/* Lighthouse on the cliff */}
      <div
        className="absolute"
        style={{
          left: '22%',
          top: '52%',
          width: 8,
          height: 24,
        }}
      >
        {/* Tower body — tapered triangle */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 8,
            height: 18,
            background: SILHOUETTE,
            clipPath: 'polygon(20% 100%, 80% 100%, 100% 0, 0 0)',
          }}
        />
        {/* Lamp housing */}
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 0,
            width: 6,
            height: 6,
            background: SILHOUETTE,
          }}
        />
        {/* Lit lamp — pulses 0.7 → 1.0 over 3s; static when reduced-motion is set */}
        <motion.div
          style={{
            position: 'absolute',
            left: 2,
            top: 4,
            width: 4,
            height: 4,
            background: '#FFD890',
            borderRadius: '50%',
            boxShadow: '0 0 8px #FFAA50, 0 0 16px #FF8030',
          }}
          animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>

      {/* Far-distant sailboat 1 (full size) at 42% x */}
      <FarBoat left="42%" top="73%" scale={1} />
      {/* Far-distant sailboat 2 (smaller) at 78% x */}
      <FarBoat left="78%" top="74%" scale={0.8} />
    </div>
  )
}

function FarBoat({
  left,
  top,
  scale,
}: {
  left: string
  top: string
  scale: number
}) {
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        width: 12,
        height: 14,
        transform: `scale(${scale})`,
      }}
    >
      {/* Tiny hull */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 12,
          height: 3,
          background: SILHOUETTE,
          clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
        }}
      />
      {/* Tiny triangular sail */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          bottom: 3,
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `9px solid ${SILHOUETTE}`,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/HorizonSilhouettes.tsx
git commit -m "feat(ocean): cliff + lighthouse + far sailboat silhouettes"
```

---

## Task 4: Create `WaterAndReflections.tsx`

**Goal:** Golden sun-reflection trail under the sun, plus 4 horizontal water streaks suggesting tiny waves.

**Files:**
- Create: `src/components/constellation/garden/ocean/WaterAndReflections.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/WaterAndReflections.tsx`

```tsx
'use client'

export function WaterAndReflections() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sun reflection ellipse directly under the sun */}
      <div
        className="absolute"
        style={{
          left: '56%',
          top: '79%',
          width: 80,
          height: '14%',
          background:
            'linear-gradient(180deg, rgba(255,200,120,0.7) 0%, rgba(255,160,80,0.4) 50%, transparent 100%)',
          filter: 'blur(3px)',
          borderRadius: '50%',
          mixBlendMode: 'lighten',
        }}
      />

      {/* Water streaks — tiny suggested wave lines */}
      <div
        className="absolute"
        style={{
          left: '10%',
          right: '10%',
          top: '84%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '5%',
          right: '15%',
          top: '88%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '20%',
          right: '5%',
          top: '92%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '8%',
          right: '20%',
          top: '96%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/WaterAndReflections.tsx
git commit -m "feat(ocean): sun reflection trail and water streak lines"
```

---

## Task 5: Create `Dock.tsx`

**Goal:** Weathered wooden dock + 2 pilings, anchored lower-left.

**Files:**
- Create: `src/components/constellation/garden/ocean/Dock.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/Dock.tsx`

```tsx
'use client'

export function Dock() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dock plank surface */}
      <div
        className="absolute"
        style={{
          left: '-2%',
          bottom: '8%',
          width: '38%',
          height: 10,
          background: 'linear-gradient(180deg, #4A3020 0%, #2A1C10 100%)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
        }}
      />

      {/* Plank-line dividers */}
      <div
        className="absolute"
        style={{
          left: '8%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '18%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '28%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Pilings — descend from dock to bottom of frame */}
      <div
        className="absolute"
        style={{
          left: '3%',
          bottom: 0,
          width: 6,
          height: '10%',
          background: 'linear-gradient(180deg, #2A1C10 0%, #0A0608 100%)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '22%',
          bottom: 0,
          width: 6,
          height: '10%',
          background: 'linear-gradient(180deg, #2A1C10 0%, #0A0608 100%)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/Dock.tsx
git commit -m "feat(ocean): wooden dock and pilings, lower-left"
```

---

## Task 6: Create `PaperBoat.tsx`

**Goal:** Single paper boat (hull + sail + reflection ripple) with idle bobbing, hover, tap, and optional sail glow.

**Files:**
- Create: `src/components/constellation/garden/ocean/PaperBoat.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/PaperBoat.tsx`

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'

export interface PaperBoatProps {
  /** Position in viewport % from left (0..100). */
  slotX: number
  /** Position in viewport % from bottom (0..100). */
  slotYFromBottom: number
  /** Rotation offset in degrees, from oceanHash. */
  tilt: number
  /** Size multiplier from oceanHash, in [0.85, 1.0]. */
  scale: number
  /** Phase offset in seconds for bobbing — different per slot so boats are out of sync. */
  phaseOffset: number
  /** If true, sail emits a colored glow. */
  glow: boolean
  /** Color used for the glow (theme.moods[mood]). Ignored when glow is false. */
  glowColor: string
  /** Stagger-in delay in seconds. */
  delay: number
  /** Click handler. */
  onClick: () => void
  /** Aria label for the button. */
  ariaLabel: string
}

const HULL_GRADIENT = 'linear-gradient(180deg, #F8F0DC 60%, #D8C8A4 100%)'
const SAIL_COLOR = '#F8F0DC'

export function PaperBoat({
  slotX,
  slotYFromBottom,
  tilt,
  scale,
  phaseOffset,
  glow,
  glowColor,
  delay,
  onClick,
  ariaLabel,
}: PaperBoatProps) {
  const reduceMotion = useReducedMotion()

  // Idle bob: ±2px Y over 3.5s, ±1° rotation drift around the base tilt
  const animate = reduceMotion
    ? undefined
    : {
        y: [0, -2, 0, 2, 0],
        rotate: [tilt - 1, tilt + 1, tilt - 1],
      }

  const transition = reduceMotion
    ? undefined
    : {
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: phaseOffset,
      }

  const sailFilter = glow
    ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`
    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute cursor-pointer focus:outline-none"
      style={{
        left: `${slotX}%`,
        bottom: `${slotYFromBottom}%`,
        width: 36 * scale,
        height: 22 * scale,
        background: 'transparent',
        border: 'none',
        padding: 0,
        transform: 'translate(-50%, 0)',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        ...(animate ?? {}),
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
        ...(transition ?? {}),
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 1.2, y: -6 }}
    >
      {/* Reflection ripple under the boat */}
      <div
        style={{
          position: 'absolute',
          left: -4 * scale,
          bottom: -4 * scale,
          width: 44 * scale,
          height: 6 * scale,
          border: '1px solid rgba(255,200,140,0.4)',
          borderRadius: '50%',
        }}
      />

      {/* Hull — trapezoid */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 36 * scale,
          height: 10 * scale,
          background: HULL_GRADIENT,
          clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      />

      {/* Sail — triangle */}
      <div
        style={{
          position: 'absolute',
          left: 14 * scale,
          bottom: 9 * scale,
          width: 0,
          height: 0,
          borderLeft: `${10 * scale}px solid transparent`,
          borderRight: `${10 * scale}px solid transparent`,
          borderBottom: `${16 * scale}px solid ${SAIL_COLOR}`,
          filter: sailFilter,
        }}
      />
    </motion.button>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/PaperBoat.tsx
git commit -m "feat(ocean): paper boat component with bob, hover, tap, glow"
```

---

## Task 7: Create `PaperBoats.tsx`

**Goal:** Layout the 7 boats in fixed slots from `MemoryStar[]`, with a 5-slot mobile fallback below 600px.

**Files:**
- Create: `src/components/constellation/garden/ocean/PaperBoats.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/ocean/PaperBoats.tsx`

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MemoryStar } from '../../ConstellationRenderer'
import { PaperBoat } from './PaperBoat'
import { oceanHashForId } from './oceanHash'

interface PaperBoatsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  getMoodColor: (mood: number) => string
}

interface Slot {
  /** % from left edge of viewport */
  x: number
  /** % from bottom edge of viewport */
  yFromBottom: number
}

// 7 desktop slots — slight Y variance gives "boats on uneven water" feel.
// Slot indices match oceanHash output (0..6). Mobile drops slots 5 and 6.
const DESKTOP_SLOTS: Slot[] = [
  { x: 8, yFromBottom: 14 },
  { x: 25, yFromBottom: 12 },
  { x: 34, yFromBottom: 18 },
  { x: 42, yFromBottom: 10 },
  { x: 58, yFromBottom: 14 },
  { x: 73, yFromBottom: 9 },
  { x: 86, yFromBottom: 13 },
]

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isMobile
}

export function PaperBoats({
  memoryStars,
  onSelect,
  getMoodColor,
}: PaperBoatsProps) {
  const isMobile = useIsMobile()

  const placed = useMemo(() => {
    const usableSlotCount = isMobile ? 5 : 7
    // Track which slots are filled so two entries can't collide on the same slot.
    const taken = new Set<number>()
    return memoryStars
      .map((star) => {
        const h = oceanHashForId(star.id)
        let slot = h.slotIndex % usableSlotCount
        // Linear-probe to next free slot if collision.
        while (taken.has(slot)) {
          slot = (slot + 1) % usableSlotCount
        }
        taken.add(slot)
        return { star, hash: h, slotIndex: slot }
      })
      .slice(0, usableSlotCount)
  }, [memoryStars, isMobile])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, hash, slotIndex }, i) => {
        const slot = DESKTOP_SLOTS[slotIndex]
        return (
          <PaperBoat
            key={star.id}
            slotX={slot.x}
            slotYFromBottom={slot.yFromBottom}
            tilt={hash.tilt}
            scale={hash.scale}
            phaseOffset={(slotIndex * 0.5) % 3.5}
            glow={hash.glow}
            glowColor={getMoodColor(star.entry.mood)}
            delay={0.4 + i * 0.12}
            onClick={() => onSelect(star)}
            ariaLabel={`Open memory from ${new Date(
              star.entry.createdAt,
            ).toLocaleDateString()}`}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/ocean/PaperBoats.tsx
git commit -m "feat(ocean): 7-slot boat layout with mobile 5-slot fallback"
```

---

## Task 8: Create `OceanHarbourScene.tsx`

**Goal:** Orchestrator that composes all layers, handles loading + empty states, and mounts `MemoryModal`.

**Files:**
- Create: `src/components/constellation/garden/scenes/OceanHarbourScene.tsx`

- [ ] **Step 1: Write the file**

Path: `src/components/constellation/garden/scenes/OceanHarbourScene.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { HarbourSky } from '../ocean/HarbourSky'
import { HorizonSilhouettes } from '../ocean/HorizonSilhouettes'
import { WaterAndReflections } from '../ocean/WaterAndReflections'
import { Dock } from '../ocean/Dock'
import { PaperBoats } from '../ocean/PaperBoats'
import { PaperBoat } from '../ocean/PaperBoat'

export interface OceanHarbourSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function OceanHarbourScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: OceanHarbourSceneProps) {
  const getMoodColor = (mood: number) => {
    const colors = [
      theme.moods[0],
      theme.moods[1],
      theme.moods[2],
      theme.moods[3],
      theme.moods[4],
    ]
    return colors[mood] || theme.accent.primary
  }

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 36, height: 22, position: 'relative' }}
          >
            {/* Mini boat for the loading state */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: 36,
                height: 10,
                background: 'linear-gradient(180deg, #F8F0DC 60%, #D8C8A4 100%)',
                clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 14,
                bottom: 9,
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '16px solid #F8F0DC',
              }}
            />
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            the harbour wakes…
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <HarbourSky />
        <WaterAndReflections />
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center flex flex-col items-center gap-4">
            {/* Single lone boat in the middle of the harbour */}
            <div style={{ position: 'relative', width: 120, height: 60 }}>
              <PaperBoat
                slotX={50}
                slotYFromBottom={20}
                tilt={0}
                scale={1.0}
                phaseOffset={0}
                glow={false}
                glowColor="#FFFFFF"
                delay={0.4}
                onClick={() => {}}
                ariaLabel="A single paper boat — the harbour is quiet"
              />
            </div>
            <p
              style={{
                color: '#F8E8D0',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              a quiet harbour — set your first boat afloat by writing a memory
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <HarbourSky />
      <HorizonSilhouettes />
      <WaterAndReflections />
      <Dock />
      <PaperBoats
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        getMoodColor={getMoodColor}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: '#F8E8D0',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          your harbour
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: '#F8E8D0CC',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {Math.min(memoryStars.length, 7)}{' '}
          {Math.min(memoryStars.length, 7) === 1
            ? 'boat afloat'
            : 'boats afloat'}
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
    </motion.div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/scenes/OceanHarbourScene.tsx
git commit -m "feat(ocean): harbour scene orchestrator with loading and empty states"
```

---

## Task 9: Wire `OceanHarbourScene` into `GardenRenderer`

**Goal:** Add the `'ocean'` case to the dispatcher so the ocean theme renders the new scene.

**Files:**
- Modify: `src/components/constellation/GardenRenderer.tsx`

- [ ] **Step 1: Add the import and case**

Open `src/components/constellation/GardenRenderer.tsx`. The current file looks like:

```tsx
'use client'

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { PostalScene } from './garden/scenes/PostalScene'
import { MeadowScene } from './garden/scenes/MeadowScene'
import { RoseGardenScene } from './garden/scenes/RoseGardenScene'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function GardenRenderer(props: GardenRendererProps) {
  switch (props.theme.ambience) {
    case 'postal':
      return <PostalScene {...props} />
    case 'rose':
      return <RoseGardenScene {...props} />
    default:
      return <MeadowScene {...props} />
  }
}
```

Update it to:

```tsx
'use client'

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { PostalScene } from './garden/scenes/PostalScene'
import { MeadowScene } from './garden/scenes/MeadowScene'
import { RoseGardenScene } from './garden/scenes/RoseGardenScene'
import { OceanHarbourScene } from './garden/scenes/OceanHarbourScene'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function GardenRenderer(props: GardenRendererProps) {
  switch (props.theme.ambience) {
    case 'postal':
      return <PostalScene {...props} />
    case 'rose':
      return <RoseGardenScene {...props} />
    case 'ocean':
      return <OceanHarbourScene {...props} />
    default:
      return <MeadowScene {...props} />
  }
}
```

- [ ] **Step 2: Type-check**

Run: `docker compose exec app npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint`
Expected: clean.

Run: `docker compose exec app npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/GardenRenderer.tsx
git commit -m "feat(ocean): wire OceanHarbourScene into GardenRenderer dispatcher"
```

---

## Task 10: Manual visual verification

**Goal:** Confirm the scene renders correctly across all the cases the spec calls out.

**Files:** None — verification only.

- [ ] **Step 1: Restart Docker and load the app**

Run: `docker compose restart app`
Tail logs in another terminal: `docker compose logs -f app`
Open: `http://localhost:3111`

- [ ] **Step 2: Switch to ocean theme**

Click the theme dot in the header → pick **Ocean**.

- [ ] **Step 3: Navigate to Memory**

Click **Memory** in the nav (route `/constellation`).

- [ ] **Step 4: Verify the populated scene**

Confirm visually:
- [ ] Sunset gradient renders top-to-bottom: deep purple → magenta → coral → gold horizon → slate-blue water
- [ ] Sun disc sits on the horizon at roughly 58% from the left, with a golden reflection trail beneath it on the water
- [ ] 4 cloud streaks visible in the upper sky
- [ ] Cliff silhouette occupies the left ~30% with a small lighthouse on it; the lighthouse lamp pulses softly (opacity 0.7 → 1.0 ≈ 3s loop)
- [ ] Two tiny far-distant sailboat silhouettes visible on the horizon (one near 42%, smaller one near 78%)
- [ ] Wooden dock juts in from the lower-left with 2 pilings and plank-line dividers
- [ ] 7 paper-cream boats appear (or fewer if fewer entries); each bobs gently with subtle rotation drift, and they're not in lockstep
- [ ] Roughly 2–3 of the boats glow with a mood-colored sail
- [ ] Title overlay reads "your harbour" with the boat count below

- [ ] **Step 5: Verify click → modal**

Click a paper boat. Confirm:
- [ ] Boat lifts and scales briefly during the tap
- [ ] `MemoryModal` opens with the matching entry text/date
- [ ] Closing the modal returns to the scene

- [ ] **Step 6: Verify deterministic placement**

Refresh the page (`Cmd+R` / `Ctrl+R`). Confirm:
- [ ] The set of 7 may change (random-pick from `/api/entries`)
- [ ] But for an entry that appears in both visits, its slot/tilt/scale/glow is identical

- [ ] **Step 7: Mobile fallback**

Resize browser window below 600px wide (or use DevTools mobile emulator). Confirm:
- [ ] At most 5 boats render
- [ ] Slots 5 and 6 (far-right) are dropped
- [ ] Dock + sky still read cleanly

- [ ] **Step 8: Empty state**

If you have a clean test account with 0 entries, switch to ocean theme and visit Memory. Confirm:
- [ ] Sunset sky + water visible (no dock or crowd of boats)
- [ ] Single lone boat centered, bobbing
- [ ] Italic copy: *"a quiet harbour — set your first boat afloat by writing a memory"*

If you don't have such an account: temporarily change the populated render branch to `if (true)` for the empty state at the top of `OceanHarbourScene` and verify the visual; revert before committing.

- [ ] **Step 9: Loading state**

Throttle the network in DevTools to "Slow 3G" and reload. Confirm:
- [ ] Mini boat with breathing opacity
- [ ] Italic copy: *"the harbour wakes…"*

- [ ] **Step 10: Reduced motion**

In macOS System Preferences → Accessibility → Display → enable "Reduce motion". Reload the page. Confirm:
- [ ] Boats no longer bob (they sit at neutral idle position)
- [ ] Lighthouse lamp stops pulsing and stays at full opacity

Disable "Reduce motion" again before continuing.

- [ ] **Step 11: Regression — other themes unchanged**

Switch through each theme and visit Memory:
- [ ] Rose → rose garden scene (unchanged)
- [ ] Postal → postal scene (unchanged)
- [ ] Sage → meadow (unchanged)
- [ ] Linen → meadow (unchanged)
- [ ] Hearth → starfield or in-flight hearth scene (unchanged by this PR)
- [ ] Rivendell → starfield (unchanged)

- [ ] **Step 12: Final commit if any verification fixes were needed**

If any step revealed a visual gap, fix it inline and add a follow-up commit:

```bash
git add <changed-files>
git commit -m "fix(ocean): <what was wrong>"
```

If everything passed: nothing to commit.

---

## Self-Review

**Spec coverage check** — ran through `2026-05-01-ocean-harbour-memory-design.md` section by section:

- Architecture (one new switch case in `GardenRenderer`) → Task 9. ✓
- File layout (new scene + 7 sub-components + hash) → Tasks 1–8. ✓
- HarbourSky 7-stop sky + 9-stop combined gradient + sun + clouds → Task 2. ✓
- HorizonSilhouettes (cliff, lighthouse with pulsing lamp, 2 far boats) → Task 3. ✓
- WaterAndReflections (sun trail + 4 streaks) → Task 4. ✓
- Dock + 2 pilings + plank lines → Task 5. ✓
- PaperBoat (hull, sail, ripple, idle bob, hover, tap, glow, reduced-motion) → Task 6. ✓
- 7-slot layout + mobile 5-slot fallback + collision-safe slot allocation → Task 7. ✓
- OceanHarbourScene orchestrator + loading + empty states + title overlay → Task 8. ✓
- Mood → glow color via `theme.moods[entry.mood]` → wired in Task 7 (`getMoodColor`) and Task 6 (`glowColor` prop). ✓
- Deterministic per-entry slotIndex/tilt/scale/glow → Task 1, consumed in Task 7. ✓
- Manual verification of each spec requirement → Task 10. ✓

**Placeholder scan** — no TBD/TODO/"add appropriate handling" anywhere. Each code step has full code.

**Type consistency** — `OceanBoatHash` is defined in Task 1 and consumed in Task 7. `PaperBoatProps` is defined in Task 6 and used in Tasks 7 and 8. `getMoodColor` signature `(mood: number) => string` matches between Task 7 and Task 8. Slot count `7` and mobile cutoff `5` are consistent across Tasks 7, 8, and 10.

**Reduced-motion gating:** Both `PaperBoat` (Task 6) and `HorizonSilhouettes` (Task 3) consult Framer Motion's `useReducedMotion`. Boats stop bobbing and the lighthouse lamp stops pulsing when the OS preference is set. This matches the spec's "Error handling & edge cases" section.
