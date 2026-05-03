# Global Gear Settings — Design

## Problem

The landing (`/`) and pricing (`/pricing`) pages still render two legacy floating orbs:

- Bottom-left **CursorPicker** orb
- Bottom-right **ThemeSwitcher** orb

Every other route — login included — renders the top-right gear `DeskSettingsPanel`, which already exposes a superset of controls (theme, cursor, animations, ambient sound). The result is two different settings UIs depending on which page you're on, and the legacy orbs clutter the landing's marketing surface.

## Goal

A single settings entry point — the corner gear — visible on **every** page (landing, pricing, login, and all authed pages). No floating orbs.

## Scope

- Update `src/components/LayoutContent.tsx` so the landing/pricing branch renders `<DeskSettingsPanel />` instead of `<CursorPicker />` + `<ThemeSwitcher />`.
- Remove the now-unused imports.
- Delete the two orphaned files: `src/components/CursorPicker.tsx` and `src/components/ThemeSwitcher.tsx`. (Grep confirms `LayoutContent` is their only consumer.)

Out of scope:

- Re-styling the gear panel.
- Touching `Navigation`, `FullscreenButton`, `FullscreenPrompt`, or any other chrome.
- Adding `<Background />` to the landing — landing keeps its own bespoke background; the gear button styles itself from `theme.glass.*` and renders fine without it.

## Acceptance criteria

1. Landing page shows the gear at top-right; opening it offers theme + cursor + animations + sound, like every other page.
2. Pricing page same as above.
3. Login page unchanged from today (it already has the gear).
4. The two legacy orbs no longer render anywhere in the app.
5. `CursorPicker.tsx` and `ThemeSwitcher.tsx` are deleted; no dangling imports remain.
6. `npm run lint` and `npm run build` both pass.

## Known minor side-effect (accepted)

On scrolled landing, the gear (`top-6 right-6 z-50`) overlays the right edge of the `StickyHeader` pill (`top-0 z-50`, fades in on scroll). User accepted this — corner gear over a centered `max-w-6xl` pill is a minor visual overlap, fixable later if it bothers anyone.
