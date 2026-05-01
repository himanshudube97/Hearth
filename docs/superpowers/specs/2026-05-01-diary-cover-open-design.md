# Diary Cover Open Animation — Design

**Date:** 2026-05-01
**Status:** Approved (pending spec review)
**Scope:** `/write` page only (desktop + tablet). Mobile unchanged.

## Goal

When the user lands on `/write` for the first time in a session, the diary appears **closed** at screen center. A trackpad scroll gesture progressively lifts the cover open, revealing the existing two-page `BookSpread`. Once open, a "Close diary" button in the top-right returns to the closed state.

The intent is a tactile, ritualistic moment — "I'm opening my journal" — without adding friction on every visit.

## Non-goals

- Two-way close via reverse-scroll gesture. Close is a button, not a gesture.
- Cover animation on mobile. Mobile keeps its existing `MobileJournalEntry` flow.
- Modifying `BookSpread` or `react-pageflip` integration.
- Per-day or per-visit cover. Once-per-session only.

## User-visible behavior

### States

A single state variable `coverState: 'closed' | 'open'`. The "opening" feel during scrolling is just the interpolation of the `progress` motion value (see below) — no separate state.

1. **`closed`** — first /write visit of the session. User sees only the diary cover at screen center (single page width, ~650×820). The cover gently bobs ±2° on a 4s loop as a discoverability cue. Subtle text *"Scroll to open"* fades in below after ~1s; fades out as scrolling begins.
2. **`open`** — `progress` has reached `1`, cover unmounted, normal `BookSpread` experience. A small × icon button at top-right of the viewport (tooltip: "Close diary") returns to `closed`.

Wheel-capture is mounted whenever `coverState === 'closed'`. State transitions: `closed → open` (snap completes after user scrolls past 0.5), `open → closed` (close button).

### Persistence

Session-scoped via `sessionStorage`, key `hearth-diary-cover-opened`. When `coverState` becomes `'open'`, set to `'true'`. On mount, read this key and skip directly to `'open'` if set. Cleared when the close button is clicked.

### Mobile

`useLayoutMode()` returning `'mobile'` skips all cover logic — the existing `MobileJournalEntry` renders unchanged.

## Visual choreography

### Layout model

A wrapper `<motion.div>` is centered on screen via the existing `top: max(50%, 510px); left: 50%; translate(-50%, -50%)` pattern from `DeskScene`. Inside the wrapper:

- The existing `BookSpread` (1300×820) at its normal position.
- A new `DiaryCover` element (650×820), positioned absolutely with `left: 50%` (its left edge at the wrapper's horizontal center = the spine). `transform-origin: left center`, `rotateY: 0` initial.

### Single source of truth: `progress`

A `useMotionValue(0)` ranges `0` (closed) → `1` (open). All animated values derive from it via `useTransform`:

| Property | Transform |
|---|---|
| Cover `rotateY` | `progress × −180` (deg) |
| Wrapper `translateX` (additional offset on top of the existing centering) | `(1 − progress) × −325` (px) |
| BookSpread `opacity` | ease-in: `progress` (start fade ~10%, full at ~70%) |
| Cover `opacity` | `1` until `progress > 0.95`, then linear to `0` at `1.0` |
| Cover drop-shadow blur | `8 + progress × 32` (px) — cover lifts visually |

The wrapper `translateX` is what makes the closed book *appear* visually centered: when closed (cover only, single page wide), wrapper shifts left by 325px so the cover sits at screen center. As the spread fades in and gains width, the wrapper eases back to 0, re-centering the now-wider open spread.

### Snapshot at key progress values

| progress | Wrapper x | Cover rotateY | BookSpread opacity | Cover opacity |
|---|---|---|---|---|
| 0.0 | −325 | 0° | 0 | 1 |
| 0.5 | −163 | −90° | 0.5 | 1 |
| 0.9 | −33 | −162° | 1 | 1 |
| 1.0 | 0 | −180° | 1 | 0 (unmounts) |

## Gesture mechanics

### Wheel capture

While `coverState === 'closed'`, mount a full-viewport `<div>` with `onWheel`:

```ts
const SENSITIVITY = 1 / 600
onWheel = (e) => {
  e.preventDefault()
  progress.set(clamp(progress.get() + e.deltaY * SENSITIVITY, 0, 1))
  scheduleSnap()
}
```

`preventDefault()` stops the body from bouncing/scrolling on a fixed-position page. The capture div uses normal pointer-events — there are no click targets on the cover while closed, so nothing needs to pass through.

### Idle-snap

A `setTimeout` resets on every wheel event. After 150ms with no wheel events:

- `progress >= 0.5` → `animate(progress, 1, { type: 'spring', stiffness: 200, damping: 26 })`. On complete: `setCoverState('open')`, write sessionStorage, unmount wheel-capture div.
- `progress < 0.5` → `animate(progress, 0, { type: 'spring', stiffness: 200, damping: 26 })`. Stays in `coverState='closed'`.

Only the idle-snap commits state. Half-hearted partial scrolls naturally settle back. This is what makes a confident gesture feel "captured" without locking accidentally.

### Sensitivity tuning note

`1/600` works for both trackpads (~50 events × ~6 delta per swipe ≈ 0.5 progress = exactly snap threshold) and mouse wheels (~100 delta per notch ≈ 0.17 progress per notch). Tune in dev. No separate code paths.

## State management & close

`useDiaryCover()` hook owns:

- `coverState: 'closed' | 'open'` — React state
- `progress: MotionValue<number>` — Framer motion value
- Derived motion values (`wrapperX`, `spreadOpacity`, etc.) via `useTransform`
- `onWheel(e)` — wheel handler
- `closeCover()` — `sessionStorage.removeItem(...)`, `progress.set(0)`, `setCoverState('closed')`. Jump-cut, no animation. Two-way close was explicitly scoped out.

Initial mount logic:
```ts
const initial = sessionStorage.getItem('hearth-diary-cover-opened') === 'true' ? 'open' : 'closed'
const [coverState, setCoverState] = useState(initial)
const progress = useMotionValue(initial === 'open' ? 1 : 0)
```

(Guard `sessionStorage` access for SSR — already handled by the `mounted` gate at [DeskScene.tsx:46](src/components/desk/DeskScene.tsx#L46).)

## Cover styling (theme-aware)

`DiaryCover.tsx` renders a 650×820 element with:

- **Background**: `theme.bg.primary` darkened by ~15% (computed via a small `darken(hex, 0.15)` utility, or `color-mix(in srgb, ${theme.bg.primary}, black 15%)` if browser support is fine — Next 16 / React 19 environments support it).
- **Inner gradient sheen**: subtle linear gradient overlay (top-left highlight, bottom-right shadow) ~5% opacity to suggest leather.
- **Grain texture**: very light noise overlay via SVG filter or `background-image` data URL, ~3% opacity.
- **Spine highlight**: 4px-wide gradient strip on the cover's left edge, `theme.accent.warm` at low opacity — catches light at the binding.
- **Corner accents**: small triangular gold/silver corners (~24px) using `theme.accent.warm`, four corners.
- **Center ornament**: existing `ThemeOrnament` component scaled up (~2x).
- **Drop shadow**: `0 ${8 + progress × 32}px ${16 + progress × 48}px rgba(0,0,0,0.35)` — increases as cover lifts off.
- **Bobbing animation** (closed only): `rotate: [-2°, 2°, -2°]` over 4s loop, paused once `progress > 0`.

Uses `useThemeStore` so cover updates live when the user changes themes.

**v1 deferral:** All cover colors derive from existing theme fields. We do not add a `theme.cover` field. Once shipped, if a particular theme needs a distinct cover (e.g., a black leather diary regardless of theme), add `theme.cover: { base, accent, ornament }` to `lib/themes.ts` and update `DiaryCover` to consume it.

## File changes

| File | Change | Approx LOC |
|---|---|---|
| `src/components/desk/DiaryCover.tsx` | **NEW** — cover element with theme-driven visuals, receives `progress: MotionValue`, derives all transforms internally | ~120 |
| `src/hooks/useDiaryCover.ts` | **NEW** — encapsulates `coverState`, `progress`, idle-snap, sessionStorage, wheel handler, `closeCover()`. Returns the values + handlers `DeskScene` needs. | ~80 |
| `src/components/desk/DeskScene.tsx` | **MODIFIED** — wire `useDiaryCover()`; wrap existing book block in a `motion.div` with `style={{ x: wrapperX, opacity: spreadOpacity }}`; mount `<DiaryCover progress={progress} />` overlay; mount full-screen wheel-capture div when `coverState === 'closed'`; mount `<CloseButton onClick={closeCover} />` when `coverState === 'open'`. Mobile path untouched. | +30 |

`BookSpread.tsx`, `MobileJournalEntry.tsx`, `lib/themes.ts`, `react-pageflip` integration — **no changes**.

## Boundaries & invariants

- `BookSpread` is treated as a black box. The cover layer reads no internal state from it. Only its parent's `x` and `opacity` are animated externally.
- `progress` is the single animation source. No component should set its own conflicting transform.
- `coverState` transitions are: `closed → open` (after snap completes) and `open → closed` (button only). No other paths.
- `sessionStorage` is read once on mount; from there `coverState` is the live source of truth.

## Edge cases

- **SSR**: existing `mounted` gate at [DeskScene.tsx:46](src/components/desk/DeskScene.tsx#L46) already prevents hydration mismatch. Read `sessionStorage` inside `useEffect`, not initial state.
- **Theme change while closed**: cover live-updates colors via `useThemeStore` — already handled by being a normal React component.
- **Resize during opening**: positioning uses the existing centered transform on the wrapper; no special resize handling needed.
- **Wheel events during snap-animation**: lock the wheel handler while a snap animation is running (via a `isSnapping` ref) so deltas don't fight the spring. After `onComplete`, unlock.
- **User opens a second tab on /write**: each tab has its own `sessionStorage` snapshot. First tab opens diary → key set in that tab. Second tab opened later → also reads `'true'` (sessionStorage IS shared per-origin per-tab session... actually it's per-tab, so each tab independently shows the cover once). This is the desired behavior.

## Testing

- **Manual**: open `/write` in fresh session → cover shown, scroll → opens smoothly → close button returns to closed → second nav within session skips cover. Repeat with each of the 10 themes to verify cover styling reads correctly.
- **Dev tweaking**: `SENSITIVITY` and snap spring config tuned in dev with real trackpad + mouse wheel.
- **Mobile sanity**: open `/write` on a phone-width viewport → no cover, existing `MobileJournalEntry` renders.
- No automated tests for animation timing — matches existing convention in the desk components, which are also visually tested only.

## Open questions

None blocking. Two minor decisions deferrable to implementation:

1. Exact close-button styling — match nearest existing top-bar button pattern; reused, not reinvented.
2. Exact bobbing amplitude/period for the closed-cover idle animation — tune in dev for "subtle but present."
