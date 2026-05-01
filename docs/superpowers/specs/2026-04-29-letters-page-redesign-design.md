# Letters Page Redesign — Design Spec

**Date:** 2026-04-29
**Status:** Draft, pending user review
**Scope:** Frontend-only. No schema or API changes.

## Context

Today, `/letters` is a single screen where the postcard editor (`PostcardFront` / `PostcardBack` / `Postcard`) is the default surface, with an internal `viewMode: 'write' | 'archive'` toggle. Two recipient types exist: `'self' | 'friend'`. Drafts autosave via `useAutosaveEntry` (entryType=`letter`, `isSealed=false`); seal flips `isSealed=true` and locks the entry.

This redesign replaces the postcard metaphor with a **letter on lined paper** metaphor (per Image #1 in the brainstorm), trims and rephrases the recipient list, and makes the **sealed-letters list** the default landing surface.

## Out of scope (v1)

- Stranger / pen-pal recipient (`/api/letters/received` exists but the sender side is not built; defer)
- Past-me recipient (cut from the brainstorm)
- Reading sealed letters before their unlock date (sealed = closed, period)
- Changes to delivery cron, encryption, or Lemon Squeezy gating
- Sealed-letter appearance on the bookshelf / timeline (separate pass)

## Surfaces

### Surface 1: Sealed letters list — `/letters` (default landing)

A scrapbook-style list of the user's sealed letters. Each tile shows:

- Recipient name (e.g. "future me" or "Mom")
- Sealed date ("sealed Apr 27, 2026")
- Unlock date ("opens Apr 27, 2027" — or "someday" if user picked a far date)

Tiles are **closed/sealed visually** (folded-letter or wax-seal treatment) — they are not openable. Hovering a tile may show a quiet tooltip with the same metadata; there is no modal, no preview, no contents shown. Reading is gated entirely on the existing letter-arrival flow when `unlockDate` passes.

**Top affordance:** a single primary button — `✎ Write a letter` — opens Surface 2.

**Empty state:** when the user has no sealed letters, the page shows a calm illustration + the same `✎ Write a letter` CTA. (No auto-redirect to Surface 2 — the empty state is a deliberate, gentle invitation.)

Visual style: follows existing `components/scrapbook/` patterns where possible (tile sizing, hover, layout grid).

### Surface 2: Write a letter — opened from Surface 1

The screen from the mockup. Two-column layout:

**Left column — sidebar:**
- Header: `DEAR…`
- Two recipient tiles (vertical stack):
  - `future me · a year from now` (selected by default)
  - `someone close · you name them`
- Below the tiles: a quiet helper card — "Letters can be opened on a date, or left to be found by chance. → choose when below"
- Date chips: `1 month` · `6 months` · `1 year` · `someday`
  - `1 month`/`6 months`/`1 year` set `unlockDate = createdAt + N`
  - `someday` opens a date picker; user selects any future date (minimum existing 1-week constraint applies)

**Right column — letter:**
- Lined-paper background, handwritten font (existing `--font-caveat`)
- Top-right stamp: date + "HEARTH" mark, matching mockup
- `A LETTER` small caps title (top-left)
- `Dear ___,` salutation:
  - If recipient = `future me` → renders fixed "Dear future me," (no input)
  - If recipient = `someone close` → renders `Dear [____],` with the blank as an inline text input (name appears handwritten once entered, e.g. "Dear Mom,")
- Body: existing TipTap editor styled to fit lined paper (line height matches rule lines)
- Signature line: `yours, [name]` — auto-filled from `useProfileStore().profile.name`
- Footer row: `← back` and `fold & seal ✦`
- Footer label: `— the end —` (decorative, like in mockup)

**Tucked-in attachments** — sit between the signature line and the `fold & seal` row, in their own quiet strip labeled `— tucked in —`:
- Photos (1–3) as small polaroid cards with washi-tape, slight tilt
- Doodle as a folded sketch card
- Song as a pasted-in ticket-stub-style chip (existing `SongEmbed`, restyled small)

These are added via the existing add-photo / add-song / add-doodle controls. Default placement: keep them in the existing editor toolbar (no new affordances). If during implementation that feels visually crowded against the lined-paper aesthetic, they may move to a small inline `+ tuck in` row directly above the tucked-in strip — that is a polish-time call, not a spec question.

### Recipient model — schema mapping

Existing `Recipient` type today: `'self' | 'friend'`. The redesigned UI maps:

- `future me` → `'self'` (existing behavior — delivered to the user's own email on `unlockDate`)
- `someone close` → `'friend'` *with caveat*: today `'friend'` requires `recipientEmail` so the daily cron can deliver. For "someone close" we will treat **a name without an email as an unsent letter** — `entryType = 'unsent_letter'` (already in the schema), no email delivery, never auto-arrives. If the user supplies an email, it stays `entryType = 'letter'` and uses the existing delivery cron.
  - This is the only nuance worth noting: the same UI tile produces two different `entryType` values depending on whether an email is provided. UI surfaces this with an optional "send to ___'s email on this date" toggle/input under the name field. Default = unsent.

### Drafts & seal mechanic

- `useAutosaveEntry` continues to autosave the in-progress letter (entryType=`letter`/`unsent_letter`, `isSealed=false`).
- `fold & seal` triggers the existing seal mechanic: sets `isSealed=true`, persists `unlockDate`, plays a sealing animation (envelope fold or wax-seal stamp — visual treatment to be designed during implementation), then routes back to Surface 1 where the new sealed tile is now visible.
- After seal, the entry is locked per existing `isEntryLocked` rules. No new server enforcement.

## Components

New / replaced:
- `components/letters/SealedLetterList.tsx` — Surface 1 grid, replaces the archive view inside today's `letters/page.tsx`
- `components/letters/SealedLetterTile.tsx` — single sealed-letter tile
- `components/letters/LetterWriteView.tsx` — Surface 2 two-column layout, replaces `Postcard` shell
- `components/letters/RecipientSidebar.tsx` — left column (DEAR… tiles + date helper + chips)
- `components/letters/LetterPaper.tsx` — right column (lined paper + editor + signature + tucked-in)
- `components/letters/TuckedIn.tsx` — the photo/doodle/song strip

Retired (moved out of `/letters` flow, not deleted from repo immediately):
- `Postcard.tsx`, `PostcardFront.tsx`, `PostcardBack.tsx`, `FloatingEnvelope.tsx` — kept around in case any non-letter surface still uses them; if `grep -r 'Postcard'` confirms `/letters` is the only consumer, they can be deleted in the same PR.

Reused as-is:
- `useAutosaveEntry`, `SongEmbed`, `DoodlePreview`, `useProfileStore`, `useThemeStore`
- `LetterReveal`, `LetterArrivedBanner` (downstream — when a letter arrives, these handle the unlock/read flow; redesign does not touch them)

## Server / data

**No changes.** Existing fields used:
- `entryType`: `'letter' | 'unsent_letter'`
- `recipientName`, `recipientEmail` (encrypted, existing fields)
- `unlockDate`, `isSealed`, `isDelivered`

## Open questions

None blocking. Implementation may surface small visual choices (sealing animation, exact polaroid styling, empty-state illustration) — these are design polish, not spec questions.

## Acceptance — what "done" looks like

- Visiting `/letters` lands on the sealed list (or empty state with CTA).
- Clicking `Write a letter` opens the two-column write view matching the mockup.
- Both recipient tiles work: `future me` produces a self-letter with fixed salutation; `someone close` lets the user type a name (and optionally an email).
- Date chips set `unlockDate` correctly; `someday` opens a date picker.
- Photos/doodle/song appear in the tucked-in strip, not inline in the body.
- Drafts autosave; seal locks the entry and returns the user to the sealed list.
- Existing letter delivery cron still works for letters with an email.
