# Shelf — calendar redesign as a bookshelf of monthly diaries

**Date:** 2026-04-29
**Branch context:** `feat/design-overhaul-themes`
**Replaces:** the existing `/calendar` page
**Out of scope:** `/timeline` redesign, edit-in-shelf, streak migration

## Goal

Replace the grid-style `/calendar` with a **bookshelf** view: each year is a shelf, each month is a diary on that shelf. Tapping a spine pulls the book off the shelf as a closed cover, and a second tap opens it into a read-only book spread that the user flips through page by page — the same reading experience as `/write`, just locked to past content.

## Why now

- The grid calendar shows mood at a glance but reads as a generic mood-tracker. It doesn't reinforce the journaling identity of the rest of the app (the desk, the diary spread on `/write`, the scrapbook).
- The diary metaphor is already the strongest part of the product. Extending it to *browsing past entries* compounds that identity instead of adding a new one.
- Streaks and heatmap stats are not the value users come back for; reading what they wrote is. The grid view buries the reading affordance behind a small day cell.

## Scope decisions (settled in brainstorm)

| Decision | Choice |
| --- | --- |
| Naming | "Shelf" (nav label + `/shelf` URL) |
| Year navigation | One shelf at a time; year tabs as switcher; only years with entries |
| Spine interaction | Two-tap: spine → pulled-out closed book → open spread |
| Read mode | Pure read-only (no autosave, no inputs, no mood/photo/song/doodle controls) |
| Open-book structure | No cover page; tap opens directly to the first day's spread, just like `/write` |
| Reading navigation | Existing `DateTabRail` + `SpreadNavigation`; multi-entry days via `EntrySelector` (read-only) |
| Mobile layout | Vertical shelf, spines stacked horizontally on their sides |
| Spine colors | Curated 12-color year palette — same color for the same month across years |
| Streaks | Removed from this page; future home (likely `/me`) deferred |
| Timeline page | Untouched in this spec |

## Architecture

### Routes

- **New:** `src/app/shelf/page.tsx` — main shelf scene. Reads `?year=YYYY&month=MM&open=1` from `useSearchParams` and renders the appropriate state.
- **Replaced:** `src/app/calendar/page.tsx` — becomes a one-line client redirect to `/shelf` (preserves any existing in-app links and bookmarks).
- `src/middleware.ts`: confirm `/shelf` is treated like other authed routes (it should pick up the default protection automatically — no explicit allow-list change needed).

### URL state model

State on `/shelf` is fully derivable from query params:

| Params | Mode |
| --- | --- |
| (none) or `?year=YYYY` | `shelf` (default year = current year if it has entries; otherwise the most recent year that does) |
| `?year=YYYY&month=MM` | `pulled` (closed-book intermediate) |
| `?year=YYYY&month=MM&open=1` | `open` (reading) |

Transitions use `router.replace` (not `push`) so the browser back stack stays clean: shelf ↔ pulled ↔ open are state, not history. Hardware back from `open` → exits `/shelf` entirely; that matches how the rest of the app treats single-page state.

> **Trade-off note:** This means the closed-book intermediate is not preserved in browser history. If we later want back-button to step shelf → pulled → open, switch to `router.push` and add explicit close handlers. Acceptable for v1.

### Components

```
src/app/shelf/page.tsx                    // route entry, reads query params, hands to ShelfScene

src/components/shelf/
├── ShelfScene.tsx                        // top-level; owns mode + animation orchestration
├── ShelfHeader.tsx                       // "your shelf" title, year totals line
├── YearTabs.tsx                          // pill segmented control for years with entries
├── Shelf.tsx                             // wooden plank + 12 slots; orientation-aware
├── BookSpine.tsx                         // filled month spine — color, label, entry-count
├── EmptyMonthSpine.tsx                   // faint placeholder for months without entries
├── PulledOutBook.tsx                     // closed-book tilted intermediate w/ "tap to open"
├── ShelfBookSpread.tsx                   // read-only book spread (sibling to BookSpread)
├── shelfPalette.ts                       // monthIndex → color, plus label/year-roman helpers
└── index.ts                              // barrel export
```

**Reused from `src/components/desk/`** (no changes to these files):

- `LeftPage`, `RightPage`, `PageContent` — pure render
- `DateTabRail` — sparse-date day navigator (already supports a passed-in date list)
- `EntrySelector` — multi-entries-per-day tab; takes a `readOnly` prop (small addition)
- `PhotoBlock`, `SongEmbed`, `DoodlePreview` — static renderers already exist

**Why a sibling `ShelfBookSpread` (not extending `BookSpread`):** `BookSpread.tsx` is 588 lines and tightly entangled with autosave, lock validation, photo upload, and edit affordances. A read-only flag would force every code path to branch, expanding the file and the surface area for bugs. `ShelfBookSpread` reuses leaf components and stays focused on rendering + navigation — likely 150-200 lines, easy to reason about.

### Data flow

1. **Stats** (`useEntryStats`, already exists) loads on mount. Drives:
   - Year tabs (filtered to `years[].year` present in stats)
   - Header counts: this year's entry total, all-time total
   - Per-spine entry-count etching
   - Filled vs empty month classification

2. **Selected-month entries** (`useEntries({ month: 'YYYY-MM', includeDoodles: true })`) fetched lazily when `mode === 'open'`. The `pulled` state does not fetch — the cover doesn't need entry text.

3. Entries are grouped by calendar day on the client. `DateTabRail` receives only days that have entries. Initial day = first day of the month with an entry.

4. E2EE: `useEntries` already runs `decryptEntriesFromServer`. No new crypto.

## Visual & interaction states

### State 1 — Shelf

- Theme background, slightly warmer/dimmer than `/write`.
- Page title (lowercase serif): **your shelf**.
- Subtitle: `MM/YY · {entriesThisYear} ENTRIES THIS YEAR · {totalEntries} IN TOTAL`.
- Year tabs row (only years with entries; default selection = current year if present in stats, else the most recent year that is).
- Center: wooden plank shelf with 12 slots.
  - Filled month → `BookSpine`: month color, paper label with month name, entry count etched at the base.
  - Empty/future month → `EmptyMonthSpine`: faint translucent placeholder, not interactive.
- Desktop hover: spine lifts ~6px out of slot with soft shadow.
- Tap a filled spine → `mode = 'pulled'`.

### State 2 — Pulled-out

- Background dims to ~70% with vignette.
- Other spines stay visible but desaturate; the pulled spine animates out to center via shared `layoutId`.
- Center: closed book, ~−8° tilt, showing cover:
  - Month name in script (e.g. **april**)
  - Year in roman numerals (e.g. **MMXXVI**)
  - Month index as roman numerals at base (e.g. **vol. iv**)
  - Red ribbon bookmark
- Caption below: `tap to open · {entryCount} entries · MM/01 → MM/{lastDay}`.
- Top-left breadcrumb: `← shelf`.
- Tap closed book → `mode = 'open'`.

### State 3 — Open

- Closed book opens into a centered `ShelfBookSpread`.
- Background stays dimmed; pages are the focus.
- Top-left: `← shelf` (returns to shelf, skipping `pulled`).
- Top-right: small "april MMXXVI" label.
- `DateTabRail` shows only days with entries; first day pre-selected.
- Page flips via existing `SpreadNavigation` arrows + keyboard `← →`.
- `Esc` closes the book.
- "End of month" past last day is a no-op for v1; can add a soft hint later.

### Animations (Framer Motion)

- Spine → closed book: shared `layoutId` morph.
- Closed book → open: cover swings out, two pages settle. ~600ms total, easing `[0.22, 1, 0.36, 1]` (matches existing app feel).
- Closing: reverse, ~450ms.

### Spine palette

12 curated colors keyed by `monthIndex` (0–11) in `shelfPalette.ts`. Theme: seasonal progression — winter blues (Jan, Feb), spring greens (Mar, Apr, May), summer warms (Jun, Jul, Aug), autumn rusts (Sep, Oct), deep reds/purples (Nov, Dec). Same month always renders the same color across years; year is conveyed by the etched roman numeral year on the spine label.

> Initial palette values to be finalized during implementation against the existing theme tokens; the spec contract is "fixed by month index, theme-independent."

## Mobile adaptation (`< 768px`)

- Shelf rotates 90°: wooden rail becomes vertical along the left edge; spines lie horizontally on their sides, labels readable left-to-right; vertical scroll within the page.
- Year tabs stay as a horizontal pill row above the shelf.
- Header line wraps to two lines.
- Empty months remain as faint horizontal placeholders, same untappable rule.
- Tap-to-pull: spine rises and rotates to upright (closed-book) in screen center via the same shared `layoutId`. "tap to open" caption sits below.
- Open spread on phone: `ShelfBookSpread` viewport-checks and renders a single-page layout (mirroring the existing `MobileJournalEntry.tsx` pattern in `desk/`) instead of a two-page spread.
- Back is a real `← shelf` button at top-left; no hover affordances.
- Swipe-down-to-close is **deferred**.

## API & data — no changes required

All data is served by existing endpoints:
- `GET /api/entries/stats` (via `useEntryStats`)
- `GET /api/entries?month=YYYY-MM&includeDoodles=true` (via `useEntries`)

No new endpoints, no schema changes, no migrations.

## Testing strategy

- **Component tests** (per existing patterns in the repo): render `Shelf` with mock stats, assert filled vs empty spines; render `ShelfBookSpread` with mock entries, assert read-only render (no editor controls in DOM).
- **Manual QA matrix:**
  - Year with no entries (should never render — guard at year-tab level).
  - Current month, no entries yet (should render as empty placeholder, not as a filled spine with `0`).
  - Month with one entry on day 15 only — `DateTabRail` should pre-select day 15.
  - Month with multiple entries on the same day — `EntrySelector` switches between them, no edit affordances.
  - Letter / sealed entry inside a past month — renders without crashing (treated as a normal entry for v1).
  - Mobile vertical-shelf scroll, pull-out animation, open-spread layout.
  - `/calendar` URL still loads (redirects to `/shelf`).
  - Browser back from `open` exits `/shelf` (acceptable per URL state model decision).

## Acceptance for v1

- `/shelf` exists, nav links to it, `/calendar` redirects.
- Year tabs, filled spines, empty placeholders, year/total counts — all driven by real data via existing hooks.
- Spine → closed-book pull-out → open-book read view, with the described animations.
- Read view loads month entries, navigates days via `DateTabRail`, multi-entry days via `EntrySelector` (read-only).
- Mobile vertical-shelf layout works on < 768px.
- No editing affordances anywhere in the shelf path; `/write` is unchanged.

## Out of scope (explicit non-goals)

- `/timeline` redesign (separate brainstorm).
- Editing inside the shelf's open book — even within an entry's lock window. Edits stay on `/write`.
- Streak migration to `/me` — just removed from this page for now.
- Swipe-to-close gestures on mobile.
- Hover-prefetch of month entries.
- Shareable per-month deep links beyond `?year&month`.
- Multi-year scrolling shelf.
- Per-user shelf customization (cover colors, ribbon styles).

## Known follow-ups (post-v1)

1. Decide where streaks live (likely `/me` or a small shelf footer).
2. Reading polish: page-curl micro-animation on flip; "end of month" gentle hint on last day.
3. Timeline redesign brainstorm.
4. Letter/unsent-letter spreads inside the open book — special sealed-envelope spread vs treat as normal entry. Re-examine once v1 ships and we see how letters look in the read view.
