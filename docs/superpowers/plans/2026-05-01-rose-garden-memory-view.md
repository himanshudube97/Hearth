# Rose Garden Memory View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the rose theme its own `/constellation` scene — a rose-flower garden where each rose is a clickable memory — and rename the nav entry from "Stars" to "Memory".

**Architecture:** Refactor the existing `GardenRenderer` into a thin theme-dispatcher, extract the current postal and generic-meadow scenes into dedicated files (visual-equivalent), then build a new `RoseGardenScene` composed of small SVG layer components (sky, path, trellis, blooms, flora, petals). Click handling reuses the existing `MemoryModal`.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, Framer Motion v12 for animation, inline SVG for all scene art, Docker Compose for the dev stack. No automated test framework — visual changes are manually verified in the browser per project convention.

**Spec:** `docs/superpowers/specs/2026-05-01-rose-garden-memory-view-design.md`

---

## File Structure

**Created:**
- `src/components/constellation/garden/scenes/PostalScene.tsx` — current postal branch, extracted
- `src/components/constellation/garden/scenes/MeadowScene.tsx` — current default branch, extracted
- `src/components/constellation/garden/scenes/RoseGardenScene.tsx` — new rose scene
- `src/components/constellation/garden/rose/RoseSky.tsx`
- `src/components/constellation/garden/rose/GardenPath.tsx`
- `src/components/constellation/garden/rose/Trellis.tsx`
- `src/components/constellation/garden/rose/RoseSVG.tsx`
- `src/components/constellation/garden/rose/RoseBlooms.tsx`
- `src/components/constellation/garden/rose/ScatteredFlora.tsx`
- `src/components/constellation/garden/rose/PetalDrift.tsx`
- `src/components/constellation/garden/rose/roseHash.ts`

**Modified:**
- `src/components/constellation/GardenRenderer.tsx` — becomes a thin scene dispatcher
- `src/components/Navigation.tsx` — line 16 label rename

**Unchanged:**
- `src/components/constellation/MemoryModal.tsx`
- `src/components/constellation/ConstellationRenderer.tsx`
- `src/app/constellation/page.tsx`
- All existing files under `garden/` (AmbientDrift, Bunting, gardenLayers, LampLetterbox, LeftLamp, LetterClothesline, Mailbox, Plant, PostalSky, useGardenParallax)

---

## Convention notes for the implementer

- **Dev stack runs in Docker.** Restart with `docker compose restart app` after touching code; tail logs with `docker compose logs -f app`. The app is served on `http://localhost:3111`.
- **Theme switching** for manual verification: click the theme dot in the header (`ThemeSwitcher`) and pick the theme. The `/constellation` route is in nav as "Stars" (rename happens in Task 14).
- **Path alias** `@/*` → `./src/*`. All imports in this plan use the alias.
- **No unit tests.** Each task ends with a manual browser verification step instead of a test run. Read carefully — if the verification doesn't match, the task isn't done.

---

## Task 1: Extract PostalScene (refactor, visual-equivalent)

**Goal:** Pull the postal branch out of `GardenRenderer.tsx` into its own file. No visual change.

**Files:**
- Create: `src/components/constellation/garden/scenes/PostalScene.tsx`
- Modify: `src/components/constellation/GardenRenderer.tsx`

- [ ] **Step 1: Create the PostalScene file**

Path: `src/components/constellation/garden/scenes/PostalScene.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { useGardenParallax } from '../useGardenParallax'
import {
  DuskSky,
  StarField,
  CloudDrift,
  FarVillage,
  DistantVillage,
  NearVillage,
  CurvedPath,
  PaperPlanes,
  EnvelopeBalloon,
  GroundLine,
} from '../PostalSky'
import { LampLetterbox } from '../LampLetterbox'
import { LeftLamp } from '../LeftLamp'
import { Bunting } from '../Bunting'

export interface PostalSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function PostalScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: PostalSceneProps) {
  const parallax = useGardenParallax()

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
          className="text-center"
        >
          <motion.div
            className="text-2xl mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: theme.text.muted }}
          >
            ✦
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            sorting the evening post…
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-50">✉</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            the post hasn&apos;t arrived yet — write something and the first letter will fly in
          </p>
        </motion.div>
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
      <DuskSky parallax={parallax} theme={theme} />
      <StarField parallax={parallax} theme={theme} />
      <CloudDrift parallax={parallax} theme={theme} />
      <FarVillage parallax={parallax} theme={theme} />
      <DistantVillage parallax={parallax} theme={theme} />
      <NearVillage parallax={parallax} theme={theme} />
      <PaperPlanes parallax={parallax} theme={theme} />
      <EnvelopeBalloon parallax={parallax} theme={theme} />
      <CurvedPath parallax={parallax} theme={theme} />
      <GroundLine theme={theme} />
      <LeftLamp theme={theme} parallax={parallax} />
      <Bunting parallax={parallax} />
      <LampLetterbox theme={theme} parallax={parallax} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          evening post
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'letter on the wind' : 'letters on the wind'}
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

- [ ] **Step 2: Replace `GardenRenderer.tsx` with a temporary dispatcher that uses `PostalScene` for postal and inlines the meadow branch**

Path: `src/components/constellation/GardenRenderer.tsx`

Keep the file's existing imports for the meadow branch; add the PostalScene import and replace the postal branch with `<PostalScene {...props} />`. The full file should look like:

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { MemoryModal } from './MemoryModal'
import { useGardenParallax } from './garden/useGardenParallax'
import {
  SkyBand,
  Hills,
  DistantTrees,
  MidGrove,
  Wildflowers,
  ForegroundFrame,
  GroundBand,
} from './garden/gardenLayers'
import { AmbientDrift } from './garden/AmbientDrift'
import { LetterClothesline } from './garden/LetterClothesline'
import { PostalScene } from './garden/scenes/PostalScene'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function GardenRenderer(props: GardenRendererProps) {
  const { theme } = props
  if (theme.ambience === 'postal') {
    return <PostalScene {...props} />
  }
  return <MeadowInline {...props} />
}

function MeadowInline({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: GardenRendererProps) {
  const parallax = useGardenParallax()

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
          className="text-center"
        >
          <motion.div
            className="text-2xl mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: theme.text.muted }}
          >
            ✿
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            tending the garden...
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-50">✿</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            your garden is waiting for its first leaf — write something to begin
          </p>
        </motion.div>
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
      <SkyBand parallax={parallax} theme={theme} />
      <Hills parallax={parallax} theme={theme} />
      <DistantTrees parallax={parallax} theme={theme} />
      <MidGrove parallax={parallax} theme={theme} />
      <GroundBand theme={theme} />
      <Wildflowers parallax={parallax} theme={theme} />
      <LetterClothesline
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
      <AmbientDrift theme={theme} />
      <ForegroundFrame parallax={parallax} theme={theme} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your garden
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'letter pressed' : 'letters pressed'}
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

- [ ] **Step 3: Build & verify**

Run:
```bash
docker compose restart app && docker compose logs -f app | head -50
npm run lint
```

Then in browser at `http://localhost:3111/constellation`:
- Switch to **postal** theme → confirm the dusk-sky/lamp/letterbox scene appears identical to before.
- Switch to **sage** theme → confirm meadow scene with hills/clothesline appears identical to before.

If anything looks shifted, you copy-pasted incorrectly — diff against the original `GardenRenderer.tsx` from git history.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/scenes/PostalScene.tsx src/components/constellation/GardenRenderer.tsx
git commit -m "refactor(constellation): extract PostalScene from GardenRenderer"
```

---

## Task 2: Extract MeadowScene (refactor, visual-equivalent)

**Goal:** Move the inlined meadow branch from `GardenRenderer.tsx` into `MeadowScene.tsx`. After this, `GardenRenderer.tsx` is a tiny dispatcher.

**Files:**
- Create: `src/components/constellation/garden/scenes/MeadowScene.tsx`
- Modify: `src/components/constellation/GardenRenderer.tsx`

- [ ] **Step 1: Create the MeadowScene file**

Path: `src/components/constellation/garden/scenes/MeadowScene.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { useGardenParallax } from '../useGardenParallax'
import {
  SkyBand,
  Hills,
  DistantTrees,
  MidGrove,
  Wildflowers,
  ForegroundFrame,
  GroundBand,
} from '../gardenLayers'
import { AmbientDrift } from '../AmbientDrift'
import { LetterClothesline } from '../LetterClothesline'

export interface MeadowSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function MeadowScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: MeadowSceneProps) {
  const parallax = useGardenParallax()

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
          className="text-center"
        >
          <motion.div
            className="text-2xl mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: theme.text.muted }}
          >
            ✿
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            tending the garden...
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-50">✿</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            your garden is waiting for its first leaf — write something to begin
          </p>
        </motion.div>
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
      <SkyBand parallax={parallax} theme={theme} />
      <Hills parallax={parallax} theme={theme} />
      <DistantTrees parallax={parallax} theme={theme} />
      <MidGrove parallax={parallax} theme={theme} />
      <GroundBand theme={theme} />
      <Wildflowers parallax={parallax} theme={theme} />
      <LetterClothesline
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
      <AmbientDrift theme={theme} />
      <ForegroundFrame parallax={parallax} theme={theme} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your garden
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'letter pressed' : 'letters pressed'}
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

- [ ] **Step 2: Slim `GardenRenderer.tsx` down to a dispatcher**

Path: `src/components/constellation/GardenRenderer.tsx` — replace the entire file with:

```tsx
'use client'

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { PostalScene } from './garden/scenes/PostalScene'
import { MeadowScene } from './garden/scenes/MeadowScene'

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
    default:
      return <MeadowScene {...props} />
  }
}
```

- [ ] **Step 3: Build & verify**

Run:
```bash
docker compose restart app
npm run lint
```

In browser at `http://localhost:3111/constellation`:
- Switch through **sage**, **ocean**, **linen** themes one by one — each should look identical to before this refactor (meadow scene with theme-tinted colors).
- Switch to **postal** — still the dusk scene.
- Switch to **rose** — still meadow (rose-specific scene comes in Task 3+).
- Switch to **rivendell** / **hearth** — still cosmos. Unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/scenes/MeadowScene.tsx src/components/constellation/GardenRenderer.tsx
git commit -m "refactor(constellation): extract MeadowScene; GardenRenderer is now a dispatcher"
```

---

## Task 3: Stub RoseGardenScene + wire dispatcher

**Goal:** Add the rose case to the dispatcher and a placeholder scene so we can iterate visually from here.

**Files:**
- Create: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`
- Modify: `src/components/constellation/GardenRenderer.tsx`

- [ ] **Step 1: Create RoseGardenScene with placeholder content**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'

export interface RoseGardenSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function RoseGardenScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: RoseGardenSceneProps) {
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
        <p style={{ color: theme.text.muted, fontStyle: 'italic' }}>
          tending the rose garden…
        </p>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p style={{ color: theme.text.muted, fontStyle: 'italic' }}>
          a quiet rose garden — write a memory and the first bloom appears
        </p>
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
      <p
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ color: theme.text.muted, fontStyle: 'italic' }}
      >
        rose garden coming — {memoryStars.length} blooms ready
      </p>

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

- [ ] **Step 2: Add the rose case to the dispatcher**

Path: `src/components/constellation/GardenRenderer.tsx` — replace the entire file with:

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

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

In browser:
- Switch to **rose** theme, navigate to `/constellation` → see the placeholder text *"rose garden coming — N blooms ready"*. Other themes unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/scenes/RoseGardenScene.tsx src/components/constellation/GardenRenderer.tsx
git commit -m "feat(constellation): wire RoseGardenScene placeholder into dispatcher"
```

---

## Task 4: Build the rose-id hash utility

**Goal:** Pure function that maps `entry.id` → palette index (0–4) and size (1.0–1.4). Deterministic so memories keep identity across visits.

**Files:**
- Create: `src/components/constellation/garden/rose/roseHash.ts`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/roseHash.ts`

```ts
export const ROSE_PALETTE = [
  '#B12838', // crimson
  '#E27062', // coral
  '#F4B6B0', // blush
  '#F8E8D8', // cream
  '#C898C0', // lavender-rose
] as const

export type RoseColor = (typeof ROSE_PALETTE)[number]

// Simple deterministic string hash → unsigned 32-bit int
function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function roseColorForId(id: string): RoseColor {
  return ROSE_PALETTE[hash(id) % ROSE_PALETTE.length]
}

export function roseSizeForId(id: string): number {
  // Map second-byte slice of hash into [1.0, 1.4]
  const h = hash(id + '-size')
  const t = (h % 1000) / 1000 // 0..0.999
  return 1.0 + t * 0.4
}
```

- [ ] **Step 2: Lint & commit (no visual change yet)**

```bash
npm run lint
git add src/components/constellation/garden/rose/roseHash.ts
git commit -m "feat(rose): add deterministic rose color/size hash from entry id"
```

---

## Task 5: Build RoseSky

**Goal:** Sky gradient + sun glow + two distant hill silhouettes. First visual layer.

**Files:**
- Create: `src/components/constellation/garden/rose/RoseSky.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/RoseSky.tsx`

```tsx
'use client'

export function RoseSky() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #FFE4DA 0%, #F8C8C0 50%, #E8A8A0 100%)',
        }}
      />
      {/* Sun glow blob upper-right */}
      <div
        className="absolute"
        style={{
          right: '8%',
          top: '6%',
          width: '36vmin',
          height: '36vmin',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,220,0.85) 0%, rgba(255,210,200,0.35) 40%, rgba(255,200,190,0) 70%)',
          filter: 'blur(8px)',
        }}
      />
      {/* Far hill silhouette */}
      <svg
        className="absolute bottom-[28%] left-0 w-full"
        height="120"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ opacity: 0.55 }}
      >
        <path
          d="M0,80 C180,40 360,90 540,60 C720,30 900,70 1080,55 C1260,40 1380,70 1440,55 L1440,120 L0,120 Z"
          fill="#D89090"
        />
      </svg>
      {/* Closer hill silhouette */}
      <svg
        className="absolute bottom-[22%] left-0 w-full"
        height="100"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{ opacity: 0.7 }}
      >
        <path
          d="M0,70 C200,55 380,80 560,55 C740,30 920,70 1100,50 C1280,30 1380,55 1440,45 L1440,100 L0,100 Z"
          fill="#C87878"
        />
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Render it inside RoseGardenScene's main return**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add the import near the other imports:
```tsx
import { RoseSky } from '../rose/RoseSky'
```

Replace the main `return (...)` block (the one for `entries.length > 0`) with:

```tsx
  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <RoseSky />

      <p
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ color: theme.text.muted, fontStyle: 'italic' }}
      >
        rose garden coming — {memoryStars.length} blooms ready
      </p>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
    </motion.div>
  )
```

(Note: removed `style={{ background: theme.bg.gradient }}` from the wrapper — RoseSky is now the background.)

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

In browser, rose theme `/constellation`: pink-coral sky gradient, soft sun glow upper-right, two layered rose-tinted hills along the bottom third. Placeholder text still floats above.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/RoseSky.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): add RoseSky layer with gradient, sun glow, and hills"
```

---

## Task 6: Build GardenPath

**Goal:** Stone-tile path curving from bottom-center toward the trellis center.

**Files:**
- Create: `src/components/constellation/garden/rose/GardenPath.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/GardenPath.tsx`

```tsx
'use client'

interface Tile {
  cx: number
  cy: number
  rx: number
  ry: number
  rotate: number
}

const TILES: Tile[] = [
  // Far → near. Tiles are ellipses to fake perspective.
  { cx: 50, cy: 56, rx: 1.6, ry: 0.5, rotate: 0 },
  { cx: 50, cy: 60, rx: 2.2, ry: 0.7, rotate: 0 },
  { cx: 50, cy: 64, rx: 3.0, ry: 0.9, rotate: 0 },
  { cx: 49, cy: 69, rx: 4.0, ry: 1.2, rotate: -2 },
  { cx: 50, cy: 75, rx: 5.4, ry: 1.6, rotate: 1 },
  { cx: 51, cy: 82, rx: 7.2, ry: 2.1, rotate: -1 },
  { cx: 50, cy: 92, rx: 9.6, ry: 2.8, rotate: 0 },
]

export function GardenPath() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {TILES.map((t, i) => (
          <g key={i} transform={`translate(${t.cx} ${t.cy}) rotate(${t.rotate})`}>
            {/* Soft tile shadow */}
            <ellipse cx="0" cy="0.4" rx={t.rx} ry={t.ry} fill="rgba(120,40,40,0.18)" />
            {/* Tile face */}
            <ellipse cx="0" cy="0" rx={t.rx} ry={t.ry} fill="#E8D2C8" />
            {/* Tile highlight */}
            <ellipse cx="0" cy={-t.ry * 0.4} rx={t.rx * 0.8} ry={t.ry * 0.5} fill="#F4E4DC" opacity="0.8" />
          </g>
        ))}
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Render in RoseGardenScene**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add the import:
```tsx
import { GardenPath } from '../rose/GardenPath'
```

In the main return, just after `<RoseSky />`:
```tsx
      <RoseSky />
      <GardenPath />
```

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme `/constellation`: a curved stone path from bottom-center widening toward the foreground.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/GardenPath.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): add GardenPath stone-tile path"
```

---

## Task 7: Build Trellis

**Goal:** Wooden white-painted arch with vine lattice, mid-screen, framing where the path meets the horizon.

**Files:**
- Create: `src/components/constellation/garden/rose/Trellis.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/Trellis.tsx`

```tsx
'use client'

export function Trellis() {
  // Trellis is centered horizontally, sits behind the foreground tiles.
  // Coordinate space: percentage of viewport via CSS positioning + inner SVG viewBox.
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '32%',
        width: '38vmin',
        height: '38vmin',
        transform: 'translateX(-50%)',
      }}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%">
        {/* Outer arch frame */}
        <defs>
          <linearGradient id="trellisWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4ED" />
            <stop offset="100%" stopColor="#E8DAC8" />
          </linearGradient>
        </defs>

        {/* Left post */}
        <rect x="20" y="60" width="10" height="160" fill="url(#trellisWood)" stroke="#9A7060" strokeWidth="0.6" />
        {/* Right post */}
        <rect x="170" y="60" width="10" height="160" fill="url(#trellisWood)" stroke="#9A7060" strokeWidth="0.6" />
        {/* Arch top */}
        <path
          d="M20,65 C20,15 180,15 180,65"
          fill="none"
          stroke="url(#trellisWood)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M20,65 C20,15 180,15 180,65"
          fill="none"
          stroke="#9A7060"
          strokeWidth="0.6"
          strokeLinecap="round"
        />

        {/* Lattice — diagonal cross-hatch, faint */}
        <g stroke="#D8C4B0" strokeWidth="0.8" opacity="0.7">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`d1-${i}`} x1={30 + i * 20} y1="60" x2={10 + i * 20} y2="220" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`d2-${i}`} x1={30 + i * 20} y1="220" x2={10 + i * 20} y2="60" />
          ))}
        </g>

        {/* Vines climbing the posts */}
        <g stroke="#5C7A4B" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M25,210 C28,180 22,160 26,130 C30,100 22,80 26,60" />
          <path d="M175,210 C172,180 178,160 174,130 C170,100 178,80 174,60" />
        </g>
        {/* Tiny leaves on the vines */}
        <g fill="#6E8E58">
          {[200, 180, 160, 140, 120, 100, 80].map((y, i) => (
            <ellipse key={`lL-${i}`} cx={i % 2 === 0 ? 22 : 30} cy={y} rx="2.2" ry="1.2" transform={`rotate(${i % 2 === 0 ? -25 : 25} ${i % 2 === 0 ? 22 : 30} ${y})`} />
          ))}
          {[200, 180, 160, 140, 120, 100, 80].map((y, i) => (
            <ellipse key={`lR-${i}`} cx={i % 2 === 0 ? 178 : 170} cy={y} rx="2.2" ry="1.2" transform={`rotate(${i % 2 === 0 ? 25 : -25} ${i % 2 === 0 ? 178 : 170} ${y})`} />
          ))}
        </g>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Render in RoseGardenScene**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add import:
```tsx
import { Trellis } from '../rose/Trellis'
```

In main return, after `<GardenPath />` and before the placeholder `<p>`:
```tsx
      <GardenPath />
      <Trellis />
```

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme: a creamy white arched trellis with green vines and tiny leaves climbing the posts, centered above where the path meets the horizon.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/Trellis.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): add Trellis arch with vine lattice"
```

---

## Task 8: Build RoseSVG (single bloom component)

**Goal:** A single animated rose that takes color, mood-glow color, and size as props. Reusable for the loading state, empty state, and the 7 memory blooms.

**Files:**
- Create: `src/components/constellation/garden/rose/RoseSVG.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/RoseSVG.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'

interface RoseSVGProps {
  /** Petal color (one of ROSE_PALETTE values). */
  color: string
  /** Glow halo color (typically theme.moods[mood]). */
  glow: string
  /** Size multiplier. 1.0 = base ~64px. */
  size?: number
  /** If true, this rose breathes/sways idly. Default true. */
  animate?: boolean
}

const OUTLINE = 'rgba(122,32,48,0.4)'

export function RoseSVG({ color, glow, size = 1, animate = true }: RoseSVGProps) {
  const px = 64 * size
  return (
    <div
      className="relative"
      style={{ width: px, height: px }}
    >
      {/* Mood glow halo behind the rose */}
      <div
        className="absolute"
        style={{
          inset: '-30%',
          background: `radial-gradient(circle, ${glow} 0%, ${glow}55 30%, transparent 70%)`,
          opacity: 0.5,
          filter: 'blur(6px)',
        }}
      />

      <motion.svg
        viewBox="-50 -50 100 100"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
        animate={
          animate
            ? { rotate: [-2, 2, -2], scale: [1, 1.03, 1] }
            : undefined
        }
        transition={
          animate
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        {/* Stem */}
        <path
          d="M0,30 C-3,40 4,50 0,60"
          stroke="#5C7A4B"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Leaves */}
        <ellipse cx="-10" cy="42" rx="7" ry="3.2" fill="#6E8E58" transform="rotate(-30 -10 42)" />
        <ellipse cx="10" cy="48" rx="7" ry="3.2" fill="#6E8E58" transform="rotate(30 10 48)" />

        {/* Outer petals (back layer) */}
        <g stroke={OUTLINE} strokeWidth="0.6">
          <ellipse cx="-14" cy="-4" rx="14" ry="20" fill={color} transform="rotate(-25 -14 -4)" opacity="0.92" />
          <ellipse cx="14" cy="-4" rx="14" ry="20" fill={color} transform="rotate(25 14 -4)" opacity="0.92" />
          <ellipse cx="0" cy="-18" rx="14" ry="18" fill={color} opacity="0.95" />
          <ellipse cx="-8" cy="10" rx="14" ry="16" fill={color} transform="rotate(-15 -8 10)" opacity="0.9" />
          <ellipse cx="8" cy="10" rx="14" ry="16" fill={color} transform="rotate(15 8 10)" opacity="0.9" />
        </g>

        {/* Mid petals */}
        <g stroke={OUTLINE} strokeWidth="0.5">
          <ellipse cx="-6" cy="-6" rx="10" ry="13" fill={color} transform="rotate(-20 -6 -6)" />
          <ellipse cx="6" cy="-6" rx="10" ry="13" fill={color} transform="rotate(20 6 -6)" />
          <ellipse cx="0" cy="-12" rx="10" ry="12" fill={color} />
        </g>

        {/* Inner petals (bud) */}
        <g stroke={OUTLINE} strokeWidth="0.5">
          <ellipse cx="-3" cy="-4" rx="6" ry="9" fill={color} transform="rotate(-15 -3 -4)" />
          <ellipse cx="3" cy="-4" rx="6" ry="9" fill={color} transform="rotate(15 3 -4)" />
          <ellipse cx="0" cy="-8" rx="6" ry="8" fill={color} />
        </g>

        {/* Bright highlight on inner bud */}
        <ellipse cx="0" cy="-8" rx="3" ry="5" fill="#ffffff" opacity="0.35" />

        {/* Dark center crease */}
        <path
          d="M-3,-4 C-1,-2 1,-2 3,-4"
          stroke={OUTLINE}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  )
}
```

- [ ] **Step 2: Lint & commit**

```bash
npm run lint
git add src/components/constellation/garden/rose/RoseSVG.tsx
git commit -m "feat(rose): add RoseSVG bloom with petals, leaves, and mood-glow halo"
```

(No visual change yet — wired in Task 9.)

---

## Task 9: Build RoseBlooms (lays out 7 clickable blooms)

**Goal:** Position 7 rose memories — 3 on the trellis arch + 4 on flanking bushes — and wire click → `setSelectedStar`.

**Files:**
- Create: `src/components/constellation/garden/rose/RoseBlooms.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/RoseBlooms.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../../ConstellationRenderer'
import { RoseSVG } from './RoseSVG'
import { roseColorForId, roseSizeForId } from './roseHash'

interface RoseBloomsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  getMoodColor: (mood: number) => string
  theme: Theme
}

// Anchor positions for up to 7 blooms, in viewport-percentage coords.
// Index 0..2 → on the trellis arch; 3..6 → flanking bushes.
const ANCHORS: { x: number; y: number }[] = [
  { x: 38, y: 32 }, // arch left
  { x: 50, y: 26 }, // arch top
  { x: 62, y: 32 }, // arch right
  { x: 18, y: 62 }, // bush far-left
  { x: 30, y: 70 }, // bush mid-left
  { x: 70, y: 70 }, // bush mid-right
  { x: 82, y: 62 }, // bush far-right
]

export function RoseBlooms({ memoryStars, onSelect, getMoodColor }: RoseBloomsProps) {
  const placed = useMemo(() => {
    return memoryStars.slice(0, ANCHORS.length).map((star, i) => ({
      star,
      anchor: ANCHORS[i],
      color: roseColorForId(star.id),
      size: roseSizeForId(star.id),
    }))
  }, [memoryStars])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, anchor, color, size }, i) => (
        <motion.button
          key={star.id}
          type="button"
          onClick={() => onSelect(star)}
          className="absolute cursor-pointer focus:outline-none"
          style={{
            left: `${anchor.x}%`,
            top: `${anchor.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 1.25, y: -4 }}
        >
          <RoseSVG color={color} glow={getMoodColor(star.entry.mood)} size={size} />
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Render in RoseGardenScene + remove placeholder text**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add import:
```tsx
import { RoseBlooms } from '../rose/RoseBlooms'
```

Replace the entire `entries.length > 0` `return (...)` block with:

```tsx
  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <RoseSky />
      <GardenPath />
      <Trellis />
      <RoseBlooms
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        getMoodColor={getMoodColor}
        theme={theme}
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
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your rose garden
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'bloom in the garden' : 'blooms in the garden'}
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
```

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme `/constellation`:
- 7 roses appear (3 on the arch, 4 around the path) — assuming you have 7+ entries; with fewer entries you see fewer.
- Each rose breathes idly.
- Hover a rose → it scales up.
- Click a rose → `MemoryModal` opens with the entry's text.
- Refresh the page — same memory should stay the same color (its size and color are id-derived).

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/RoseBlooms.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): render 7 clickable rose-memories on trellis and bushes"
```

---

## Task 10: Build ScatteredFlora (decorative)

**Goal:** Daisies, baby's breath sprigs, leaf clumps, and rose buds scattered along the path edges and bush bases. Pure decoration — non-interactive.

**Files:**
- Create: `src/components/constellation/garden/rose/ScatteredFlora.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/ScatteredFlora.tsx`

```tsx
'use client'

interface FloraItem {
  type: 'daisy' | 'baby' | 'leaf' | 'bud'
  x: number
  y: number
  scale: number
}

const FLORA: FloraItem[] = [
  { type: 'leaf', x: 12, y: 78, scale: 1.0 },
  { type: 'daisy', x: 16, y: 84, scale: 0.9 },
  { type: 'baby', x: 22, y: 80, scale: 1.1 },
  { type: 'bud', x: 26, y: 74, scale: 0.85 },
  { type: 'leaf', x: 36, y: 86, scale: 1.0 },
  { type: 'daisy', x: 42, y: 90, scale: 0.85 },
  { type: 'baby', x: 58, y: 88, scale: 1.0 },
  { type: 'leaf', x: 64, y: 84, scale: 0.9 },
  { type: 'bud', x: 72, y: 76, scale: 0.95 },
  { type: 'daisy', x: 78, y: 82, scale: 1.0 },
  { type: 'baby', x: 84, y: 86, scale: 0.9 },
  { type: 'leaf', x: 88, y: 80, scale: 0.85 },
  { type: 'daisy', x: 8, y: 92, scale: 1.0 },
  { type: 'leaf', x: 92, y: 94, scale: 1.1 },
]

function FloraSVG({ type, scale }: { type: FloraItem['type']; scale: number }) {
  const px = 36 * scale
  switch (type) {
    case 'daisy':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-10"
              rx="3.5"
              ry="6"
              fill="#FBF4ED"
              stroke="rgba(120,80,80,0.3)"
              strokeWidth="0.3"
              transform={`rotate(${a})`}
            />
          ))}
          <circle cx="0" cy="0" r="3" fill="#E8B040" />
        </svg>
      )
    case 'baby':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          {[
            [0, 0],
            [-6, -4],
            [6, -4],
            [-3, -10],
            [3, -10],
            [-9, 2],
            [9, 2],
            [0, -14],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#FBF4ED" />
          ))}
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.6" />
        </svg>
      )
    case 'leaf':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          <ellipse cx="-4" cy="-2" rx="9" ry="4" fill="#6E8E58" transform="rotate(-30 -4 -2)" />
          <ellipse cx="4" cy="-2" rx="9" ry="4" fill="#5C7A4B" transform="rotate(30 4 -2)" />
          <ellipse cx="0" cy="-8" rx="7" ry="3.5" fill="#7E9E68" />
        </svg>
      )
    case 'bud':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.7" />
          <ellipse cx="-4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(-30 -4 6)" />
          <ellipse cx="4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(30 4 6)" />
          <ellipse cx="0" cy="-6" rx="5" ry="7" fill="#E27062" stroke="rgba(122,32,48,0.4)" strokeWidth="0.4" />
          <ellipse cx="-2" cy="-6" rx="3" ry="6" fill="#B12838" opacity="0.5" />
        </svg>
      )
  }
}

export function ScatteredFlora() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {FLORA.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <FloraSVG type={f.type} scale={f.scale} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Render in RoseGardenScene**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add import:
```tsx
import { ScatteredFlora } from '../rose/ScatteredFlora'
```

In the main return, after `<Trellis />` and before `<RoseBlooms />`:
```tsx
      <Trellis />
      <ScatteredFlora />
      <RoseBlooms
```

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme: daisies, baby's breath sprigs, leaf clumps, and a few small rose-buds scattered along the bottom third of the screen. Non-interactive.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/ScatteredFlora.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): scatter decorative flora along path edges"
```

---

## Task 11: Build PetalDrift overlay

**Goal:** 12 falling rose petals drifting diagonally with sway. This is a scene-internal overlay; the page-level `Background.tsx` particle layer is independent and untouched.

**Files:**
- Create: `src/components/constellation/garden/rose/PetalDrift.tsx`
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Create the file**

Path: `src/components/constellation/garden/rose/PetalDrift.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import { ROSE_PALETTE } from './roseHash'

interface Petal {
  id: number
  startX: number
  drift: number
  duration: number
  delay: number
  size: number
  color: string
  rotateFrom: number
  rotateTo: number
}

// Deterministic petals so SSR + client render match.
const PETALS: Petal[] = Array.from({ length: 12 }, (_, i) => {
  const seed = i * 7
  return {
    id: i,
    startX: (seed * 13) % 100,
    drift: ((seed * 17) % 30) - 15,
    duration: 18 + ((seed * 5) % 14),
    delay: (i * 1.4) % 16,
    size: 8 + ((seed * 3) % 8),
    color: ROSE_PALETTE[i % ROSE_PALETTE.length],
    rotateFrom: -45 + ((seed * 11) % 90),
    rotateTo: 220 + ((seed * 7) % 180),
  }
})

export function PetalDrift() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PETALS.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.startX}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
          }}
          initial={{ y: 0, x: 0, rotate: p.rotateFrom, opacity: 0 }}
          animate={{
            y: '110vh',
            x: `${p.drift}vw`,
            rotate: p.rotateTo,
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.85, 1],
          }}
        >
          {/* Petal shape: small soft ellipse */}
          <svg viewBox="-10 -10 20 20" width="100%" height="100%">
            <ellipse
              cx="0"
              cy="0"
              rx="9"
              ry="5"
              fill={p.color}
              stroke="rgba(122,32,48,0.3)"
              strokeWidth="0.3"
            />
            <ellipse cx="-2" cy="-1" rx="3" ry="1.5" fill="#ffffff" opacity="0.45" />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Render in RoseGardenScene**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add import:
```tsx
import { PetalDrift } from '../rose/PetalDrift'
```

In the main return, after `<RoseBlooms ... />` and before the title block:
```tsx
      />
      <PetalDrift />

      <motion.div
```

- [ ] **Step 3: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme: petals slowly drift downward with sway across the scene. They pass behind the title overlay because they're rendered before it.

- [ ] **Step 4: Commit**

```bash
git add src/components/constellation/garden/rose/PetalDrift.tsx src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): add slow falling rose petals overlay"
```

---

## Task 12: Wire AmbientDrift (butterfly + bee)

**Goal:** Reuse the existing `garden/AmbientDrift.tsx` to add a butterfly and a bee floating across the rose scene.

**Files:**
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Add the import and render it**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add the import (next to other `garden/...` imports):
```tsx
import { AmbientDrift } from '../AmbientDrift'
```

In the main return, after `<PetalDrift />` and before the title block:
```tsx
      <PetalDrift />
      <AmbientDrift theme={theme} />

      <motion.div
```

- [ ] **Step 2: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme: a butterfly + a bee drift across the scene at varying speeds. (If the existing `AmbientDrift` only renders meadow-tuned creatures, that's still OK — they read fine in the rose palette.)

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): wire AmbientDrift creatures into rose garden"
```

---

## Task 13: Polish loading + empty states with rose visuals

**Goal:** Replace the bare-text loading/empty states with rose-bud SVG visuals using the `RoseSVG` component.

**Files:**
- Modify: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

- [ ] **Step 1: Update the loading and empty states to use `RoseSVG`**

Path: `src/components/constellation/garden/scenes/RoseGardenScene.tsx`

Add the imports near the top (alongside the other `../rose/*` imports):
```tsx
import { RoseSVG } from '../rose/RoseSVG'
```

Replace the entire `if (loading) { ... }` block with:

```tsx
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
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <RoseSVG color="#F4B6B0" glow={theme.accent.warm} size={0.5} />
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            tending the rose garden…
          </p>
        </motion.div>
      </motion.div>
    )
  }
```

Replace the entire `if (entries.length === 0) { ... }` block with:

```tsx
  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoseSVG color="#E27062" glow={theme.accent.warm} size={0.8} />
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            a quiet rose garden — write a memory and the first bloom appears
          </p>
        </motion.div>
      </motion.div>
    )
  }
```

- [ ] **Step 2: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme:
- During the brief load → small breathing rose appears with *"tending the rose garden…"* copy.
- If you have a fresh test account with 0 entries: rose theme `/constellation` shows a single rose with the empty-state copy. (To force this: temporarily comment out the API call in `src/app/constellation/page.tsx`'s `fetchEntries` and set `setEntries([])`. Revert before committing.)

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/scenes/RoseGardenScene.tsx
git commit -m "feat(rose): polish loading + empty states with rose-bud visuals"
```

---

## Task 14: Mobile-friendly bloom layout

**Goal:** Below 600px viewport width, switch to a stacked layout: 3 blooms on a smaller arch + 4 in a single bush row, so the 7 roses don't overlap.

**Files:**
- Modify: `src/components/constellation/garden/rose/RoseBlooms.tsx`

- [ ] **Step 1: Update RoseBlooms to detect viewport and pick anchors**

Path: `src/components/constellation/garden/rose/RoseBlooms.tsx`

Replace the entire file with:

```tsx
'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../../ConstellationRenderer'
import { RoseSVG } from './RoseSVG'
import { roseColorForId, roseSizeForId } from './roseHash'

interface RoseBloomsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  getMoodColor: (mood: number) => string
  theme: Theme
}

const DESKTOP_ANCHORS: { x: number; y: number }[] = [
  { x: 38, y: 32 },
  { x: 50, y: 26 },
  { x: 62, y: 32 },
  { x: 18, y: 62 },
  { x: 30, y: 70 },
  { x: 70, y: 70 },
  { x: 82, y: 62 },
]

const MOBILE_ANCHORS: { x: number; y: number }[] = [
  { x: 32, y: 36 },
  { x: 50, y: 30 },
  { x: 68, y: 36 },
  { x: 18, y: 70 },
  { x: 38, y: 76 },
  { x: 62, y: 76 },
  { x: 82, y: 70 },
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

export function RoseBlooms({ memoryStars, onSelect, getMoodColor }: RoseBloomsProps) {
  const isMobile = useIsMobile()
  const anchors = isMobile ? MOBILE_ANCHORS : DESKTOP_ANCHORS

  const placed = useMemo(() => {
    return memoryStars.slice(0, anchors.length).map((star, i) => ({
      star,
      anchor: anchors[i],
      color: roseColorForId(star.id),
      size: roseSizeForId(star.id) * (isMobile ? 0.7 : 1),
    }))
  }, [memoryStars, anchors, isMobile])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, anchor, color, size }, i) => (
        <motion.button
          key={star.id}
          type="button"
          onClick={() => onSelect(star)}
          className="absolute cursor-pointer focus:outline-none"
          style={{
            left: `${anchor.x}%`,
            top: `${anchor.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 1.25, y: -4 }}
        >
          <RoseSVG color={color} glow={getMoodColor(star.entry.mood)} size={size} />
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Build & verify**

```bash
docker compose restart app
npm run lint
```

Rose theme `/constellation`:
- Desktop (resize browser ≥ 600px): blooms in original arch + bush layout.
- Resize window to < 600px (or use Chrome devtools mobile emulation): blooms shrink and reposition so they don't overlap.
- Roses still clickable on mobile widths.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/garden/rose/RoseBlooms.tsx
git commit -m "feat(rose): add mobile-friendly bloom layout under 600px"
```

---

## Task 15: Rename nav label "Stars" → "Memory"

**Goal:** Change the nav entry copy. Route stays the same.

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Edit line 16**

Path: `src/components/Navigation.tsx`

Find the line:
```tsx
  { href: '/constellation', label: 'Stars', icon: '★' },
```

Replace with:
```tsx
  { href: '/constellation', label: 'Memory', icon: '★' },
```

- [ ] **Step 2: Build & verify**

```bash
docker compose restart app
npm run lint
```

Top nav (any signed-in route): the previously-"Stars" tab now reads **Memory** with the same star icon. Clicking it still navigates to `/constellation`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat(nav): rename Stars → Memory"
```

---

## Task 16: Final regression QA pass

**Goal:** Confirm nothing else broke and all themes render correctly.

- [ ] **Step 1: Production build**

```bash
docker compose exec app npm run build
```

Expected: completes without errors. If TypeScript or lint errors surface, fix them and recommit before continuing.

- [ ] **Step 2: Manual theme sweep**

Visit `http://localhost:3111/constellation` and switch through each theme using the theme switcher. Confirm:

- **rivendell** — cosmos with stars, unchanged.
- **hearth** — cosmos with stars, unchanged.
- **rose** — new rose garden with sky, hills, path, trellis, 7 blooms, scattered flora, drifting petals, butterfly + bee. Title says *"your rose garden"* and bloom count.
- **sage** — meadow scene with hills, trees, clothesline, ambient creatures. Identical to pre-refactor.
- **ocean** — meadow scene with theme-tinted (blue) palette. Identical to pre-refactor.
- **postal** — dusk village scene with letterbox, lamps, bunting. Identical to pre-refactor.
- **linen** — meadow scene with theme-tinted (cream) palette. Identical to pre-refactor.

For each theme: also click any visible memory tile (rose/star/letter on clothesline) → confirm `MemoryModal` opens with the correct entry text.

- [ ] **Step 3: Confirm nav rename**

On `/write`, `/scrapbook`, `/letters`, `/shelf`, `/constellation`: top nav shows **Memory** (not Stars).

- [ ] **Step 4: Commit any final fixes (if any)**

If the build or sweep surfaced fixes, commit them. Otherwise no commit needed.

- [ ] **Step 5: Hand back to user**

Plan execution complete. Summarize the final state to the user with a one-line description of each commit on the branch since the start of this plan.
