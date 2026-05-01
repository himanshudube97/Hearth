# Hearth Fireplace Memory View — Design

**Date:** 2026-05-01
**Theme scope:** `hearth` (firelight, dark mode) — does not affect any other theme

## Problem

The Memory page (`/constellation`) currently dispatches by `theme.mode`:

- Light themes → `GardenRenderer`, which switches by `theme.ambience` and gives `rose` and `postal` their own scenes.
- Dark themes → `ConstellationRenderer` (cosmos starfield), with no further branching.

This means the Hearth theme — whose ambience is `firelight` and whose particle is `embers` — falls through to the same starfield as Rivendell. Visually identical to a forest theme, off-brand for the app called "Hearth," and the only major theme without a unique Memory scene.

The longer-term plan is to give every theme its own Memory UI; this spec ships the first dark-side scene and establishes the dispatcher pattern that future dark themes will plug into.

## Goal

Give the Hearth theme a unique Memory view: an illustrative cottage with an arched fireplace at its center, a real burning flame inside the opening, and 5–7 envelope-style letters tacked to the surrounding brick wall. Clicking a letter opens the existing `MemoryModal` with that entry. Visually consistent with the cottagecore vignettes already shipped (`RoseGardenScene`, `PostalScene`).

Out of scope: redesigning Memory views for any other theme, changing the entries data flow, changing `MemoryModal`, changing how memories are sampled (still 7 random per visit).

## Visual concept

A peaked-roof brick cottage silhouette fills most of the frame, set against the deep firelight night background. An arched opening is centered in the cottage; logs sit at the base with a real burning flame above them, and ambient sparks drift up inside the chimney (decorative — not clickable). Around the opening — top row of three across the peaked roof, two on the sides, two lower — sit envelope-shaped diamond letters, each with a small wax seal at its center whose color encodes the entry's mood. Some letters faintly glow ("surfaced tonight"). Clicking a letter is the only interactive action on the page.

## Architecture

Mirror the light-side dispatch pattern on the dark side.

**Today:**
```
ConstellationPage
  ├─ light → GardenRenderer (switch by ambience: postal | rose | default→meadow)
  └─ dark  → ConstellationRenderer (starfield)
```

**After:**
```
ConstellationPage
  ├─ light → GardenRenderer (unchanged)
  └─ dark  → FirelightRenderer (new)
              ├─ ambience === 'firelight' → HearthScene (new)
              └─ default                  → ConstellationRenderer (unchanged)
```

`ConstellationRenderer` (the starfield) is preserved as the dark-side fallback so Rivendell is unaffected. Future dark themes can be added by extending `FirelightRenderer`'s switch — no further changes to `ConstellationPage`.

## Components

### New files

| Path | Purpose |
| --- | --- |
| `src/components/constellation/FirelightRenderer.tsx` | Dark-side dispatcher; switches by `theme.ambience`. Mirrors `GardenRenderer`. |
| `src/components/constellation/firelight/scenes/HearthScene.tsx` | Orchestrator. Composes the cottage frame, fire, sparks, and letter wall. Handles loading + empty states. |
| `src/components/constellation/firelight/CottageFrame.tsx` | Static SVG: peaked-roof brick silhouette with a centered arched fireplace opening. Uses `viewBox` + `preserveAspectRatio` for responsive scaling. |
| `src/components/constellation/firelight/HearthFire.tsx` | Wraps `@lottiefiles/dotlottie-react` `<DotLottieReact />`, sized and positioned inside the opening. Renders a static SVG ember-glow fallback if the Lottie file is missing or fails to load. Respects `prefers-reduced-motion` (Lottie has a built-in flag). |
| `src/components/constellation/firelight/Logs.tsx` | Static stacked-logs SVG layered under the flame. |
| `src/components/constellation/firelight/LetterDiamond.tsx` | One envelope-diamond letter: lozenge (rotated 45°), envelope flap V, central wax seal. Props: `slotX`, `slotY`, `tilt`, `sealColor`, `glow`, `delay`, `onClick`. |
| `src/components/constellation/firelight/LetterWall.tsx` | Takes `MemoryStar[]`, runs each through `letterHash`, places it on a fixed slot. Renders 5–7 `LetterDiamond` children. Below ~600px viewport, uses a tighter 5-slot arrangement (drops the lower-row pair). |
| `src/components/constellation/firelight/AmbientSparks.tsx` | A few small drifting sparks rising inside the fireplace opening. Decorative only; no click handlers. Freezes when `useReducedMotion()` is true. |
| `src/components/constellation/firelight/letterHash.ts` | Deterministic mapping `entry.id → { slotIndex, tilt, glow }`. `tilt` ∈ [-8°, +8°]; `glow` is true for roughly 1 in 3 letters (so 2–3 letters glow on a typical 7-letter visit). Mirrors the `roseHash.ts` pattern so the same memory always sits in the same slot when surfaced. |
| `public/lottie/hearth-fire.lottie` | Free fire animation downloaded from lottiefiles.com. Filename is fixed; the player loads from `/lottie/hearth-fire.lottie`. |

### Edited files

| Path | Change |
| --- | --- |
| `src/app/constellation/page.tsx` | Replace dark-mode line `const Renderer = theme.mode === 'light' ? GardenRenderer : ConstellationRenderer` with `... ? GardenRenderer : FirelightRenderer`. No other changes. |
| `package.json` | Add dependency `@lottiefiles/dotlottie-react`. |

### Reused as-is

- `src/components/constellation/MemoryModal.tsx` — the modal shown when a memory is opened. Same component handles a clicked letter; no changes.
- `MemoryStar` interface from `ConstellationRenderer.tsx` — generic enough to describe a letter's position. Imported and reused by the new components.
- `ConstellationRenderer.tsx` — preserved unchanged; still serves Rivendell and any other future dark themes whose ambience isn't `firelight`.

## Data flow

The data path is identical to `RoseGardenScene` — only rendering differs.

```
ConstellationPage
  ├─ fetch /api/entries?limit=50
  ├─ shuffle + slice top 7  (MAX_VISIBLE_MEMORIES)
  ├─ build MemoryStar[] with x/y/size/delay
  └─ pass to dispatcher
       ↓
   theme.mode === 'dark'
       ↓
   FirelightRenderer
       ↓
   theme.ambience === 'firelight'
       ↓
   HearthScene
       ├─ CottageFrame              (static SVG)
       ├─ Logs + HearthFire         (static container, animated content)
       ├─ AmbientSparks             (decorative; ignores entries)
       └─ LetterWall(memoryStars)
            └─ memoryStars.map →
                 LetterDiamond
                   ├─ position:     letterHash(entry.id) → slot index 0..6
                   ├─ tilt:         letterHash(entry.id) → -8°..+8°
                   ├─ sealColor:    theme.moods[entry.mood]
                   ├─ glow:         letterHash(entry.id).glow
                   ├─ delay:        memoryStar.delay  (used for stagger-in)
                   └─ onClick → setSelectedStar(star)
                                         ↓
                              MemoryModal (existing)
```

`HearthScene` ignores the page-computed `MemoryStar.x` and `MemoryStar.y` (which are designed for an open starfield) and uses `letterHash` to map each entry to one of 7 fixed slots on the cottage wall. The page-computed `delay` is still used for the stagger-in animation. This keeps placement strategy local to the scene — `ConstellationPage` doesn't need to know about it. `RoseGardenScene` follows the same pattern.

## Error handling & edge cases

- **Loading / no entries** — `ConstellationPage` renders the loading and empty states; `HearthScene` only renders once `memoryStars.length > 0`. We add a polished empty state matching `RoseGardenScene`'s pattern: cottage with a dark fireplace and the line "your hearth is waiting for its first letter."
- **Lottie file missing or fails to load** — `HearthFire` catches the error and renders a static SVG ember-glow fallback inside the opening (warm radial gradient + faint flicker via Framer Motion). The scene never breaks if `public/lottie/hearth-fire.lottie` is absent.
- **Fewer than 7 entries** — `LetterWall` only fills slots that have a memory; empty slots show nothing. No placeholder ghost letters.
- **Mobile / small screens** — Cottage SVG scales via `viewBox` + `preserveAspectRatio`. Below ~600px viewport, `LetterWall` switches to a 5-slot arrangement (drops the lower-row pair). Mirrors the mobile bloom layout `RoseGardenScene` already ships.
- **Reduced motion** — Lottie respects `prefers-reduced-motion` (built-in player flag). `AmbientSparks` checks `useReducedMotion()` from Framer Motion and renders sparks as static.
- **Theme switch** — Switching away from Hearth re-runs the dispatcher; `HearthScene` unmounts cleanly. The Lottie player handles its own teardown.

## Testing

Light touch — matches the test rigor that `RoseGardenScene` shipped with (no formal unit suite for these scene components today).

1. **Type check & lint** — `npm run lint` and `npm run build` pass on the new files.
2. **Visual smoke in Docker** — `docker compose up -d`, switch to Hearth theme, navigate to Memory page. Verify:
   - Cottage frame renders centered; scales correctly from desktop down to mobile
   - Lottie flame plays inside the opening; logs sit underneath without overlap
   - 7 letters appear on the wall in their deterministic slots; at least one glows
   - Clicking a letter opens `MemoryModal` with the correct entry
   - Empty-state copy shows when there are no entries
   - Switching theme away from Hearth swaps to the correct scene (Rivendell → starfield, Rose → garden, Postal → postal, etc.)
3. **Lottie missing fallback** — Temporarily rename `public/lottie/hearth-fire.lottie`, reload, confirm the static ember-glow fallback shows and nothing crashes.
4. **Reduced motion** — Toggle macOS "Reduce motion" and confirm Lottie + sparks stop animating.

## Open assets

- The fire Lottie file (`public/lottie/hearth-fire.lottie`) is sourced from lottiefiles.com — Himanshu picks a free fire animation he likes and drops it at that path. Filename is fixed by the spec; the file itself is selected during implementation.
