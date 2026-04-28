# Scrapboard Redesign — Design Spec

**Date:** 2026-04-28
**Status:** Draft for review
**Owner:** Himanshu
**Supersedes:** `2026-04-28-scrapbook-canvas-design.md` (the v0 ephemeral canvas)

## What we're building

A redesign of `/scrapbook` from a single ephemeral canvas (in-memory only, lost on reload) into a persistent collection of free-form scrapboards. The user can create many scrapboards, each one a curated keepsake page. Surface changes from cream paper to a thick textured **scrapbook page** with per-type attachment styles (pin, tape, paper-clip, wax seal, ink stamp). New item types are added: `clip` (paper ephemera), `mood` (wax seal), `stamp` (ink stamp), and `date` (auto-added date pill).

This is a re-skin + persistence layer + new item types. It does not change the global navigation (already exists) or any other surface in the app.

## Why

The current `/scrapbook` is a tech demo: things you arrange disappear on reload. To be useful as a journaling artifact, scrapboards must persist and be revisitable. Users also want to create *more than one* — a board for a trip, a board for a season, a board for a person. Tying a scrapboard to a specific calendar day (the v0 model) limited what they could be. Free-form collections fit how people actually scrapbook.

The v0 cream-paper surface and uniform shadow attachment also flattened the visual story. A real scrapbook page has different attachment styles for different ephemera — and that's the visual identity we're moving toward.

## Non-goals (v1)

- Per-theme surface variants (one neutral kraft surface ships in v1; theme-tinted variants are a v2 follow-up)
- Voice memos as an item type
- Mobile creation/editing parity (mobile remains view-only — same as v0)
- Multi-page scrapboards (one page per board; multi-page is v3+)
- Collaborative / shared scrapboards
- Templates / preset layouts
- Persisted undo/redo across sessions (per-session only)
- Pre-rendered board thumbnails (grid uses a placeholder; thumbnail generation is a v2 follow-up)
- User-uploaded stickers (fixed library only, same as today)

## User flow

### From the global nav
1. User clicks **Scrapbook** in the global tab bar (`src/components/Navigation.tsx` — already exists, no changes).
2. Routed to `/scrapbook` — a **grid of all the user's scrapboards**, plus a "+ New scrapboard" tile.
3. Each grid tile shows: a placeholder preview, the title (or date fallback), updated-at, item count.
4. Clicking a tile routes to `/scrapbook/[id]`.
5. Clicking "+ New" creates a fresh scrapboard (with a `date` item auto-placed) and routes to it.
6. Tile menu: rename, delete (with confirm).

### On a scrapboard
1. Themed scrapbook-page surface fills the viewport. Items render at their stored positions.
2. Toolbar (left rail) for adding items: `text · photo · song · sticker · doodle · clip · mood · stamp`. Below: undo, reset.
3. Adding an item drops it at canvas center with a small random tilt; user drags, rotates, resizes.
4. Every change debounces (1500ms) and writes to the server via `PUT /api/scrapboards/[id]`.
5. The `date` item is auto-placed on board creation. User can drag, rotate, edit text, or delete it like any other item.
6. **Reset** wipes all items (with confirm). The board itself remains.
7. **Back to grid** via a small affordance at the top-left of the board.
8. No time-lock. Boards are always editable. (Diverges from `JournalEntry` rules.)

## Architecture

### Data model

**New Prisma model: `Scrapboard`** (additive — no changes to existing tables).

```prisma
model Scrapboard {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?              // encrypted, optional — UI falls back to date label
  items     String   @db.Text    // encrypted JSON: AES-256-GCM ciphertext of ScrapboardItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, updatedAt(sort: Desc)])
}
```

Add a back-relation on `User`:
```prisma
model User {
  // ... existing fields
  scrapboards Scrapboard[]
}
```

**Why one JSON blob, not normalized item rows:**
- Items are tightly coupled to a single board; no cross-board queries needed.
- Atomic autosave — one row write per save. Matches the existing autosave pattern for journal entries.
- Schema flexibility: new item types added without migrations.
- The blob is bounded (target: <5 MB for typical boards including ~20 compressed JPEG photos).

**Encryption.** Both `title` and `items` are encrypted with AES-256-GCM via `src/lib/encryption.ts` (existing pattern). Encrypt on save, decrypt on read. Same `iv:authTag:encryptedData` hex format as `JournalEntry.text`.

**No time-lock.** Unlike `JournalEntry`, scrapboards have no calendar-day lock. They are always editable. `src/lib/entry-lock.ts` does not apply.

### Item type union

Defined in `src/lib/scrapbook.ts` (existing file — extended). All items share `BaseItem` with id/x/y/width/height/rotation/z (positions are % of canvas, 0–100, same as v0).

```ts
type ScrapboardItemType =
  // existing v0
  | 'text' | 'sticker' | 'photo' | 'song' | 'doodle'
  // new in this spec
  | 'clip' | 'mood' | 'stamp' | 'date'
```

Per-type fields:

| Type      | Fields                                                                                                          |
|-----------|-----------------------------------------------------------------------------------------------------------------|
| `text`    | `text`, `color`, `bg`, `tape`, `fontFamily`, `fontSize` *(unchanged from v0)*                                   |
| `sticker` | `stickerId` *(unchanged)*                                                                                       |
| `photo`   | `src` (data URL or null), `caption?`, `polaroid` *(unchanged)*                                                  |
| `song`    | `url`, `title`, `provider` *(unchanged)*                                                                        |
| `doodle`  | `strokes[]` *(unchanged)*                                                                                       |
| `clip`    | `variant: 'index-card' \| 'ticket-stub' \| 'receipt'`, `lines: string[]`                                        |
| `mood`    | `level: 0 \| 1 \| 2 \| 3 \| 4`                                                                                  |
| `stamp`   | `topLine: string`, `midLine: string`, `bottomLine: string`, `ink: 'red' \| 'blue' \| 'black'`                   |
| `date`    | `isoDate: string` (ISO yyyy-mm-dd), `displayText?: string` (user override; otherwise formatted from `isoDate`)  |

### Attachment styles (rendered, not stored)

Attachment is purely visual and derived per item type at render time — no field on `BaseItem`. Choosing it is the renderer's job.

| Type      | Attachment                                                                                                       |
|-----------|------------------------------------------------------------------------------------------------------------------|
| `text`    | Push-pin top-center                                                                                              |
| `photo`   | Washi tape strip on top edge **or** push-pin (deterministic per item id, so it's stable across renders)          |
| `song`    | Washi tape strip                                                                                                 |
| `doodle`  | Photo corners (paper mounts) on the four corners                                                                 |
| `sticker` | None — sits flat as a decal (mixed metaphor, accepted)                                                           |
| `clip` (index-card) | Push-pin top-center                                                                                    |
| `clip` (ticket-stub) | Two grommet circles on the left edge (decorative)                                                     |
| `clip` (receipt) | Tiny paper-clip top-left                                                                                  |
| `mood`    | None — looks pressed (wax-seal styling: subtle drop-shadow, slightly raised)                                     |
| `stamp`   | None — looks stamped (slightly faded ink, no shadow)                                                             |
| `date`    | Push-pin top-center                                                                                              |

### Surface

A new `ScrapbookPage` background component replaces the current corkboard/cream-paper background in `ScrapbookCanvas.tsx`. The surface:

- Base color: warm kraft (`#e8d8b0`-ish, neutral)
- Subtle paper-grain texture (CSS noise overlay or SVG)
- Soft inner shadow at the page edges to suggest depth
- No theme-tinted variants in v1 (deferred to v2 — `paperForTheme` in `src/lib/scrapbook.ts` already exists as the seam)

### Photo handling

Adopt the journal photo-compression pipeline:

- File picked → loaded into `<img>` → drawn to a `<canvas>` resized to max ~1600px on the long edge → exported as `toDataURL('image/jpeg', 0.85)` → stored as a data URL on the `photo` item's `src` field.
- The current `ScrapbookCanvas` uses `readAsDataURL` directly (no compression). This is fixed by the redesign.
- Reference implementation: `src/components/desk/PhotoSlot.tsx` and `src/components/CollagePhoto.tsx`.

Photo data URLs live inside the encrypted `items` blob. No separate file/blob storage in v1.

### API routes

All under `src/app/api/scrapboards/`. All routes use `getCurrentUser()` from `@/lib/auth`.

| Method | Path                          | Purpose                                                                |
|--------|-------------------------------|------------------------------------------------------------------------|
| `GET`  | `/api/scrapboards`            | List boards: `[{id, title, updatedAt, itemCount}]` for the grid         |
| `POST` | `/api/scrapboards`            | Create board with default `date` item; returns full board               |
| `GET`  | `/api/scrapboards/[id]`       | Full board (decrypted items + title)                                    |
| `PUT`  | `/api/scrapboards/[id]`       | Autosave: replaces title and/or items (encrypted on the way in)         |
| `DELETE` | `/api/scrapboards/[id]`     | Delete                                                                  |

`itemCount` is computed at list time (count after decrypt + parse). For v1 this is fine; if it gets slow we cache it as a denormalized column later.

### Client architecture

Reusing existing pieces wherever possible:

- `src/components/scrapbook/ScrapbookCanvas.tsx` — refactored to take a `boardId` prop and an initial `items` array, and to plug into a new `useAutosaveScrapboard` hook (modeled on `useAutosaveEntry`).
- `src/components/scrapbook/items/{TextItem,StickerItem,PhotoItem,SongItem,DoodleItem}.tsx` — kept as-is. New files: `ClipItem.tsx`, `MoodItem.tsx`, `StampItem.tsx`, `DateItem.tsx`.
- `src/components/scrapbook/CanvasItemWrapper.tsx` — extended to render attachment overlays (pin / tape / grommets / corners / clip) per item type.
- `src/components/scrapbook/CanvasToolbar.tsx` — extended with new buttons (clip, mood, stamp). Reset button added.
- `src/lib/scrapbook.ts` — extended with new item types, `make*Item` factories, attachment-style helpers.
- `src/lib/encryption.ts` — used as-is (already exports `encrypt` and `decrypt`).
- `src/hooks/useAutosaveScrapboard.ts` — new, mirrors `useAutosaveEntry`.
- `src/store/` — no new store needed; board state lives in the canvas component.

New routes:
- `src/app/scrapbook/page.tsx` — replaced from "render canvas" to "render grid of boards".
- `src/app/scrapbook/[id]/page.tsx` — new, renders the canvas for a specific board.

## Migration

The current `/scrapbook` is an ephemeral useState canvas with no persisted data. **No data migration is needed.** The route's behavior changes (from canvas to grid), but no users are losing existing scrapboards because none are stored.

The new `Scrapboard` table is created via `prisma migrate dev`. It's purely additive — no existing tables change.

## Testing approach

This codebase doesn't ship a test runner today. Verification is manual + lint + build:

- `npm run lint` clean
- `npm run build` clean
- Manual: create a board, add one of every item type, reload, verify all items persist with positions/rotations/sizes intact. Delete a date item and re-add via toolbar. Reset a board. Delete a board.
- Manual: ~20 photos compressed to JPEG, total board size stays under ~5 MB. Verify by inspecting the encrypted-blob length.
- Manual: encryption round-trip — items go in and come back identical (no drift in floats due to JSON serialization).

## Open scope edges (flagged, not blocking)

- **Theme-tinted surfaces.** `paperForTheme` is the seam; ships in a follow-up.
- **Pre-rendered thumbnails.** v1 grid uses a placeholder (or a CSS render of the first photo if any). Real thumbnails are v2.
- **Performance ceiling.** ~20 photos per board. We'll watch for boards exceeding ~5 MB and add eviction guidance if it becomes a real problem.
- **Mobile creation parity.** Out of scope. Mobile is read-only (matching v0).
- **Sticker variants.** Existing fixed library is reused as-is.
