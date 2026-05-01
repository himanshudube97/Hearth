# Sage Meadow Butterfly Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Sage's `MeadowScene`, replace the clothesline-as-memory-reveal with 5 always-on-screen, looping, clickable butterflies, and fill the vacated space with a static OpenMoji flower garden.

**Architecture:** Two new presentational components — `MeadowMemoryButterflies` (interactive) and `MeadowGarden` (static decoration) — replace `<LetterClothesline />` in `MeadowScene`. Each butterfly is a focusable `<button>` whose click opens the existing `MemoryModal` via the unchanged `setSelectedStar` prop. The 5 ambient butterflies in `AmbientDrift` are removed via the existing `creatures` prop filter so they don't compete with the interactive ones.

**Tech Stack:** React 19, Next.js 16, TypeScript, Framer Motion v12, OpenMoji SVG assets via the existing `Plant` component. No test runner — verification is `npm run lint`, `npm run build` (typecheck), and manual browser check per project `CLAUDE.md`.

**Spec:** [docs/superpowers/specs/2026-05-01-sage-meadow-butterfly-memory-design.md](../specs/2026-05-01-sage-meadow-butterfly-memory-design.md)

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `src/components/constellation/garden/MeadowMemoryButterflies.tsx` | Create | 5 clickable, hue-shifted, looping butterflies — one per `MemoryStar`; opens `MemoryModal` via `onSelect` |
| `src/components/constellation/garden/MeadowGarden.tsx` | Create | Static OpenMoji cluster (fence + flowers + pots) filling the cleared mid-band |
| `src/components/constellation/garden/scenes/MeadowScene.tsx` | Modify | Remove clothesline; mount the two new components; pass `creatures={['bee', 'bird']}` to `AmbientDrift` |

`LetterClothesline.tsx` is intentionally **not deleted** — keeps the diff focused on user-visible behavior. Cleanup is out of scope.

---

## Task 1: Create `MeadowMemoryButterflies` component

**Files:**
- Create: `src/components/constellation/garden/MeadowMemoryButterflies.tsx`

- [ ] **Step 1: Create the file with imports and types**

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../ConstellationRenderer'
import { Plant } from './Plant'

interface ButterflyAnchor {
  /** Home X in vw — center of the loop region */
  x: number
  /** Home Y in vh — center of the loop region */
  y: number
  /** Loop width in vw */
  loopW: number
  /** Loop height in vh */
  loopH: number
  /** Butterfly sprite size in px */
  size: number
  /** OpenMoji butterfly SVG hue rotation in degrees */
  hueRotate: number
  /** Saturation multiplier passed to Plant */
  saturate: number
  /** Seconds per full wandering loop */
  loopDuration: number
  /** Wing flap period in seconds */
  flapDuration: number
}

/**
 * Five home anchors, spread across the upper-mid band where the clothesline
 * used to hang. Anchors are positional (color stays at the position even if
 * underlying memories change session-to-session). Same hue palette as the
 * removed AmbientDrift butterflies (default, warm, magenta, rosy, lime).
 */
const HOMES: ButterflyAnchor[] = [
  { x: 18, y: 28, loopW: 14, loopH: 9,  size: 38, hueRotate: 0,   saturate: 0.9,  loopDuration: 22, flapDuration: 0.35 },
  { x: 36, y: 38, loopW: 16, loopH: 10, size: 32, hueRotate: -55, saturate: 1.0,  loopDuration: 26, flapDuration: 0.40 },
  { x: 52, y: 26, loopW: 13, loopH: 8,  size: 28, hueRotate: 200, saturate: 1.05, loopDuration: 19, flapDuration: 0.32 },
  { x: 66, y: 44, loopW: 18, loopH: 11, size: 30, hueRotate: 280, saturate: 1.1,  loopDuration: 24, flapDuration: 0.42 },
  { x: 80, y: 32, loopW: 12, loopH: 9,  size: 26, hueRotate: 95,  saturate: 1.0,  loopDuration: 28, flapDuration: 0.30 },
]

interface MeadowMemoryButterfliesProps {
  memoryStars: MemoryStar[]
  onSelect: (star: MemoryStar) => void
  theme: Theme
  getMoodColor: (mood: number) => string
}
```

- [ ] **Step 2: Add the loop path helper**

Append to the same file:

```tsx
/**
 * Build a wandering oval-ish keyframe path around a home anchor.
 * Returns x/y arrays in vw/vh suitable for framer-motion `animate`.
 */
function buildLoopPath(anchor: ButterflyAnchor) {
  const { x, y, loopW, loopH } = anchor
  const halfW = loopW / 2
  const halfH = loopH / 2

  // 8-point lazy-oval. Closes back to start so repeat: Infinity is seamless.
  const xs = [
    x,
    x + halfW * 0.7,
    x + halfW,
    x + halfW * 0.6,
    x,
    x - halfW * 0.6,
    x - halfW,
    x - halfW * 0.7,
    x,
  ]
  const ys = [
    y,
    y - halfH * 0.5,
    y,
    y + halfH * 0.6,
    y + halfH,
    y + halfH * 0.5,
    y,
    y - halfH * 0.6,
    y,
  ]
  return { xs, ys }
}
```

- [ ] **Step 3: Add the single-butterfly subcomponent**

Append to the same file:

```tsx
interface MemoryButterflyProps {
  anchor: ButterflyAnchor
  star: MemoryStar
  haloColor: string
  onClick: () => void
}

function MemoryButterfly({ anchor, star, haloColor, onClick }: MemoryButterflyProps) {
  const { xs, ys } = buildLoopPath(anchor)
  const dateLabel = new Date(star.entry.createdAt).toDateString()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Read memory from ${dateLabel}`}
      className="absolute focus:outline-none"
      style={{
        top: 0,
        left: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        width: anchor.size,
        height: anchor.size,
      }}
      initial={{ x: `${anchor.x}vw`, y: `${anchor.y}vh`, opacity: 0 }}
      animate={{
        x: xs.map(v => `${v}vw`),
        y: ys.map(v => `${v}vh`),
        opacity: 1,
      }}
      transition={{
        x: { duration: anchor.loopDuration, repeat: Infinity, ease: 'easeInOut' },
        y: { duration: anchor.loopDuration, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 1.2, ease: 'easeOut' },
      }}
      whileHover={{ scale: 1.15 }}
      whileFocus={{ scale: 1.15 }}
    >
      {/* Mood-tint halo */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -anchor.size * 0.35,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${haloColor}40 0%, ${haloColor}00 70%)`,
          opacity: 0.55,
          pointerEvents: 'none',
          transition: 'opacity 200ms ease',
        }}
        className="memory-butterfly-halo"
      />
      {/* Wing-flap wrapper */}
      <motion.div
        animate={{ scaleX: [1, 0.55, 1, 0.55, 1] }}
        transition={{
          duration: anchor.flapDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: 'center', position: 'relative' }}
      >
        <Plant
          name="butterfly"
          width={anchor.size}
          saturate={anchor.saturate}
          hueRotate={anchor.hueRotate}
          opacity={0.95}
        />
      </motion.div>
    </motion.button>
  )
}
```

- [ ] **Step 4: Add the container component (default export)**

Append to the same file:

```tsx
export function MeadowMemoryButterflies({
  memoryStars,
  onSelect,
  theme: _theme,
  getMoodColor,
}: MeadowMemoryButterfliesProps) {
  // Bind the first N memoryStars (max 5) to the leftmost anchors so layout
  // stays stable when there are fewer memories than anchors.
  const visible = memoryStars.slice(0, HOMES.length)

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      {visible.map((star, i) => {
        const anchor = HOMES[i]
        const haloColor = getMoodColor(star.entry.mood)
        return (
          <MemoryButterfly
            key={star.entry.id}
            anchor={anchor}
            star={star}
            haloColor={haloColor}
            onClick={() => onSelect(star)}
          />
        )
      })}
    </div>
  )
}
```

The unused `_theme` prop is kept on the interface so adding theme-aware tweaks later doesn't change the call site. Underscore prefix avoids the lint warning.

- [ ] **Step 5: Lint and typecheck**

Run from repo root:

```bash
docker compose exec app npm run lint -- src/components/constellation/garden/MeadowMemoryButterflies.tsx
```

Expected: no errors. If `MemoryStar` import path is rejected, double-check it lives at `'../ConstellationRenderer'` relative to `garden/` (it does — `MeadowScene` already imports it from there).

Then run a quick typecheck (full build is fine but slow; `next build --no-lint` is faster than full):

```bash
docker compose exec app npx tsc --noEmit
```

Expected: no new errors introduced by this file. (Pre-existing repo errors, if any, are out of scope.)

- [ ] **Step 6: Commit**

```bash
git add src/components/constellation/garden/MeadowMemoryButterflies.tsx
git commit -m "feat(sage): add MeadowMemoryButterflies — clickable looping butterflies bound to memoryStars"
```

---

## Task 2: Create `MeadowGarden` component

**Files:**
- Create: `src/components/constellation/garden/MeadowGarden.tsx`

- [ ] **Step 1: Create the file with imports and types**

```tsx
'use client'

import type { Theme } from '@/lib/themes'
import { Plant, type PlantName } from './Plant'

interface GardenItem {
  id: string
  name: PlantName
  /** X in % of viewport width */
  x: number
  /** Y in % of viewport height */
  y: number
  /** Sprite size in px */
  size: number
  /** Rotation in degrees */
  rotate: number
  /** Saturation override for this item */
  saturate?: number
  /** Z-order; higher = in front */
  z: number
}
```

- [ ] **Step 2: Add the static layout constants**

Append:

```tsx
/**
 * Back row: three fence segments straddling the mid-horizontal axis,
 * with slight horizontal jitter so they don't read as one continuous
 * line. Lower saturation pushes them visually behind the flower row.
 */
const FENCE: GardenItem[] = [
  { id: 'fence-l', name: 'fence', x: 18, y: 60, size: 110, rotate: 0,  saturate: 0.55, z: 1 },
  { id: 'fence-c', name: 'fence', x: 42, y: 61, size: 130, rotate: 0,  saturate: 0.55, z: 1 },
  { id: 'fence-r', name: 'fence', x: 66, y: 60, size: 110, rotate: 0,  saturate: 0.55, z: 1 },
]

/**
 * Flower cluster — 11 stems / blossoms across the band. Sizes and
 * rotations chosen for a "tended but informal" look. Z-order layers
 * taller stems behind shorter ones so the bouquet reads as planted.
 */
const FLOWERS: GardenItem[] = [
  { id: 'sun-1',  name: 'sunflower', x: 22, y: 72, size: 46, rotate: -4,  z: 5 },
  { id: 'rose-1', name: 'rose',      x: 30, y: 70, size: 36, rotate: 6,   z: 6 },
  { id: 'tul-1',  name: 'tulip',     x: 36, y: 74, size: 32, rotate: -3,  z: 7 },
  { id: 'hib-1',  name: 'hibiscus',  x: 44, y: 71, size: 38, rotate: 4,   z: 6 },
  { id: 'bls-1',  name: 'blossom',   x: 50, y: 75, size: 28, rotate: -2,  z: 7 },
  { id: 'bouq-1', name: 'bouquet',   x: 56, y: 70, size: 44, rotate: 2,   z: 5 },
  { id: 'wht-1',  name: 'wheat',     x: 62, y: 73, size: 34, rotate: -5,  z: 6 },
  { id: 'tul-2',  name: 'tulip',     x: 68, y: 74, size: 30, rotate: 3,   z: 7 },
  { id: 'rose-2', name: 'rose',      x: 74, y: 72, size: 32, rotate: -4,  z: 6 },
  { id: 'bls-2',  name: 'blossom',   x: 79, y: 75, size: 26, rotate: 5,   z: 7 },
  { id: 'sun-2',  name: 'sunflower', x: 84, y: 71, size: 40, rotate: -2,  z: 5 },
]

/**
 * Two potted plants flanking the cluster as visual weight.
 */
const POTS: GardenItem[] = [
  { id: 'pot-l', name: 'potted-plant', x: 14, y: 78, size: 56, rotate: -2, z: 4 },
  { id: 'pot-r', name: 'potted-plant', x: 88, y: 78, size: 56, rotate: 2,  z: 4 },
]

const ITEMS: GardenItem[] = [...FENCE, ...POTS, ...FLOWERS]
```

- [ ] **Step 3: Add the component**

Append:

```tsx
interface MeadowGardenProps {
  theme: Theme
}

export function MeadowGarden({ theme: _theme }: MeadowGardenProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      {ITEMS.map(item => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: item.z,
          }}
        >
          <Plant
            name={item.name}
            width={item.size}
            rotate={item.rotate}
            saturate={item.saturate ?? 0.7}
            opacity={0.95}
          />
        </div>
      ))}
    </div>
  )
}
```

The `theme` prop is currently unused but preserved on the interface so future tweaks (e.g. theme-aware saturation) don't change the call site.

- [ ] **Step 4: Lint and typecheck**

```bash
docker compose exec app npm run lint -- src/components/constellation/garden/MeadowGarden.tsx
docker compose exec app npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/constellation/garden/MeadowGarden.tsx
git commit -m "feat(sage): add MeadowGarden — static OpenMoji flower cluster"
```

---

## Task 3: Wire new components into `MeadowScene`

**Files:**
- Modify: `src/components/constellation/garden/scenes/MeadowScene.tsx`

The current file imports `LetterClothesline`, mounts it in the JSX, and renders `<AmbientDrift theme={theme} />` (which shows all 5 ambient butterflies + bee + bird). We will:
1. Remove the `LetterClothesline` import.
2. Add imports for `MeadowMemoryButterflies` and `MeadowGarden`.
3. Replace `<LetterClothesline ... />` with `<MeadowGarden theme={theme} />` placed before `<AmbientDrift />`, and `<MeadowMemoryButterflies ... />` placed after `<AmbientDrift />` so it stacks above ambient layers.
4. Pass `creatures={['bee', 'bird']}` to `<AmbientDrift />` so its 5 ambient butterflies stop rendering.

- [ ] **Step 1: Update imports**

In `src/components/constellation/garden/scenes/MeadowScene.tsx`, replace:

```tsx
import { AmbientDrift } from '../AmbientDrift'
import { LetterClothesline } from '../LetterClothesline'
```

with:

```tsx
import { AmbientDrift } from '../AmbientDrift'
import { MeadowMemoryButterflies } from '../MeadowMemoryButterflies'
import { MeadowGarden } from '../MeadowGarden'
```

- [ ] **Step 2: Replace clothesline with garden + butterflies in JSX**

In the same file, find the block that currently reads:

```tsx
      <Wildflowers parallax={parallax} theme={theme} />
      <LetterClothesline
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
      <AmbientDrift theme={theme} />
      <ForegroundFrame parallax={parallax} theme={theme} />
```

Replace with:

```tsx
      <Wildflowers parallax={parallax} theme={theme} />
      <MeadowGarden theme={theme} />
      <AmbientDrift theme={theme} creatures={['bee', 'bird']} />
      <MeadowMemoryButterflies
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
      <ForegroundFrame parallax={parallax} theme={theme} />
```

- [ ] **Step 3: Lint and typecheck**

```bash
docker compose exec app npm run lint -- src/components/constellation/garden/scenes/MeadowScene.tsx
docker compose exec app npx tsc --noEmit
```

Expected: no new errors. If lint reports `LetterClothesline` as unused, that confirms Step 1 succeeded (we removed the import).

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/scenes/MeadowScene.tsx
git commit -m "feat(sage): swap clothesline for butterfly memory reveal + flower garden"
```

---

## Task 4: Manual browser verification

**No file changes** — runs through the spec's testing list against a live dev server.

- [ ] **Step 1: Start the stack and tail logs**

```bash
docker compose up -d
docker compose logs -f app
```

Wait until you see Next.js report it's serving on `http://localhost:3111` (or whatever port your `NEXT_PUBLIC_APP_URL` uses). Leave the log stream open in a side terminal so you can spot runtime errors.

- [ ] **Step 2: Verify Sage with ≥5 memories**

1. In the app: switch theme to Sage (theme switcher — note Sage is in the active list per recent commits).
2. Make sure the active user has ≥5 entries (use the seed script `docker compose exec app npx tsx prisma/seed.ts` if needed).
3. Navigate to `/constellation`.

Expected: 5 differently-colored butterflies looping in stable regions of the upper-mid screen. No clothesline. A flower garden (fence behind, flowers in front, two pots flanking) sits in the lower-mid band.

- [ ] **Step 3: Verify Sage with fewer than 5 memories**

Either temporarily archive entries, or seed a fresh user with 2 entries. Reload `/constellation`.

Expected: exactly 2 butterflies appear, in the leftmost two anchor positions (around x=18%, x=36%). Flower garden still present.

- [ ] **Step 4: Verify empty Sage state**

With a user that has zero entries, navigate to `/constellation`.

Expected: the existing "your garden is waiting…" empty state renders. No butterflies, no garden.

- [ ] **Step 5: Verify click → modal**

With ≥5 memories, click any butterfly.

Expected: `MemoryModal` opens for the corresponding entry. Behind the modal backdrop, the other butterflies keep flying (no freeze).

- [ ] **Step 6: Verify hover and keyboard focus**

1. Hover a butterfly → cursor becomes pointer; butterfly grows slightly (~15%); halo brightens.
2. Press Tab from somewhere on the page → focus moves through the butterflies; pressing Enter on a focused butterfly opens the modal.

Expected: both behaviors work; focus is visually apparent (via the scale change).

- [ ] **Step 7: Verify mood-color halo**

Find an entry you know is high-mood (mood index 3 or 4) and a low-mood entry (0 or 1). Confirm the corresponding butterflies' halos differ — warm tint for high mood, cool tint for low mood, matching `getMoodColor`.

(Tip: hover the entries in the journal first to recall their moods, or check `/constellation` itself — modal shows the mood color.)

- [ ] **Step 8: Verify other themes are untouched**

Switch to each of: rose, ocean, postal, hearth, rivendell. Open `/constellation` for each.

Expected: visuals identical to before this change. Rose still shows roses; postal still shows the mailbox scene; hearth/rivendell still show the cosmos.

- [ ] **Step 9: Verify resize behavior**

In Sage with ≥5 memories on `/constellation`:
1. Drag the browser window from desktop width to ~mobile-portrait width.
2. Confirm butterflies stay inside the viewport (loops use vw/vh, so they should rescale naturally).
3. Confirm the flower garden remains visible and roughly centered.

- [ ] **Step 10: Final commit (only if any tweaks needed)**

If steps 2–9 surfaced visual nits (anchor overlapping, butterfly clipping the garden, halo too strong, etc.), tweak the `HOMES` constants in `MeadowMemoryButterflies.tsx` or the `FLOWERS`/`FENCE`/`POTS` arrays in `MeadowGarden.tsx`. Re-run Steps 2–9 after each tweak. Commit with:

```bash
git add src/components/constellation/garden/MeadowMemoryButterflies.tsx src/components/constellation/garden/MeadowGarden.tsx
git commit -m "fix(sage): tune butterfly anchors / garden composition after browser pass"
```

If no tweaks are needed, skip this step.

---

## Self-Review Notes

**Spec coverage:**
- 5 butterflies, one per memoryStar → Task 1 (`HOMES`, `visible.map`).
- Always-on-screen looping motion → Task 1 Step 3 (motion keyframes around home anchor).
- Click → MemoryModal → Task 1 (`onSelect`) + Task 3 (passes `setSelectedStar` from MeadowScene).
- Halo with `getMoodColor` → Task 1 Step 3.
- Hover + keyboard focus accessibility → Task 1 Step 3 (`whileHover`, `whileFocus`, `<button>`, `aria-label`).
- Bee + bird preserved as ambient → Task 3 Step 2 (`creatures={['bee', 'bird']}`).
- Flower garden using only existing OpenMoji glyphs → Task 2 (`fence`, `bouquet`, `tulip`, `hibiscus`, `sunflower`, `rose`, `blossom`, `wheat`, `potted-plant`).
- Clothesline removed from MeadowScene; file not deleted → Task 3 (import removed, JSX replaced; `LetterClothesline.tsx` untouched).
- Fewer-than-5 memories edge case → Task 1 Step 4 (`memoryStars.slice(0, HOMES.length)`); Task 4 Step 3 (browser verify).
- Zero-memories edge case → Task 4 Step 4 (existing empty-state branch in MeadowScene handles it; no new code needed).
- Other themes untouched → Task 4 Step 8.

**Placeholder scan:** No "TBD", no "implement appropriately", no "similar to above" — every code step shows the actual code.

**Type consistency:** `MemoryStar` imported from `'../ConstellationRenderer'` in Task 1 matches the existing import path in `MeadowScene.tsx`. `PlantName` and `Plant` import from `'./Plant'` match the existing `AmbientDrift.tsx` pattern. `Theme` from `'@/lib/themes'` matches the project alias. `creatures={['bee', 'bird']}` matches the existing `Creature` union (`'butterfly' | 'bee' | 'bird'`) in `AmbientDrift.tsx`.
