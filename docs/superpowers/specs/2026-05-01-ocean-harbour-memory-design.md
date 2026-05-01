# Ocean Harbour — Memory View

**Date:** 2026-05-01
**Theme scope:** `ocean` (light mode, ambience `ocean`) — does not affect any other theme.

## Problem

`/constellation` (the Memory page) dispatches by `theme.mode`. On the light side, `GardenRenderer` already gives `postal` and `rose` their own scenes; everything else falls through to `MeadowScene`. The ocean theme — whose ambience is `ocean` and whose tagline is *"Pale dawn light on the harbour"* — currently looks identical to sage. It needs its own Memory scene that matches the theme's identity.

The longer-term plan is to give every theme its own Memory UI; rose has shipped, hearth is in flight, and this spec adds the ocean scene next using the same dispatcher slot.

## Goal

Give the ocean theme a unique Memory view: a harbour at sunset with a wooden dock in the foreground and 7 paper boats moored along it, each boat a clickable memory. Distant silhouettes (cliff with a small lit lighthouse, two far-distant sailboats) sit on the horizon. Visually consistent with the cottagecore vignettes already shipped (`RoseGardenScene`, `PostalScene`) and with the dark-side `HearthScene`.

Out of scope: redesigning Memory views for any other theme, changing entries data flow, changing `MemoryModal`, changing how memories are sampled (still 7 random per visit), changing the ocean theme's home/journal background or its `foam` page-level particle.

## Visual concept

A full-bleed sunset sky runs from deep purple at the zenith through magenta and coral to gold at the horizon (~78% down the frame), then resolves into a slate-blue water band. The sun disc sits on the horizon, with a bright golden reflection trail spilling toward the viewer. Mid-ground silhouettes — a dark cliff on the left, a small lighthouse with a softly pulsing warm lamp, two tiny sailboat silhouettes on the horizon — give the harbour depth. A weathered wooden dock juts in from the lower-left with pilings. Seven paper-cream boats are arranged in deterministic slots along and near the dock; each bobs gently. Roughly 2–3 of the 7 glow with a mood-colored sail (the "surfaced tonight" memories). Clicking a boat is the only interactive action on the page.

## Architecture

Add a third light-side branch to the existing dispatcher:

**Today:**
```ts
switch (theme.ambience) {
  case 'postal': return <PostalScene {...props} />
  case 'rose':   return <RoseGardenScene {...props} />
  default:       return <MeadowScene {...props} />
}
```

**After:**
```ts
switch (theme.ambience) {
  case 'postal': return <PostalScene {...props} />
  case 'rose':   return <RoseGardenScene {...props} />
  case 'ocean':  return <OceanHarbourScene {...props} />  // NEW
  default:       return <MeadowScene {...props} />
}
```

`GardenRendererProps` is unchanged. Loading and empty states live in the new scene component (matches `RoseGardenScene` pattern).

### File layout

```
src/components/constellation/garden/
├── scenes/
│   └── OceanHarbourScene.tsx        ← NEW orchestrator
└── ocean/                            ← NEW; only consumed by OceanHarbourScene
    ├── HarbourSky.tsx
    ├── HorizonSilhouettes.tsx
    ├── WaterAndReflections.tsx
    ├── Dock.tsx
    ├── PaperBoats.tsx
    ├── PaperBoat.tsx
    └── oceanHash.ts
```

`GardenRenderer.tsx` gets one new case; no other existing files change. `MemoryModal`, `ConstellationRenderer`, dark-side `FirelightRenderer` (in flight), and other scenes are untouched.

## Components

### New files

| Path | Purpose |
| --- | --- |
| `src/components/constellation/garden/scenes/OceanHarbourScene.tsx` | Orchestrator. Composes the layered scene, handles loading + empty states, owns `getMoodColor`, mounts `MemoryModal`. Mirrors `RoseGardenScene`. |
| `src/components/constellation/garden/ocean/HarbourSky.tsx` | Full-bleed gradient background, sun disc on the horizon, blurred cloud streaks. Pure SVG/CSS. Static. |
| `src/components/constellation/garden/ocean/HorizonSilhouettes.tsx` | Cliff silhouette + lighthouse (with warm lamp slow-pulsing 0.7 → 1.0 over 3s) + two far-distant sailboat silhouettes near the horizon. |
| `src/components/constellation/garden/ocean/WaterAndReflections.tsx` | Water band beneath the horizon, golden sun-reflection ellipse, 4 horizontal water-streak lines suggesting tiny waves. |
| `src/components/constellation/garden/ocean/Dock.tsx` | Weathered wooden dock + 2 pilings, anchored lower-left. Static SVG/CSS. |
| `src/components/constellation/garden/ocean/PaperBoats.tsx` | Reads `MemoryStar[]`, runs each entry through `oceanHash`, places it on a fixed slot. Renders up to 7 `PaperBoat` children. Below ~600px viewport, uses 5 slots (drops the two far-right outliers). Memoizes layout. |
| `src/components/constellation/garden/ocean/PaperBoat.tsx` | One paper boat: hull + triangle sail + reflection ripple. Props: `slotX`, `slotY`, `tilt`, `scale`, `phase`, `glow`, `glowColor`, `onClick`. Idle bobs ±2px Y over 3–4s with ±1° rotation drift; phase offset prevents lockstep. Hover: scale 1.1 + brighter sail. Tap: 250ms lift `y: -6` + scale 1.2 + glow pulse, then `onClick`. |
| `src/components/constellation/garden/ocean/oceanHash.ts` | Deterministic mapping `entry.id → { slotIndex, tilt, scale, glow }`. `tilt` ∈ [−4°, +4°]; `scale` ∈ [0.85, 1.0]; `glow` true for ~1 in 3. Mirrors `roseHash.ts`. |

### Edited files

| Path | Change |
| --- | --- |
| `src/components/constellation/GardenRenderer.tsx` | Add `case 'ocean': return <OceanHarbourScene {...props} />` to the existing switch. |

### Reused as-is

- `src/components/constellation/MemoryModal.tsx` — unchanged.
- `MemoryStar` interface — generic enough to describe a boat slot. Imported and reused.
- All other scenes (`MeadowScene`, `PostalScene`, `RoseGardenScene`) and the dark-side renderer — unchanged.

## Visual specifications

### Sunset gradient (HarbourSky)

7-stop vertical gradient on the sky portion (top 78% of frame):

| Stop | Y position | Color |
| --- | --- | --- |
| Zenith | 0% | `#2A1F3A` (deep purple) |
| Upper sky | 18% | `#5A3258` (purple-magenta) |
| Mid sky | 38% | `#B04860` (coral pink) |
| Lower sky | 56% | `#E07848` (warm coral) |
| Pre-horizon | 70% | `#F0B070` (peach gold) |
| Horizon | 78% | `#F8D090` (pale gold) |

Water band continues below the horizon (78% → 100%):

| Stop | Y position | Color |
| --- | --- | --- |
| Near-water | 80% | `#4A5878` (slate blue-gray) |
| Mid water | 90% | `#3A4868` (deeper slate) |
| Foreground water | 100% | `#1C2840` (near-black blue) |

**Sun disc:** radial gradient `#FFF4D8` → `#FFD890` → `#FF9858` → transparent, ~70px diameter, positioned at ~58% x, ~70% y (on the horizon). Soft glow shadow.

**Clouds:** 4 horizontal blurred streaks in upper sky, color `rgba(255,200,140,0.5)`, 2–4px tall, 80–140px wide. Static.

### Horizon silhouettes (HorizonSilhouettes)

- **Cliff:** dark polygon `#1A1620`, occupies left ~30% of the frame from y=60% down to the horizon. Irregular silhouette suggesting rocky outcrop.
- **Lighthouse:** small SVG (~8×24px) on the cliff at ~22% x, top of cliff. Tapered tower body in `#1A1620`, small cap, lit lamp `#FFD890` with `0 0 8px #FFAA50, 0 0 16px #FF8030` glow. Lamp opacity animates 0.7 → 1.0 over 3s loop.
- **Far-distant sailboats:** two tiny silhouettes (`#1A1620`) on the horizon. First at 42% x, full size (~12×14px). Second at 78% x, scaled 0.8×. Static.

### Water and reflections (WaterAndReflections)

- **Sun reflection trail:** blurred ellipse, position 56% x / 79% y, ~80px wide × 14% tall, gradient `rgba(255,200,120,0.7)` → `rgba(255,160,80,0.4)` → transparent. Mix-blend mode `lighten` on the water band.
- **Water streaks:** 4 horizontal lines across the water band, 1px tall, `linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)`. Static (the bobbing comes from the boats, not the water).

### Dock (Dock)

- Anchored lower-left (~−2% to 36% x, ~bottom 8% with 10px height).
- Plank surface gradient `#4A3020` → `#2A1C10`.
- 2 pilings descending from the dock to the bottom of the frame, gradient `#2A1C10` → `#0A0608`.
- 3 plank-line dividers at 8%, 18%, 28% x.
- Drop shadow `0 4px 6px rgba(0,0,0,0.4)`.

### Paper boats (PaperBoat)

- **Hull:** trapezoid clip-path on a 36×10px rect, gradient `#F8F0DC` (top 60%) → `#D8C8A4` (bottom). Drop shadow `0 2px 4px rgba(0,0,0,0.5)`.
- **Sail:** CSS triangle (or SVG path), 20px wide × 16px tall, color `#F8F0DC`, drop shadow `0 1px 2px rgba(0,0,0,0.3)`.
- **Glow (when `glow: true`):** sail filter `drop-shadow(0 0 8px <moodColor>) drop-shadow(0 0 16px <moodColorDarker>)`. `moodColor` from `theme.moods[entry.mood]`.
- **Reflection ripple:** elliptical border `rgba(255,200,140,0.4)` directly under the boat, 44px wide × 6px tall.
- **Idle animation:** Y bobs ±2px over 3–4s; rotation drifts ±1° around the slot tilt; deterministic phase offset by `slotIndex` so boats aren't in lockstep.
- **Hover:** scale to 1.1, sail brightness +10%.
- **Tap:** 250ms tween — lift `y: -6`, scale to 1.2, glow pulse on sail. After tween, fires `onClick(star)`.

### 7-slot layout (PaperBoats)

Slots are anchored to viewport-percentage coordinates (recomputed on resize). Slight Y variance gives a "boats on uneven water" feel rather than a single line.

| Slot | x | y from bottom | Notes |
| --- | --- | --- | --- |
| 0 | 8%  | 14% | Closest to dock end |
| 1 | 25% | 12% | Near dock |
| 2 | 34% | 18% | Slightly back, scale ~0.85 (set by hash, not slot) |
| 3 | 42% | 10% | Mid-foreground |
| 4 | 58% | 14% | Right of center |
| 5 | 73% | 9%  | Right side |
| 6 | 86% | 13% | Far right |

Below 600px viewport: drop slots 5 and 6 (5 boats total).

## Mood → glow color mapping

Same pattern as rose: `theme.moods[entry.mood]` drives the glow on glowing boats, the boat shape itself is identity-neutral (uniform paper). Ocean palette:

| Mood | Color | Feel |
| --- | --- | --- |
| 0 Misty | `#5A6868` | muted slate |
| 1 Drifting | `#7A8888` | soft gray-teal |
| 2 Surfacing | `#2C5260` | deep teal |
| 3 Clear | `#4A7080` | mid blue |
| 4 Radiant | `#7090A0` | highlight blue |

Non-glowing boats render with no sail glow regardless of mood — only the ~2–3 hash-selected boats per visit are lit.

## Data flow

Identical to `RoseGardenScene`. `OceanHarbourScene` ignores the page-computed `MemoryStar.x` / `MemoryStar.y` (designed for an open starfield) and uses `oceanHash` to assign each entry to one of the 7 fixed slots. The page-computed `delay` is still used for stagger-in.

```
ConstellationPage
  ├─ fetch /api/entries?limit=50 → shuffle → top 7
  ├─ build MemoryStar[] (with delay)
  └─ pass to GardenRenderer
       ↓
   theme.ambience === 'ocean'
       ↓
   OceanHarbourScene
       ├─ HarbourSky               (static)
       ├─ HorizonSilhouettes       (lighthouse lamp pulses)
       ├─ WaterAndReflections      (static)
       ├─ Dock                     (static)
       └─ PaperBoats(memoryStars)
            └─ memoryStars.map →
                 PaperBoat
                   ├─ slotIndex: oceanHash(entry.id).slotIndex
                   ├─ tilt:      oceanHash(entry.id).tilt
                   ├─ scale:     oceanHash(entry.id).scale
                   ├─ glow:      oceanHash(entry.id).glow
                   ├─ glowColor: theme.moods[entry.mood] (only used if glow)
                   ├─ delay:     memoryStar.delay
                   └─ onClick → setSelectedStar(star)
                                         ↓
                              MemoryModal (existing, unchanged)
```

## Click interaction

1. User taps a paper boat.
2. Boat runs a 250ms tap animation: lift `y: -6`, scale to 1.2, glow pulse on sail.
3. After the tap animation, `onSelect(star)` fires.
4. The page-level `selectedStar` updates; existing `MemoryModal` opens with the entry.
5. Modal close behavior unchanged.

## Loading state

- Centered small paper-boat SVG (~32px, paper-cream) bobbing gently with breathing opacity.
- Italic serif copy: *"the harbour wakes…"*
- Background uses the full sunset gradient at lower opacity (~0.6) so the loading frame already feels like the place.

## Empty state (0 entries)

- Single paper boat in the middle of an empty water frame — no dock, no boats, just sunset sky and water with the lone boat bobbing.
- Italic serif copy: *"a quiet harbour — set your first boat afloat by writing a memory"*
- Same opacity/transition cadence as the rose empty state.

## Ambient & motion budget

- `HarbourSky`, `Dock`, `WaterAndReflections`, `HorizonSilhouettes` (cliff + far boats) — static.
- Lighthouse lamp opacity 0.7 → 1.0 / 3s loop.
- 7 boats each bobbing ±2px Y over 3–4s with ±1° rotation drift, deterministic phase offset.
- No `AmbientDrift` (butterfly/bee) on this scene — the lighthouse pulse + boat bobbing already provide enough motion. Easy to add a slow gull silhouette later if it feels too still.
- Page-level `Background.tsx` `foam` particle layer is independent and untouched.

## Error handling & edge cases

- **Loading / no entries** — `OceanHarbourScene` renders the loading and empty states described above; falls through to the full scene only when `memoryStars.length > 0`.
- **Fewer than 7 entries** — `PaperBoats` only renders slots that have a memory; empty slots show nothing. No placeholder ghost boats.
- **Mobile / small screens** — All layers scale via `viewBox` + `preserveAspectRatio`. Below ~600px viewport, `PaperBoats` switches to a 5-slot arrangement (drops slots 5 and 6).
- **Reduced motion** — Lighthouse pulse and boat bob check `useReducedMotion()` from Framer Motion; when true, boats render at neutral idle position with no Y/rotation animation, lighthouse lamp stays at full opacity.
- **Theme switch** — Switching away from ocean re-runs the dispatcher; `OceanHarbourScene` unmounts cleanly. No external resources to tear down.

## Performance notes

- All layers are SVG/CSS primitives — no images, no asset bundling.
- 7 boats × 2 motion properties (Y + rotation) on `motion.div` transforms — same model as rose blooms. GPU-accelerated.
- `PaperBoats` memoizes `oceanHash` lookups per `memoryStars` array; positions don't recompute on hover.
- No new runtime dependencies.

## Testing

Light touch — matches the test rigor of `RoseGardenScene` (no formal unit suite for these scene components today).

1. **Type check & lint** — `npm run lint` and `npm run build` pass on the new files.
2. **Visual smoke in Docker** — `docker compose up -d`, switch to ocean theme, navigate to Memory page. Verify:
   - Sunset gradient renders cleanly with sun on the horizon and golden reflection trail
   - Cliff + lighthouse + 2 far boats sit on the horizon; lamp pulses softly
   - Dock juts in from lower-left with pilings
   - 7 boats appear in their deterministic slots; 2–3 glow with mood color
   - Each boat bobs gently and out of phase with the others
   - Clicking a boat opens `MemoryModal` with the correct entry
   - Refresh: the same memory keeps its slot/tilt/scale/glow but the visit may surface a different 7
3. **Empty state** — manually clear entries (or use a fresh account); confirm the lone-boat empty state renders with the correct copy.
4. **Mobile** — narrow window below 600px; confirm 5-boat arrangement and that the dock + sky still read.
5. **Reduced motion** — toggle macOS "Reduce motion"; confirm boats stop bobbing and the lighthouse lamp stays static.
6. **Regression** — switch to sage / linen / postal / rose / hearth / rivendell; confirm those scenes are visually identical to before this change.

## Risks / open questions

- **Sunset palette saturation on light-mode page chrome**: The Memory page currently inherits `theme.bg.gradient` from the ocean theme (cool grey). The new scene fully overrides the background with the sunset gradient inside its own `motion.div`, matching the rose precedent (rose's pink sky overrides the meadow gradient). No change to `theme.bg.gradient` itself, so the journal page is unaffected. Verified via `RoseGardenScene` shipping with the same pattern.
- **Boat paper color uniformity vs rose's 5-color palette**: Rose blooms vary by deterministic palette index because flower color is part of the bloom's identity. Paper boats are deliberately uniform — folded paper is paper — and identity comes from tilt, scale, position, and glow instead. If, after shipping, the scene feels too monochromatic, a v2 could introduce subtle paper-tint variation (cream / off-white / faint blush) without changing the data model.
- **`AmbientDrift` decision**: Spec ships without bird/creature drift. Adding a gull later only requires extending `AmbientDrift.tsx` to switch by `theme.ambience` — no scene rewrite needed.
- **Lighthouse lamp visibility against bright sunset sky**: The lamp glow is layered over a bright gold horizon, which can wash it out. Mitigation: the lamp sits on the cliff silhouette (dark `#1A1620`), so the immediate background behind the lamp is dark even though the surrounding sky is bright. Visual check during implementation will confirm.
