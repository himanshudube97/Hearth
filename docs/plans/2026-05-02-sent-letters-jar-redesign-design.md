# Sent Letters — Jar Redesign

**Date**: 2026-05-02
**Status**: Draft (demo-approved, awaiting plan finalization)
**Demo route**: `/letters/sent-demo`

## Goal

Replace the current "lined-album with stamps" view at `/letters` (sent tab) with a more poetic, scrapbook-feeling artifact: a glass jar that holds the user's sent letters, with a hanging tag that doubles as the time selector. Default view is monthly because letters aren't sent every day; a toggle switches to a yearly summary so users can see, year-by-year, how many letters have been delivered vs. how many are still on their way.

## Why

The current sealed-letters page reads like an inventory list pinned to a lined sheet. It's functional but neutral. Letters are emotional artifacts — the surface that holds them should feel like a vessel a user wants to peek into. A jar metaphor makes the experience feel like opening a memory chest, and the hanging tag makes the time selector feel hand-tied rather than UI-ish.

## Page Layout (top → bottom)

```
┌────────────────────────────────────────────────────┐
│           [Nav pill — fixed, layout-level]         │
│                                                    │
│              letters i've sent           ← H1      │
│   ✦ tap the jar to see who you've written to ✦  ← prominent CTA  │
│   each stamp inside is a letter you've sent       │  ← tiny subtitle
│                                                    │
│              [ monthly | full year ]      ← mode toggle │
│                                                    │
│   [stamps fan out here when jar is opened]        │
│                                                    │
│   (flex spacer pushes jar near bottom)            │
│                                                    │
│                ┌───────┐                           │
│           ╔════╧═══════╧════╗                      │  ← cork lid + wax seal
│           ║                  ║──╮                  │  ← twine + dotted rope
│           ║  ✉  ❦  ✉        ║   ╰──[ ‹ Apr 2026 › ]│  ← hanging tag (selector)
│           ║                  ║          2 letters  │
│           ║  ▒▒  ▒▒  ▒▒     ║                      │  ← settled delivered pile
│           ╚══════════════════╝                      │
│   ──────────────────────────────────                │  ← shelf
│           1 sealed · 1 delivered                    │  ← legend
│                                                    │
└────────────────────────────────────────────────────┘
```

## Components

### 1. Page header (top)
- **H1**: `letters i've sent` — Caveat 38px
- **Prominent CTA**: `✦ tap the jar to see who you've written to ✦` — Cormorant italic 26px, accent-rose for the highlighted phrase. Anchors the upper third of the page so it doesn't read empty.
- **Subtitle**: `each stamp inside is a letter you've sent on its way` — muted Cormorant italic 13px

### 2. Mode toggle
A small pill with two options: `monthly` | `full year`. Pre-selected: monthly. Switching modes:
- clamps the cursor into bounds
- closes the jar (so the fanout doesn't show stamps from the previous mode)

### 3. Fanout area (above jar, conditional)
When the jar is opened, the stamps for the current selection fan out as a grid above the jar. Reuses the existing `Stamp` + `ReceiptModal` so click-through behavior is unchanged.

### 4. Jar (SVG)
A glass apothecary jar with character:
- **Lid**: cork-textured rectangle with grain speckles + a domed wax seal on top (with a small drip and an embossed `✿`)
- **Neck**: triple-strand twine wrap with a small bow on the left
- **Glass body**: soft cream fill with a peach radial glow at the bottom (warmth), left and right vertical sheen highlights, a top curve highlight, a subtle base ring
- **Embossed fleuron** ❦ faintly etched on the front of the glass
- **Contents** (clipped to interior):
  - sealed letters drift in the upper half (folded-envelope shape, accent-rose wax seal)
  - delivered letters settle at the bottom (muted color, sediment ellipse beneath them)
  - 4 firefly dots that pulse softly — pure decoration, signal of "memories live here"
  - if total count exceeds the visual cap (14), a `+ N more` wisp appears in the middle
- **Tap behavior**: lid lifts (`translateY(-14px) rotate(-6deg)`) → fanout transitions in → tapping again closes

### 5. Hanging tag (selector)
A small luggage-style paper tag tied to the right side of the jar's neck by a dotted rope:
- Notched corners (clip-path polygon for luggage-tag silhouette)
- Dashed inner border
- Eyelet at the top with a metallic ring (radial gradient) where the rope attaches
- Title (label): `Apr 2026` (monthly) or `2026` (yearly), Cormorant italic flanked by `❦` ornaments
- Count: `8 letters` in Caveat accent-rose
- `‹` and `›` arrow buttons step the cursor; disabled at bounds (25% opacity, `cursor: not-allowed`)
- Tilted `-4deg`, drop-shadow filter for depth

### 6. Shelf
A thin wood-grain bar under the jar (dusty-pink theme tone), giving the jar somewhere to rest.

### 7. Legend
`X sealed · Y delivered` under the shelf — small Cormorant italic, two color dots.

## Interaction Model

- **Default state**: jar closed, monthly mode, cursor on the most recent month with a sent letter (clamped to bounds).
- **Tap jar**: lid pops, stamps fan out above. Tap again to close.
- **Tag arrows**: navigate cursor, close the jar (fanout collapses), recompute jar contents.
- **Mode toggle**: switches between monthly and yearly. Closes jar, clamps cursor to bounds.
- **Tap a stamp** (when fanned out): opens the existing `ReceiptModal` (unchanged).

## Calendar Bounds

- **Floor**: `LAUNCH_YEAR = 2026`, `LAUNCH_MONTH = 0` (January)
- **Ceiling**: today's `(year, month)` from `new Date()`
- Arrows that would step past either bound are disabled (visually faded, no-op on click).
- `clampToBounds` runs on mode change, ensuring the cursor never escapes the valid range.
- In yearly mode today, only `2026` is valid → both arrows disabled until 2027 begins. Intentional.

## Stamp Shape Variety

Each stamp picks a deterministic shape from its ID hash:

| Shape       | Frequency | Look                                  |
|-------------|-----------|---------------------------------------|
| `postage`   | 3/5       | Existing scalloped-edge stamp (mask)  |
| `circle`    | 1/5       | Round seal, 110×110, circular frame   |
| `rect`      | 1/5       | Clean rectangle, 100×130, 3px radius  |

Hash uses `Math.abs(h * 13 + 7) % SHAPES.length` so that short IDs (e.g. `'1'`) still distribute across shapes (the original `h >> 12` always returned 0 for short IDs).

The `corner` photo-album marks are hidden on circle stamps (they don't look right against a round edge). The DELIVERED watermark is recentered on circles to stay inside bounds.

## File Touchpoints

Already in place from the demo work:

- **NEW**: `src/components/letters/sent/JarShelfDemo.tsx` — the entire jar view (header, toggle, jar SVG, hanging tag, fanout)
- **NEW**: `src/app/letters/sent-demo/page.tsx` — preview route
- **MODIFIED**: `src/components/letters/sent/Stamp.tsx` — added `shape` variant (postage/circle/rect), shape-specific styles, hash-fix for short IDs

To-be-modified during integration:

- `src/components/letters/sent/SentView.tsx` — replace the lined-album rendering with the jar view; wire to real `/api/letters/sent` data instead of mock; remove `YearTabs` + `StampGrid` (or keep `StampGrid` for the fanout reuse)

To delete (if jar replaces it entirely):

- `src/components/letters/sent/YearTabs.tsx` — superseded by the hanging tag
- The lined-album CSS in `SentView.tsx`

## Integration Plan (sketch)

1. Promote `JarShelfDemo` → `JarSentView` (rename, accept stamps as a prop instead of using mock).
2. Update `SentView.tsx` to fetch sent stamps and pass them to `JarSentView`.
3. Pass real `LAUNCH_YEAR` / `LAUNCH_MONTH` (configurable; sensible default is the user's `createdAt` year).
4. Empty-state: when a user has zero sent letters across all months, show a single empty jar with a soft "you haven't sealed any letters yet" line.
5. Remove `/letters/sent-demo` route once the live page is on the new view (or keep as an internal preview; user's call).
6. Remove old `YearTabs` and lined-album CSS from `SentView.tsx`.

## Open Questions / Future Polish

- **Real launch month per user**: should the floor be the platform launch (Jan 2026 hard-coded) or the individual user's first sent letter? Per-user is more intimate but adds complexity. Default to hard-coded for v1.
- **Empty months**: tag arrows currently step through *every* month between Jan 2026 and today, including months with zero letters (the jar shows empty). Alternative: skip empty months. Current behavior feels honest ("nothing in May" is itself a fact) — keeping it.
- **Mobile layout**: the jar block is 520×410px. On narrow screens the hanging tag may push past the right edge. Needs a media query: tag swings under the jar instead of beside it, or jar+tag scale down.
- **Reduced motion**: firefly pulses use SVG `<animate>`. Should respect `prefers-reduced-motion`.
- **Accessibility**: the jar is a `<button>` with aria-label. The tag arrows are `<button>` with aria-label. The mode toggle uses two buttons. Should add a screen-reader-only summary of the current selection ("Showing 2 letters from April 2026: 1 sealed, 1 delivered").
- **Stamp shape on the live page**: the shape-variety change in `Stamp.tsx` already affects the existing `/letters` (sent tab) view. If the jar redesign replaces that view, no concern. If kept as a fallback, confirm it's a desired change there too.

## What's NOT in scope

- Inbox view (`InboxView.tsx`) is untouched.
- The compose flow (`/letters/write`) is untouched.
- `ReceiptModal` design and behavior unchanged — clicking a fanned-out stamp opens the same modal as before.
- No backend / API changes. All sealing/delivery logic intact.
