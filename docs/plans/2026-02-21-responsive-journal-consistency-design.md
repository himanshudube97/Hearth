# Responsive Journal with Consistent Writing Capacity

**Date**: 2026-02-21
**Status**: Design approved, pending implementation

## Problem

1. The book spread is hardcoded at 1300x820px — clips on anything smaller than a laptop
2. Text overflow from left page to right page uses DOM `scrollHeight` measurement — fragile, race-condition prone, screen-dependent
3. The `<!--page-break-->` marker is stored at save time based on whatever screen the user was on — text written on desktop can clip when viewed on mobile, and vice versa
4. Several navigation bugs: right arrow can't reach new-entry spread, EntrySelector desyncs from spread index, server caps entries at 50

## Design Decisions

### Core Principle: One Character Limit Everywhere

A fixed character limit (~1200 chars) applies across all devices. This is derived from the current desktop book capacity:
- Left page: ~21 lines of writing area
- Right page: ~13 lines (minus photos/doodle/save)
- ~35 chars/line with Caveat font at 20px
- Total: ~1200 characters

This is the single source of truth for writing capacity.

### Two Layouts, One Data Model

**Desktop (>=1400px)**: Book spread — left page (song + writing), right page (photos + writing overflow + doodle + save). Text flows left to right visually.

**Tablet landscape (1024-1399px)**: Scaled-down book spread via CSS `transform: scale()`. Same components, just smaller.

**Mobile/Tablet portrait (<1024px)**: Clean single-screen form — song input, writing textarea (with character counter), photo upload, doodle canvas, save button. Vertically stacked, scrollable.

### Drop `<!--page-break-->` From Storage

Store one continuous text string. The page split on desktop becomes a render-time calculation.

- Existing entries: Strip `<!--page-break-->`, join text
- New entries: Save one HTML string
- Desktop rendering: Split at line boundary dynamically
- Mobile rendering: Display as continuous text

### Line-Count Based Page Split (Desktop)

Replace DOM `scrollHeight` measurement with a predictable formula:

```
LEFT_PAGE_LINES = Math.floor(leftWritingAreaHeight / LINE_HEIGHT)
```

Where `leftWritingAreaHeight` is calculated from the known layout:
- Book height (820px) - padding (40px) - song section (~80px) - label (~20px) = ~680px
- 680 / 32 = ~21 lines

For each line of text, estimate display lines: `Math.ceil(line.length / CHARS_PER_LINE)` where `CHARS_PER_LINE` is derived from the writing area width and font metrics.

### Word-Boundary Overflow

When text exceeds left page capacity during writing:
1. Find the last word boundary (space/punctuation) that fits
2. Transfer the incomplete word and everything after to the right page
3. Cursor follows to the right page textarea

Never break a word in half across pages.

### Blank Lines and Formatting

Stored as HTML paragraphs: `<p>text</p>` for text lines, `<p></p>` for blank lines. Each paragraph counts as at least one display line in the split calculation. This preserves all user formatting — headings, spacing, paragraph breaks.

## Breakpoint Strategy

| Width | Layout | Details |
|-------|--------|---------|
| >=1400px | Full book spread | 1300x820px, no scaling |
| 1024-1399px | Scaled book spread | CSS `transform: scale(width/1400)` |
| <1024px | Mobile form | Single-screen, scrollable, no book metaphor |

Detection: `useMediaQuery` hook or CSS media queries + conditional rendering.

## Mobile Layout (New)

```
+-------------------+
|  [Song Input]     |
+-------------------+
|                   |
|  Writing Area     |
|  (scrollable,     |
|   char counter)   |
|                   |
+-------------------+
|  [Add Photos]     |
+-------------------+
|  [Doodle Canvas]  |
+-------------------+
|  847 / 1200       |
|  [Save Entry]     |
+-------------------+
```

- All sections in a scrollable container
- Character counter shown subtly below textarea
- Same API calls, same data format as desktop
- Photos and doodle are collapsible sections to maximize writing space
- Mood picker accessible (same as desktop)

## Desktop Layout (Unchanged Structure, New Internals)

```
+--LEFT PAGE--+--BINDING--+--RIGHT PAGE--+
| Song Input  |           | Photos       |
|             |           |              |
| Writing     |   |||     | Writing      |
| (21 lines   |   |||     | (overflow    |
|  max)       |   |||     |  from left)  |
|             |           |              |
|             |           | Doodle       |
|             |           | [Save]       |
+-------------+-----------+--------------+
```

Changes from current:
- Text overflow uses line-count formula instead of DOM measurement
- Page split at render time (viewing old entries) instead of stored marker
- Word-boundary aware overflow
- Character limit enforced

## Viewing Existing Entries

**Desktop**: Parse stored HTML, count lines, split at left page capacity. Left page shows first N lines + song. Right page shows remaining lines + photos + doodle.

**Mobile**: Show all content in a scrollable view: song embed, full text, photos, doodle preview. No splitting needed — everything is visible by scrolling.

## Data Migration

Existing entries with `<!--page-break-->`:
- Strip the marker at read time (API or client)
- Join the text before and after the marker into one string
- No database migration needed — just handle it in the rendering/API layer
- Could add a one-time migration later to clean up stored data

## Bug Fixes (Included in This Work)

1. **Right arrow dead-end**: Change guard from `< entries.length` to `<= entries.length` so users can navigate forward to new-entry spread
2. **PageTurn theme colors**: Use `diaryTheme.pages.background` instead of hardcoded `hsl(40, 30%, 94%)`
3. **EntrySelector desync**: When selecting an entry via EntrySelector, also update `globalCurrentSpread` to match
4. **Server limit cap**: Increase API limit or implement cursor pagination in BookSpread
5. **Dead code cleanup**: Remove unused SpreadNavigation component, fix PhotoSlot dead `processImage` path

## Constants

```typescript
// Shared constants for writing capacity
export const JOURNAL_CONSTANTS = {
  LINE_HEIGHT: 32,           // px, matches line pattern spacing
  FONT_SIZE: 20,             // px, Caveat font
  MAX_CHARS: 1200,           // Total character limit per entry
  DESKTOP_BOOK_WIDTH: 1300,  // px
  DESKTOP_BOOK_HEIGHT: 820,  // px
  BREAKPOINT_DESKTOP: 1400,  // px, full book spread
  BREAKPOINT_TABLET: 1024,   // px, scaled book spread
  // Below 1024: mobile form layout
}
```

## Technical Notes

- Use `useMediaQuery` hook (or `window.matchMedia`) for breakpoint detection
- Mobile form uses the same Zustand stores (journal, desk, diary theme)
- Character counting uses `text.length` on the raw textarea value (before HTML conversion)
- The line-count split for desktop works on the stored HTML by counting `<p>` tags
- CSS `transform: scale()` for tablet maintains the 1300x820 aspect ratio while fitting smaller screens

## Out of Scope

- Multi-spread entries (database `spreads` field) — not used in UI, keep as-is
- TipTap rich text editor — sticking with textarea
- Offline/PWA support
- Entry syncing between devices in real-time
