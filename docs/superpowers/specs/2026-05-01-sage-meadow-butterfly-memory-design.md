# Sage Meadow — Butterfly Memory Reveal

**Date:** 2026-05-01
**Scope:** In the Sage theme's `MeadowScene`, replace the clothesline-as-reveal-mechanism with clickable butterflies. Up to 5 butterflies fly in slow looping paths inside the visible viewport; clicking one opens the existing `MemoryModal` for that memory. Replace the visual space the clothesline used to occupy with a flower-garden cluster built from existing OpenMoji assets. No other themes change.

## Problem

In Sage, memories surface as envelopes hanging on a clothesline (`LetterClothesline`); the 5 ambient butterflies in `AmbientDrift` are pure decoration that drift edge-to-edge and disappear. The interaction the user wants is the opposite: butterflies should be the always-present, clickable carriers of memories, and the clothesline should give way to a quieter decorative element.

## Goals

- 5 butterflies (or fewer if there are fewer memories) are always visible on screen at once, each tied to one of the 5 `memoryStars` already supplied to `MeadowScene`.
- Clicking a butterfly opens the existing `MemoryModal` for that memory — no modal changes.
- Butterflies retain the multi-color OpenMoji look from current `AmbientDrift` (5 distinct hues).
- The space vacated by the clothesline is filled with a tended flower garden (existing OpenMoji glyphs only, so the scene blends with the butterflies and the rest of the meadow).
- Bee and bird in `AmbientDrift` stay as ambient, non-interactive decoration.

## Non-goals

- No changes to `MemoryModal`, `MemoryStar`, the random-5 selection logic, or the `/constellation` data fetching.
- No changes to other themes (rose, ocean, postal, hearth, rivendell, linen).
- No changes to `getMoodColor`, `useGardenParallax`, or the existing parallax garden layers.
- No new asset downloads. The flower garden uses only SVGs already present in [public/garden/](../../../public/garden/).
- No bench or arch — OpenMoji has no garden-bench/arch glyph; introducing a non-OpenMoji image would clash with the existing style.

## Architecture

### File layout

```
src/components/constellation/garden/
├── MeadowMemoryButterflies.tsx   ← NEW; the 5 clickable, looping butterflies
├── MeadowGarden.tsx              ← NEW; static decorative cluster (fence + flowers + pots)
├── AmbientDrift.tsx              ← MODIFIED only at the call site (creatures filter); component itself unchanged
├── LetterClothesline.tsx         ← left in place; no longer used by MeadowScene
└── scenes/
    └── MeadowScene.tsx           ← MODIFIED: swap clothesline for MeadowGarden + MeadowMemoryButterflies; pass creatures={['bee', 'bird']} to AmbientDrift
```

`LetterClothesline.tsx` is not deleted in this change — it's no longer referenced from MeadowScene, but other scenes / future use is up to a separate cleanup. Leaving it in place keeps the diff focused on the user-visible behavior and avoids hunting cross-references.

### Data flow

```
ConstellationRenderer (parent, unchanged)
   │  picks 5 random memories → memoryStars
   ▼
GardenRenderer (dispatcher, unchanged)
   ▼
MeadowScene
   ├── AmbientDrift creatures={['bee','bird']}      (no butterflies here anymore)
   ├── MeadowGarden                                  (static flowers, no memory data)
   └── MeadowMemoryButterflies
         memoryStars        → up to 5 entries
         onSelect           → setSelectedStar       (opens MemoryModal)
         theme, getMoodColor → for halo tinting
```

The selection logic (which 5 memories appear) lives upstream and is unchanged. `MeadowMemoryButterflies` is purely a presentational + interaction layer over the array it receives.

## Components

### `MeadowMemoryButterflies`

Renders one `<button>` per memory in `memoryStars` (slice to 5 if longer). Each butterfly:

- **Home position**: chosen from a fixed array of 5 anchor points spread across the upper-mid sky band. Anchors are positional constants in the file (`HOMES: { x: vw, y: vh, hueRotate: number, size: px, loopDuration: s, flapDuration: s }[]`). Anchors are spread roughly across the area the clothesline used to span (top ~22% to ~52% vertically, ~10% to ~85% horizontally) so butterflies don't overlap their loops.
- **Color**: each anchor carries a fixed `hueRotate` value (0, -55, 200, 280, 95) — same palette as today's `AmbientDrift`. Color is positional, not memory-derived, so a given screen position always shows the same color even as the underlying memory changes session-to-session.
- **Loop motion**: Framer Motion keyframes for `x` and `y` tracing a small wandering path (figure-8 / lazy oval, ~12–18 vw wide × ~8–12 vh tall) around the home anchor. `repeat: Infinity`, `ease: 'easeInOut'`. Per-anchor `loopDuration` between 18–28s, individualized so loops desync.
- **Wing flap**: nested `motion.div` with `scaleX: [1, 0.55, 1]` reused from current `AmbientDrift`, `flapDuration` per anchor (0.30–0.42s).
- **Halo**: a soft circular gradient sitting behind the butterfly, color = `getMoodColor(entry.mood)` at ~14% opacity, slightly larger than the butterfly. Gives a subtle mood cue without changing the butterfly art.
- **Hover / focus**: cursor `pointer`; on hover or keyboard focus, halo opacity rises to ~28% and butterfly `scale` becomes 1.15 with a 200ms transition. Implemented via `whileHover` / `whileFocus`.
- **Accessibility**: rendered as a `<button>` with `aria-label="Read memory from {entry.createdAt.toDateString()}"`, `pointer-events: auto` (the wrapping container stays `pointer-events: none` consistent with the rest of `AmbientDrift` style), focusable via Tab.
- **Click handler**: `onSelect(memoryStar)`.
- **Modal-open behavior**: butterflies keep flying when the modal is open. No pause / freeze logic.

### `MeadowGarden`

Static (no animation) cluster of OpenMoji glyphs occupying the band the clothesline used to fill (roughly the lower half of the band, centered horizontally). Composition:

- **Back row (further from camera)**: `fence.svg` repeated 3 times across the middle horizontal axis, low opacity / muted saturation via the existing `Plant` component filter chain. Subtle horizontal jitter so the segments don't read as a single continuous line.
- **Front cluster**: 8–12 stems and blossoms drawn from `bouquet`, `tulip`, `hibiscus`, `sunflower`, `rose`, `blossom`, `wheat`, with size variation (24–48px) and slight rotation jitter (±6°). Layered front-to-back so taller stems sit behind shorter ones.
- **Anchors**: 1 `potted-plant` lower-left and 1 lower-right of the cluster for visual weight.
- All glyphs use the same `Plant` component as the rest of the garden so styling matches.

The garden is a deterministic visual — positions are file-level constants, no randomization at render time. This avoids layout shift between renders and keeps the scene calm.

### `MeadowScene` changes

- Remove `<LetterClothesline ... />`.
- Add `<MeadowGarden theme={theme} parallax={parallax} />` between `<Wildflowers />` and `<AmbientDrift />`.
- Add `<MeadowMemoryButterflies memoryStars={memoryStars} onSelect={setSelectedStar} theme={theme} getMoodColor={getMoodColor} />` after `<AmbientDrift />` so it sits above ambient layers.
- Change `<AmbientDrift theme={theme} />` to `<AmbientDrift theme={theme} creatures={['bee', 'bird']} />` so the existing 5 ambient butterflies stop rendering (the prop already exists on `AmbientDrift`).

The "letters pressed" subtitle and the "your garden" header stay unchanged.

## Edge cases

- **Fewer than 5 memories**: render `Math.min(memoryStars.length, HOMES.length)` butterflies, using the leftmost N anchors. The empty meadow still feels populated by the flower garden.
- **Zero memories**: existing empty-state branch in `MeadowScene` already handles this (returns before the main scene renders). No change.
- **Same memory selected twice (would only happen if upstream changes)**: not handled here; selection uniqueness is the upstream `memoryStars` selector's responsibility.
- **Window resize**: anchors are in `vw` / `vh` so loops naturally rescale. No resize handler needed.
- **Reduced motion**: not addressed in this change. Current `AmbientDrift` does not honor `prefers-reduced-motion` either; matching existing scope.

## Testing

Manual verification only (this is a UI change with no business logic):

1. **Sage theme, ≥5 memories**: open `/constellation`, verify exactly 5 differently-colored butterflies are visible at all times, each looping in a stable region of the screen.
2. **Sage theme, 2 memories**: verify 2 butterflies render, in the leftmost anchor positions; flower garden still fills the cleared space.
3. **Sage theme, 0 memories**: verify the empty-state copy (`your garden is waiting…`) renders; no butterflies, no garden.
4. **Click a butterfly**: verify `MemoryModal` opens for that memory's entry; verify butterflies keep flying behind the modal backdrop.
5. **Hover a butterfly**: verify cursor becomes pointer, butterfly scales up slightly, halo brightens.
6. **Tab keyboard focus**: verify each butterfly is reachable via Tab, focus ring or scale-up indicates focus, Enter triggers modal open.
7. **Other themes (rose, ocean, postal, hearth, rivendell)**: open `/constellation` for each — verify nothing changed visually.
8. **Resize window**: verify butterfly loops reposition smoothly and stay within viewport at common breakpoints (mobile portrait, tablet, desktop).
9. **Mood color tint**: verify each butterfly's halo reflects the entry mood (heavy → cool tint, radiant → warm tint, matching `getMoodColor`).

## Open questions

None. All design choices were resolved during brainstorming:

- 5 butterflies, one per `memoryStar` (existing random-5 logic upstream).
- Always on-screen wandering loops (option 1 from the motion choices).
- Clothesline removed from MeadowScene; replaced by static OpenMoji flower garden.
- No bench / arch — OpenMoji has no glyph and a non-OpenMoji image would visually clash.
