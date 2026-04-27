# Theme Sounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ambient background loops per theme (with toggle + volume) and four UI one-shot sounds (page turn, theme switch, letter seal, new entry) — all sourced from Pixabay royalty-free.

**Architecture:** Single audio layer using Howler.js. A Zustand store (`soundStore`) holds user preferences (ambient on/off, ambient volume, UI sounds on/off) with localStorage persistence. A `useAmbientSound` hook reacts to theme changes and crossfades between Howl instances. A `playSfx()` helper fires one-shots at click sites. Asset paths centralized in `src/lib/sounds.ts`. Missing files do not error — playback simply no-ops.

**Tech Stack:** Howler.js (~7kb gzipped), Zustand + persist, MP3 assets in `public/sounds/`.

**Manual asset step (out of code):** User picks 11 ambient loops + 4 one-shots from Pixabay search URLs in the design doc and drops them in `public/sounds/` with the exact filenames listed in Task 2. Code works the moment files appear; missing files silently no-op.

---

### Task 1: Install Howler.js + scaffold the sound directory

**Files:**
- Modify: `package.json` (via npm)
- Create: `public/sounds/ambient/.gitkeep`
- Create: `public/sounds/ui/.gitkeep`
- Create: `public/sounds/README.md`

- [ ] **Step 1: Install Howler + types**

```bash
docker compose exec app npm install howler
docker compose exec app npm install -D @types/howler
```

- [ ] **Step 2: Create sound directories**

```bash
mkdir -p public/sounds/ambient public/sounds/ui
touch public/sounds/ambient/.gitkeep public/sounds/ui/.gitkeep
```

- [ ] **Step 3: Create asset README listing required files**

Create `public/sounds/README.md`:

```markdown
# Hearth Sound Assets

All files MP3, mono, ~96 kbps. Source: Pixabay (royalty-free, no attribution).

## Ambient loops (`ambient/`)
Each must loop seamlessly. ~30s–2min, no abrupt events.

- `forest.mp3`        — Rivendell (forest birdsong + soft wind)
- `shire.mp3`         — Hobbiton (countryside, distant birds, brook)
- `sunset.mp3`        — Winter Sunset (soft winter wind)
- `spring.mp3`        — Cherry Blossom (spring birds, light breeze)
- `arctic.mp3`        — Northern Lights (cold arctic wind)
- `mountains.mp3`     — Misty Mountains (distant mountain wind)
- `rainy.mp3`         — Gentle Rain (soft rain, no thunder)
- `cosmos.mp3`        — Cosmos (space drone / ambient pad)
- `candle.mp3`        — Candlelight (fireplace crackle)
- `ocean.mp3`         — Ocean Twilight (slow waves, no seagulls)
- `snowy.mp3`         — Quiet Snow (soft snow wind)

## UI one-shots (`ui/`)
Short, low-key. ~0.5–1.5s.

- `page-turn.mp3`     — single soft page flip
- `theme-switch.mp3`  — soft whoosh / chime sweep
- `letter-seal.mp3`   — wax seal + envelope close
- `new-entry.mp3`     — light paper rustle

## Sourcing
Search URLs in `docs/superpowers/plans/2026-04-27-theme-sounds.md`.
Selection rule: must loop seamlessly, no human voice, no sudden events
(thunder, animal cries) — they grate on listen #50.
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json public/sounds/
git commit -m "feat(sounds): scaffold sound directories and install howler"
```

---

### Task 2: Sound asset registry

**Files:**
- Create: `src/lib/sounds.ts`

- [ ] **Step 1: Create the registry**

Create `src/lib/sounds.ts`:

```typescript
import type { Theme } from '@/lib/themes'

// Maps theme.ambience tag → ambient loop URL.
// Keep keys aligned with the `ambience` union in lib/themes.ts.
export const ambientSources: Record<Theme['ambience'], string> = {
  forest: '/sounds/ambient/forest.mp3',
  shire: '/sounds/ambient/shire.mp3',
  sunset: '/sounds/ambient/sunset.mp3',
  spring: '/sounds/ambient/spring.mp3',
  arctic: '/sounds/ambient/arctic.mp3',
  mountains: '/sounds/ambient/mountains.mp3',
  rainy: '/sounds/ambient/rainy.mp3',
  cosmos: '/sounds/ambient/cosmos.mp3',
  candle: '/sounds/ambient/candle.mp3',
  ocean: '/sounds/ambient/ocean.mp3',
  snowy: '/sounds/ambient/snowy.mp3',
}

export type SfxName = 'pageTurn' | 'themeSwitch' | 'letterSeal' | 'newEntry'

export const sfxSources: Record<SfxName, string> = {
  pageTurn: '/sounds/ui/page-turn.mp3',
  themeSwitch: '/sounds/ui/theme-switch.mp3',
  letterSeal: '/sounds/ui/letter-seal.mp3',
  newEntry: '/sounds/ui/new-entry.mp3',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sounds.ts
git commit -m "feat(sounds): add sound asset registry"
```

---

### Task 3: Sound preferences store

**Files:**
- Create: `src/store/sound.ts`

- [ ] **Step 1: Create the Zustand store**

Create `src/store/sound.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SoundStore {
  ambientEnabled: boolean
  ambientVolume: number   // 0..1
  uiSoundsEnabled: boolean
  setAmbientEnabled: (v: boolean) => void
  setAmbientVolume: (v: number) => void
  setUiSoundsEnabled: (v: boolean) => void
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      ambientEnabled: false,   // opt-in: respects user attention by default
      ambientVolume: 0.3,
      uiSoundsEnabled: false,  // opt-in: same reason
      setAmbientEnabled: (v) => set({ ambientEnabled: v }),
      setAmbientVolume: (v) => set({ ambientVolume: Math.max(0, Math.min(1, v)) }),
      setUiSoundsEnabled: (v) => set({ uiSoundsEnabled: v }),
    }),
    { name: 'hearth-sound' }
  )
)
```

- [ ] **Step 2: Commit**

```bash
git add src/store/sound.ts
git commit -m "feat(sounds): add sound preferences store"
```

---

### Task 4: SFX helper (one-shots)

**Files:**
- Create: `src/lib/playSfx.ts`

- [ ] **Step 1: Create the helper**

Create `src/lib/playSfx.ts`:

```typescript
import { Howl } from 'howler'
import { sfxSources, type SfxName } from '@/lib/sounds'
import { useSoundStore } from '@/store/sound'

// Lazy cache of Howl instances — first call to each name creates the Howl,
// subsequent calls reuse it. Howler handles concurrent plays of the same
// sound automatically.
const cache: Partial<Record<SfxName, Howl>> = {}

export function playSfx(name: SfxName) {
  // Skip on server-side render.
  if (typeof window === 'undefined') return

  const { uiSoundsEnabled, ambientVolume } = useSoundStore.getState()
  if (!uiSoundsEnabled) return

  let howl = cache[name]
  if (!howl) {
    howl = new Howl({
      src: [sfxSources[name]],
      volume: 0.5,
      preload: true,
      // If file is missing, fail silently — feature degrades gracefully.
      onloaderror: () => {
        // No-op. Avoid console noise; users may not have all assets yet.
      },
    })
    cache[name] = howl
  }

  // Tie one-shot loudness loosely to ambient volume so things stay balanced
  // when a user lowers the overall mix. Floor at 0.2 so SFX stay audible.
  howl.volume(Math.max(0.2, ambientVolume * 1.5))
  howl.play()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/playSfx.ts
git commit -m "feat(sounds): add playSfx one-shot helper"
```

---

### Task 5: Ambient sound hook

**Files:**
- Create: `src/hooks/useAmbientSound.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useAmbientSound.ts`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { useThemeStore } from '@/store/theme'
import { useSoundStore } from '@/store/sound'
import { ambientSources } from '@/lib/sounds'

const FADE_MS = 1200

// Mounts a single ambient loop tied to the active theme. Crossfades on
// theme change. Respects ambientEnabled + ambientVolume from soundStore.
//
// Browser autoplay policy: Howl.play() must be called from a user gesture
// the first time. Since ambientEnabled defaults to false and is flipped via
// a click in the settings panel, that toggle IS the user gesture — playback
// is allowed.
export function useAmbientSound() {
  const theme = useThemeStore((s) => s.theme)
  const ambientEnabled = useSoundStore((s) => s.ambientEnabled)
  const ambientVolume = useSoundStore((s) => s.ambientVolume)

  const currentRef = useRef<Howl | null>(null)
  const currentSrcRef = useRef<string | null>(null)

  // React to theme changes + enable/disable.
  useEffect(() => {
    const targetSrc = ambientEnabled ? ambientSources[theme.ambience] : null

    // No change in source — just adjust volume on existing Howl.
    if (currentSrcRef.current === targetSrc) {
      if (currentRef.current && targetSrc) {
        currentRef.current.volume(ambientVolume)
      }
      return
    }

    // Fade out the old Howl (if any), then unload it.
    const old = currentRef.current
    if (old) {
      old.fade(old.volume(), 0, FADE_MS)
      const oldRef = old
      setTimeout(() => {
        oldRef.stop()
        oldRef.unload()
      }, FADE_MS + 50)
    }

    if (!targetSrc) {
      currentRef.current = null
      currentSrcRef.current = null
      return
    }

    // Start the new Howl at 0 and fade in.
    const next = new Howl({
      src: [targetSrc],
      loop: true,
      volume: 0,
      html5: true, // streaming-friendly for longer loops
      onloaderror: () => {
        // Asset missing — silent no-op so the rest of the app still works.
      },
    })
    next.play()
    next.fade(0, ambientVolume, FADE_MS)

    currentRef.current = next
    currentSrcRef.current = targetSrc
  }, [theme.ambience, ambientEnabled, ambientVolume])

  // Stop on unmount.
  useEffect(() => {
    return () => {
      const cur = currentRef.current
      if (cur) {
        cur.stop()
        cur.unload()
      }
    }
  }, [])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAmbientSound.ts
git commit -m "feat(sounds): add useAmbientSound hook with theme-aware crossfade"
```

---

### Task 6: Mount the ambient hook in the app shell

**Files:**
- Modify: `src/components/Background.tsx` (add hook call near top of component)

- [ ] **Step 1: Add the hook to Background**

`Background.tsx` already subscribes to the theme store and renders globally — perfect mount point. Add at line ~830 (right after `const { theme, themeName } = useThemeStore()`):

```typescript
// existing
const { theme, themeName } = useThemeStore()
useAmbientSound()
```

And import at top of file (group with other hook imports):

```typescript
import { useAmbientSound } from '@/hooks/useAmbientSound'
```

- [ ] **Step 2: Verify it compiles**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Background.tsx
git commit -m "feat(sounds): mount ambient sound hook in Background"
```

---

### Task 7: Wire page turn one-shot

**Files:**
- Modify: `src/components/desk/SpreadNavigation.tsx`

- [ ] **Step 1: Add playSfx import**

At the top of `SpreadNavigation.tsx`, after the `useThemeStore` import:

```typescript
import { playSfx } from '@/lib/playSfx'
```

- [ ] **Step 2: Wrap the spread-change click**

Change line ~38 from:

```typescript
onClick={() => onSpreadChange(spreadNum)}
```

to:

```typescript
onClick={() => {
  if (spreadNum !== currentSpread) playSfx('pageTurn')
  onSpreadChange(spreadNum)
}}
```

(The `if` prevents firing the sound when the user clicks the dot they're already on.)

- [ ] **Step 3: Commit**

```bash
git add src/components/desk/SpreadNavigation.tsx
git commit -m "feat(sounds): play page-turn sfx on spread change"
```

---

### Task 8: Wire theme switch one-shot

**Files:**
- Modify: `src/components/ThemeSwitcher.tsx`
- Modify: `src/components/desk/DeskSettingsPanel.tsx`

- [ ] **Step 1: Add playSfx to ThemeSwitcher**

In `ThemeSwitcher.tsx`, add import after the themes import:

```typescript
import { playSfx } from '@/lib/playSfx'
```

Change the click handler (line ~73):

```typescript
onClick={() => {
  if (name !== themeName) playSfx('themeSwitch')
  setTheme(name)
  setIsOpen(false)
}}
```

- [ ] **Step 2: Add playSfx to DeskSettingsPanel**

In `DeskSettingsPanel.tsx`, add import:

```typescript
import { playSfx } from '@/lib/playSfx'
```

Change line ~119 from:

```typescript
onClick={() => setTheme(name)}
```

to:

```typescript
onClick={() => {
  if (name !== themeName) playSfx('themeSwitch')
  setTheme(name)
}}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeSwitcher.tsx src/components/desk/DeskSettingsPanel.tsx
git commit -m "feat(sounds): play theme-switch sfx in both pickers"
```

---

### Task 9: Wire new-entry and letter-seal one-shots

**Files:**
- Modify: `src/components/desk/EntrySelector.tsx`
- Modify: `src/app/letters/page.tsx`

- [ ] **Step 1: Wire new entry**

In `EntrySelector.tsx`, add import:

```typescript
import { playSfx } from '@/lib/playSfx'
```

Change the new-entry click handler (line ~103):

```typescript
onClick={() => {
  playSfx('newEntry')
  onEntrySelect(null)
  onNewEntry()
}}
```

- [ ] **Step 2: Wire letter seal**

In `src/app/letters/page.tsx`, add import alongside other lib imports:

```typescript
import { playSfx } from '@/lib/playSfx'
```

After the successful seal (line ~197, immediately after `if (res.ok) {`):

```typescript
if (res.ok) {
  playSfx('letterSeal')
  setSuccessData({ toLabel: recipientLabel, isFriend, unlockDate })
  setShowAnimation(true)
} else {
  // ...unchanged
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/desk/EntrySelector.tsx src/app/letters/page.tsx
git commit -m "feat(sounds): play new-entry and letter-seal sfx"
```

---

### Task 10: Add the Sound section to DeskSettingsPanel

**Files:**
- Modify: `src/components/desk/DeskSettingsPanel.tsx`

- [ ] **Step 1: Import the sound store**

Add to imports near the top (next to `useDeskSettings`):

```typescript
import { useSoundStore } from '@/store/sound'
```

- [ ] **Step 2: Read sound state in component**

After `const { pageOpacity, setPageOpacity } = useDeskSettings()`:

```typescript
const {
  ambientEnabled,
  ambientVolume,
  uiSoundsEnabled,
  setAmbientEnabled,
  setAmbientVolume,
  setUiSoundsEnabled,
} = useSoundStore()
```

- [ ] **Step 3: Add the Sound section markup**

Inside the drawer's scroll container, **after** the Page Opacity `<section>` and **before** the closing `</div>` at line ~210, insert:

```tsx
{/* Sound */}
<section>
  <h3 className="text-xs uppercase tracking-[0.15em] mb-3" style={{ color: theme.text.muted }}>
    Sound
  </h3>

  {/* Ambient toggle row */}
  <div className="flex items-center justify-between mb-3">
    <div>
      <p className="text-xs" style={{ color: theme.text.primary }}>
        Ambient
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: theme.text.muted }}>
        Background loop matched to your theme
      </p>
    </div>
    <button
      onClick={() => setAmbientEnabled(!ambientEnabled)}
      className="w-10 h-6 rounded-full relative transition-colors"
      style={{
        background: ambientEnabled ? theme.accent.warm : theme.glass.border,
      }}
      aria-label="Toggle ambient sound"
    >
      <motion.span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
        animate={{ left: ambientEnabled ? '18px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>

  {/* Volume slider — only meaningful when ambient is on */}
  <div className="mb-4" style={{ opacity: ambientEnabled ? 1 : 0.4 }}>
    <div className="flex items-baseline justify-between mb-2">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.text.muted }}>
        Volume
      </span>
      <span className="text-[10px] font-mono" style={{ color: theme.text.primary }}>
        {Math.round(ambientVolume * 100)}%
      </span>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(ambientVolume * 100)}
      onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
      disabled={!ambientEnabled}
      className="w-full h-1 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${theme.accent.warm} 0%, ${theme.accent.warm} ${ambientVolume * 100}%, ${theme.glass.border} ${ambientVolume * 100}%, ${theme.glass.border} 100%)`,
        accentColor: theme.accent.warm,
      }}
    />
  </div>

  {/* UI sounds toggle row */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs" style={{ color: theme.text.primary }}>
        UI sounds
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: theme.text.muted }}>
        Page turns, theme changes, letter seals
      </p>
    </div>
    <button
      onClick={() => setUiSoundsEnabled(!uiSoundsEnabled)}
      className="w-10 h-6 rounded-full relative transition-colors"
      style={{
        background: uiSoundsEnabled ? theme.accent.warm : theme.glass.border,
      }}
      aria-label="Toggle UI sounds"
    >
      <motion.span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
        animate={{ left: uiSoundsEnabled ? '18px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
</section>
```

- [ ] **Step 4: Verify build**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/desk/DeskSettingsPanel.tsx
git commit -m "feat(sounds): add Sound section to desk settings panel"
```

---

### Task 11: Manual QA pass

**Files:** none (testing only)

- [ ] **Step 1: Drop placeholder sound files**

For QA, drop any short MP3 into each `public/sounds/ambient/*.mp3` and `public/sounds/ui/*.mp3` slot — even one file copied 11+4 times is fine to verify wiring. Final assets get curated from Pixabay separately.

- [ ] **Step 2: Restart app**

```bash
docker compose restart app
```

- [ ] **Step 3: Verify ambient defaults off**

Open the app fresh (clear localStorage `hearth-sound` if needed). Confirm: no sound plays on load.

- [ ] **Step 4: Verify ambient toggle**

Open desk settings → Sound section → toggle Ambient on. Confirm: loop fades in within ~1.2s. Drag volume slider: confirm volume responds live.

- [ ] **Step 5: Verify theme crossfade**

With ambient on, switch themes via the gear panel. Confirm: old loop fades out, new theme's loop fades in.

- [ ] **Step 6: Verify UI sounds**

Toggle UI sounds on. Test each:
- Click a different page dot in spread navigation → page-turn plays
- Switch theme → theme-switch plays (in addition to ambient crossfade)
- Click "New Entry" in the entry selector → new-entry plays
- Send a future letter (in `/letters`) → letter-seal plays after success

- [ ] **Step 7: Verify graceful failure**

Delete one ambient file (e.g. `forest.mp3`), reload, switch to Rivendell theme. Confirm: no console errors, app still functions, just no sound for that theme.

- [ ] **Step 8: Verify persistence**

Set ambient volume to 60%, enable UI sounds, reload page. Confirm both settings stick.

- [ ] **Step 9: Final commit if any tweaks**

```bash
git add -A
git commit -m "feat(sounds): post-QA tweaks" # only if needed
```

---

## Asset sourcing (separate manual step)

User picks files from these Pixabay searches and drops them in `public/sounds/` with the filenames listed in Task 1's README. License: royalty-free, no attribution, commercial OK.

**Ambient (one each):**
- forest → https://pixabay.com/sound-effects/search/forest-ambience/
- shire → https://pixabay.com/sound-effects/search/countryside/
- sunset → https://pixabay.com/sound-effects/search/winter-wind/
- spring → https://pixabay.com/sound-effects/search/spring-birds/
- arctic → https://pixabay.com/sound-effects/search/arctic-wind/
- mountains → https://pixabay.com/sound-effects/search/mountain-wind/
- rainy → https://pixabay.com/sound-effects/search/gentle-rain/
- cosmos → https://pixabay.com/sound-effects/search/space-ambient/
- candle → https://pixabay.com/sound-effects/search/fireplace/
- ocean → https://pixabay.com/sound-effects/search/ocean-waves/
- snowy → https://pixabay.com/sound-effects/search/snow-wind/

**One-shots:**
- page-turn → https://pixabay.com/sound-effects/search/page-turn/
- theme-switch → https://pixabay.com/sound-effects/search/soft-whoosh/
- letter-seal → https://pixabay.com/sound-effects/search/sealing%20wax/
- new-entry → https://pixabay.com/sound-effects/search/paper-rustle/

**Selection rule:** must loop seamlessly (ambient), no human voice, no sudden events (thunder, animal cries, alarm tones).
