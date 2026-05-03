# A Small Light — Send a kindness to a stranger

**Date:** 2026-05-03
**Name:** "A Small Light." Working metaphor: hearth → fire → light. The act is sending a small light — a gratitude, a wish, a kindness — to a stranger you'll never meet.
**Scope:** A new feature on the Letters page where any user can, once per day, write a short paper note (10–200 chars) and send it anonymously to a random other user on the app. The compose UI **softly frames** the prompt around warmth (placeholder text invites a gratitude, a wish, a small kindness — see UX section), but does not technically restrict content. The recipient sees it in a second mailbox, can reply once with a 20-word note, burn it, or do nothing. Everything ephemeral: notes auto-delete 24h after delivery, replies auto-delete 24h after they're written. No identity is ever exposed in either direction. Only two integer counters per user persist.
**Surface:** Letters page (new mailbox UI next to the existing postbox). New Prisma models (`StrangerNote`, `StrangerReply`). New API routes under `/api/stranger-notes/`. New cron route `/api/cron/expire-stranger-notes`. Two integer fields added to `User`.
**Out of scope (v1):** Moderation pipeline (separate spec, **launch blocker** — see below). Push notifications. Block lists. Multiple back-and-forth (strictly one-shot). Localization. Premium gating (this feature is free for everyone).

---

## Problem & positioning

Hearth needs a feature that gives Gen Z and millennial users a reason to open the app *and* a reason to tell a friend about it. The journaling market is crowded; pure private journaling is a hard sell. But "send a small kindness to a stranger and maybe get a 20-word warmth back" is:

- **Emotionally novel** — no major journaling app does this. Sarahah/NGL did adjacent things but as social addons, not standalone gentle exchanges.
- **Aligned with Hearth's positioning** — gentle, on-brand for the app's warm/poetic tone. Strangers can carry small lights friends never see.
- **Inherently shareable** — the moment you receive a stranger's kindness (or a warmth back from yours) is screenshot-bait in a wholesome way.
- **Free** — used as an acquisition / engagement loop, not a paywall.
- **Soft-moderating by framing.** The compose UI invites *kindness, gratitude, a wish, a small joy* — not "say anything to a stranger." This self-selects the audience and content. People who'd write something cruel don't open an app called "send a small light." Combined with the once-per-day cap, this is meaningful (but not sufficient) content protection on its own.

This spec covers v1: the mechanic, the data, the UX. It explicitly defers a real moderation pipeline (AI check, report flow, blocklist) to a follow-up spec, which **must ship before the feature is exposed in marketing or shown to users outside a controlled friend-test alpha**.

## Goals

1. **Anonymity is absolute.** Sender and recipient can never identify each other through the product. No timestamps shown to recipient that would narrow a sender pool. No "user X also sent" leakage.
2. **Ephemerality is enforced server-side.** Note content is hard-deleted from the database when its lifecycle ends. After deletion the only trace is two integer counters on each user's row.
3. **One-per-day on send, one-shot on reply.** Strict rate limit prevents spam loops and preserves the "small ritual" feeling.
4. **Visually consistent with existing aesthetic.** Reuse the paper component from the memory page. Match dusty / playfair tone the rest of the app uses.
5. **Deferred moderation is explicitly tracked.** A "BLOCKER before public launch" section in the spec, plus a TODO in code where moderation hooks would attach.

## Non-goals

- **Moderation in v1.** No AI content check, no profanity filter, no report button, no blocklist. **Feature must not go to public launch in this state.** Internal alpha / friend-test only until moderation ships.
- **Push notifications.** When a note is delivered or a reply arrives, the user only finds out by visiting the Letters page (where the new mailbox glows). Push integration arrives later, leveraging the existing `PushSubscription` model.
- **Multiple replies / threads.** Strictly one outgoing note → at most one reply back. Period. No way to reply to the reply.
- **Choosing who to send to.** Always uniformly random across eligible users. No filters, no preferences.
- **Premium tier.** Free for everyone, including free-tier users. This feature is engagement, not monetization.
- **Cross-language matching.** v1 assumes all notes are in English (or whatever the sender writes). No language detection.
- **Sender keeps a copy.** Once sent, the sender never re-reads their own note. Only the `strangerNotesSent` counter increments.

---

## User experience

### Sender flow

1. User visits **Letters page**. Sees the existing postbox (their letter-to-self / letter-to-friend mailbox) and a **new second mailbox** beside it (working visual: a small lantern, an unmarked wooden mailbox, or a tin can on a string — final visual chosen during implementation, must match Hearth's dusty / playfair aesthetic).
2. The second mailbox shows a small label, "Send a small light."
3. **If user has already sent today**: the mailbox is dimmed, label reads "Your light is on its way. Come back tomorrow." Tap is a no-op (or opens a small read-only "your light is out there" message).
4. **If user has not sent today**: tap opens a paper (same component as memory-page paper). Cursor placed in writing area. **Placeholder copy softly invites warmth**, e.g., *"a gratitude, a wish, a kindness — anything gentle you'd send to a stranger."* Char counter shown subtly (max 200, min 10). Send button at bottom appears once min length met.
5. User writes, hits **Send**.
6. Animation: paper folds / fades / drifts off-screen.
7. Confirmation: "Sent. A small light, on its way." (final copy in implementation pass).
8. Mailbox returns to dimmed state.

### Recipient flow

1. User visits Letters page. The second mailbox **glows** (small accent-color halo, or pulse, or single dot — design pass) if there is any unread item: a delivered stranger note or a reply to a note they sent.
2. Tap mailbox → opens. If both a delivered note and a reply are present, two zones are shown stacked: "For you" (received) and "Echo" (reply to your sent note). If only one type, only that zone shows.
3. Tap a received note → paper opens (read mode). The note text fills the paper. Below the paper, three actions:
   - **Reply** — opens a small 20-word input. Placeholder: *"send a warmth back — 20 words"*. Counter shown; max enforced both client- and server-side.
   - **Burn** — confirms once ("Let this go? It cannot be recovered."), then deletes immediately.
   - **Close** — closes the paper. Note remains until its 24h timer expires.
4. Time remaining shown subtly on the paper, e.g., "fades away in 18 hours" — gives the moment weight without nagging.
5. **After replying**: paper stays viewable (read-only) for the rest of the 24h, with a "warmth sent" indicator. Reply button replaced with greyed "You replied: [their full text]" — recipient can't reply twice.

### Sender's reply receipt flow

1. When a recipient replies, the sender's mailbox glows on next visit.
2. Tap → "Echo" zone shows the 20-word reply on a smaller paper / card.
3. Two actions: **Burn** (delete now) or **Close** (auto-deletes 24h after the reply was written).
4. No way to respond back. Hard rule, communicated by the absence of a reply input — not by a disabled-state button (we don't want to suggest the option exists).

### Edge cases shown to the user

- **No eligible recipient yet** (early days, low user count): note shows status "still finding its way…" in the dimmed mailbox state. Sender can't see why; system retries match on cron.
- **Sender deletes account before reply delivered**: reply is silently dropped (orphan; cleaned by cron).
- **Recipient deletes account while note is in their mailbox**: note dies with their account (Prisma cascade).

---

## Visual & placement

- **Letters page** is the home. Existing postbox stays untouched.
- **Second mailbox** sits next to existing postbox. Visually distinct enough to read as "external mail" not "your mail" — final visual to be picked in implementation, but constraint: must match the existing dusty / paper / playfair aesthetic. Per project memory: minimal, single option, no multi-variant buffet.
- **Paper component** for both compose and read views: reuse the existing memory-page paper. If it's not already extracted as a shared component, this spec includes that extraction as part of the work.
- **Reply input**: smaller paper / card, 20-word counter, single send button.
- **Animations**: fold + drift on send; gentle fade on burn; subtle glow on mailbox when unread item present. Use Framer Motion (already in stack).

## Counters

Two integer fields added to the `User` model:

- `strangerNotesSent: Int @default(0)` — incremented when the user successfully sends.
- `strangerNotesReceived: Int @default(0)` — incremented when a note is delivered to the user (matched, not at read time).

Optionally surface these on the Letters page near the new mailbox as poetic copy ("You've sent 12 small lights. 7 have come back as quiet visitors."). Display copy is a separate small task; the counters themselves are part of v1.

A third field on `User` is added for daily rate limiting:

- `lastStrangerNoteSentAt: DateTime?` — set on every successful send. Used to enforce "one per day" without depending on note rows (which get hard-deleted).

"One per day" is defined as **one per calendar day in the user's local timezone**, using the existing `X-User-TZ` header pattern Hearth already uses for entry-lock comparisons.

---

## Data model

```prisma
model StrangerNote {
  id          String   @id @default(cuid())

  senderId    String
  sender      User     @relation("SentStrangerNotes", fields: [senderId], references: [id], onDelete: Cascade)

  recipientId String?
  recipient   User?    @relation("ReceivedStrangerNotes", fields: [recipientId], references: [id], onDelete: Cascade)

  // AES-256-GCM encrypted (iv:authTag:encryptedData hex), per existing lib/encryption.ts
  content     String   @db.Text

  status      String   @default("queued")
  // queued    — created, not yet matched
  // delivered — matched to a recipient; 24h timer running from matchedAt
  // replied   — recipient replied; note still visible until matchedAt + 24h
  // (after matchedAt + 24h or burn → row hard-deleted)

  createdAt   DateTime @default(now())
  matchedAt   DateTime?  // set when assigned to a recipient (timer reference)
  readAt      DateTime?  // first time recipient opened it (analytics only)

  reply       StrangerReply?

  @@index([recipientId, status])
  @@index([status, matchedAt])  // cron sweeps + queued retries
}

model StrangerReply {
  id          String   @id @default(cuid())

  noteId      String       @unique
  note        StrangerNote @relation(fields: [noteId], references: [id], onDelete: Cascade)

  // AES-256-GCM encrypted; max 20 words enforced before encryption
  content     String   @db.Text

  createdAt   DateTime @default(now())
  readAt      DateTime?  // first time sender opened the reply (analytics)

  @@index([createdAt])  // cron cleanup
}

model User {
  // existing fields...
  strangerNotesSent       Int       @default(0)
  strangerNotesReceived   Int       @default(0)
  lastStrangerNoteSentAt  DateTime?
}
```

**Migration discipline:** all three additions to `User` are new optional/default-bearing columns — no data loss risk. New models are additive. Per CLAUDE.md guidance, never create migrations that delete data.

**Encryption:** use the existing `lib/encryption.ts` helper. Same `iv:authTag:encryptedData` hex format used elsewhere in the app. Encrypt on write, decrypt on read. Server holds plaintext only momentarily for delivery/display.

---

## API endpoints

All routes use `getCurrentUser()` from `@/lib/auth`.

### `POST /api/stranger-notes`
Send a new note.

**Body:** `{ content: string }`
**Validation:** content trimmed length is **between 10 and 200 chars**. User's `lastStrangerNoteSentAt` is null OR is on a different calendar day in the requesting `X-User-TZ`. If rate-limited: `429`.
**Behavior:**
1. Encrypt content.
2. Create `StrangerNote` row with `status="queued"`, `senderId` set.
3. Attempt immediate match (see Matching algorithm). If a recipient is found, transition to `delivered`, set `matchedAt`, increment recipient's `strangerNotesReceived`.
4. Increment sender's `strangerNotesSent` and set `lastStrangerNoteSentAt = now()`.
5. Return 201 with minimal payload (`{ id, status }`).

**TODO before launch:** moderation hook here, BEFORE encrypt+store. If moderation rejects, return 400 with a soft message ("Try gentler words?"). No counter increment, no row created.

### `GET /api/stranger-notes/inbox`
Returns the recipient's current mailbox state.

**Response:**
```
{
  receivedNotes: [
    { id, content, matchedAt, expiresAt, myReply?: string }   // myReply is the text I (recipient) sent back, if I have replied
  ],
  receivedReplies: [
    { id, content, createdAt, expiresAt }   // replies to notes I sent
  ],
  canSendToday: boolean,
  counters: { sent: number, received: number }
}
```

Decrypts content server-side. `expiresAt` computed from `matchedAt + 24h` or `createdAt + 24h`.

Marks `readAt` for any newly-opened notes/replies (separate `POST .../read` is cleaner — see below — but inbox can also lazy-mark on first fetch; pick one pattern in implementation).

### `POST /api/stranger-notes/[id]/read`
Marks a received note's `readAt = now()` if not already set. Idempotent. Used for analytics only — read does not affect lifecycle.

### `POST /api/stranger-notes/[id]/reply`
Reply to a received note.

**Body:** `{ content: string }`
**Validation:** caller is the recipient of `[id]`. Note has no existing reply. Content word-count ≤ 20. Note status is `delivered` (not expired).
**Behavior:**
1. Encrypt reply content.
2. Create `StrangerReply` row linked to note.
3. Update note status → `replied`.
4. Return 201.

**TODO before launch:** moderation hook on reply content too.

### `POST /api/stranger-notes/[id]/burn`
Burn a received note immediately.

**Validation:** caller is the recipient of `[id]`.
**Behavior:** hard-delete the `StrangerNote` row (cascade deletes any reply). Return 204.

### `POST /api/stranger-notes/replies/[id]/burn`
Burn a received reply immediately.

**Validation:** caller is the sender of the parent note (i.e., `note.senderId == currentUser.id`).
**Behavior:** hard-delete the `StrangerReply` row. Return 204.

---

## Matching algorithm

Runs at two times: synchronously on send (to deliver immediately when possible), and from the cron job (to retry queued notes).

**Eligibility predicate** for a candidate recipient `u`, given a note from sender `s`:

- `u.id != s.id` (no self-delivery)
- `u.deletedAt is null` (alive account)
- (v1 stops here. Future: weight by recently active, exclude users with too many recent stranger notes already sitting unread, exclude same recipient as last note from this sender, etc.)

**Selection:** `ORDER BY RANDOM() LIMIT 1` from the eligible set. PostgreSQL `RANDOM()` is fine at our scale; revisit if user count crosses 100k.

**No eligible recipient:** leave note as `queued`. Cron retries. Sender sees "still finding its way" state.

**Race condition:** two simultaneous sends could pick the same recipient. That's fine — both notes get delivered to that user. No locking needed for v1.

---

## Lifecycle & cleanup (cron)

New cron route: `POST /api/cron/expire-stranger-notes`

Authenticated via existing `CRON_SECRET` (mirroring `/api/cron/deliver-letters`).

**Per run:**

1. **Hard-delete expired delivered notes**: `DELETE FROM StrangerNote WHERE status IN ('delivered', 'replied') AND matchedAt < NOW() - INTERVAL '24 hours'`. Cascades to any attached reply.
2. **Hard-delete expired replies (independent)**: `DELETE FROM StrangerReply WHERE createdAt < NOW() - INTERVAL '24 hours'`. (A reply might outlive its parent note if the note was burned, hence independent cleanup.)
3. **Retry queued notes**: for each `StrangerNote WHERE status = 'queued'` (cap batch at 100), run the match logic. Successful match transitions row to `delivered`.

**Cadence:** every 15 minutes is sufficient. Existing letter-cron pattern can serve as scaffold.

**Stuck queued notes** (e.g., genuinely zero eligible recipients for many days): no special handling in v1. They sit. Acceptable for a small new app. Add a "max queue age" cleanup later if needed.

---

## Privacy & anonymity guarantees

- The recipient is set on the row, but no API ever returns the sender's identity to the recipient (or vice versa).
- Server-side: assumed trusted. Operators can theoretically read note content while it lives (24h window). This is acceptable for v1; a future hardening pass could move encryption keys client-side, but that conflicts with server-side moderation needs anyway.
- No timestamps that could de-anonymize: recipient sees `matchedAt` (when *they* received it), never `createdAt` (which could narrow the sender pool when user count is small).
- Counter increments are atomic on the User row, no per-pair tracking.

---

## Out of scope (v1) — explicit list

- **Moderation pipeline** (separate spec; **launch blocker**).
- **Push notifications** for delivery / reply arrival.
- **Block lists / report flow** (depends on moderation spec).
- **Editing a sent note** — once sent, it's sent.
- **Letter-style themes** for stranger notes — single paper visual only.
- **Premium-only enhancements** (e.g., "send to two strangers") — feature stays free.
- **Multi-language detection / matching by language**.
- **Profile-page settings** for opting out of receiving (if you don't want strangers' notes, that becomes important post-launch — defer to moderation spec).
- **Analytics dashboard** of stranger-note volume.

## Open questions / launch blockers

### BLOCKER: Moderation before public launch

A separate spec must define and ship before this feature is exposed beyond a controlled internal alpha. Minimum required contents:

1. **Pre-send content check** on note + reply (OpenAI moderation API or Anthropic equivalent — both free for moderation).
2. **Regex strip / reject** on URLs, `@handles`, phone-number patterns.
3. **Report button** in the UI (received note + received reply). On report: hide that item from the recipient immediately; record the report against the (anonymous) sender.
4. **Per-user receive opt-out** in profile ("don't send me notes from strangers") — small toggle. Defaults on for new accounts.
5. **Repeat-offender handling**: shadow-suspend senders past a report threshold; their future notes are accepted (no error shown to them) but never delivered.

This launch-blocker section is the gate — implementation can begin in parallel but **the feature flag stays off in production until moderation is shipped and tested.**

### Other open questions

1. **Visual treatment of the second mailbox.** Lantern vs. small wooden mailbox vs. tin can vs. something else. One option, picked during implementation, matching existing aesthetic. Per project memory: no multi-variant buffet.
2. **Where to display counters.** Near the new mailbox is the assumption; exact copy and placement is a small design pass. Suggested copy direction: *"You've sent 12 small lights. 7 have come back as quiet visitors."*
3. **Cron cadence.** 15 min is suggested; could be 5 min or 30 min depending on perceived "freshness" we want for queued matching.
4. **Final UI copy** — placeholder text on the compose paper, confirmation strings, mailbox labels. Drafts are inline above; final pass during implementation.
