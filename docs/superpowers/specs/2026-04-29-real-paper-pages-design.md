# Real-paper diary pages — minimum change

**Date:** 2026-04-29
**Branch:** feat/design-overhaul-themes

## Goal

Stop the diary pages from looking like glass during page-flips. Keep everything else (theme color, shadows, layout, settings, ornaments, etc.) exactly as it is.

## What "looks like glass" today

In `src/app/globals.css:104-138`, the `.diary-page` class has four glass-isms:

1. `backdrop-filter: blur(14px)` + `-webkit-backdrop-filter: blur(14px)` — frosted-glass blur behind the page
2. `border: 1.5px solid rgba(255, 255, 255, 0.18)` — white glass-rim edge
3. `inset -4px 0 12px rgba(255, 255, 255, 0.06)` (left page) and `inset 4px 0 12px rgba(255, 255, 255, 0.06)` (right page) — white inner shimmer along the spine, the "glass sheen"
4. `color-mix(in srgb, ... transparent)` translucency — the page lets the desk show through

The mid-flip rule (`.stf__item:not(.--simple).diary-page`) already paints the page fully opaque with the theme color while it's curling — that's already paper-like. The resting page is what reads as glass.

## Change

In `src/app/globals.css` only:

- Remove `backdrop-filter: blur(14px);` and `-webkit-backdrop-filter: blur(14px);` from `.diary-page`.
- Remove `border: 1.5px solid rgba(255, 255, 255, 0.18);` from `.diary-page`.
- Remove `inset -4px 0 12px rgba(255, 255, 255, 0.06),` from `.diary-page--left`'s box-shadow.
- Remove `inset 4px 0 12px rgba(255, 255, 255, 0.06),` from `.diary-page--right`'s box-shadow.

Keep the `color-mix` translucency line as-is so the existing **Page Opacity** slider keeps working. At its default (95%), the page is already essentially solid; with the four glass-isms gone, the resting page reads as solid theme-tinted paper instead of frosted glass.

## Files touched

- `src/app/globals.css` — the four removals above, and nothing else

## Out of scope (explicitly)

- No grain / paper texture
- No paper color / tint changes
- No shadow recoloring (cool → warm)
- No edge-color or border-color additions
- No changes to `DeskSettingsPanel` / Page Opacity slider
- No JSX changes (no `BookSpread.tsx`, no `glassDiaryColors.ts`, no other components)
- No changes to postcards or any other surface that uses `--diary-page-opacity`

## Success criteria

- The resting diary spread no longer reads as glass — no blur, no white rim, no white spine sheen
- Per-theme color is preserved exactly (no shift in tint)
- Mid-flip curl is unchanged
- Page Opacity slider continues to function exactly as before
