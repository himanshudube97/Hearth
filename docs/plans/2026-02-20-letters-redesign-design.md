# Letters Feature Redesign - Design Document

**Date**: 2026-02-20
**Status**: Approved

## Goals

1. **Consistency**: Letters (self + friend) support the same media as the write page: photos, music links, and doodles
2. **Email richness**: Both self-letter and friend-letter emails include full media (text, photos, doodle as image, music as clickable link)
3. **Redesigned letters page**: Poetic landing cards, inline expand writing, organized sent/received archive
4. **Cross-user delivery**: If a friend-letter recipient is a Hearth user, the letter also appears in their app

## Page Layout

The `/letters` page has 4 vertical sections:

### 1. Hero Option Cards

Two cards side by side (stack on mobile):

**"Letter to Future Self"**
> "Write to the person you're becoming. Seal your words in time - they'll find you when the moment is right."
> Envelope icon, warm/amber tones

**"Letter to a Friend"**
> "Send your heart across the distance. A letter that arrives not when it's sent, but when it's meant to."
> Paper plane icon, soft/blue tones

Clicking a card smoothly expands the writing area below (Framer Motion). Selected card gets a highlight. Clicking again collapses.

### 2. Writing Area (Inline Expand)

Expanded below the selected card:

- Envelope-style header ("Dear future me," or "Dear [friend name],")
- Full TipTap editor (same extensions as write page)
- 2 polaroid photo slots (CollagePhoto components)
- Music link text input + SongEmbed preview
- Doodle button -> DoodleCanvas modal, DoodlePreview inline
- "Ready to send" button -> Send drawer (date picker, location, friend details)

### 3. Sent Letters Archive

Two sub-sections:

**"Letters to myself"**
- Each card: "Sealed on [date]", "Arriving [date]" or "Arrived"
- Lock icon (sealed) or letter icon (arrived)
- Clicking an arrived one opens the postcard reading modal

**"Letters to friends"**
- Each card: "To [friend name]", "Sent on [date]", "Arriving [date]"
- Lock icon always (you can't re-read friend letters)

### 4. Received Letters

**"Letters from the past"** - Self-letters that have arrived, clickable to read

**"Letters from friends"** - Letters received from Hearth users who sent you a letter (future-ready, implemented as part of this work)

## Email Enhancements

### Both Self-Letter AND Friend-Letter Emails Include:

1. **Text content** - Styled in serif font, existing dark theme design
2. **Photos** - Embedded as inline images, polaroid-style frames
3. **Music link** - Styled card with song/link info + "Listen" button (emails can't embed players)
4. **Doodle** - Stroke JSON -> SVG -> PNG via `sharp`, embedded as inline image

### Technical: Doodle to Image

During cron delivery (not at creation time):
- Read doodle stroke data from DB
- Render strokes into SVG string server-side (map stroke points to SVG paths)
- Convert SVG -> PNG buffer using `sharp`
- Embed as CID-attached inline image in email

## Schema Changes

```prisma
model JournalEntry {
  // Existing fields...

  // NEW: Track received letters from other users
  isReceivedLetter  Boolean   @default(false)
  originalSenderId  String?   // userId of the person who sent this letter
  originalEntryId   String?   // the sender's entry ID (for reference)
}
```

## API Changes

### Modified: `POST /api/entries`
- Accept `doodle` and `songLink` data for letter entries (currently only for normal entries)
- Save doodle strokes and song link when entryType is 'letter'

### Modified: `GET /api/cron/deliver-letters`
- After sending email, check if `recipientEmail` exists in User table
- If yes, create a new JournalEntry for recipient with:
  - `entryType: 'letter'`, `isReceivedLetter: true`
  - Copy: text, photos, doodle, songLink
  - Set: `originalSenderId`, `originalEntryId`
  - `isDelivered: true`, `deliveredAt: now`
- Render doodle -> PNG for email embedding

### Modified: `GET /api/letters/mine`
- Exclude received letters (`isReceivedLetter: false`)

### New: `GET /api/letters/received`
- Fetch entries where `userId = currentUser` AND `isReceivedLetter = true`
- Decrypt and return with sender info

### Modified: Email templates in `lib/email.ts`
- `sendLetterEmail()`: Add photos, doodle image, music link to HTML
- `sendSelfLetterNotification()`: Convert to full content email (rename to `sendSelfLetterEmail()`)

## Component Changes

### Modified: `letters/page.tsx` (major rewrite)
- Replace current toggle UI with hero option cards
- Add inline expand writing area with full media support
- Add sent letters archive (two sections)
- Add received letters section

### Modified: `Editor.tsx`
- No changes needed - it's already a controlled component that accepts props

### Reused from Write Page:
- `CollagePhoto` - polaroid photo slots
- `SongEmbed` - music link preview
- `DoodleCanvas` - drawing modal
- `DoodlePreview` - inline doodle display

### Modified: Postcard Reading Modal
- Add photo display (polaroid overlays)
- Add doodle image display
- Add music link embed
- Update download capture to include all media

## Data Flow

### Writing a Letter:
```
User picks card -> Expand writing area -> Write text + add photos/doodle/music
-> "Ready to send" -> Send drawer (date, location, friend details)
-> POST /api/entries (entryType: 'letter', isSealed: true, all media)
-> Envelope animation -> Success state
```

### Letter Delivery (Cron):
```
Cron finds due letters -> For each letter:
  1. Decrypt content
  2. Render doodle to PNG (if exists)
  3. Build rich email (text + photos + doodle image + music link)
  4. Send email to recipient (self or friend)
  5. If friend letter: check if recipientEmail is a Hearth user
     -> If yes: create received letter entry for that user
  6. Mark isDelivered = true
```

### Reading a Letter:
```
Letters page loads -> Fetch /api/letters/mine + /api/letters/received
-> Show in archive sections
-> Click arrived letter -> Postcard modal (text + photos + doodle + music)
-> Mark as viewed
```
