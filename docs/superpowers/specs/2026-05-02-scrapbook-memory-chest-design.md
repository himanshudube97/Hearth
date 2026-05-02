# Scrapbook Listing — Memory Chest Design

**Date:** 2026-05-02
**Status:** Draft, pending user review
**Scope:** Frontend-only. No schema or API changes.

## Context

Today, `/scrapbook` shows a flat grid of `ScrapbookTile` cards (cream rectangles with deterministic sticker + quote per id). The page reads as generic — multiple scrapbooks land on the same sticker/quote (hash collision), and nothing communicates "these are *my* personal scrapbooks." It also has no parallel to the Letters page, so jumping between Scrapbook and Letters tabs feels visually disjointed.

This redesign replaces the grid with a **memory chest scene** that mirrors the Letters page architecture: a single iconic focal object on a horizon line, an action card on the left, a brass year/month picker on the object, and a fanout reveal on click. Selecting a month/year and clicking the chest reveals scrapbooks from that period as polaroid-like cards rising into the empty area above the chest.

Approved by user via interactive demo at `/scrapbook-chest-demo`.

## Out of scope (v1)

- Renaming/editing scrapbook titles inline (existing `PUT /api/scrapbooks/[id]` may handle, but no UI here)
- Drag-to-reorder cards
- Multi-select / bulk delete (delete still happens on the canvas page or via existing per-tile menu)
- Search/filter beyond month + year
- Animation polish beyond the entrance fanout
- Replacing the demo route — `/scrapbook-chest-demo` will be deleted as part of this work

## Layout (mirrors Letters page exactly)

| Letters page                   | Scrapbook page (this spec)        |
|--------------------------------|-----------------------------------|
| `PostalSky` backdrop           | `ScrapbookHorizon` backdrop       |
| `Lamp` + `Postbox` (right)     | `MemoryChest` (right)             |
| `WriteCard` (left)             | `ChestActionCard` (left)          |
| `PostboxControls` (year/month) | `ChestControls` (year/month)      |
| `LetterFanout` (letters fan)   | `ScrapbookCardFanout` (cards rise)|
| `RevealModal` (read letter)    | navigate to `/scrapbook/[id]`     |
| Footer caption                 | Footer caption                    |

The chest base sits at the same vertical position as the postbox base (above the horizon line). The action card on the left is at the same vertical level as `WriteCard`. Switching between the two tabs should feel continuous.

Page is `h-screen overflow-hidden` — no page scroll, ever.

## Theming

A new `<ScrapbookTokens />` component (parallel to `LettersTokens`) injects CSS variables derived from the active theme. The chest is themed: the base wood tone uses theme accent colors so the rose theme has a warm rose-brown chest, the butter theme has a honey-brown chest, etc. Brass and dark iron straps remain constant across themes.

CSS vars introduced (additions only — existing `--bg-1`, `--accent-warm` etc. reused):
- `--chest-1` (mid wood tone) — derived from `theme.accent.warm`
- `--chest-2` (deep shadow) — derived from `theme.accent.primary` darkened
- `--chest-3` (highlight) — derived from `theme.accent.warm` lightened
- `--brass` (constant, `#d4af6a` → `#8a6a3a` gradient)
- `--iron` (constant, dark)
- `--card-paper` — `theme.bg.secondary` lightened (already similar to existing scrapbook tile bg)

## Components

All new files live in `src/components/scrapbook/listing/` (new subfolder, parallel to `letters/inbox/`):

- `ScrapbookListingView.tsx` — main scene, parallel to `InboxView`
- `ScrapbookTokens.tsx` — CSS var injector, parallel to `LettersTokens`
- `ScrapbookHorizon.tsx` — sky/hills/floor backdrop, parallel to `PostalSky`
- `MemoryChest.tsx` — rectangular chest visual (lid + body + iron straps + brass plate + clasp + tag)
- `ChestControls.tsx` — year/month picker pills on the brass plate
- `ChestActionCard.tsx` — left "open the chest" / "+ new scrapbook" card
- `ScrapbookCardFanout.tsx` — flex-wrap container, animates cards rising
- `ScrapbookCard.tsx` — one card (tape + washi band + sticker + date + item count)

`src/app/scrapbook/page.tsx` swaps from `<ScrapbookGrid />` to `<ScrapbookListingView />`. The old `ScrapbookGrid` and `ScrapbookTile` are deleted.

## Data flow

- `ScrapbookListingView` fetches `GET /api/scrapbooks` once on mount (existing endpoint, returns `ScrapbookSummary[]`).
- Group results by `createdAt` year + month client-side using `new Date(createdAt)` and the browser's local timezone (same approach as `groupInboxByMonth` in `letters/lettersData.ts`).
- Year picker bounds: `min = year of earliest scrapbook`, `max = current year`. For the current year, month picker is capped at the current month.
- Default selection on load: current year + current month.

Server-side: no changes. The existing `GET /api/scrapbooks` already returns everything we need (`id`, `title`, `itemCount`, `createdAt`, `updatedAt`).

## Behavior

- **Initial state:** chest closed, picker showing current month/year. If the current month has scrapbooks, the `N new ✦` tag is visible on the chest.
- **Click chest:** lid rotates open (rotateX -115°). Cards spawn from chest position and fan up into the empty area above with stagger (~30ms per card, capped). When closed again, cards fall back into the chest and fade.
- **Click card:** navigates to `/scrapbook/[id]`. No modal. Briefly scales the card to 1.10× before navigation as feedback (~150ms).
- **Hover card:** lifts and straightens tilt (`rotate(0)`).
- **+ new scrapbook button** (left action card): `POST /api/scrapbooks`, navigate to created `/scrapbook/[id]`. Same as current `ScrapbookGrid.createBoard`.
- **Picker change:** cards re-fan for the new month. Empty months show the chest with no cards rising; an "the chest is empty for [month]" message appears inside the open chest.

## High-count handling (non-scroll)

The cards-area has fixed dimensions (top: 60px, left: 60px, right: 60px, height: ~52vh) and never scrolls the page. Card sizing adapts to count:

- **0–12 cards:** card 96×124px, gap 22px — generous spacing
- **13–24 cards:** card 88×112px, gap 16px — slight shrink
- **25+ cards:** card 80×100px, gap 12px — fits ~30 cards across 4 rows in a typical viewport

For counts above ~36 (rare but possible): cards-area enables internal vertical scroll inside the area only — page itself stays non-scroll. (Implementation: `overflow-y: auto` on `.cards-area` with custom thin scrollbar styled to match the wood/brass palette.)

## Edge cases

- **No scrapbooks anywhere:** chest opens, "the chest is empty for [month]" message inside, picker disabled at current month/year, primary CTA prominent.
- **Single scrapbook in a month:** card rises and centers above the chest, alone. No layout regression.
- **Picker on a month with no scrapbooks but other months populated:** picker remains enabled (so user can browse), empty-state message shows.
- **Active theme switches mid-session:** ScrapbookTokens recomputes via `useThemeStore`; chest re-tints smoothly via CSS variable transitions.

## Open questions for user

None — design has been validated through the demo. Implementation can proceed.

## Implementation notes

- The demo at `/scrapbook-chest-demo` is the visual reference. Production version differs in: real API data, theme tokens, viewport-locked layout, smaller card sizes for high counts, navigation on card click.
- Delete `/scrapbook-chest-demo` route as the final step of implementation (after the real page is verified).
- Keep the existing `useScrapbookList` patterns if any; otherwise inline the fetch in `ScrapbookListingView` (matches `InboxView` style).
