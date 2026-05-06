# Landing Page Diary — Design Spec

**Date:** 2026-05-06
**Status:** Draft for review
**Owner:** Himanshu

## Goal

Replace the current static `FeaturesSection` on the marketing landing page with an **interactive diary** the user flips through — eight two-page spreads, one per feature, showing real screenshots and a live theme-switcher. The page goes from "ambient and quiet" to "informative and quiet": users learn what's inside Hearth without leaving the diary metaphor.

The signature interaction — a 3D corner-bend on hover — is a hard requirement (carries over from the user's other app).

## Non-Goals

- No scroll-hijacking. The diary lives in normal page flow; users navigate with Prev/Next, arrow keys, page pips, or swipe.
- No hero changes. The existing `HeroSection` stays exactly as-is.
- No new app features — this is purely landing-page work.
- No new npm packages. Framer Motion v12 is already a dep.

## Page Structure

The landing page (`src/app/page.tsx`) becomes:

1. **Hero** — `HeroSection` (unchanged)
2. **Diary** — new `DiarySection` (replaces `FeaturesSection`)
3. **Footer CTA** — `FooterCTA` (unchanged)

The existing `WhisperGallery` between sections is **dropped** — the diary's own ambient surroundings replace its ambient role. (Open question — flag in review if you want to keep the whisper gallery.)

`FeaturesSection.tsx` is left in the codebase but un-imported so its SVG `Illustration` component (`journal` / `letters` / `scrapbook` / `memory`) can be reused inside the diary. A follow-up cleanup deletes the file once the diary ships.

## Diary Spreads

Eight spreads, navigated 1 → 8. Total 7 forward clicks from cover to CTA.

| # | Left page | Right page |
|---|---|---|
| 1 | **Cover** — closed front cover. "HEARTH" debossed in serif italic with a thin gold-foil stroke (theme `accent.warm`). Subtitle "A small house for the days." Theme-tinted card-stock background. | Back of cover (blank with grain). |
| 2 | **I. The page that listens** — Roman numeral, italic title, 1–2 short paragraphs, marginalia. Reuses the `journal` SVG as a small accent. | Polaroid-framed screenshot of a written entry (`journal-entry.png`). Italic caption beneath. |
| 3 | **II. Letters that wait** — copy + reused `letters` SVG. | Screenshot of compose / sealed letter (`letter-sealed.png`) + caption. |
| 4 | **III. Small things, kept** — copy + reused `scrapbook` SVG. | Screenshot of a populated scrapbook canvas (`scrapbook.png`) + caption. |
| 5 | **IV. Where memory grows** — copy + reused `memory` SVG. | Screenshot of the memory/constellation view (`memory-constellation.png`) + caption. |
| 6 | **V. A house with many windows** — copy on themes. | **Live polaroid grid** of all 10 themes. CSS-rendered, no screenshots. Click any polaroid → diary tint, surrounding background, and particle layer all morph to that theme over ~600ms. |
| 7 | **VI. Yours alone** — copy on E2EE / privacy. | Lock/key visual + screenshot of master-key UI (`master-key.png`) + caption. |
| 8 | **Begin** — soft closing prose ("the page is yours"). | Big themed CTA button — same "Begin Writing" target as the hero CTA. |

### Spread definition data

`src/components/landing/spreads.ts` exports a `SPREADS: SpreadDef[]` array. Each entry:

```ts
type SpreadDef = {
  numeral?: string                     // 'I', 'II', ... (omit on cover/back)
  title: string
  copy: string                         // 1–2 paragraphs
  marginalia?: string                  // bottom-left of left page
  illustration?: 'journal' | 'letters' | 'scrapbook' | 'memory'
  rightKind: 'photo' | 'polaroidGrid' | 'cta' | 'coverBack'
  imagePath?: string                   // for rightKind: 'photo'
  caption?: string                     // for rightKind: 'photo'
}
```

`DiarySpread.tsx` reads a single `SpreadDef` and renders both pages. `DiaryCover.tsx` and the polaroid grid / CTA right-pages are special-cased.

## Behavior

### Navigation

- **Prev / Next buttons** — small circular, theme-tinted, below the diary. Disabled at endpoints.
- **Arrow keys** — `←` prev, `→` next. Bound on `keydown` while the diary section is on screen (using an `IntersectionObserver` so we don't hijack global keys).
- **Page-pip indicator** — 8 dots below the diary; clickable to jump directly.
- **Touch / swipe** — horizontal swipe on the diary container flips one spread (50px threshold).

### Hover-corner-bend

- Each page has 4 hot-zones: top-left, top-right, bottom-left, bottom-right (≈80px square each).
- Top-left / bottom-left peel from the **left page** = preview of previous spread.
- Top-right / bottom-right peel from the **right page** = preview of next spread.
- Peel angle scales with mouse proximity to the very corner: closer = more peel (max ~45°).
- **Click a peeled corner** = commits the flip (calls `flipNext` / `flipPrev`).
- **Mouseout** = corner settles back over 250ms.
- Disabled in reduced-motion mode and on touch devices.

### Cover-opening (spread #1 ↔ #2 transition)

- Forward (#1 → #2): the front cover swings outward (right edge as hinge) over ~900ms — slower and more ceremonial than a normal page flip.
- Reverse (#2 → #1): the cover swings closed with the same animation, played in reverse.
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`. Different from regular page flips so the moment of "opening the diary" reads as distinct.

### Theme demo on spread #6

- Each polaroid is a live mini-version of the theme: actual `bg.gradient`, 2–3 floating particle dots, theme name in italic handwritten beneath.
- **Hover** a polaroid → lifts 6px, tilts -2°, particles intensify briefly, shadow deepens.
- **Click** a polaroid → `setTheme(themeId)` is called (existing `useThemeStore`). The diary tint, surrounding section background, and particle layer cross-fade over ~600ms. Clicked polaroid gets a faint glow ring (`active`).
- The diary captures `originalTheme` on mount via `useRef`. A small "← reset" link appears below the polaroid grid once the user has clicked one; clicking it calls `setTheme(originalTheme)`.

### Mobile fallback (< 720px)

- Single-page mode: one page at a time, full container width.
- Same 8 spreads → same 8 single-pages (each spread's left + right are stacked vertically).
- Polaroid grid becomes a horizontal-scroll carousel.
- Hover-corner-bend disabled. Replaced with a soft "tap edge to peek" hint that briefly lifts the corner on first visit, then fades.

### Reduced motion

When `prefers-reduced-motion: reduce`:
- Page flips → 150ms cross-fade (no 3D).
- Hover-corner-bend disabled (corner shows a tiny `↻` hint icon instead).
- Theme polaroid swap → instant.
- All idle micro-animations frozen.
- Surrounding particles dim to 30% opacity, no movement.
- Sound forced off (regardless of toggle).

## Visual System

### The diary itself

- **Paper:** cream base `#fbf4e3`, tinted toward current theme's `accent.primary` at 8% opacity. Mixed via CSS `color-mix(in srgb, #fbf4e3, var(--theme-accent) 8%)`. Light themes get a subtle warm tint; dark themes get a soft lavender/dusk wash. Always retains contrast for legible text + screenshots.
- **Edges:** subtle deckled effect (CSS `clip-path` polygon with ±1px irregularity). Faint paper grain via SVG `feTurbulence` filter at low opacity, applied as `background-image`.
- **Spine:** vertical gradient stripe down the spread center, ~18px wide, darker shadow falling toward both pages.
- **Corner shadows:** each unhovered corner has a 6px inset shadow so it reads as liftable.

### Cover (spread #1)

- Front cover background = a darker, theme-accent-tinted card stock (use `accent.primary` mixed with `#2a2218` at 50/50 for a fabric-leather feel).
- "HEARTH" debossed in Playfair italic, ~5rem tracking-[0.3em], with a 1px stroke in `accent.warm` (gold-foil simulation).
- Subtitle "A small house for the days." in smaller italic at ~50% opacity below the title.
- Subtle 3D drop-shadow underneath the closed book.

### Inside pages — left side

- Roman numeral, ~3rem, Playfair italic, opacity 0.4. (Matches existing `FeaturesSection` style.)
- Title: Playfair italic, ~1.75rem, full opacity.
- Body copy: `theme.text.secondary`, ~1rem, line-height 1.7, max ~36ch.
- Marginalia: bottom-left of page, italic, ~0.75rem, opacity 0.5. Examples per spread:
  - Journal: *"— for later"*
  - Letters: *"— sealed and waiting"*
  - Scrapbook: *"— pinned in place"*
  - Memory: *"— look up"*
  - Themes: *"— pick your weather"*
  - Privacy: *"— only yours"*
- Optional small SVG decoration (the existing journal/letters/scrapbook/memory illustrations from `FeaturesSection` get reused as accent details).

### Inside pages — right side

- Screenshot framed as a **polaroid-ish photo**: white border 12px, slight rotation 1–2° (alternating direction per spread), subtle drop-shadow. Looks glued in.
- Caption beneath, ~0.85rem italic, opacity 0.6, max 1–2 short phrases (e.g. *"a wax stamp. a date you choose."*).
- Photo gets a subtle paper-texture overlay (`mix-blend-mode: multiply` with the same SVG noise filter, very low opacity) so it doesn't fight the cream paper.

### Surrounding section background

- Theme-aware: takes the current theme's `bg.gradient` at full intensity.
- Existing `Background.tsx` particle component is rendered behind the diary so when the theme is "Sakura" the section has actual sakura petals drifting; "Snow" → snowflakes, etc.
- A radial vignette darkens edges so the diary feels stage-lit.

### Polaroid grid (spread #6)

- 10 polaroids in a 5×2 grid with slight rotation variance (-3° to +3° per polaroid, deterministic by index).
- Each polaroid: ~120×140px, white frame, holds:
  - "Photo" area (~96×96px) showing that theme's `bg.gradient` + 2–3 small floating particle dots positioned via deterministic seed
  - Theme name underneath in italic at ~0.85rem (font choice resolved during implementation — see Open Question #2)
- Tape strips: 3 of the 10 polaroids have a semi-transparent yellow rectangle at one top corner, deterministically chosen.

### Typography

- Existing Playfair (serif italic) for titles, body, marginalia. No new font loaded for the main copy.
- For polaroid theme names: prefer using Playfair italic at smaller size (avoid loading a new handwritten font unless one is already loaded). Final call confirmed during implementation.

## Animation

### Page flip (Next / arrow / pip jump)

- Right page rotates around the spine (Y-axis) over ~700ms with `cubic-bezier(0.4, 0.0, 0.2, 1)` (decelerates as it lands).
- Implementation: each spread is a `<div>` with `transform-style: preserve-3d`. The flipping leaf is a child with two faces (front + back) using `backface-visibility: hidden`.
- The back face is rendered with the *previous* spread's content visible briefly mid-flip.
- A page-shadow gradient slides across the spine during the flip, deepest at 90°.
- Slight cylindrical warp during flip via a sub-element with `rotate3d(0, 1, 0, ...)` and a small `translateZ` curve so it looks like real paper.

### Hover-corner-peel

- Mouse enters within ~80px of a corner → corner curls up over 200ms.
- Implemented as a separate `<div>` per corner with `transform-origin` at the diagonally opposite corner of the hot-zone, `transform: rotateX/Y(...)` driven by mouse distance.
- Reveals a clipped strip of the next/prev spread underneath.
- Settles back over 250ms on mouseout.

### Cover-opening (one-time)

- The cover element rotates outward (right edge as hinge) over ~900ms via Framer Motion `animate` with `ease: [0.25, 0.1, 0.25, 1]`.
- After completion, the cover element unmounts and spread #2 is rendered normally.

### Polaroid theme swap

- Polaroid hover: Framer Motion `whileHover={{ y: -6, rotate: -2, scale: 1.05 }}`.
- Polaroid click: a CSS ripple emanates from the polaroid (radial gradient expanding), and `setTheme(themeId)` triggers the global theme swap.
- The diary paper tint, surrounding background, and particle layer all transition over ~600ms (CSS transitions on theme-derived custom properties).

### Idle micro-animations

- Diary breathing: `scale: [1, 1.005, 1]` over 8s, perpetual, `ease: 'easeInOut'`.
- Page flutter: top edge of each visible page lifts ~1px at random intervals (8–14s), `ease: 'easeOut'`.
- Marginalia text: opacity `[0.5, 0.8, 0.5]` over 6s, perpetual.

### Sound (optional, off by default)

- A whisper-quiet paper rustle (`/public/sounds/page-flip.ogg`, ~10KB).
- Plays on each page flip if the user has toggled sound on.
- Toggle: small `🔇 / 🔊` icon next to the page-pip indicator. Persisted in `localStorage` under `hearth:diary-sound`.
- Honors `prefers-reduced-motion: reduce` (forced off).

## Tech & File Layout

### New files

```
src/components/landing/
├── DiarySection.tsx          orchestrator: section wrapper, theme override snapshot, IntersectionObserver
├── DiaryBook.tsx             3D stage + perspective wrapper + spine + paper texture
├── DiaryCover.tsx            cover spread (#1) with cover-open animation
├── DiarySpread.tsx           generic two-page renderer for #2–#5, #7
├── DiaryPageFlip.tsx         flipping leaf with front + back faces
├── DiaryCornerPeel.tsx       hover-corner-peel layer (4 corners per page)
├── DiaryNav.tsx              Prev/Next + page-pips + sound toggle
├── DiaryPolaroidGrid.tsx     spread #6: 10 live theme polaroids
├── DiaryThemePolaroid.tsx    single polaroid (mini bg, particles, name)
├── DiaryCTASpread.tsx        spread #8: closing prose + Begin button
├── spreads.ts                SPREADS: SpreadDef[] data
└── useDiaryNav.ts            hook: currentSpread, flipNext, flipPrev, jumpTo, keyboard binding
```

### Modified files

- `src/app/page.tsx` — drop `FeaturesSection` and `WhisperGallery`, insert `<DiarySection />` between `<HeroSection />` and `<FooterCTA />`. Diary loaded via `next/dynamic` with `ssr: false` so the 3D code doesn't bloat first paint.
- `src/components/landing/FeaturesSection.tsx` — left in place (un-rendered) so its `Illustration` SVG component can be imported by `DiarySpread.tsx`. Delete in a follow-up cleanup.

### Assets to add

Save under `public/landing/diary/`:

| File | Source |
|---|---|
| `journal-entry.png` | Real screenshot of a written entry (text + photo + song embed + doodle if possible). ~1200×900. |
| `letter-sealed.png` | Compose view OR sealed-letter card. ~1200×900. |
| `scrapbook.png` | Populated scrapbook canvas. ~1400×900. |
| `memory-constellation.png` | Constellation/garden view with a year populated. ~1400×900. |
| `master-key.png` | Master-key / lock UI. ~1200×900. |
| `sounds/page-flip.ogg` | ~10KB rustle (optional, off by default). |

**Theme polaroids do NOT need screenshots** — rendered live in CSS from each theme's existing `bg.gradient` and particle config.

### State

- `currentSpread: number` — local in `DiarySection`, defaults to 0 (cover).
- `themeOverride: string | null` — set when user clicks a polaroid; cleared by reset link.
- `originalThemeRef` — captured on mount; used to revert.
- `soundOn: boolean` — read from `localStorage` (`hearth:diary-sound`), default false.

### Performance

- Diary loaded via `next/dynamic({ ssr: false })`.
- Screenshots: `next/image` with explicit dimensions, `priority={false}`. Only spread #2's image is preloaded (next-up after cover). The rest use `loading="lazy"` and prefetch on hover of the Next button.
- Particle component already exists (`Background.tsx`); reused inside polaroid live previews with low instance count (2–3 particles each).
- 3D transforms use GPU-friendly properties only (`transform`, `opacity`).

### Existing code not touched

- `useThemeStore` — read + write only via existing API.
- `Background.tsx` — reused as-is.
- `HeroSection.tsx`, `StickyHeader.tsx`, `FooterCTA.tsx` — untouched.

## Open Questions

1. **WhisperGallery removal** — currently the spec drops it; the diary's ambient surroundings cover the same role. Confirm during review.
2. **Handwritten font for polaroid theme names** — fall back to Playfair italic unless a handwritten font is already loaded in the app shell. Final call during implementation.
3. **Screenshot crops** — exact dimensions and crops finalized when the user provides screenshots.

## Out of Scope

- Editing or rewriting `HeroSection`, `StickyHeader`, or `FooterCTA`.
- Adding new themes, particles, or sound effects beyond the single page-flip rustle.
- Backend or API changes.
- A/B testing infrastructure.
- Analytics events for diary navigation (a sensible follow-up but not in this spec).
