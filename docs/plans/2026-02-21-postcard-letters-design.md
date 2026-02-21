# Postcard Letters UI Design

**Date:** 2026-02-21
**Route:** `/new-letters`
**Status:** Design approved

## Overview

A new route with a flippable postcard UI for writing and receiving letters. The postcard has a **front (writing surface)** and a **back (photos + address details)**, connected by a 3D CSS flip animation. Supports both self-letters and friend letters.

Exists alongside the current `/letters` page — no changes to existing code.

## Postcard Layout

### Front Side (Default View — Writing Surface)

- Full card is a TipTap rich text editor styled as a vintage postcard
- **Left half:** Writing area with Caveat handwriting font, faint horizontal ruled lines
- **Right half:** Decorative — "POST CARD" header, theme-specific stamp box (top-right), postmark circle with "AIR MAIL"
- **Top edge:** Red/blue air mail stripe
- **Overall:** Aged paper color (#f5f0e6), subtle box-shadow for worn edges
- Vertical divider line down the center (like a real postcard)

### Back Side (Flip View — Photos + Address)

- **Left half:** Photo upload area (1-2 photos, polaroid-style tilted) + doodle canvas preview below
- **Right half:** Address form
  - To: name field (auto-fills "Future Me" for self-letters)
  - Email: friend's email (hidden for self-letters)
  - From: sender name (optional)
  - Unlock date: quick presets (1 week, 2 weeks, 1 month, 3 months, 6 months, 1 year) + custom date picker
  - Writing from: location field (optional)
  - Decorative Hearth stamp in bottom-right corner

### Flip Interaction

- Click/tap a flip button to rotate the card 180deg with CSS 3D transform
- `perspective: 1200px` on container, `transform: rotateY(180deg)` on card
- `backface-visibility: hidden` on both faces
- Transition duration: ~0.8s ease

## Letter Type Toggle

- Above or below the card: toggle between "To Future Self" and "To a Friend"
- Self-letter: hides email field, auto-fills "Future Me" in To field
- Friend letter: shows all address fields

## Component Structure

### New Files

```
src/app/new-letters/page.tsx          — Route page, state management
src/components/postcard/
  Postcard.tsx                        — Flippable card container (3D CSS)
  PostcardFront.tsx                   — Writing surface with TipTap editor
  PostcardBack.tsx                    — Photos (left) + address form (right)
```

### Reused (No Changes)

- TipTap editor setup and configuration
- Photo upload + compression logic (from CollagePhoto patterns)
- DoodleCanvas component
- SongEmbed input
- FloatingEnvelope animation (plays after send)
- `POST /api/entries` with `entryType: 'letter'`
- Encryption (AES-256-GCM for text, recipient info, etc.)
- Cron delivery (`/api/cron/deliver-letters`)
- Email templates (Resend)

## Data Flow

```
Write on front → Flip → Add photos + address on back → Send
  ↓
Payload: {
  entryType: 'letter',
  text: encrypted,
  recipientEmail, recipientName, senderName, letterLocation (all encrypted),
  unlockDate, isSealed: true,
  photos: [...], doodle: {...}, songUrl
}
  ↓
POST /api/entries (existing handler)
  ↓
Cron delivers when unlockDate <= now
```

## Responsive Behavior

- **Desktop:** Card ~700x450px, centered on page
- **Tablet:** Card scales to ~90vw, maintains aspect ratio
- **Mobile:** Full-width card, slightly taller ratio for more writing space. Flip via tap.

## What's NOT Changing

- No new API routes
- No schema changes
- No new database models
- `/letters` page untouched
- Email templates, cron, encryption — all reused as-is

## Send Flow

1. User clicks "Send" button (below card)
2. Validation: content required, unlock date required, friend email required (if friend letter)
3. Encrypt fields, POST to `/api/entries`
4. On success: FloatingEnvelope animation plays
5. Success state with "Write another" option
