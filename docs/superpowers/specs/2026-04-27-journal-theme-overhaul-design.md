# Journal Theme & Font Overhaul — Design Spec

**Date:** 2026-04-27
**Status:** Approved by user, ready for implementation plan
**Scope:** Visual + theme + font overhaul of the Journal (Write) page and Stars (Constellation) page. No data model, layout, or editor behavior changes.

## Goal

Replace the current dark-heavy 12-theme palette with a smaller, paper-textured set of 10 new themes (plus Rivendell, kept) drawn from the Anthropic Journal Redesign mockups. Adopt a humanist serif + handwriting font system that gives the app the "feel-good, minimalist journal" vibe shown in the mockups. Solve the Stars page for light themes by introducing a parallel "garden" renderer.

The redesign is intentionally narrow: visuals, palettes, fonts, and one new renderer. Editor, layout, data model, and feature behavior are unchanged.

## Non-goals (explicit)

To prevent scope creep, the following are **out of scope** for this work and will be done (if at all) in later passes:

- Redesign of Letters, Calendar, Timeline, Login, Pricing, Me, or Landing pages
- Editor changes: fragments, drag-to-reorder, bold, color, numbered lists, checkboxes
- Second writing surface (prompt response, etc.)
- Two-column "open journal" layout, polaroid stack right pane, inline sketch panel, "Tonight's Prompt" highlighted box, leaf-bookmark decoration, header pill nav redesign
- Any change to `JournalEntry` or `User` schema; no migrations; no API changes
- Rewrite of the existing constellation renderer (only extracted into a component)
- Sourcing/licensing new ambient sound assets for the new themes
- Larger redesign of the theme switcher UI (only the list changes)

## Branch strategy

Before any code changes:

1. Push the current `main` HEAD to a preservation branch named `claude-design-pre-overhaul` so the pre-redesign state is recoverable.
2. Create a new working branch (e.g. `feat/design-overhaul-themes`) off `main` for this work.

The working branch is where all changes in this spec land. We do not delete or rewrite history on `main` until the user explicitly merges.

## Theme system

### New theme list (11 themes)

| Code | Name | Mode | Notes |
|---|---|---|---|
| rivendell | Rivendell Sunset | dark | Kept from current |
| hearth | Hearth | dark | Firelight night — deep brown + amber + cream |
| paperSun | Paper Sun | light | Warm cream paper, rust accent |
| rose | Rose | light | Blush & cherry blossom paper |
| sage | Sage | light | Matcha & cream |
| ocean | Ocean | light | Misty seaside dawn — pale blue-grey + teal |
| saffron | Saffron | light | Marigold paper, indigo accent |
| garden | Garden | light | Pressed flora — sage paper + rust |
| postal | Postal | light | Letter office parchment, indigo + rust |
| linen | Linen | light | Minimal off-white linen, soft rust |
| midnight | Midnight | dark | Gold leaf library — deep navy + gold |

Themes dropped from current: `hobbiton`, `winterSunset`, `cherryBlossom`, `northernLights`, `mistyMountains`, `gentleRain`, `cosmos`, `candlelight`, `oceanTwilight`, `quietSnow`, `warmPeaceful`.

### Interface change

Add a `mode: 'light' | 'dark'` field to the `Theme` interface. Used by the Stars renderer split, and available for any component that needs to know background lightness (shadow strength, paper texture, particle opacity).

```ts
export interface Theme {
  name: string
  description: string
  mode: 'light' | 'dark'   // NEW
  bg: { primary; secondary; gradient }
  text: { primary; secondary; muted }
  accent: { primary; secondary; warm; highlight }
  glass: { bg; border; blur }
  moods: { 0; 1; 2; 3; 4 }
  moodEmojis: string[]
  moodLabels: string[]
  particles: ParticleType
  ambience: AmbienceType
}
```

### Exact palettes

Hex values are extracted directly from the Anthropic mockup PNGs by pixel-sampling each region (background primary, paper secondary, text primary, accent primary, etc.) during implementation. Each new theme keeps the same field shape as existing themes; only values change. Reviewer of the implementation PR can spot-check by comparing rendered Journal page against mockup screenshots.

### localStorage migration

Stored theme name in localStorage may be one of the 11 dropped names. On first load after the deploy, the theme store remaps:

| Old name | New name |
|---|---|
| `cherryBlossom` | `rose` |
| `winterSunset` | `hearth` |
| `northernLights` | `midnight` |
| `mistyMountains` | `linen` |
| `gentleRain` | `ocean` |
| `cosmos` | `midnight` |
| `candlelight` | `hearth` |
| `oceanTwilight` | `ocean` |
| `quietSnow` | `linen` |
| `warmPeaceful` | `paperSun` |
| `hobbiton` | `sage` |

Unknown values fall back to `rivendell`. The remap runs once on hydration and writes the new value back to localStorage.

## Per-theme ambient animations

Each theme keeps an ambient particle layer rendered by `Background.tsx`. Light-theme animations are intentionally subtle (≈30–50% lower density than dark themes, opacity ≈0.3–0.5, slow drift) so they don't fight the paper texture.

| Theme | `particles` value | Implementation |
|---|---|---|
| rivendell | `fireflies` | Existing — unchanged |
| hearth | `embers` | **New** — warm sparks rising slowly |
| midnight | `goldFlecks` | **New** — gold leaf flakes drifting |
| paperSun | `sunbeam` | Existing, retuned subtler |
| rose | `sakura` | Existing, color tint from accent |
| saffron | `sakura` | Existing, color tint from accent |
| sage | `leaves` | Existing `dandelion` repurposed/parametrized as a `leaves` system |
| garden | `leaves` | Same shared system, slower drift |
| ocean | `foam` (+ optional `mist`) | Existing, retuned |
| postal | `dust` | Existing, soft + slow |
| linen | `dust` | Existing, very low density |

**Net new particle code:** two genuinely new systems (`embers`, `goldFlecks`) and one parametrized `leaves` system (color + drift speed as inputs) that powers sage and garden.

Ambient sound: new themes either inherit silence or map to an existing per-theme ambient track that fits (e.g. `hearth` → existing candle ambience, `midnight` → existing cosmos ambience). No new audio assets in this pass.

The existing "Animations toggle" in `DeskSettingsPanel` continues to disable all particles when off — no change to that contract.

## Font system

Two fonts, three roles. Loaded via `next/font/google` for preload + zero layout shift.

| Role | Font | Used for |
|---|---|---|
| Body serif | EB Garamond | Body prose, editor text, section labels (in tracked uppercase), counters |
| Italic body | EB Garamond Italic | Prompts, dates in headers, "a few things you wrote" style flourishes |
| Handwriting | Caveat | Mood word, "today felt", "+ New Entry" button, polaroid captions, "Begin writing…" placeholders, "send as letter" button |

CSS custom properties on `:root`:

```css
--font-serif: 'EB Garamond', 'Cormorant Garamond', 'Iowan Old Style', Georgia, serif;
--font-script: 'Caveat', 'Kalam', 'Bradley Hand', cursive;
```

Set globally — applied at the `<body>` level via `next/font` so every page inherits the serif body. Other pages get a free font upgrade with no other regression. The TipTap editor (`.ProseMirror`) inherits the body serif so prose flows in serif by default.

Per-element handwriting application is limited to the Journal page in this pass: mood word, date/time chip, "+ New Entry" label, sketch label, prompt-area placeholder. Handwriting is the accent, not the body — overuse breaks the design.

If EB Garamond / Caveat feel wrong after a render, swappable to Cormorant Garamond and Kalam by changing the imports — the CSS variables don't move.

## Stars page split

The current `src/app/constellation/page.tsx` (746 lines) is the dark-mode renderer. We do **not** rewrite it; we extract it.

### File layout (proposed)

```
src/app/constellation/
  page.tsx                              ← thin wrapper: picks renderer by theme.mode

src/components/constellation/
  ConstellationRenderer.tsx             ← extracted from current page.tsx, no logic change
  GardenRenderer.tsx                    ← new, light-mode renderer
  shared/                                ← shared hooks/data fetching, single source of truth
    useLetters.ts                       ← (or wherever data fetching currently lives)
```

The data layer is shared: same letters fetched, same click → letter reveal modal, same counts. Only the visual is mode-dependent.

### Garden renderer (light mode)

- Each letter = one **pressed leaf** sprite scattered on the paper canvas
- Position is **deterministic** (seeded by letter id) — leaves stay in the same place across visits
- Leaf shape: SVG with subtle veins, slight rotation, color tinted from the active theme's accent palette
- Hover: gentle lift + soft drop shadow
- Click: opens the existing letter reveal modal (no rewrite)
- Bottom counter: "12 letters pressed" instead of "12 stars in your sky"
- Ambient particles use the active theme's particle system per Section "Per-theme ambient animations"
- Roughly 1-in-8 leaves are replaced by a flower bud sprite for visual variety; same click behavior
- Page heading shifts per mode ("your sky" / "your garden"); nav label stays "Stars"

## Theme switcher UI

The picker itself isn't redesigned, but two small updates land with this work:

- It now lists 11 themes (Rivendell + 10 new), reflecting the new palette
- Each theme row shows a mode indicator (sun/moon icon) so light vs dark is obvious at a glance — useful since the picker is the entry point to the new light themes

## Files expected to change

This is a sketch, not a final list — the implementation plan will refine it.

- `src/lib/themes.ts` — replace 11 theme objects, keep Rivendell, add `mode` field, update type unions
- `src/store/` (theme store) — add localStorage migration on hydration
- `src/components/Background.tsx` — add `embers`, `goldFlecks`, `leaves` particle implementations; retune light-theme density
- `src/components/AmbientSoundLayer.tsx` — map new themes to existing audio or silence
- `src/components/ThemeSwitcher.tsx` — new theme list + mode indicator
- `src/components/desk/DeskSettingsPanel.tsx` — list rendering of new themes (likely automatic if it iterates `themes`)
- `src/components/Editor.tsx` and CSS — apply serif font; check that contrast still works on light backgrounds
- `src/components/MoodPicker.tsx` — handwriting font for mood word
- `src/app/layout.tsx` and `src/app/globals.css` — load Google Fonts via `next/font`, set CSS variables, apply body serif globally
- `src/app/constellation/page.tsx` — split into `ConstellationRenderer` + `GardenRenderer` + thin wrapper
- `src/components/constellation/GardenRenderer.tsx` — new
- `src/components/constellation/ConstellationRenderer.tsx` — extracted from current page
- Asset files: pressed leaf SVG sprite(s), flower bud SVG sprite (small set, theme-tinted via CSS)

## Acceptance criteria

The redesign is done when:

1. Theme switcher shows exactly 11 themes (Rivendell + 10 new), each with a sun/moon mode indicator.
2. All 10 new themes render the Journal page with palette and font matching the corresponding mockup screenshot, side-by-side spot-check.
3. Each theme has a working ambient particle layer matching the Section "Per-theme ambient animations" mapping; the Animations toggle disables all of them.
4. EB Garamond is the body font on every page; Caveat appears on the listed Journal-page accent elements.
5. The Stars page (`/constellation`) renders a constellation in dark themes (unchanged behavior) and a garden of pressed leaves in light themes; click opens the existing letter reveal modal in both cases.
6. A user with a dropped theme name in localStorage (e.g. `cherryBlossom`) loads cleanly into the migrated theme (`rose`) with no visible error.
7. No schema changes; no migrations; no API changes; existing entries open and edit identically.
8. The pre-redesign `main` HEAD is preserved on the `claude-design-pre-overhaul` branch.

## Risks and open questions

- **Pixel-sampling palettes from PNG mockups** can introduce slight off-by-shade values. Mitigation: side-by-side render comparison during implementation, with the user flagging any palette that feels wrong.
- **Caveat readability** at small sizes on light backgrounds — if mood word or date chip are too thin to read, fall back to a heavier handwriting weight or to italic serif for that element.
- **Light-theme contrast** on the TipTap editor — need to verify text on cream/blush backgrounds clears AA contrast. If not, bump `text.primary` darkness for that theme.
- **Existing per-theme sound assets** may not map cleanly to all new themes. Some themes will be silent until audio is sourced in a later pass; that's acceptable.
