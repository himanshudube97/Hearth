# Glass Diary — Design Spec

**Date:** 2026-04-26
**Status:** Approved for implementation planning
**Scope:** Diary writing experience only. Letters/postcard UI is explicitly out of scope and will be revisited later.

## Goal

Replace the current six-theme diary system with a single **glass diary** at `/write`. Preserve every existing diary mechanic — page-turn animation, spine, ribbon bookmark, character limits, append-only editing — and change only the visual surfaces from opaque paper to translucent glass that matches the page-theme background. Consolidate to one writing route. Make mobile auto-paginate so writing flows across pages without internal scrolling.

## Why

The current diary's cream paper looks polished on its own but conflicts with the animated themed backgrounds (stars, fireflies, sakura, snow) — they're hidden behind the book. The user wants the diary surface to feel like part of the same world as the background, the way the existing `/write` single-page card already does. Maintaining six diary themes also fragments the design and adds maintenance overhead for a feature the user doesn't value at this stage.

## Branch strategy

1. Cut `archive/legacy-diary` from current `main` before any code changes. This branch is the long-term reference for the existing six-theme diary, the `/desk` route, the closed-book/cover state, and the original single-page `/write`.
2. All changes below land on `main`. The `archive/legacy-diary` branch is never merged back; it exists purely as a reference snapshot.

## Deletions

The following are removed from `main`:

| Item | Path |
|---|---|
| Five non-glass diary themes | `src/lib/diaryThemes.ts` (`agedLeather`, `grimoire`, `victorianRose`, `cottagecore`, `celestial`) |
| Diary theme selector UI | `src/components/desk/DiaryThemeSelector.tsx` |
| Diary theme store | `src/store/diary.ts` (no longer needed; only one theme exists) |
| `/desk` route | `src/app/desk/page.tsx` (redirected to `/write`, then deleted) |
| Current single-page `/write` design | `src/app/write/page.tsx` (replaced by the glass diary spread) |
| Closed-book / cover state | `useDeskStore.isBookOpen`, `openBook`, `closeBook`, `DeskBook` cover-rendering logic |
| "Close Book" button | `BookSpread.tsx` line ~370 |

Anything else in those files that becomes unreachable after these deletions is removed too. The `diaryThemes.ts` file shrinks to just `glassTheme`, or is collapsed into `themes.ts` if that's cleaner.

## Preserved (unchanged)

- Two-page open-book layout: spine in middle, ribbon bookmark on right page
- Page-turn animation between entries / pages
- "New Entry" / "+" controls
- Section labels: ADD A SONG, WRITE YOUR THOUGHTS, PHOTOS, DRAW
- Per-entry character limit (`JOURNAL.MAX_CHARS = 1200`, split across left + right pages)
- Append-only editing rules from `CLAUDE.md`
- All existing functionality: TipTap editor, song embed, photo upload + camera, doodle canvas, mood picker
- Animated theme background (Background.tsx particles)

## Visual design — desktop

The book opens directly to a two-page spread. No closed-book / cover state.

**Page surfaces.** Each page becomes a translucent dark-glass surface that adapts to the active page theme:

- Background: `theme.glass.bg` (e.g. dark green-tinted on Rivendell, dark purple-tinted on Cosmos, dark pink-tinted on Cherry Blossom). Roughly `rgba(...,0.55)` opacity at the surface level so the animated background still shows through clearly.
- Backdrop blur: `theme.glass.blur` (existing value).
- Border: 1px, `rgba(theme.accent.warm, 0.18)`.
- Box shadow: `0 16px 50px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.18)`.
- Border radius: `6px` on the spine side, `18px` on the outside edge of each page (preserves the open-book silhouette).

**Ruled lines.** Faint warm/gold lines at ~15% opacity, replacing the existing dark blue ones. Source color: `theme.accent.warm` at low alpha.

**Spine.** Subtle vertical gradient strip between the two pages: `linear-gradient(180deg, rgba(theme.accent.warm,0.12), rgba(theme.accent.warm,0.05), rgba(theme.accent.warm,0.12))`, with thin dark borders on each side suggesting the binding seam. Existing binding-dot decorations (small circles down the spine) stay.

**Ribbon bookmark.** Stays. Color: `theme.accent.primary` at full opacity (instead of the diary-theme-specific colors). Sits on the top edge of the right page as today.

**Typography.**
- Section labels (ADD A SONG, etc.): existing layout, color `rgba(theme.accent.warm, 0.7)`, letter-spacing as today.
- Prompts (italic Georgia): color `rgba(theme.accent.warm, 0.6)`.
- Date: italic Georgia, color `rgba(theme.accent.warm, 0.85)`, sits in a small glass pill above the spine.
- User's writing (Caveat handwriting): color `rgba(255,255,255,0.92)` (light, high-contrast on the dark glass).

**Photo slot dashed borders, doodle canvas borders.** Light/warm: `rgba(theme.accent.warm, 0.3)` dashed for photos, `rgba(theme.accent.warm, 0.2)` solid for doodle.

**Theme adaptation.** Switching the global page theme (via the existing theme switcher) instantly recolors the diary's tint, ruled lines, and accents because every value is sourced from `theme.glass.*` and `theme.accent.*` rather than from a diary-specific theme record.

## Visual design — mobile

Same glass aesthetic. Different layout because two columns side-by-side don't fit on a phone. The diary becomes a horizontal pager.

**Page sequence.** Photos + doodle always live on the **last** page. Writing takes as many pages as it needs.

- **Page 1**: SONG section + writing area
- **Pages 2..N-1** (if present): writing-only continuation pages
- **Page N (always last)**: PHOTOS + DRAW + Save Entry button

Given `MAX_CHARS = 1200`, mobile entries top out at ~2 writing pages + 1 photos/doodle page = 3 pages total in the worst case.

**Pagination behavior.**
- The active writing page has a fixed height (exactly fills the visible viewport minus header/footer chrome).
- When the user types past the bottom of page N's writing area, page N+1 is auto-spawned and the cursor moves to it. This is implemented as a fixed visible-line capacity per page, not a character count, so it adapts to phone size.
- Deleting backwards across a page boundary moves the cursor back to the previous page; the empty trailing page collapses if no longer needed.
- No internal scrolling within any page. The editor never shows a scrollbar.

**Navigation.**
- Pagination dots at the bottom of every page show position and count (e.g., `● ○ ○`).
- Horizontal swipe left/right moves between pages.
- Tapping a dot jumps to that page.
- Page-turn animation matches the desktop spirit (subtle slide + slight rotation), but is a horizontal swipe gesture, not a paper-curl.

**Header (every page).** Date in italic serif top-right. No "Close" button. The save flow lives on the last page.

**Save.** "Save Entry" button at the bottom of the last page, only visible when there's text. Existing save behavior unchanged.

## Routing & state

- **`/write`** — primary writing route. Renders the open glass diary directly. After login, the user is redirected here.
- **`/desk`** — temporarily 301-redirects to `/write`, then is deleted in the same PR after verifying no internal links or external bookmarks. (If we want to be extra safe, leave the redirect in place for one release.)
- `useDeskStore` — simplified to remove `isBookOpen`/`openBook`/`closeBook` (book is always open). If nothing else lives in this store, delete the file and remove the import.
- `useDiaryStore` — deleted entirely.

## Theme color sourcing

Where today's diary themes hard-code colors per theme record, the glass diary sources everything from the active page theme:

| Visual element | Source |
|---|---|
| Page surface bg | `theme.glass.bg` |
| Page surface backdrop blur | `theme.glass.blur` |
| Page surface border | `rgba(theme.accent.warm, 0.18)` |
| Ruled lines | `rgba(theme.accent.warm, 0.15)` |
| Section labels | `rgba(theme.accent.warm, 0.7)` |
| Prompts | `rgba(theme.accent.warm, 0.6)` |
| Date / metadata | `rgba(theme.accent.warm, 0.85)` |
| User writing | `theme.text.primary` |
| Photo slot border (dashed) | `rgba(theme.accent.warm, 0.3)` |
| Doodle canvas border | `rgba(theme.accent.warm, 0.2)` |
| Doodle canvas bg | `rgba(255,255,255,0.03)` |
| Spine gradient | `rgba(theme.accent.warm, 0.05–0.12)` |
| Ribbon | `theme.accent.primary` |
| Save button | `theme.accent.warm` (existing pattern) |

A small helper such as `getGlassDiaryColors(theme)` should centralize these so they're not scattered through `BookSpread.tsx`.

## Implementation order (for the plan)

1. Cut `archive/legacy-diary` branch from current `main`.
2. Simplify `diaryThemes.ts`: keep only the glass entry, with new dark-translucent values that read from the page theme. Delete the other five.
3. Add `getGlassDiaryColors(theme)` helper.
4. Update `BookSpread.tsx` to consume the helper. Drop the existing `currentDiaryTheme === 'glass'` branches (always glass now). Remove the "Close Book" button.
5. Delete `DiaryThemeSelector.tsx` and the 📖 trigger button. Remove its usage from `DeskScene.tsx`.
6. Simplify `useDeskStore` to remove open/close state. Always render `BookSpread` directly. If `useDeskStore` is now empty, delete the file.
7. Replace `/write/page.tsx` content with the glass diary spread (reuse the desktop+mobile rendering from `DeskScene` / `BookSpread`).
8. Add a redirect from `/desk` → `/write`, then delete `/desk/page.tsx`.
9. Delete `useDiaryStore` and remove all references.
10. Mobile: replace `MobileJournalEntry`'s flat stack with the paginated horizontal pager described above. Photos + doodle + Save live on the last page; writing pages auto-spawn as needed.
11. Verify end-to-end: login redirects to `/write`; desktop and mobile both render glass diary; all 11 page themes tint the diary correctly; entries save and reload.

## Out of scope

- Letters / postcard UI (deferred to a future spec)
- Other writing surfaces: timeline, calendar, constellation, letters list views
- Onboarding or landing page changes
- Any new background/page themes — the existing 11 stay as-is

## Open questions deferred to the implementation plan

- TipTap auto-pagination strategy on mobile — custom plugin vs. multi-textarea split with shared state. Either is workable; the plan should evaluate and pick.
- Whether to keep `useDeskStore` (if anything else still uses it) or delete the file.
- Whether `/desk` keeps its redirect for one release or is deleted in the same PR.

## Risks

- **Auto-pagination correctness.** Cursor handling across page boundaries (especially deletions, paste, IME composition) is the highest-risk piece. Plan should call out test cases explicitly.
- **Hidden uses of removed exports.** `agedLeatherTheme`, etc., may be imported from somewhere we haven't found. The plan should grep for each before deletion.
- **Visual regression across the 11 page themes.** A theme that has unusually low-contrast `glass.bg` could make text unreadable. The plan should include a manual visual pass on all 11 themes after implementation.
