# Real-paper diary pages (keep theme tint)

**Date:** 2026-04-29
**Branch:** feat/design-overhaul-themes

## Goal

Replace the "glass" treatment on diary pages with a real-paper feel, while keeping each theme's per-page color tint. The flip animation (`react-pageflip`) is unchanged — only the visual treatment of the page surface changes.

## Current state

- `.diary-page` in `src/app/globals.css:104-138` uses:
  - `backdrop-filter: blur(14px)` (glass blur)
  - White-tinted rim border `rgba(255,255,255,0.18)` and white inset shimmer (glass edges)
  - `color-mix(... transparent)` translucency (see-through)
  - Cool grey-black drop shadows
- Per-theme paper tint comes from `--page-bg-solid` set on the spread wrapper (`BookSpread.tsx:415`)
- A user-facing **Page Opacity** slider (`DeskSettingsPanel.tsx:193`) writes `--diary-page-opacity` to make the page see-through to the desk — central to the glass aesthetic

## Design

### Surface treatment changes (CSS only, in `globals.css`)

1. **Drop translucency** — `.diary-page` uses `--page-bg-solid` directly (no `color-mix` with transparent). The mid-flip rule (`.stf__item:not(.--simple).diary-page`) already paints opaque, so this just makes resting and mid-flip consistent.
2. **Drop blur** — remove `backdrop-filter: blur(14px)` and the `-webkit-` prefix.
3. **Fiber grain** — layer a tiled inline-SVG noise (`feTurbulence` fractalNoise, ~160px tile, ~5% alpha) on top of the base color via `background-image`. Same noise across all themes; reads as "the same paper, tinted differently." Composited so the grain reads as fiber on both light and dark themes (see implementation note below).
4. **Page-edge color** — replace the white border `rgba(255,255,255,0.18)` with a theme-warm tone via a new CSS var `--page-edge`, set on the spread wrapper from `colors.pageBorder` (already derived from theme warm accent at 0.18 alpha; currently unused on the page itself).
5. **Gutter shadow** — `.diary-page--left` gets a strong inset shadow on its **right** edge; `.diary-page--right` gets it on its **left** edge. ~22px feathered, warm dark `rgba(30,15,5,0.18)`. Sells the curve into the binding.
6. **Warm long shadow** — replace the cool `rgba(0,0,0,0.55)` drop shadow with a warm `rgba(40,25,15,0.45)` so the page sits warm on the cover, not cold-floating.
7. **Soft warm wash for dark themes** — a barely-there overlay gradient (~3% alpha cream) added in the `background-image` stack so dark-themed pages read as *tinted stationery*, not flat dark plastic. Same overlay across all themes — invisible on light pages, gently warming on dark ones.

**Implementation note on grain blend:** Use `background-blend-mode: multiply, normal` (or layered SVGs with appropriate alphas). The grain SVG itself uses semi-transparent dark dots; multiplying onto a light theme darkens slightly, onto a dark theme it disappears too much. Adjustment: ship the grain at ~6% alpha black + ~4% alpha white (two-tone noise), so both light and dark surfaces show fiber. Verify visually across at least Sakura (light), Forest (mid), and Midnight (dark).

### Settings change

- `DeskSettingsPanel.tsx:27` flips from `pathname === '/write'` to `false` (or simply remove the `showPageOpacity` const and the conditional section). The store + CSS var plumbing stays so it's a one-line revert if a future "vellum mode" wants to come back.

### Files touched

- `src/app/globals.css` — `.diary-page`, `.diary-page--left/--right`, mid-flip rule
- `src/components/desk/BookSpread.tsx` — set `--page-edge` CSS var on the `motion.div` spread wrapper from `colors.pageBorder` (sibling to existing `--page-bg`/`--page-bg-solid`)
- `src/components/desk/DeskSettingsPanel.tsx` — hide the Page Opacity section

### Out of scope

- Renaming `glassDiaryColors.ts` → `paperDiaryColors.ts` (works fine as-is; rename later if it bothers anyone)
- Changes to `react-pageflip` config (curl already feels right — only surface treatment changes)
- Postcard front/back (`PostcardBack.tsx:71`, `PostcardFront.tsx:82`) which also reference `--diary-page-opacity` — separate surface; leave for a later pass
- Per-theme paper variations (e.g., parchment vs. modern white per theme) — one paper texture for now, theme provides only color
- Removing the `useDeskSettings` page-opacity store or the CSS var (kept as no-op plumbing)

## Success criteria

- Across all 10 themes, the diary spread reads as **paper** at a glance (not glass / not plastic)
- The page-flip animation visibly curls a paper-feeling surface — grain + warm shadow + warm edge travel through the curl naturally because they're all in the base `.diary-page` class
- No regression in readability of body text, ruled lines, or photo/doodle blocks
- Page Opacity slider no longer appears on `/write`; it does not appear on or affect any other route
- No JSX restructure in `BookSpread.tsx` — only the one extra CSS var on the wrapper
