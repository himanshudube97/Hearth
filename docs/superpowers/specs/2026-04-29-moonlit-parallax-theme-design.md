# Moonlit — parallax theme

**Status:** Design approved, awaiting implementation plan
**Date:** 2026-04-29

## Summary

A new Hearth theme called **Moonlit** that renders a 5-layer parallax scene of a moon over still water, with cursor-driven depth shift, gentle ambient drift, and twinkling stars. The effect is fully isolated to this theme — no other theme's appearance or behavior changes. Reference inspiration: https://parallax-day-and-night.netlify.app/.

## Goals

- Add one new theme (`moonlit`, display name "Moonlit") with a distinctive parallax background that no other theme has.
- Cursor movement subtly shifts five depth layers, creating spatial depth.
- Scene feels alive even when the cursor is still (ambient drift, star twinkle).
- Implementation lives in a single new component; touching `Background.tsx` is a single early-return branch — every other theme's render path is unchanged.

## Non-goals

- No day variant or day↔night toggle. The scene is intentionally a single mood.
- No scroll-driven parallax. Cursor only.
- No new dependencies (uses existing React + raw `requestAnimationFrame`).
- No raster art assets in `/public`; everything is inline SVG.
- No changes to other themes' colors, particles, or behavior.

## Scene composition

Five depth layers, far → near. Larger parallax shift = closer to the viewer.

| # | Layer            | Content                                                                                          | Mouse shift (px, max) |
|---|------------------|--------------------------------------------------------------------------------------------------|-----------------------|
| 1 | Sky              | Vertical gradient `#0A0E1A → #14182A`, faint nebula wash                                         | 0 (anchor)            |
| 2 | Stars (far)      | ~80 small SVG `<circle>`s, varied brightness, CSS keyframe twinkle with staggered delays          | ±6                    |
| 3 | Moon + halo      | One large soft-edged circle (~140 px) upper third, radial-gradient fill, luminous bloom layer    | ±14                   |
| 4 | Water            | Lower half: dark gradient with vertical "moon path" reflection stripe, faint horizontal shimmer  | ±22                   |
| 5 | Foreground reeds | 4–6 thin curved SVG paths along bottom edge, near-black silhouette                               | ±36                   |

Y-axis shifts are dampened to 50% of X-axis so vertical mouse motion feels subtler than horizontal.

Ambient drift: each layer adds a 1–2 px sine offset on its own phase so the scene never freezes when the cursor is still.

## Theme integration

New entry in `src/lib/themes.ts`:

```ts
export type ThemeName =
  | 'rivendell' | 'hearth' | 'rose' | 'sage'
  | 'ocean' | 'postal' | 'linen'
  | 'moonlit'   // new

export const moonlitTheme: Theme = {
  name: 'Moonlit',
  description: 'Moon over still water',
  mode: 'dark',
  bg: { primary: '#0A0E1A', secondary: '#14182A',
        gradient: 'linear-gradient(180deg, #0A0E1A 0%, #141A2C 50%, #0E1422 100%)' },
  text: { primary: '#E4E8F0', secondary: '#A8B2C8', muted: '#6E7890' },
  accent: { primary: '#7B8FB8', secondary: '#5E72A0',
            warm: '#E8DCA8', highlight: '#F4E8B8' },
  glass: { bg: 'rgba(20, 26, 44, 0.55)',
           border: 'rgba(123, 143, 184, 0.15)', blur: '28px' },
  moods: { 0: '#3E4258', 1: '#5E6680', 2: '#7B8FB8',
           3: '#A8B6D0', 4: '#E8DCA8' },
  moodEmojis: ['🌑', '🌒', '🌓', '🌔', '🌕'],
  moodLabels: ['New', 'Waxing', 'Half', 'Gibbous', 'Full'],
  particles: 'moonlit',
  ambience: 'moonlit',
  cover: '#1F2A44',
}
```

Type unions extended:
- `Theme.particles`: add `'moonlit'`.
- `Theme.ambience`: add `'moonlit'`.
- `ThemeName`: add `'moonlit'`.
- Register `moonlitTheme` in the `themes` record.

The `particles: 'moonlit'` value is a sentinel — it does not correspond to a tsParticles config. `Background.tsx` recognizes it and renders `MoonlitScene` instead of `<Particles>`.

## Component architecture

### New: `src/components/MoonlitScene.tsx`

Self-contained component. Mounted only when active theme is `moonlit`. Owns:
- Layer DOM (five fixed-position children of a fullscreen root).
- `mousemove` listener on `window`.
- Single `requestAnimationFrame` loop driving easing for all layers.
- CSS keyframes for star twinkle (scoped via `styled-jsx` or unique class prefix).

Component shape:

```
MoonlitScene
└── <div class="moonlit-root">                (fixed, inset-0, z-0, pointer-events-none)
    ├── <div class="layer sky"/>              (CSS gradient)
    ├── <svg class="layer stars">…</svg>      (~80 circles, twinkle)
    ├── <svg class="layer moon">…</svg>       (radial-gradient circle + halo)
    ├── <svg class="layer water">…</svg>      (gradient + reflection stripe)
    └── <svg class="layer reeds">…</svg>      (silhouette paths)
```

Estimated size: 200–250 LOC including the inline SVG path data and twinkle CSS.

### Touchpoint: `src/components/Background.tsx`

Add at the top of the render branch (after current theme is known):

```tsx
if (theme.particles === 'moonlit') return <MoonlitScene />
```

This early-return means `<Particles>` never mounts when the theme is Moonlit, and every other theme's existing code path is byte-identical to today.

### Touchpoint: `src/components/ThemeSwitcher.tsx`

Add one entry to whatever array/list drives the selector UI so users can pick Moonlit.

### Conditionally edited (only if needed)

- `src/components/AmbientSoundLayer.tsx` — if it `switch`es on `ambience`, add a `moonlit` case (likely a calm water/wind loop, or no-op fallback). To inspect during implementation; no edit if a default-fallback exists.
- `src/components/landing/ThemeShowcase.tsx` — if the landing page hard-codes a theme list, add an entry.

### Untouched by design

All other branches of `Background.tsx`, every particle config function, every other theme entry, every other component. The early-return is the only hook into existing rendering — no other theme's behavior changes.

## Mouse parallax mechanics

### Input → output

```
mousemove (clientX, clientY)
  → normalize to [-1, +1] around viewport center
  → store as targetX, targetY
```

### Animation loop

A single `requestAnimationFrame` loop:

```
currentX += (targetX - currentX) * 0.08   // soft easing
currentY += (targetY - currentY) * 0.08
for each layer in [sky, stars, moon, water, reeds]:
  drift = sin(t * layer.speed + layer.phase) * layer.driftAmplitude
  tx = currentX * layer.shift + drift
  ty = currentY * layer.shift * 0.5
  layer.style.transform = translate3d(tx px, ty px, 0)
```

`translate3d` keeps each layer GPU-composited. One rAF, five DOM transform writes per frame.

### Constants (per layer)

| Layer  | shift (px) | drift amplitude (px) | drift speed (rad/s) |
|--------|------------|----------------------|---------------------|
| sky    | 0          | 0                    | —                   |
| stars  | 6          | 1                    | 0.0003              |
| moon   | 14         | 1.5                  | 0.0005              |
| water  | 22         | 2                    | 0.0007              |
| reeds  | 36         | 2                    | 0.0009              |

(Numbers are starting points; tune during implementation.)

### Star twinkle

Pure CSS: each `<circle>` has `animation: twinkle Xs ease-in-out infinite alternate` with random duration (2–6 s) and `animation-delay` to stagger. No JS cost beyond initial render.

### Reduced motion

```
prefers-reduced-motion: reduce
  → disable cursor parallax (no mousemove listener attached)
  → disable ambient drift (skip the rAF loop entirely)
  → freeze star twinkle (animation-play-state: paused)
```

The scene renders as a static image. No motion at all.

### Touch / coarse-pointer devices

```
matchMedia('(pointer: fine)').matches === false
  → disable cursor parallax (no mousemove listener)
  → keep ambient drift + twinkle (the rAF loop runs without targetX/Y input)
```

On phones / tablets the scene still feels alive via drift + twinkle, just without cursor reactivity.

## Isolation guarantees

- `MoonlitScene` has no module-level state, no globals, no persistent listeners outside its `useEffect`.
- All event listeners are attached in `useEffect` and torn down in its cleanup function.
- The rAF loop is cancelled on unmount via `cancelAnimationFrame`.
- All CSS is scoped (styled-jsx or `.moonlit-*` prefix). No global selectors.
- Switching themes from Moonlit to anything else: `MoonlitScene` unmounts, listeners are removed, rAF is cancelled, transforms are gone. Cleanly.
- Switching from any other theme to Moonlit: tsParticles unmounts (its `<Particles>` returns null because we early-returned before it), `MoonlitScene` mounts. No interaction between the two.
- Zero new package dependencies.

## Build order

1. Add `moonlitTheme` to `themes.ts`; verify the theme switcher lists it and basic palette colors render. (Temporarily set `particles: 'mist'` or similar so existing path keeps working until step 6.)
2. Build static `MoonlitScene` — all five layers visible, no animation, mounted directly in a test page or behind a feature flag.
3. Wire `mousemove` + the easing rAF loop.
4. Add ambient sine drift + star twinkle CSS.
5. Add `prefers-reduced-motion` and `pointer: fine` guards.
6. Add the early-return in `Background.tsx`; flip `particles` to `'moonlit'`; remove any temp.
7. Manual verification:
   - Switch to Moonlit → parallax works, mouse-still scene drifts, stars twinkle.
   - Switch to every other theme → identical to before this change.
   - Toggle `prefers-reduced-motion` → scene goes static.
   - Open on mobile / touch → parallax inert, drift + twinkle still visible.

## Risks and considerations

- **Performance on low-end devices.** Five `translate3d` updates per frame plus 80 CSS-animated circles is well within budget, but worth verifying on a slower laptop. Mitigation: drop star count to ~40 if FPS dips; everything else is already cheap.
- **Visual contrast against journal UI.** The dark navy palette must keep the cream paper spreads readable. The `text` and `glass` palette values are picked to match other dark themes (rivendell, hearth) which already work; visual QA during step 7 confirms this.
- **Theme list duplication.** The full list of themes lives in `themes.ts` but is sometimes shadow-listed in UI components. Adding a new theme requires updating each list. Mitigated by enumerating from `Object.keys(themes)` where possible — but if any component hardcodes the list, it gets one extra entry.
- **TypeScript union widening.** Adding `'moonlit'` to the `particles` and `ambience` unions means `switch` statements elsewhere may newly require a `default` or a `moonlit` case. The TS compiler will surface these — easy to fix.

## Open questions resolved during brainstorm

- Scene: moon over still water (option C of the scene options).
- Driver: cursor only (option A).
- Day/night: night only (option A).
- Theme name: `moonlit`.
- Implementation: layered inline SVG (option 1).
