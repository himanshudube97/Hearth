# Scrapbook Canvas — Design Spec

**Date:** 2026-04-28
**Status:** Draft for review
**Owner:** Himanshu

## What we're building

A new entry mode in Hearth — a free-form canvas where users drop photos, text, songs, doodles, and theme-keyed stickers anywhere on the page, and arrange them by drag, rotate, and resize. The page feels like a real scrapbook spread: paper texture, washi tape, items landing at slight tilts.

Scrapbook is the larger-canvas craft mode for evening laptop / iPad sessions. Regular entries and letters cover the day-to-day. Mobile users can *view* scrapbook entries (read-only) but cannot create or edit them.

## Why

The structured editor is great for writing. But some days users want to *make* something — pin a polaroid next to a song, scribble a tiny doodle, stick a sticker. That impulse currently has no home in Hearth. Scrapbook gives it one, and uses building blocks the app already has (photos, songs, doodles, themes).

## Non-goals (v1)

- Mobile creation/editing (read-only display only on mobile)
- Multi-page scrapbooks (one page per entry; multi-page is v2)
- User-uploaded stickers (fixed theme-keyed library only)
- Collaborative / shared scrapbooks
- Templates ("pick a layout") — pure freeform only
- Animation, audio playback inside canvas (song = embedded card like today)
- Undo/redo history beyond per-session ephemeral state (no persisted undo stack)

## User flow

1. From the main menu, alongside `/write`, user clicks **Scrapbook**.
2. Routed to `/scrapbook` — a blank themed canvas with a date stamp pre-placed at the top, and a toolbar.
3. User adds items by clicking a toolbar button (Photo / Text / Song / Sticker / Doodle). Item appears at canvas center with a small random tilt.
4. User drags items by their **top-center handle**, rotates via a rotate handle, resizes via corner handles. Body of each item stays free for editing (typing into text, drawing in doodle, etc.).
5. Autosave fires on any change (debounced) — same pattern as regular entries. First change creates the entry; subsequent changes update it.
6. Entry shows up in calendar / timeline / constellation alongside regular entries, rendered as a scrapbook card.
7. Edit window: same lock rules as regular entries — fully editable on the calendar day of `createdAt`, read-only after.

## Architecture

### Data model

Scrapbook is a new `entryType` on the existing `JournalEntry` model. No new top-level table.

**Prisma changes:**
```prisma
enum EntryType {
  normal
  letter
  unsent_letter
  ephemeral
  scrapbook  // NEW
}

model JournalEntry {
  // ... existing fields
  canvasItems String?  // NEW — encrypted JSON ciphertext (iv:authTag:encryptedData),
                       // decrypts to an array of CanvasItem. Only set when entryType=scrapbook.
}
```

`canvasItems` is `null` for non-scrapbook entries. Migration is additive only — no data loss.

**CanvasItem schema (TypeScript):**
```ts
type CanvasItemType = 'photo' | 'text' | 'song' | 'sticker' | 'doodle' | 'date_stamp';

interface CanvasItem {
  id: string;             // uuid, stable across saves
  type: CanvasItemType;
  x: number;              // 0–100, % of canvas width (left edge of item)
  y: number;              // 0–100, % of canvas height (top edge of item)
  width: number;          // 0–100, % of canvas width
  height: number;         // 0–100, % of canvas height
  rotation: number;       // degrees, -180 to 180
  z: number;              // integer, higher = on top
  content: PhotoContent | TextContent | SongContent | StickerContent | DoodleContent | DateStampContent;
}
```

Coordinates are **percentages of canvas**, so the layout renders identically across iPad, 13" laptop, and 27" monitor. The canvas itself is a fixed aspect ratio (4:5 portrait) that scales to fit the viewport.

**Per-type content:**
- `PhotoContent`: `{ url, caption?, polaroidFrame: boolean }`
- `TextContent`: `{ text, fontFamily: 'handwritten' | 'serif', fontSize: number, color: string }`
- `SongContent`: `{ provider, trackId, title, artist }` (mirrors current `SongEmbed`)
- `StickerContent`: `{ stickerId, themeKey }` (references a sticker in the static library)
- `DoodleContent`: `{ strokes: Stroke[], strokeColor, strokeWidth }` (mirrors current `Doodle`)
- `DateStampContent`: `{ date }` (auto-placed on canvas init)

Encryption: text/photo/doodle content is sensitive — the entire `canvasItems` JSON is encrypted at rest, mirroring how `text` is encrypted today. The `canvasItems` field stores the AES-256-GCM ciphertext (`iv:authTag:encryptedData`) as a string; encrypt on save, decrypt on retrieve. No separate plain field.

### Components

```
src/app/scrapbook/
  page.tsx                    # /scrapbook route, creates or edits today's scrapbook
  [id]/page.tsx               # view a specific scrapbook entry (read-only on mobile)

src/components/scrapbook/
  ScrapbookCanvas.tsx         # fixed-aspect canvas, paper texture, theme-keyed background
  CanvasItemWrapper.tsx       # drag/rotate/resize wrapper — shared by all item types
  CanvasToolbar.tsx           # floating toolbar with Add buttons (Photo/Text/Song/Sticker/Doodle)
  StickerPicker.tsx           # popover showing theme-keyed sticker pack
  items/
    PhotoItem.tsx             # renders a polaroid; reuses CollagePhoto rendering
    TextItem.tsx              # contenteditable text card
    SongItem.tsx              # reuses SongEmbed
    StickerItem.tsx           # renders sticker SVG
    DoodleItem.tsx            # mini DoodleCanvas inside a wrapper
    DateStampItem.tsx         # rendered date label, auto-placed at top
  ScrapbookReadOnly.tsx       # read-only renderer (used in calendar/timeline preview AND mobile viewing)

src/lib/
  scrapbook.ts                # canvas item helpers (defaultPlacement, randomTilt, layering)
  stickers/                   # static sticker library (per-theme SVGs)
    garden.ts                 # pressed leaves, petals
    midnight.ts               # stars, moons
    hearth.ts                 # embers, sparks
    ... etc per theme
```

### Drag / rotate / resize interaction

Each `CanvasItemWrapper` shows handles only when the item is selected:

- **Top-center handle** (small bar): primary drag handle. Mousedown + drag = move. Click without drag = select.
- **Top-right rotate handle**: drag rotates around item center.
- **Four corner resize handles**: drag scales (proportional for sticker/photo/doodle, free for text).
- **Top-right delete X**: removes item.
- **Item body**: always interactive for editing (type into text, draw on doodle). Body never starts a drag — that's only the top-center handle.

Selection: click on the body or handle selects the item. Click outside any item deselects all. Multi-select is out of scope for v1.

Z-order: newly added items get max z + 1. Selecting any item auto-bumps it to max z + 1 (matches the physical scrapbook metaphor — when you touch a piece, it comes to the top). No explicit "bring to front" / "send to back" controls in v1.

Default tilt on item drop: random rotation between -4° and +4°. Never zero. This is the visual signal that makes the canvas feel like a scrapbook.

### Per-theme sticker library

Each theme exports a small sticker pack (8–12 SVGs) in `src/lib/stickers/<themeKey>.ts`. The `StickerPicker` reads the current theme from the theme store and shows the matching pack. Stickers are static SVGs imported as React components — no network fetch.

A few stickers (e.g., a generic star, a heart) are shared across all themes via `src/lib/stickers/shared.ts`.

For v1, plan ~10 stickers per theme × 11 themes ≈ ~80–110 SVGs total. This is the largest art-asset cost in the feature.

### Canvas paper

The canvas background is a themed paper texture. Each theme exports a paper background (`src/lib/themes.ts` extension): cream grain for hearth/paperSun/linen, deep ink-blue with star flecks for midnight, soft sage with watercolor edge for garden, etc. Paper is an SVG/PNG asset, fixed per theme.

The dashed border around the canvas (visible in the wireframe) is rendered in CSS — themed accent color.

## Autosave & lock rules

Mirror the existing entry pattern in `useAutosaveEntry`:

- First change → debounced 1500ms → `POST /api/entries` with `entryType: 'scrapbook'` and initial `canvasItems`.
- Subsequent changes → `PUT /api/entries/[id]` with updated `canvasItems`.
- Server validates and re-encrypts.

Lock rules (existing `isEntryLocked` + `validateAppendOnlyDiff` in `src/lib/entry-lock.ts`):

- Calendar day of `createdAt` (per `X-User-TZ`): canvas fully editable. Items can be added, moved, edited, deleted.
- After: read-only. No add, move, edit, delete. Renders via `ScrapbookReadOnly`.

This means the scrapbook gets the same "today only" editing window as regular entries, which keeps the data model and lock logic uniform.

## Mobile read-only display

When a user opens a scrapbook entry on mobile (via calendar/timeline), `ScrapbookReadOnly` renders the canvas at the device's viewport width, scaling all `%`-coord items proportionally. No drag handles, no toolbar, no edit affordances. The entry is a "card" you can view but not modify.

Creating/editing scrapbooks on mobile: blocked. The `/scrapbook` route on mobile shows a friendly empty state: "Scrapbook is best on a larger screen — open Hearth on iPad or laptop to make one." With a button to open the regular entry editor instead.

Detection: viewport width < 768px = mobile read-only. Tablets and up = full editor.

## Calendar / timeline / constellation integration

A scrapbook entry shows up in all entry-listing views (calendar, timeline, constellation) the same as a regular entry. Differences:

- **Calendar grid**: scrapbook entries get a small badge (e.g., a tiny polaroid icon) on the day cell.
- **Timeline / list views**: the entry preview shows a thumbnail of the canvas (rendered via `ScrapbookReadOnly` at small size) instead of the text preview.
- **Entry detail modal** (`EntryDetailModal`): opens the scrapbook at full size, read-only if locked.

Constellation: scrapbook entries get a slightly different node style (e.g., a small star with a polaroid corner) so they're visually distinct from text entries. Mood is still picked via existing `MoodPicker`, displayed the same way.

## Error handling

- Save failure → keep local state, retry on next change, surface a small "Saving…" / "Save failed, will retry" indicator (mirror existing autosave pattern).
- Image upload failure → item shows broken-image placeholder with a "retry" button.
- Decrypt failure on load → show the entry as inaccessible with a clear error (same as existing entry decrypt failure handling).
- Sticker library missing for a theme → fall back to `shared.ts` stickers + show all themes' packs (no hard failure).

## Testing

- **Unit:** scrapbook helpers — `defaultPlacement`, `randomTilt`, `clampToCanvas`, layering math. CanvasItem schema validation.
- **Unit:** lock rules apply to scrapbook (`isEntryLocked` for `entryType: 'scrapbook'`).
- **Component:** `CanvasItemWrapper` drag/rotate/resize using simulated pointer events. Test that body interactions don't trigger drag.
- **Component:** `ScrapbookReadOnly` renders without handles, no edit affordances.
- **Integration:** create a scrapbook entry via API, retrieve it, decrypt, render. Round-trip canvasItems JSON.
- **E2E (manual for v1):** desktop drag/rotate/resize feels good; mobile shows read-only correctly.

## Open questions (resolve before implementation)

These are small enough to defer to the implementation plan but worth flagging:

1. **Photo upload path** — does scrapbook reuse the same upload endpoint regular entries use, or get its own? Probably reuse.
2. **Doodle inside item — bounded canvas size?** Pick a fixed working resolution (e.g., 800×600 internal) that scales to whatever item dimensions the user sets.
3. **Text item — color picker scope?** Three preset colors per theme, or full color wheel? Three presets is the lighter call.
4. **Date stamp — required, or just placed by default and deletable?** Probably default-placed, deletable.
5. **Empty canvas after deleting all items — is that valid state to save?** Probably yes, but treat it as "draft" not deserving of constellation node.

## Risks

- **Sticker art volume.** ~100 SVGs across 11 themes is real design work. Mitigation: ship v1 with 4–5 themes' sticker packs done well, fall back to shared pack on themes without packs yet.
- **Drag/rotate/resize math edge cases.** Rotation around center, resize from corner with rotation applied, clamp-to-canvas with rotated bounding box — these are fiddly. Use a tested library (e.g., `react-moveable` or `interactjs`) rather than rolling our own.
- **Encryption + JSON size.** Large `canvasItems` (many photos, big doodles) could push entry size up. Photos are stored as URLs not base64, so the JSON itself stays small. Doodle strokes are the only fat content — same situation as today's standalone doodles.
- **"Two ways to journal" confusion.** Some users won't know whether to pick `/write` or `/scrapbook` for a given day. Mitigation: marketing copy + onboarding tooltip on first visit ("scrapbook is for the days you want to make something, not just write").
