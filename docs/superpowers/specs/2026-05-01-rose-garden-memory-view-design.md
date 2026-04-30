# Rose Garden — Memory View

**Date:** 2026-05-01
**Scope:** Replace the shared light-theme `GardenRenderer` visual with a rose-specific scene when the active theme is `rose`. Rename the nav entry from "Stars" to "Memory". Other themes (sage, ocean, linen, postal) are unchanged.

## Problem

`/constellation` shows your memories. Dark themes (`rivendell`, `hearth`) render a cosmos of stars. Light themes share a generic meadow scene (`GardenRenderer`), with `postal` as the only theme-specific branch. As a result, **rose looks identical to sage** on the memory page. The user wants rose to feel like its own place — a flower garden of roses, where each rose is a memory you click to open.

## Goals

- Rose theme gets a distinct, lush memory scene (a rose garden) — not a recolor of the meadow.
- Each clickable bloom is a real memory; opening it surfaces the existing `MemoryModal` unchanged.
- Per-visit picks stay consistent with current behavior (up to 7 random memories, refresh to reshuffle).
- Nav label changes from "Stars" to "Memory" so future themes can introduce their own memory scenes without the label fighting them.
- The architecture supports adding more per-theme scenes later without bloating `GardenRenderer.tsx`.

## Non-goals

- No changes to `MemoryModal`, the `MemoryStar` shape, the `/constellation` page-level data fetching, or the random-pick logic.
- No changes to dark-theme `ConstellationRenderer`.
- No changes to sage/ocean/linen/postal scenes — only refactored into their own files; visuals are pixel-equivalent.
- No new entry types, no DB schema change, no API change.
- The rose-theme **home/journal background** is out of scope. Only the `/constellation` view changes.

## Architecture

### File layout

```
src/components/constellation/
├── GardenRenderer.tsx          ← thin dispatcher; picks scene by theme.ambience
├── MemoryModal.tsx             ← unchanged
├── ConstellationRenderer.tsx   ← unchanged
└── garden/
    ├── scenes/
    │   ├── PostalScene.tsx     ← extracted from current GardenRenderer (postal branch)
    │   ├── MeadowScene.tsx     ← extracted from current GardenRenderer (default branch)
    │   └── RoseGardenScene.tsx ← NEW
    ├── rose/                   ← NEW; only consumed by RoseGardenScene
    │   ├── RoseBlooms.tsx
    │   ├── RoseSVG.tsx
    │   ├── Trellis.tsx
    │   ├── GardenPath.tsx
    │   ├── ScatteredFlora.tsx
    │   ├── PetalDrift.tsx
    │   └── RoseSky.tsx
    └── (existing files: AmbientDrift.tsx, Bunting.tsx, gardenLayers.tsx,
         LampLetterbox.tsx, LeftLamp.tsx, LetterClothesline.tsx, Mailbox.tsx,
         Plant.tsx, PostalSky.tsx, useGardenParallax.ts — unchanged in place)
```

### Dispatcher

`GardenRenderer.tsx` becomes:

```ts
switch (theme.ambience) {
  case 'postal': return <PostalScene {...props} />
  case 'rose':   return <RoseGardenScene {...props} />
  default:       return <MeadowScene {...props} />
}
```

`GardenRendererProps` is unchanged. Loading and empty states currently live in `GardenRenderer` — they move into each scene component, since the empty-state copy is scene-specific. (Each scene owns its own loading and empty visual; the dispatcher is purely a switch.)

### Why this refactor

The current `GardenRenderer` already has a postal/non-postal branch inline. Adding a third inline branch for rose would push it past readability. Extracting each scene into its own file makes each scene under ~250 lines and keeps the dispatcher trivial. Future themes (sage-specific, ocean-specific, etc.) can drop in as new scene files without touching anything else.

## Rose garden scene composition

`RoseGardenScene.tsx` renders these layers back-to-front. Each is a sibling component in `garden/rose/`.

1. **RoseSky** — full-bleed vertical gradient `#FFE4DA → #F8C8C0 → #E8A8A0`. One soft sun-glow blob (radial gradient, blurred) anchored upper-right. Two distant blurred hill silhouettes in deeper rose `#D89090` and `#C87878` for depth.
2. **GardenPath** — stone-tile path curving from bottom-center toward the trellis. Tiles narrow with perspective. Soft shadow under each tile.
3. **Trellis** — wooden white-painted arch with vine lattice, mid-screen, framing the path. SVG. Slight idle sway not required (it's a structure).
4. **RoseBlooms** — 7 animated rose SVGs (the clickable memory tiles). Layout: 3 anchor onto the trellis arch; 4 sit on rose-bushes flanking the path (2 left, 2 right). Idle: ±2° rotate over 4s, scale 1.0 → 1.03 breathing. Hover: scale to 1.15 + glow ring. Tap: 250ms lift + scale to 1.25 + soft pulse, then `onSelect(star)`.
5. **ScatteredFlora** — daisies, baby's breath sprigs, rose buds, leaf clumps strewn around the bushes and path edges. Pure SVG decoration, non-interactive.
6. **PetalDrift** — slow falling rose petals (10–15 at any time). Drifts diagonally with sway. Replaces the body-level `sakura` particle layer for rose-theme `/constellation` only — the page-level `Background.tsx` particle effect is independent and untouched.
7. **AmbientDrift** — reuse the existing `garden/AmbientDrift.tsx` (one butterfly + one bee already supported). It's theme-aware via colors, so it works as-is.

## Rose colors and sizing

5-color palette cycled across the 7 blooms (so a typical visit shows all 5 + 2 repeats):

| Color name      | Hex       |
|-----------------|-----------|
| Crimson         | `#B12838` |
| Coral           | `#E27062` |
| Blush           | `#F4B6B0` |
| Cream           | `#F8E8D8` |
| Lavender-rose   | `#C898C0` |

**Color assignment** is deterministic from `entry.id` (a stable hash → palette index), so the same memory is the same color across visits. This gives each memory a stable identity in the garden.

**Mood drives the glow halo**, not the rose petals. Behind each rose, a soft radial glow uses `theme.moods[entry.mood]` at low opacity (~25%). A "Heavy" memory glows muted brown-pink; a "Radiant" memory glows highlight pink. The rose petals keep their identity color regardless.

**Size** also varies deterministically from `entry.id` (1.0× to 1.4×) so the arrangement looks organic, not gridded.

## Click interaction

1. User taps a rose.
2. Rose runs a 250ms tap animation: lift `y: -4`, scale to 1.25, soft pulse on the glow halo.
3. After the tap animation, `onSelect(star)` fires.
4. The page-level `selectedStar` state updates; existing `MemoryModal` opens with the entry.
5. Modal close behavior unchanged.

`MemoryModal` is shared with `ConstellationRenderer` and other scenes — no changes to it.

## Empty state

When there are 0 entries on rose theme:

- Single rose-bud SVG (closed, with two leaves) center-screen, soft idle pulse.
- Italic serif copy: *"a quiet rose garden — write a memory and the first bloom appears"*.
- Same opacity/transition cadence as existing meadow empty state.

## Loading state

- Centered small rose SVG (same `RoseSVG` component, blush color, ~32px) with the existing breathing-opacity animation.
- Italic serif copy: *"tending the rose garden…"*.

## Nav label rename

`src/components/Navigation.tsx` line 16:

```diff
- { href: '/constellation', label: 'Stars', icon: '★' },
+ { href: '/constellation', label: 'Memory', icon: '★' },
```

Route stays `/constellation`. Icon stays `★`. No other call sites (verified — `Navigation.tsx` is the only place this label appears).

## Performance notes

- All flora, sky, trellis, and path are SVG primitives — no images, no asset bundling.
- Petal drift caps at 15 concurrent petals. Each is a single transformed `motion.div` — same model as existing `sakura` particles.
- Rose bloom animations use `motion` transforms (GPU-accelerated). No layout thrash.
- `RoseBlooms` memoizes layout positions per `memoryStars` array; positions don't recompute on hover.

## Testing

- **Manual**: switch theme to rose, navigate to `/constellation`, verify scene renders with up to 7 rose-memories, click each rose to confirm `MemoryModal` opens with the right entry.
- **Manual**: with 0 entries on rose theme, confirm rose-bud empty state appears.
- **Manual**: refresh page, confirm the same memory keeps its color but its position may shuffle.
- **Manual**: switch to sage / ocean / linen / postal — confirm those scenes are visually identical to before the refactor (regression check on the extraction).
- **Manual**: switch to rivendell / hearth — confirm dark-theme constellation is unchanged.
- **Build/lint**: `npm run build` and `npm run lint` clean.
- No automated test infrastructure for these visual components currently exists; visual changes are manually verified per project convention.

## Risks / open questions

- **Mobile layout**: The trellis-arch layout assumes ~16:9 viewport. On narrow mobile, the 7 roses risk overlapping. Mitigation: `RoseBlooms` reads viewport width and uses a more vertical, stacked layout below 600px (3 on a smaller arch, 4 on a single bush row). Concrete breakpoint behavior is implementation-defined during build but the constraint is captured here.
- **Color contrast for cream rose on rose-tinted sky**: cream `#F8E8D8` on sky `#FFE4DA` could wash out. Mitigation: every rose has a dark-rose outline `#7A2030` at 0.4 opacity, plus the mood glow halo behind it. This guarantees cream roses still read.
- **Refactor regression risk**: Extracting `MeadowScene` and `PostalScene` from the current `GardenRenderer` could introduce subtle differences (z-index, motion timing). Mitigation: extraction is a literal copy-paste of existing JSX into new files; props are passed through unchanged; no logic is rewritten during extraction. Implementation plan should keep the extraction commit separate from the new rose scene commit so any regression is bisectable.
