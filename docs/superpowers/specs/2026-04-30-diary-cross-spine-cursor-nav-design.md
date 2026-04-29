# Diary cross-spine cursor navigation

**Date:** 2026-04-30
**Scope:** New-entry spread on the diary (`BookSpread` / `LeftPage` / `RightPage`).
**Surface:** Desktop keyboard input on the diary writing textareas.

## Problem

When writing on the new-entry spread, the cursor cannot cross the spine vertically. ArrowDown on the last visual row of the left page does nothing; ArrowUp on the first visual row of the right page does nothing. Users with multi-line entries that span both pages get visually stuck on whichever page they started on and have to reach for the mouse, or lean on horizontal arrows / overflow to migrate.

Horizontal arrows and overflow already work today:

- `LeftPage.handleTextChange` measures DOM overflow and pushes the overflow word into the right-page draft, then focuses the right textarea (`src/components/desk/LeftPage.tsx:108`).
- `LeftPage.handleKeyDown` navigates to the right page on ArrowRight at end-of-value (`src/components/desk/LeftPage.tsx:98`).
- `RightPage.handleKeyDown` navigates to the left page on ArrowLeft at position 0 (`src/components/desk/RightPage.tsx:163`).

Vertical navigation across the spine is the missing piece.

## Goals

1. ArrowDown on the visual last row of the left textarea moves the cursor to the right textarea, landing at column 0 of its first row.
2. ArrowUp on the visual first row of the right textarea moves the cursor to the left textarea, landing at the end of its last row.
3. ArrowRight from end-of-left lands at the *start* of the right textarea (currently lands at end — flip it so the cursor sits where the text logically continues).
4. ArrowLeft from start-of-right continues to land at the end of the left textarea (no change).
5. The existing overflow-driven page-fill behavior remains untouched.

## Non-goals

- Multi-spread entries (an entry spanning more than one spread). Out of scope.
- Touching the binary-search overflow split in `LeftPage.handleTextChange`.
- Removing the right-page hard cap (`RightPage.handleTextChange:218–224`).
- Changes to viewing mode for locked / past entries.
- Mobile keyboard navigation (`MobileJournalEntry.tsx` is a separate surface).

## Design

### 1. Detecting "visual last/first row" in a textarea

The textareas use a fixed `lineHeight: 32px` and a known top padding (per `PageWrapper` and the left/right textarea wrappers). The reliable approach used elsewhere in the codebase is DOM measurement, so we use the same here:

- Build a hidden mirror `<div>` that copies the textarea's font, width, padding, and `white-space: pre-wrap` styling, append the text up to `selectionStart`, and read the caret's pixel offset top.
- "Last row" = caret top is within one `lineHeight` of the highest caret top reachable in the textarea (or, simpler: caret top + `lineHeight` >= total content height).
- "First row" = caret top < `lineHeight`.

To keep the change small we put this in a small helper used by both pages:

```
src/lib/textarea-caret.ts
  export function isCaretOnFirstVisualRow(textarea: HTMLTextAreaElement): boolean
  export function isCaretOnLastVisualRow(textarea: HTMLTextAreaElement): boolean
```

The mirror div is created on demand, populated, measured, and removed in the same call. No persistent DOM, no listeners.

### 2. Focus-trigger upgrade: support landing position

Today the focus is delivered through a numeric trigger that increments when the parent wants the textarea focused:

- `LeftPage` receives `focusTrigger: number` and on increment focuses the textarea, setting selection to `(len, len)`.
- `RightPage` receives `focusTrigger: number` and on increment focuses the textarea, setting selection to `(len, len)`.

We extend this to carry a landing position. To minimize prop churn we keep a numeric trigger (so React identity comparisons still work) and add a sibling prop:

- `focusTrigger: number`
- `focusAt?: 'start' | 'end'` (default `'end'` to match today)

`LeftPage`'s focus effect: when `focusAt === 'start'`, set `selectionRange(0, 0)`; otherwise `(len, len)`.
`RightPage`'s focus effect: same pattern.

In `BookSpread` we maintain two trigger pairs:

- `leftTextareaFocusTrigger` + `leftTextareaFocusAt`
- `rightTextareaFocusTrigger` + `rightTextareaFocusAt`

Updating the trigger increments the counter and sets the landing position in the same render.

### 3. Wiring per direction

| Source | Trigger | Right page lands at | Left page lands at |
|---|---|---|---|
| ArrowRight at end-of-left (existing) | bump right | `start` (changed from `end`) | — |
| ArrowDown on last visual row of left (new) | bump right | `start` | — |
| Overflow auto-flow from left (existing) | bump right | `afterPrepend` (offset = `overflowText.length`) | — |
| ArrowLeft at start-of-right (existing) | bump left | — | `end` (unchanged) |
| ArrowUp on first visual row of right (new) | bump left | — | `end` |

The `afterPrepend` case exists because the overflow path *prepends* the overflow word to the right-page draft. Today the focus lands at `(len, len)` — at the very end of the right page — which is wrong if the right page already has text. We instead land at `(overflowText.length, overflowText.length)`, immediately after the just-prepended word. That is also a small bug fix in the existing overflow flow.

Concrete prop shape on `RightPage`:

- `focusAt?: 'start' | 'end' | 'afterPrepend'` (default `'end'` to keep current callers safe)
- `prependLength?: number` (read only when `focusAt === 'afterPrepend'`)

`LeftPage` only needs `'start' | 'end'` (no prepend path on the left side).

### 4. handleKeyDown changes

**`LeftPage.handleKeyDown`** gains:

```
if (e.key === 'ArrowDown') {
  if (isCaretOnLastVisualRow(textarea)) {
    e.preventDefault()
    onNavigateRight?.()  // BookSpread bumps right trigger with focusAt: 'start'
  }
}
```

ArrowRight branch updates `focusAt` to `'start'` via the same callback (BookSpread is the one that owns the trigger state).

**`RightPage.handleKeyDown`** gains:

```
if (e.key === 'ArrowUp') {
  if (isCaretOnFirstVisualRow(textarea)) {
    e.preventDefault()
    onNavigateLeft?.()
  }
}
```

`onNavigateLeft` already lands at end-of-left, so no change there.

### 5. BookSpread callback shape

Today `onNavigateRight` and `onNavigateLeft` are `() => void`. We extend them to accept an optional position so the caller can specify landing:

```
onNavigateRight?: (focusAt?: 'start' | 'end' | 'afterPrepend', prependLength?: number) => void
onNavigateLeft?: (focusAt?: 'start' | 'end') => void
```

`BookSpread.handleNavigateRight`, `handleNavigateLeft`, and `handleLeftPageFull` call into the same trigger-bumping helpers, passing the appropriate `focusAt`.

## Files touched

- `src/components/desk/BookSpread.tsx` — add `focusAt` state per side; update `handleLeftPageFull`, `handleNavigateRight`, `handleNavigateLeft`; thread the new prop into `LeftPage` / `RightPage`.
- `src/components/desk/LeftPage.tsx` — accept `focusAt` prop; ArrowDown branch in `handleKeyDown`; flip ArrowRight landing to `'start'`.
- `src/components/desk/RightPage.tsx` — accept `focusAt` (and `prependLength`) prop; ArrowUp branch in `handleKeyDown`.
- `src/lib/textarea-caret.ts` — new helper module with `isCaretOnFirstVisualRow` / `isCaretOnLastVisualRow`.

No store, schema, API, or autosave changes.

## Edge cases

- **Empty right page, ArrowDown from left.** Cursor lands at `(0, 0)` of the empty textarea. Fine.
- **Right page has text, ArrowDown from left.** Cursor lands at `(0, 0)`, in front of existing right-page content — matches the user's "landing at start of next page" mental model.
- **Single-line left page (one row total).** Caret on row 0 = both first and last row. ArrowDown navigates right; ArrowUp does not (no `onNavigateUp` handler on left).
- **Empty left page, ArrowUp from right's first row.** Cursor lands at `(0, 0)` on left, which is also `(len, len)`. No-op visually but focuses the left textarea.
- **Long single line that wraps.** Caret on the *visually* last row (after wrap) but `selectionStart < value.length`. ArrowDown should still navigate — the visual-row check handles this; the existing end-of-value check on ArrowRight does not, which is correct (ArrowRight on a wrapped line should move within the line).
- **IME / composing input.** We only bind ArrowDown/ArrowUp keys; the textareas already let composition through.
- **Locked entry (past day).** New-entry textareas don't render for locked entries (LeftPage/RightPage take an `isNewEntry` branch). No effect.

## Testing

1. Type a paragraph that fills the left page exactly to the last row.
2. Press ArrowDown on the last row — cursor should land at start of right textarea.
3. Press ArrowUp from the first row of right — cursor should return to end of left.
4. Press ArrowRight at end-of-left — cursor lands at start of right (changed behavior, intentional).
5. Press ArrowLeft at start-of-right — cursor lands at end of left (unchanged).
6. Type until the left page overflows — overflow word appears on right page, cursor sits right after it (the existing autosave still fires).
7. Manual smoke: themes, autosave indicator still updates as expected, no console errors during navigation.

## Risks

- **Visual-row detection accuracy.** The mirror-div technique is well-known but requires copying the right styles. Mitigation: keep the helper small and unit-test mentally against the textarea's known fixed `lineHeight`.
- **Focus loss during react-pageflip.** Cross-spine navigation does NOT flip pages — both textareas sit on the same visible spread. Library shouldn't interfere.
- **ArrowRight landing change.** Today ArrowRight at end-of-left lands at end-of-right; changing to start-of-right is a UX change. It's the correct mental model for "I'm continuing my writing onto the next page," but worth flagging.
