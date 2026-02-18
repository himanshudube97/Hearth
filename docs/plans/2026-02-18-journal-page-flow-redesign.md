# Journal Page-Flow Redesign

**Date:** 2026-02-18
**Status:** Design Approved

## Overview

Redesign the journal entry experience to feel like a physical diary with paginated spreads, richer media support, and append-only editing that preserves authenticity.

## Goals

1. **Physical diary feel** — Fixed page sizes, no scrolling within pages, natural page-turn flow
2. **Richer media** — Photos (with camera capture), doodles, and music per spread
3. **Authenticity** — Append-only editing preserves the "moment in time" nature of journaling

## Design Decisions

### Page Layout

Each journal entry consists of 1-3 **spreads** (2 pages each = 2-6 pages total).

**Left Page (Writing Only):**
```
┌─────────────────────┐
│ 🎵 Music link       │  ← Spotify/YouTube/SoundCloud embed
├─────────────────────┤
│                     │
│                     │
│   Writing Area      │  ← Primary text area
│                     │
│                     │
│                     │
└─────────────────────┘
```

**Right Page (Media + Writing):**
```
┌─────────────────────┐
│   📷        📷      │  ← Two tilted/overlapping photos (polaroid style)
│  Photo 1  Photo 2   │
├─────────────────────┤
│                     │
│   Writing Area      │  ← Secondary text area
│                     │
├─────────────────────┤
│                     │
│   🎨 Doodle Area    │  ← Drawing canvas
│                     │
└─────────────────────┘
```

### Media Blocks

Media slots are **always visible** but **optional to fill**. Empty slots show placeholder UI (e.g., "tap to add photo").

| Media Type | Limit | Location |
|------------|-------|----------|
| Music link | 1 per entry | Top of left page (first spread only) |
| Photos | 2 per spread | Top of right page |
| Doodle | 1 per spread | Bottom of right page |
| Text | Unlimited | Both pages, all spreads |

### Photo Capture

Users can add photos via:
1. **File picker** — Upload from device storage
2. **Camera capture (mobile)** — Native camera via `<input capture="camera">`
3. **Webcam capture (desktop)** — Modal with live preview using `getUserMedia()` API

**Webcam Modal Flow:**
```
[Add Photo] → [Upload / Take Photo]
                      ↓
              ┌─────────────────┐
              │ [Live preview]  │
              │   from webcam   │
              ├─────────────────┤
              │  [📸 Capture]   │
              └─────────────────┘
                      ↓
              ┌─────────────────┐
              │ [Photo preview] │
              ├─────────────────┤
              │ [Retake] [Use]  │
              └─────────────────┘
```

### Photo Storage

**Phase 1 (MVP):**
- Convert photo to base64
- Store in PostgreSQL (entry JSON or separate `EntryPhoto` table)
- Compress/resize client-side before storage (max 800px width)

**Phase 2 (Scale):**
- Upload to cloud storage (Supabase Storage / S3 / Cloudinary)
- Store URL reference in database
- CDN delivery with image optimization

**API Design:** Return photo URLs from day 1. Phase 1 returns data URLs, Phase 2 returns cloud URLs. Frontend code unchanged.

### Pagination

**No scrolling within pages.** Content is paginated across spreads.

- User starts with 1 spread (2 pages)
- Can add spreads via "+ Add pages" button (up to 3 spreads / 6 pages)
- Each spread follows the same layout (left = writing, right = media + writing)
- Navigation: page dots or arrows at book edges

### Multiple Entries Per Day

Users can create unlimited entries per day.

**UI:** Entry dots displayed above the date header:
```
        ①  ②  ③  ④
  ────────────────────
   Wednesday, Feb 18, 2026
```

- Active entry highlighted
- Tap dot to switch entries
- Each entry has its own pagination (pages within that entry)

### Editing Rules (Append-Only)

Preserves diary authenticity — you can add, but never remove or change.

| Action | Allowed |
|--------|---------|
| Edit existing text | ❌ No |
| Add more text to pages | ✅ Yes |
| Remove photo/doodle once added | ❌ No |
| Add photo to empty slot | ✅ Yes |
| Add doodle to empty canvas | ✅ Yes |
| Add new spreads to existing entry | ✅ Yes |
| Change music link once set | ❌ No |
| Add music link if empty | ✅ Yes |

### Deletion Flow (Two-Step)

```
Entry in Journal
    ↓ "Delete"
Archived (hidden from main view, recoverable)
    ↓ "Delete Forever" (from archive view)
Permanently deleted
```

- First delete = soft delete (archived)
- Archive accessible via settings or dedicated "Archive" section
- Permanent delete only available from archive
- Adds friction to prevent accidental data loss

## Data Model Changes

### JournalEntry (updated)

```prisma
model JournalEntry {
  id            String   @id @default(cuid())
  userId        String
  text          Json     // Array of page content: [{ page: 1, content: "..." }, ...]
  mood          Int
  song          String?

  // New fields
  spreads       Int      @default(1)  // Number of spreads (1-3)
  archivedAt    DateTime?             // Soft delete timestamp

  // Relations
  photos        EntryPhoto[]
  doodles       EntryDoodle[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
}
```

### EntryPhoto (new)

```prisma
model EntryPhoto {
  id            String   @id @default(cuid())
  entryId       String
  spread        Int      // Which spread (1, 2, or 3)
  position      Int      // 1 or 2 (left or right photo)
  url           String   // Data URL (phase 1) or cloud URL (phase 2)
  rotation      Int      @default(0)  // Tilt angle for polaroid effect (-15 to 15)

  createdAt     DateTime @default(now())

  entry         JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, spread, position])
}
```

### EntryDoodle (updated)

```prisma
model EntryDoodle {
  id            String   @id @default(cuid())
  entryId       String
  spread        Int      @default(1)  // Which spread
  strokes       Json     // Stroke data

  createdAt     DateTime @default(now())

  entry         JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, spread])
}
```

## Component Architecture

```
BookSpread (updated)
├── SpreadNavigation        # Page dots, spread indicators
├── LeftPage (updated)
│   ├── MusicBlock          # Song URL input + embed
│   └── WritingArea         # Text area, fixed height
├── RightPage (updated)
│   ├── PhotoBlock          # Two tilted photo slots
│   │   ├── PhotoSlot       # Single photo with upload/capture
│   │   └── CameraModal     # Webcam capture UI
│   ├── WritingArea         # Text area, fixed height
│   └── DoodleBlock         # Drawing canvas
└── AddSpreadButton         # "+ Add pages" (if < 3 spreads)
```

### New Components Needed

1. **PhotoSlot** — Empty state, upload trigger, photo display with tilt
2. **CameraModal** — Webcam preview, capture, retake/use flow
3. **PhotoBlock** — Container for two PhotoSlots with overlapping layout
4. **SpreadNavigation** — Page dots, spread switching
5. **EntrySelector** — Entry dots for multiple entries per day
6. **ArchiveView** — List archived entries, permanent delete option

## UI States

### New Entry Flow
1. Open book → lands on "new entry" spread
2. Music block empty, photo slots empty, doodle empty
3. User writes, optionally adds media
4. Click "Save Entry" → entry saved
5. Can add more spreads before or after saving

### View Entry Flow
1. Navigate to date → see entry dots if multiple entries
2. Click entry dot → loads that entry
3. See filled content (text, photos, doodles)
4. Empty slots still show "tap to add" (append-only)
5. Can add to empty slots, cannot edit filled content

### Archive Flow
1. On entry → click "..." menu → "Delete"
2. Confirm dialog → entry archived
3. Entry disappears from main view
4. Settings → Archive → see archived entries
5. Can restore or permanently delete

## Migration Path

### From Current Implementation

Current: Single spread, left page = mood/song/doodle, right page = text

New: Multi-spread, left = music/text, right = photos/text/doodle

**Migration Steps:**
1. Add new schema fields (spreads, archivedAt)
2. Create EntryPhoto model
3. Update EntryDoodle with spread field
4. Migrate existing entries:
   - Move song to new location
   - Keep doodle on spread 1
   - Text stays on spread 1
   - No photos (legacy entries)
5. Update components incrementally

## Open Questions

1. **Photo size limit?** Suggest 5MB max, resize to 1200px width client-side
2. **Doodle per spread vs per entry?** Design says per spread — confirm this scales well
3. **Archive retention?** Keep archived entries forever, or auto-delete after 1 year?

## Success Criteria

- [ ] Users can create entries with 1-3 spreads
- [ ] Photos can be added via file upload and camera/webcam
- [ ] Tilted polaroid photo display looks polished
- [ ] Page navigation feels like turning real pages
- [ ] Multiple entries per day work with entry dots
- [ ] Append-only editing prevents modification of existing content
- [ ] Archive + permanent delete flow works smoothly
- [ ] Existing entries migrate without data loss
