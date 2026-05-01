# Letters Redesign — Design Spec

**Date:** 2026-05-01
**Status:** Approved (pending implementation plan)
**Reference demo:** `/tmp/hearth-letters-demo.html` (single-file HTML, opens in any browser)

---

## Summary

Replace the current `/letters` UI (a grid of identical card tiles + a single compose form) with a postal-themed two-surface experience that uses **distinct metaphors for distinct verbs**:

| Surface | Metaphor | Verb |
|---|---|---|
| **letters** (combined) | Writing desk + postbox in one scene | write *and* receive |
| **sent** | Stamp album, year-tabbed, no scroll | review what you've sent |

The current "list of cards" treats sealed letters as items in a database. This redesign treats them as artifacts: letters that arrive *to* a postbox and stamps that record what you've sent. Reading a never-opened letter triggers a one-time reveal ceremony (wax seal cracks, envelope opens, letter unfurls).

## Goals

- Make the letters feature **emotionally legible**: the visuals should match what the user is feeling — anticipation when receiving, ceremony when reading for the first time, quiet record-keeping for sent.
- Use the existing Hearth design language: paper / Caveat / dusty palette, rose · sage · ocean themes, lamp from `LeftLamp.tsx`.
- **No external assets** — everything renders in CSS / inline SVG, theme-driven via existing `theme.bg.gradient`, `theme.accent.*` tokens.
- **Single-page sent**: no scrolling on the sent stamp album — year tabs swap content within one viewport.
- **Preserve secrecy of sealed letters**: a letter the user has sent but not yet received back is shown only as a stamp (receipt). Content is not viewable from the sent surface.

## Non-goals

- Not changing the underlying `JournalEntry` model significantly (only two new nullable fields — see *Data model* below).
- Not changing the encryption pattern (`AES-256-GCM`, `lib/encryption.ts`) — text/letter fields remain encrypted at rest.
- Not changing the cron-based delivery system (`/api/cron/deliver-letters`) — that still runs daily.
- Not changing how letters to friends are emailed — `Resend` flow stays.
- Not addressing the constellation/firelight letter views — those live elsewhere (`/memory`) and are independent.

## The two-surface model

```
nav: [letters · sent]

┌── letters (default tab) ─────────────────────────────────────┐
│  top hint: "click the postbox to reveal your letters"       │
│  + badge: "2 new" (if unread letters exist)                 │
│                                                             │
│  ┌──── LEFT ────┐         ┌─── RIGHT ───┐                   │
│  │  Write Card  │   ✦     │  Lamp       │                   │
│  │              │  lamp   │             │                   │
│  │  start a     │         │  Postbox    │                   │
│  │  letter      │         │  ↓ slot ↓   │                   │
│  │              │         │  [letters]  │                   │
│  │  [begin →]   │         │  ◁ 2026 ▷   │                   │
│  │              │         │  ◁ MAY  ▷   │                   │
│  └──────────────┘         └─────────────┘                   │
│                                                             │
│              hills + village silhouette                     │
│                                                             │
│         caption: "may · 2026 · 2 new ✦ unread"              │
└─────────────────────────────────────────────────────────────┘

┌── sent ──────────────────────────────────────────────────────┐
│  letters i've sent · 27 sealed · 9 delivered                │
│                                                             │
│  [ 2026 · 8 ] [ 2025 · 5 ] [ 2024 · 3 ]    ← year tabs      │
│                                                             │
│  ┌──── stamp album page ────────────────────────────────┐   │
│  │  [stamp][stamp][stamp][stamp][stamp][stamp][stamp]   │   │
│  │  [stamp][stamp][stamp][stamp][stamp][stamp]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  click stamp → receipt modal (no content shown)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Surface 1: `letters` (combined write + inbox)

### Layout

A single horizontal scene with two zones:

- **Left zone** — width `~360px`, the *Write Card*: icon row, "start a letter" heading, paragraph, primary CTA `begin a letter →`, secondary text *"or pick a recipient: future me · someone close"*. **Identical text/structure to the current write surface** (`LetterWriteView`'s entry-point card has been kept verbatim; only the layout changes).
- **Right zone** — `flex: 1`, gets remaining space, contains the postbox group.

### Background ambience (right-zone-friendly, theme-tinted)

- Sky: `theme.bg.gradient` (linear, dawn→horizon)
- Soft sun glow at top-left, theme-tinted via `theme.accent.highlight + theme.accent.warm`
- Distant rolling hills silhouette (CSS mask) in `--shelf` color (deeper theme accent), 30% opacity
- Small village rooftops on the hills, with tiny window-glow dots in `theme.accent.warm`
- Drifting particles matching `theme.particles` (sakura / leaves / foam) — 12 of them, looping

### The postbox

Indian pillar postbox style (red rust → adapted to theme). Top-to-bottom anatomy:

| Element | Notes |
|---|---|
| Domed cap | Rounded top, horizontal gradient for cylindrical depth |
| Brim | Black flat ring, slightly wider than body |
| Cylindrical body | Horizontal gradient (dark→light→dark across the X axis) |
| Slot hood | Arched dark plate with *"letters"* in Caveat italic |
| Slot | Narrow black opening |
| Pin code | *"HEARTH · 1"* — small Cormorant caps with wide letter-spacing |
| Mid black band | Horizontal divider |
| Hearth swoosh + label | Inline SVG wave (theme-warm) + *"hearth post"* caption |
| Year placard | `[ ◁ 2026 ▷ ]` — engraved dark inset, cream text, arrows on each side |
| Month placard | `[ ◁ MAY ▷ ]` — same style, beneath year |
| Black base ring | Wide bottom band |

The two placards are **the entire month/year picker** — no dropdown, no popup. Clicking an arrow flips the value with a quick vertical card-flip animation (`transform: translateY` keyframe). Arrows disable at boundaries (year ≤ first letter year; month > current real month in current year).

### The lamp

Ported verbatim from `src/components/constellation/garden/LeftLamp.tsx`:

- Same SVG path data (lamppost + crossbar + glass + bulb)
- Same dual halo layers (`halo-1`, `halo-2`) with same animation timings
- Glass + bulb gradients fed by `theme.accent.highlight` / `theme.accent.warm`
- **Stretch the lamp height to ~580px** (up from 460 in current LeftLamp) so it stands taller than the postbox, like a real Victorian gas lamp next to a pillar box

The lamp is purely decorative; it provides warmth and frames the right zone.

### The fanout (letters emerging)

When the user picks a month, letters emerge from the slot:

- Each letter is a 130×86 cream rectangle with rounded corners, paper shadow
- Inside: addressee (Caveat) + sub-line (Cormorant italic, e.g. *"arrived May 1"*) + small wax seal centered + tiny *"arrived"* label bottom-right
- They start hidden inside the slot (translated, scaled to 0.4) and fan out:
  - Each letter offset by `(i - (n-1)/2) * 80px` horizontally
  - Rotated `offset * 14° + tilt`
  - Slight vertical lift based on distance from center
  - Cascade delay: 180ms between letters (read), 280ms (unread)
  - Duration: 0.9s read, 1.4s unread
  - Easing: `cubic-bezier(.25, .7, .4, 1)`

### Unread state

A letter is **unread** if its `unlockDate` has passed but the user has never opened it (see `letterReadAt` field in *Data model* below).

Visual indicators:

- **Top hint badge**: `2 new` orange pill next to the hint text, with a soft pulse animation. Hides when there are no unreads.
- **Dangling tag from postbox slot**: small orange `2 new ✦` paper tag swaying gently. Only present when the *currently-displayed month* has unreads.
- **Caption beneath postbox**: changes from *"X letters arrived"* → *"X new letters ✦ unread"* (or *"N new · M read"* mixed)
- **In the fanout**: unread letters get an orange ring outline (`box-shadow: 0 0 0 2px accent-primary, 0 0 24px accent-highlight`), a slight brightness pulse, and a pulsing wax seal. Their address line shows *"✦ unread · …"* prefix and the bottom label says *"sealed"* instead of *"arrived"*.

### The first-time reveal ceremony

Triggered when the user clicks an **unread** letter in the fanout. **One-time per letter.**

#### Sequence

1. **Overlay fades in** — full-screen radial dusk gradient + backdrop blur (~14px). Blocks interaction with everything else.
2. **Sealed envelope appears centered** — 320×220, cream paper, with:
   - Pointed front flap (clip-path triangle) covering top half
   - A red wax seal in the center (radial gradient, ✦ glyph)
   - Soft warm halo pulsing around the envelope (`haloPulse 4s ease-in-out infinite`)
3. **Caption above** (fades in 300ms after open): *"a letter from past you · sealed [date]"* — using the `sealedDate` from when this letter was created. For letters TO someone else, the caption can read *"a letter you sent · sealed [date]"* — content unchanged.
4. **Prompt below**: *"tap to break the seal"* (gentle bob animation)
5. **User clicks the envelope**:
   - **t=0**: wax seal splits — the two halves rotate apart (`translateX ± rotate ±30°`) and fade out (1s ease)
   - **t=0**: 8 wax-particle burst, each flying radially `40-70px` (0.9s ease-out, fade)
   - **t=700ms**: envelope flap rotates open (`rotateX(-178deg)`, 1s cubic-bezier)
   - **t=1500ms**: the letter slides up out of the envelope and scales 2.2× (`translateY(-220px) scale(2.2)`, 1.1s cubic-bezier)
   - **t=1500ms**: letter content fades in — salutation (Caveat 15px), body (Caveat 11px lined), signature (right-aligned)
6. **User reads, presses ✕ or Escape**: overlay fades out. The letter is marked **read** server-side via `POST /api/letters/[id]/read`. The fanout glow on this letter fades, badges decrement.

#### Re-reads (already-read letters)

Click any read letter → same modal opens, but the seal is already broken, flap already opened, content visible immediately. **No ceremony.** Same close interaction.

The re-read modal does *not* re-mark the letter or fire the API.

---

## Surface 2: `sent` (stamp album)

### Layout (single viewport, no scroll)

```
[ header: "letters i've sent" + summary line ]
[ year tabs: 2026 · 8  |  2025 · 5  |  2024 · 3 ]
[ album page — fills remaining viewport height ]
  └─ stamp grid (auto-fill, minmax 108px)
```

The album is `flex: 1; overflow: hidden;` — stamps for the active year render in a single grid that fits in the viewport. The grid uses `auto-fill` with `minmax(108px, 1fr)` so density adapts to viewport width.

### The stamp

Each sent letter renders as a **postage stamp** mounted with paper corner-mounts:

- 100×130px, perforated edges (CSS mask with radial-gradient cutouts at `12px 100%` / `100% 12px`)
- Inside: 1.5px serif border frame, denomination (e.g. `1y`, `8m`, `∞` for "someday"), a unicode glyph (`✦ ✿ ❀ ☽ ☼ ✻ ♡` — varies per letter), `hearth · evening post` caption, and a date in Caveat
- Tilt: random `-3°` to `+3°` for hand-mounted feel
- Tint: cycles through `s-1` (paper-1), `s-2` (paper-2), `s-3` (accent-highlight blend), `s-4` (accent-warm blend)

### Two states

- **In transit** (still sealed): clean stamp
- **Delivered/arrived**: postmark cancellation lines (two diagonal stripes across the stamp) + a small circular `DELIVERED` text mark in the bottom-right corner

This visual difference is enough — no separate sections, no labels needed.

### The receipt modal

Click any stamp → receipt modal:

- Cream paper with dashed border, *"— receipt —"* heading
- Title (large Caveat): *"to amma"*
- Field rows: `sealed Apr 22 · 2026`, `opens someday`, etc.
- Status line: *"✦ still sealed"* or *"✓ delivered"*
- A discreet *"peek at this letter · breaks the seal"* link at the bottom (subtle, dotted underline). On click: native `confirm()` warning, then if confirmed, an alert showing the content. **In implementation: this should mark the letter as `peekedAt` server-side and remove it from the unread-on-arrival pool — the user has already seen it, so no ceremony when it arrives.**

The receipt **never shows letter body content** by default. The peek affordance is intentional friction.

---

## Compose flow (still envelope-flip)

The `begin a letter →` CTA on the Write Card opens the existing compose flow as a **full-screen modal**, not a separate page:

- **Step 1 — Address envelope**: front of envelope, recipient toggle (`future me` / `someone close`), recipient name input, large stamp-shaped placeholder reading *"hearth · sealed today"*, unlock-when pills (`1 month` / `6 months` / `1 year` / `someday`)
- **Step 2 — Turn over**: `turn over →` button triggers a 3D `rotateY(180deg)` flip of the modal
- **Step 3 — Write inside**: lined paper, Caveat editor (TipTap, current implementation), salutation auto-filled, signature footer
- **Step 4 — Fold & seal**: button triggers fold animation (top third + bottom third flip inward) + wax seal drops with a spring → modal closes → the new sent stamp lands in the stamp album with a subtle scale-in animation

This flow is **mostly the existing `LetterPaper.tsx` + `RecipientSidebar.tsx`**, refactored to fit the modal pattern. The existing `useAutosaveEntry` hook drives the autosave, and `/api/entries/[id]/seal` finalizes the letter.

---

## Data model

### Required new field on `JournalEntry`

```prisma
model JournalEntry {
  // ... existing fields
  letterReadAt   DateTime?  // null = unread (or n/a for non-letters); set on first reveal
  letterPeekedAt DateTime?  // null = never peeked; set if user broke seal early via "peek" affordance
}
```

Both nullable, both default null. **Additive only** — no destructive migration. Existing letters get `letterReadAt = null`, but they are also pre-`isDelivered = true` (they've been around), so we'll need a one-time backfill: any letter with `isDelivered = true && letterReadAt IS NULL` should be assumed read (set `letterReadAt = isDelivered timestamp` or `now()`). This is done in the migration so existing users don't see all their old letters as "new."

### API additions

- `POST /api/letters/[id]/read` — sets `letterReadAt = now()`. Idempotent (no-op if already set). Returns `{ ok: true }`.
- `POST /api/letters/[id]/peek` — sets `letterPeekedAt = now()`. Returns letter content (decrypted) for one-time view. (Could reuse the existing single-entry GET if it returns body.)
- Existing `GET /api/letters/mine` extended (or split into two):
  - `GET /api/letters/inbox` — letters where `unlockDate <= now()` and `userId = currentUser` (delivered to self) and either self-letter or sealed-letter to-self. Group by month for the month picker.
  - `GET /api/letters/sent` — letters the user *sent* (sealed, regardless of recipient). Group by year for tabs.

In practice, the same `JournalEntry`s appear in both lists (your sent letter to yourself shows in both your sent album as a stamp, and once it unlocks, in your inbox as a letter). The two queries differ only in shape and grouping.

### What encryption changes — none

`text`, `textPreview`, `recipientEmail`, `recipientName` continue to be encrypted on save / decrypted on retrieve via `lib/encryption.ts`. The reveal modal decrypts on the client only after the user opens it (existing pattern in `LetterReveal.tsx`).

---

## Component architecture

```
src/app/letters/page.tsx                    // tabs orchestrator (was: surface state machine)

src/components/letters/
├── LettersNav.tsx                          // [letters · sent] tab pills
│
├── inbox/
│   ├── InboxView.tsx                       // root: layout + scene + state
│   ├── PostalSky.tsx                       // sun, hills, village, particles
│   ├── Lamp.tsx                            // imports + reuses existing LeftLamp SVG
│   ├── Postbox.tsx                         // dome, brim, body, hood, slot, pincode, bands, swoosh, base
│   │   └── PostboxControls.tsx             // year + month placards (could inline)
│   ├── LetterFanout.tsx                    // letters that emerge from the slot
│   ├── WriteCard.tsx                       // left-side begin-a-letter card
│   ├── TopHint.tsx                         // persistent hint banner with new-count badge
│   ├── NewLetterTag.tsx                    // dangling "N new ✦" tag from the postbox slot
│   └── RevealModal.tsx                     // first-time reveal ceremony
│
├── sent/
│   ├── SentView.tsx                        // root
│   ├── YearTabs.tsx                        // year-tab pills
│   ├── StampGrid.tsx                       // single-viewport grid of stamps
│   ├── Stamp.tsx                           // individual stamp + corner mounts
│   └── ReceiptModal.tsx                    // receipt + peek affordance
│
└── compose/
    ├── ComposeModal.tsx                    // full-screen modal, controls flip + steps
    ├── EnvelopeFront.tsx                   // address step (replaces RecipientSidebar)
    └── LetterInside.tsx                    // writing step (existing LetterPaper, refactored)
```

### Files to delete

- `src/components/letters/SealedLetterList.tsx`
- `src/components/letters/SealedLetterTile.tsx`
- `src/components/letters/LetterWriteView.tsx`
- `src/components/letters/RecipientSidebar.tsx`

### Files to keep / refactor

- `src/components/letters/LetterPaper.tsx` → folded into `compose/LetterInside.tsx`. Mostly the same content, repositioned inside the modal.
- `src/components/letters/letterTypes.ts` — keep, possibly extend
- `src/components/LetterReveal.tsx` (existing top-level component) → can be removed or repurposed; `RevealModal.tsx` replaces it.
- `src/components/LetterArrivedBanner.tsx` — superseded by the top-hint badge on the inbox view. Delete.

### Files unchanged

- `src/lib/themes.ts` — themes already have everything we need
- `src/lib/encryption.ts`
- `src/lib/email.ts`
- `src/app/api/cron/deliver-letters/*` — daily delivery still handles sealed → delivered transition
- `src/components/constellation/garden/LeftLamp.tsx` — read-only reference (the inbox lamp imports its SVG)

---

## Theming

The whole experience derives from CSS variables fed by `useThemeStore`:

```css
--bg-gradient        // theme.bg.gradient
--text-primary       // theme.text.primary
--accent-primary     // theme.accent.primary
--accent-warm        // theme.accent.warm
--accent-highlight   // theme.accent.highlight
--paper-1, --paper-2 // derived from theme.bg
--postbox-1/2/3      // derived from theme.accent (light → mid → deep)
--shelf              // theme.cover (dark accent for hills, etc.)
```

Three themes have all been verified to render correctly in the demo: **rose** (warm pink, romantic), **sage** (matcha, quiet), **ocean** (cool harbour, contemplative). Dark themes (Hearth, Rivendell Sunset) will look different — they should adapt naturally because we use the theme tokens, but **explicit verification needed during implementation**.

The reveal modal uses a fixed warm-dusk overlay regardless of theme — the ceremony is meant to feel separate, intimate.

---

## Migration plan

1. Schema: additive `letterReadAt` and `letterPeekedAt` columns. Default null.
2. **One-time backfill** in the migration: `UPDATE journal_entries SET letterReadAt = NOW() WHERE entryType IN ('letter', 'unsent_letter') AND isDelivered = TRUE AND letterReadAt IS NULL;` — so existing already-delivered letters don't suddenly look unread.
3. Ship new components alongside the old ones for one cycle. Behind a `LETTERS_V2` flag if desired, or hard-cut at deploy if we're confident.
4. Cron-delivered letters: when delivering, leave `letterReadAt = null` so the user sees them as new.
5. Once verified in production, delete the old components.

---

## Open questions / explicit decisions

| Question | Decision |
|---|---|
| Wrap-around on year/month placards (Dec ▷ → Jan of next year)? | **No** — boundary stop. Year/month each have their own arrows; users navigate explicitly. |
| Keep the `hearth post` plate at bottom of postbox? | **Removed** — replaced by year/month placards + bottom black base. Simpler stack. |
| Does the inbox view follow the user's globally-chosen theme? | **Yes** — it adapts. The reveal modal is theme-agnostic (always warm dusk). |
| Should the empty-month state show anything in the fanout? | **Yes** — no fanout, but the caption reads *"the box was empty"*. Postbox doesn't pulse. |
| What about non-current real months in current real year (e.g. user clicks "Jul" while we're in May)? | **Future months are dimmed and unclickable.** Cannot navigate to a month that hasn't happened yet. |
| Do we keep the `LetterArrivedBanner` notification on app load? | **No** — replaced by the persistent badge on the letters tab. The badge appears in the nav even when on other surfaces (a tiny dot/count on the `letters` tab — implementation detail). |

---

## What we're explicitly *not* changing

- The cron-based delivery system at `/api/cron/deliver-letters/*`
- The encryption format and pattern
- The Lemon Squeezy / payments flow
- The journal entry editing rules (time-locked autosave) — letters are still entries with `entryType` discriminating them
- The themes themselves (`themes.ts`)
- The constellation views (`/memory`, `/firelight`, `/garden`) — those have their own letter visualizations and are independent of `/letters`

---

## Reference

The full interactive demo lives at `/tmp/hearth-letters-demo.html` — a single self-contained HTML file with theme switcher (rose / sage / ocean) and all interactions wired up: postbox controls, fanout, reveal ceremony, year tabs, receipt modal, peek affordance.

When implementing, the demo serves as the visual contract.
