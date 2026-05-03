# Gentle Reminders — Nightly Push + Comeback Moment

**Date:** 2026-05-03
**Scope:** Two complementary engagement features. (1) An opt-in nightly browser push notification reminding users gently to journal. (2) An in-app "comeback moment" that greets users warmly when they return after an absence.
**Surface:** New service worker, opt-in card after first entry, profile-page reminder controls, new cron route, new Prisma model, new in-app comeback components.
**Out of scope:** Email reminder cascade (3/7/20/30 days). iOS Safari support without PWA install. Notification action buttons. Localization beyond English.

## Problem

Hearth is a journaling app whose value compounds with consistency, but it has no mechanism to bring a user back. A user who writes a beautiful first entry and then forgets the app exists for two weeks is the failure mode the product is most exposed to. Other journaling apps solve this with streak counters, push notifications, and re-engagement emails — most of which feel hostile and contradict Hearth's tone.

Two gentle interventions can address this without becoming spam:

1. **A nightly push reminder** the user explicitly opted in to, with poetic copy, randomized timing, and silent auto-pause when ignored.
2. **An in-app comeback moment** that turns the act of returning into something warm — particularly meaningful for users coming back after a long absence, where most apps would shame them with a broken streak.

Both features share the same underlying signal (`JournalEntry.createdAt` per user), so neither requires new tracking infrastructure.

## Goals

1. **Opt-in is gentle and reversible.** No native browser permission prompt is fired without an in-app soft confirmation first. "Not now" never burns the permission.
2. **Reminders feel like a friend remembering, not software firing.** Random time within an evening window, re-randomized daily. Poetic one-liner copy. Skipped automatically when the user already journaled today.
3. **Auto-pause silently.** After 7 consecutive ignored nights, stop firing. No "we paused your reminders" email. The user can re-enable in profile.
4. **Comeback moment matches emotional weight.** Three tiers (1–2 days, 3–7 days, 8+ days) with escalating presentation: ambient whisper → in-page card → full modal.
5. **Reuse existing infra.** Cron pattern (`/api/cron/deliver-letters`), `CRON_SECRET`, `X-User-TZ` header, existing Prisma + Resend (Resend not used here — listed for context). One new model, one new cron route.
6. **Web/desktop browsers day one.** Chrome, Firefox, Edge, Brave, Safari (macOS), Android Chrome. iOS Safari users see a fallback message in profile explaining PWA install.

## Non-goals

- **Email reminder cascade** (3/7/20/30 day inactivity emails). Acknowledged as a separate spec to brainstorm later.
- **iOS Safari without PWA.** iOS only supports web push for sites added to the home screen. We will not auto-prompt iOS users to install; we will show a one-line note in profile when web push is unsupported.
- **Notification action buttons.** No "write now / skip" buttons inside the OS notification. Tapping the body opens the app.
- **Theme- or time-aware copy variants.** A single flat pool of ~30 lines, randomly rotated. Theme-aware variants were considered and rejected for v1 to keep authoring scope tight.
- **Per-device opt-in UI.** If a user opts in on laptop and phone, both subscriptions are stored and both fire. No "manage devices" screen in v1.
- **Re-engagement email when reminders auto-pause.** Considered and rejected — sending email to a user who just demonstrated they're ignoring our nudges contradicts the gentle posture.
- **Streak counters, badges, or any gamification.**
- **Multi-language reminder copy.** English only.
- **E2EE-specific concerns.** Push payloads contain only generic poetic lines, never user content. Web Push protocol already encrypts payloads in transit.

## Architecture overview

```
┌─────────────────────────── BROWSER ───────────────────────────┐
│                                                                │
│  App load                                                      │
│    ├─ register /sw.js (service worker)                         │
│    ├─ check comeback gap → show whisper / card / modal         │
│    └─ if first-entry-just-saved & opt-in not yet shown:        │
│         show OptInCard                                         │
│                                                                │
│  OptInCard                                                     │
│    ├─ "Yes, gently" / "Surprise me" → Notification.request()   │
│    │     → if granted: PushManager.subscribe()                 │
│    │     → POST /api/push/subscribe                            │
│    └─ "Not now" → mark prompt shown, never burn permission     │
│                                                                │
│  Profile page                                                  │
│    ├─ toggle reminder on/off (re-prompt or unsubscribe)        │
│    ├─ time picker (default = "surprise me", or HH:MM)          │
│    └─ iOS-Safari fallback message when push unsupported        │
│                                                                │
│  /sw.js                                                        │
│    ├─ on 'push' → showNotification(title, body, data)          │
│    └─ on 'notificationclick' → openWindow('/?write=1')         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │  push delivery
                              ▼
┌──────────────────────── BROWSER PUSH SERVICE ──────────────────┐
│         (FCM / Mozilla autopush / Apple APNS bridge)           │
└────────────────────────────────────────────────────────────────┘
                              ▲
                              │  web-push library
                              │
┌─────────────────────────── SERVER ───────────────────────────┐
│                                                               │
│  /api/cron/send-reminders   (every 15 min, CRON_SECRET)       │
│    ├─ for each non-paused PushSubscription:                   │
│    │     compute target time for "today" in user's TZ         │
│    │       - if user has reminderTime override: use it        │
│    │       - else: hash(userId + dateStr) → slot in 7–10pm    │
│    │     if current 15-min window matches target:             │
│    │       skip if user already has entry today               │
│    │       else: pick random line, web-push.sendNotification  │
│    │       update lastFiredAt                                 │
│    └─ for each subscription with consecutiveIgnored ≥ 7:      │
│           set pausedAt = now()                                │
│                                                               │
│  /api/push/subscribe (POST)                                   │
│    upsert PushSubscription { userId, endpoint, keys, ... }    │
│                                                               │
│  /api/push/subscribe (DELETE)                                 │
│    delete by endpoint (user disabled in profile)              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Components

### Browser

#### Service worker (`public/sw.js`)
A single small file. Two event handlers:

- `push` — parse `event.data.json()` into `{ title, body }`, call `self.registration.showNotification(title, { body, icon: '/icon-192.png', badge: '/badge.png', tag: 'hearth-reminder' })`. The `tag` ensures only one Hearth notification is ever pending; a new one replaces the old.
- `notificationclick` — `event.notification.close()`, then `clients.openWindow('/?write=1')`. The `?write=1` query is read by the home page to skip directly into a fresh new-entry spread.

Registered once on app load via a hook in the root layout. Registration is idempotent.

#### `useReminders` hook (`src/hooks/useReminders.ts`)
Owns the client-side opt-in state machine.

- Reads `reminderOptInPromptShownAt` from `User.profile` to decide whether to surface the OptInCard.
- After the user's first entry is saved (autosave hook can emit a custom event or expose a callback), if the prompt hasn't been shown, renders OptInCard.
- Exposes `subscribe()`, `unsubscribe()`, `setReminderTime(time | null)` for the profile page.
- Handles browser permission edge cases (denied, default, granted) and exposes `pushSupported` boolean. iOS Safari (without PWA install) returns `pushSupported = false`.

#### `OptInCard` (`src/components/reminders/OptInCard.tsx`)
A small dismissible card, styled in the existing scrapbook aesthetic. Three buttons: `Yes, gently` / `Surprise me` / `Not now`. Both Yes options trigger the native permission prompt; "Not now" only marks the prompt as shown.

Copy: *"Want a gentle reminder in the evening? We can ping you sometime between 7 and 10pm — or pick a time that fits your day."*

#### Profile-page reminder controls (`src/components/profile/ReminderControls.tsx`)
- Master toggle (on / off / paused).
- Time mode: "surprise me" (default) or "specific time" with HH:MM picker.
- "Send a test reminder now" button (dev-friendly; works in prod too).
- iOS-Safari fallback: when `pushSupported === false` and UA matches iOS Safari, show: *"To get reminders on iPhone, install Hearth as a PWA: tap Share → Add to Home Screen."*

#### `useComeback` hook (`src/hooks/useComeback.ts`)
On app load:
- Compute `gap = max(0, todayLocal - lastEntryDayLocal)` in days.
- If `gap >= 1` AND `lastComebackShownAt < startOfTodayLocal`:
  - tier = `gap <= 2 ? 'whisper' : gap <= 7 ? 'card' : 'modal'`
  - render the appropriate component
  - PATCH `User.profile.lastComebackShownAt = now()`
- Computation uses the user's local TZ via existing `X-User-TZ` pattern, not server time.

#### `ComebackWhisper`, `ComebackCard`, `ComebackModal`
Three small components, one per tier. Each accepts `{ gapDays }` and picks a line from `lib/comeback-messages.ts` keyed by tier. Modal optionally triggers a brief particle burst from the active theme.

### Server

#### Prisma model: `PushSubscription`
```prisma
model PushSubscription {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint            String    @unique
  p256dh              String
  auth                String
  userAgent           String?
  createdAt           DateTime  @default(now())
  lastFiredAt         DateTime?
  consecutiveIgnored  Int       @default(0)
  pausedAt            DateTime?

  @@index([userId])
  @@index([pausedAt, lastFiredAt])
  @@map("push_subscriptions")
}
```

`User` gains `pushSubscriptions PushSubscription[]` relation. No other schema changes.

`User.profile` JSON gains three additive keys (no migration needed):
- `reminderTime: string | null` — `null` = surprise me, `"21:15"` = override
- `reminderOptInPromptShownAt: string | null` — ISO timestamp
- `lastComebackShownAt: string | null` — ISO timestamp

#### `/api/push/subscribe` (POST, DELETE)
- POST: body `{ endpoint, keys: { p256dh, auth }, userAgent }`. Upsert by endpoint scoped to user. Returns 200.
- DELETE: body `{ endpoint }`. Hard-delete the subscription. Returns 200.

#### `/api/cron/send-reminders` (GET)
- Auth: header `Authorization: Bearer ${CRON_SECRET}` (matches `deliver-letters` pattern).
- Query: all `PushSubscription` where `pausedAt IS NULL`, joined to `User` for `profile.reminderTime`, plus the most recent entry for the day-check.
- For each subscription:
  - Determine user's local TZ. Source: stored on the subscription (capture at subscribe time as `tz`) — *correction:* see Open Questions below; we may instead require `X-User-TZ` to round-trip via the subscribe endpoint.
  - Compute target time today in user's TZ:
    - If `reminderTime` override: parse HH:MM → today's local datetime.
    - Else: `slot = parseInt(sha256(userId + YYYYMMDD).slice(0, 8), 16) % 12` → minutes-from-7pm = `slot * 15` → `19:00 + slot*15min`.
  - If current UTC moment falls in the same 15-min window as target:
    - Check `User.entries` where `createdAt >= startOfTodayLocal`. If any, skip (don't increment ignored counter — the user *is* engaged).
    - Else: pick random line from `lib/reminder-messages.ts`. `web-push.sendNotification(subscription, JSON.stringify({ title: 'hearth', body: line }))`. Set `lastFiredAt = now()`.
  - Update the ignored counter as defined in Implementation Notes (compare the previous `lastFiredAt` against entries since), then set the new `lastFiredAt`.
- Final pass after the loop: any subscription with `consecutiveIgnored >= 7` gets `pausedAt = now()`.

#### Constants
- `src/lib/reminder-messages.ts` — exported array of ~30 strings, each ≤100 chars.
- `src/lib/comeback-messages.ts` — `{ whisper: string[], card: string[], modal: string[] }`, ~5–10 lines each tier. Modal lines may include a `{gapDays}` placeholder.

### Environment

```
VAPID_PUBLIC_KEY=...        # from `npx web-push generate-vapid-keys`
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@hearth.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # exposed to client for PushManager.subscribe()
```

`CRON_SECRET` already exists. `web-push` npm package is the only new dependency.

## Data flow examples

### Opt-in (happy path)
1. User saves first entry. `useAutosaveEntry` emits `entrySaved` event.
2. `useReminders` sees no `reminderOptInPromptShownAt` → renders `OptInCard`.
3. User taps "Surprise me".
4. Browser shows native permission prompt → user clicks "Allow".
5. `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })` returns a `PushSubscription` object.
6. Client `POST /api/push/subscribe` with endpoint + keys + UA. Server upserts row. Server sets `User.profile.reminderOptInPromptShownAt = now()` in the same request.
7. Card animates out. No further UI.

### Reminder fires (happy path)
1. Cron runs at 19:30 UTC. For user in `Asia/Kolkata` (UTC+5:30), local time is 01:00 next day — out of window. Skip.
2. Cron runs at 14:30 UTC. For same user, local time is 20:00. `hash(userId + '20260503') % 12 = 4` → target = 19:00 + 60min = 20:00. Match.
3. Check entries today (Asia/Kolkata local). None.
4. Pick line: *"the evening is quiet. write a line."*
5. Send push. Update `lastFiredAt = '2026-05-03T14:30:00Z'`.
6. Service worker shows notification.
7. User taps. Browser opens `/?write=1`. Home page reads query, dispatches "new entry" action, lands on a blank spread.

### Auto-pause
1. User opted in on day 1, never journaled, ignored 7 consecutive nights.
2. On the 7th cron fire after the 7th miss, `consecutiveIgnored` increments to 7.
3. End-of-cron pass sets `pausedAt = now()`.
4. Next nights: query filter `pausedAt IS NULL` excludes this subscription. Silent.
5. User opens app one day → comeback modal fires (gap 8+ days).
6. User toggles reminder back on in profile → server clears `pausedAt` and `consecutiveIgnored`.

### Comeback moment (8+ day return)
1. User opens Hearth after 23 days. App load.
2. `useComeback` computes `gap = 23`, tier = `modal`.
3. `lastComebackShownAt` is from 24+ days ago → fire.
4. `ComebackModal` overlays the desk. Picks line: *"it's been 23 days. no judgment, just glad you're here."*
5. Brief particle burst from active theme.
6. User taps to dismiss. PATCH `lastComebackShownAt = now()`.
7. Refreshing the page within the same calendar day does not re-fire.

## Implementation notes

### Counting "consecutive ignored" precisely
Definition: a fire is "ignored" if no entry was created between that `lastFiredAt` and the next fire (or now, if no next fire yet). Implementation:
- After firing, before updating `lastFiredAt`, check whether any entry exists since the *previous* `lastFiredAt`.
  - If no: previous fire was ignored → increment `consecutiveIgnored`.
  - If yes: previous fire was honored → reset `consecutiveIgnored = 0`.
- Then set new `lastFiredAt`.

This makes the counter exact and avoids race conditions.

### Timezone storage
The cleanest approach is to store the user's TZ on the `PushSubscription` row at subscribe time (read from `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client and send in the body). This avoids needing the user to be currently online for the cron to do its job. Alternative: store `tz` on `User.profile` and overwrite on each app load. Either works; the spec uses the first.

Add `tz String` to `PushSubscription` (defaulted to `'UTC'`).

### Cron frequency and idempotency
15-minute interval. Each subscription can fire at most once per 24h window because:
- The target time is one specific 15-min slot per user per day.
- After firing, `lastFiredAt` is set; any subsequent cron run that day will see the same target slot has already been served (by checking `lastFiredAt >= startOfTodayLocal`).

### Service worker file location
`public/sw.js` (Next.js serves `public/` at root, allowing `navigator.serviceWorker.register('/sw.js')` to work without a custom route). The file is plain JavaScript — no TypeScript build step needed for v1.

### `?write=1` query handling
The home/desk page already mounts a fresh new-entry spread by default when there's no entry-for-today. The `?write=1` flag explicitly forces this behavior even if there's an autosaved draft from earlier today, and clears itself from the URL after first read (via `router.replace`).

### Test reminder button
The profile-page "Send a test reminder now" button hits a new `POST /api/push/test` route that calls `web-push.sendNotification` for the current user's most-recently-active subscription with a fixed message: *"This is what a gentle nudge feels like."*

## Testing strategy

- **Unit:** `hash → slot` function (deterministic; same input → same slot). Tier classifier (`gapDays → whisper/card/modal`). "Skip if entry today" date math across DST boundaries.
- **Integration:** `/api/push/subscribe` round-trip (create → DELETE). `/api/cron/send-reminders` with seeded subscriptions in fake-time, verifying skip-when-journaled, fire-when-not, increment-on-ignored, pause-at-7.
- **Manual:**
  - Opt-in flow on Chrome desktop, Firefox desktop, Safari macOS.
  - "Not now" does not trigger native prompt.
  - Test reminder button delivers a notification to the calling browser.
  - Comeback whisper/card/modal each fires at the correct gap.
  - iOS Safari fallback message renders in profile.
- **Smoke after deploy:** Test reminder fires from prod to a real device.

## Open questions

1. **Active theme on the comeback modal** — should the particle burst always use the user's currently-selected theme, or should the 8+ day modal force a "hearth-warm" palette regardless? Current spec: use active theme. Easy to revisit.
2. **Cron schedule choice** — Vercel cron config (`vercel.json`) vs external scheduler. Existing `deliver-letters` cron is presumed to use the same mechanism; whatever it uses, this one mirrors.

## Sample copy (placeholder, ~5 lines per surface — author the rest later)

`reminder-messages.ts`:
- *"the evening is quiet. write a line."*
- *"hearth is here. one small thing?"*
- *"before sleep, a sentence about today."*
- *"no pressure. just a page that's waiting."*
- *"the day's still warm. tell us how it felt."*

`comeback-messages.ts.whisper` (1–2 days):
- *"you're back."*
- *"the page kept your spot."*

`comeback-messages.ts.card` (3–7 days):
- *"a few days have passed. glad you're here."*
- *"hearth missed you a little."*

`comeback-messages.ts.modal` (8+ days):
- *"it's been {gapDays} days. no judgment, just glad you're here."*
- *"long time. take a breath. the page is open."*
