# Desktop App: Sticky Fullscreen & Native Notifications

**Date:** 2026-05-08
**Scope:** Two fixes to the Tauri desktop wrapper. (1) Make the fullscreen toggle sticky across page reloads (and across desktop window state changes). (2) Add native macOS notifications + dock-icon badge for the existing daily reminder, fired locally by the desktop app.
**Surface:** `useFullscreen` hook, Tauri Rust side (`src-tauri/`), three small new API endpoints, one shared module for reminder copy.
**Out of scope:** Notification action buttons, system tray, global hotkey, deep linking from notification click, snooze, dedup between web push and desktop notification (both are allowed to fire), Windows/Linux notification polish.

## Problem

Two unrelated rough edges in the freshly-shipped desktop app:

1. **Fullscreen doesn't stick.** Today the fullscreen toggle uses the browser Fullscreen API and stores state only in component memory — every page reload (and there are many in a journaling session) drops the user out of fullscreen. On the Tauri desktop app this is worse, because users expect "fullscreen" to be a window-level mode that survives reloads, not a transient browser-level mode tied to the webview.

2. **Notifications never fire on the desktop app.** The reminder system (cron → web push → service worker) was built for browsers. Inside the Tauri webview, web push is unreliable and the user gets nothing native — no banner, no dock badge, no signal that the app is even waiting for them. The desktop app, which should be the most engaging surface, is the quietest.

## Goals

1. **Fullscreen survives refresh.** Once a user enters fullscreen, only clicking the fullscreen icon again exits it. Refreshes, route changes, and (on desktop) window-focus changes do not.
2. **Fullscreen pref is session-scoped.** When the desktop app or the browser tab is closed, the pref clears. Next launch starts windowed.
3. **Desktop fires native macOS notifications.** When a user has reminders enabled and hasn't journaled today, the desktop app shows a real macOS banner at their preferred time, with copy from the existing reminder line pool.
4. **Dock icon shows a badge.** Until the user opens the app or writes an entry, the dock icon shows a `1` badge — a passive, persistent nudge that survives the banner being dismissed.
5. **No schema changes.** Reuse the existing `User.wantsReminders`, `User.reminderTime`, `User.timezone` fields. Desktop is just another delivery client.
6. **Web push behavior unchanged.** The existing cron route, service worker, and VAPID flow are untouched. Both fire (web push on subscribed browsers + native on running desktop apps) — the user explicitly accepted this duplication for v1 simplicity.

## Non-goals

- **Dedup between web push and desktop.** A user with both a subscribed browser and the desktop app open will receive both notifications. v1 accepts this.
- **Notification action buttons.** No "Write now" / "Skip today" buttons. Click brings the window to front; that's it.
- **Deep link from notification click.** No routing to `/write` from the notification. Just window focus.
- **System tray icon.** The dock icon is the only persistent surface.
- **Global hotkey** (e.g., ⌘⇧J for new entry). Out of scope.
- **Snooze.** Notification fires once per day. If the user dismisses without writing, no follow-up.
- **Windows / Linux polish.** Tauri's notification plugin works there, but copy / icon / badge behavior is not tuned for non-macOS in v1.
- **Schema migration.** Zero new tables, zero new columns.
- **Persisted-across-quit fullscreen.** sessionStorage scope only. If the user quits the desktop app and relaunches, they start windowed.

## Architecture overview

```
┌─── DESKTOP (Tauri) ───────────────────────────────────────────────┐
│                                                                   │
│  Rust process (src-tauri/src/lib.rs)                              │
│   ├─ register tauri-plugin-notification                           │
│   ├─ Tauri 2 window API used for fullscreen (no extra plugin)     │
│   ├─ on launch: spawn `reminders::scheduler` tokio task           │
│   ├─ command: `clear_badge` (called from JS after entry save)     │
│   └─ on WindowEvent::Focused(true): clear badge                   │
│                                                                   │
│  reminders::scheduler                                             │
│   ├─ fetch GET /api/me/reminder-pref → {enabled, time, tz}        │
│   ├─ if !enabled → sleep 1h, refetch                              │
│   ├─ compute next fire = today's `time` in `tz`, or tomorrow      │
│   ├─ tokio::time::sleep_until(next_fire)                          │
│   ├─ fetch GET /api/me/journaled-today → {journaled}              │
│   │     if journaled → reschedule for tomorrow, no fire           │
│   ├─ fetch GET /api/me/reminder-line → {line}                     │
│   ├─ tauri::Notification::send(title="Hearth", body=line)         │
│   ├─ app.set_badge_count(Some(1))                                 │
│   └─ reschedule for tomorrow                                      │
│                                                                   │
│  WebView (Next.js, same as web)                                   │
│   ├─ useFullscreen reads sessionStorage on mount                  │
│   ├─ if running in Tauri AND pref==true → invoke('set_fullscreen')│
│   ├─ else if web AND pref==true → attach one-shot pointerdown     │
│   │     listener that re-enters fullscreen on next gesture        │
│   └─ on entry-save success → invoke('clear_badge') if Tauri       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌─── SERVER (Next.js, unchanged + 3 small endpoints) ───────────────┐
│                                                                   │
│  Existing:                                                        │
│   /api/cron/send-reminders   ← unchanged, still fires web push    │
│   /api/push/subscribe         ← unchanged                         │
│   service worker              ← unchanged                         │
│                                                                   │
│  New (read-only, auth required):                                  │
│   GET /api/me/reminder-pref     → {enabled, time, timezone}       │
│   GET /api/me/journaled-today   → {journaled, today}              │
│   GET /api/me/reminder-line     → {line: string}                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Part A — Sticky fullscreen

### Behavior contract

| Event | Web | Desktop (Tauri) |
| --- | --- | --- |
| Click fullscreen icon (enter) | enters fullscreen, `sessionStorage.fullscreenPreferred = "true"` | calls Tauri `set_fullscreen(true)`, writes pref |
| Click fullscreen icon (exit) | exits fullscreen, clears pref | calls `set_fullscreen(false)`, clears pref |
| Page refresh while pref=true | on mount, attaches one-shot capture-phase `pointerdown` listener; first click anywhere re-enters fullscreen, listener removes itself | on mount, immediately calls `set_fullscreen(true)` (no gesture needed) |
| Tab/window close | `sessionStorage` cleared by browser | `sessionStorage` (in webview) cleared on app quit — pref does not survive |
| User presses `Esc` (browser native exit) | browser exits fullscreen but pref stays `true`; behaves like a refresh — next click re-enters | Tauri's window mode is independent of webview Fullscreen API; `Esc` does not exit window-level fullscreen |

### Storage

Single key in `sessionStorage`:
```
hearth.fullscreenPreferred = "true" | (absent)
```
Absent = not preferred. Only ever stores `"true"`; on exit we `removeItem`.

### Web one-shot listener

On `useFullscreen` mount, if pref is `"true"` and we are not already in fullscreen and `supported === true`, attach:

```ts
const onFirstGesture = (e: PointerEvent) => {
  document.removeEventListener('pointerdown', onFirstGesture, true)
  // Don't preventDefault / stopPropagation — let the click do its job too
  void enterFullscreen()
}
document.addEventListener('pointerdown', onFirstGesture, { capture: true, once: true })
```

Capture phase + no `stopPropagation` means the click also reaches its intended target. The user does not feel the click was "consumed."

### Desktop path

Tauri 2 ships fullscreen control as part of the core window API — no additional plugin needed, only a capability grant. We call it from JS via:

```ts
import { getCurrentWindow } from '@tauri-apps/api/window'
await getCurrentWindow().setFullscreen(true)
```

Add `core:window:allow-set-fullscreen` to `src-tauri/capabilities/default.json`. (The `@tauri-apps/api` JS package is already implicitly available through the Tauri runtime; we may need to add it to `package.json` if the autogenerated globals aren't sufficient — confirm during implementation.)

### Detection of Tauri context

Single util `src/lib/desktop/isTauri.ts`:
```ts
export const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
```
Used by `useFullscreen` to branch and by the badge-clear helper.

## Part B — Native notifications + dock badge

### Reminder data flow

```
Server (existing User row)
  wantsReminders: bool
  reminderTime: "HH:MM" (local, in user's tz)
  timezone: IANA string

           ↓ GET /api/me/reminder-pref
           
Tauri scheduler (Rust)
  - reads pref once at launch
  - re-reads every 1h (handles user toggling on/off, time change)
  - computes next fire instant in user tz
  - tokio::time::sleep_until → fire
```

### Three new endpoints

All require `getCurrentUser()`. All return JSON.

**`GET /api/me/reminder-pref`**
```ts
{ enabled: boolean, time: string | null, timezone: string }
```
Reads from `User` row directly. No new fields.

**`GET /api/me/journaled-today`**
Server interprets "today" using `X-User-TZ` header (consistent with existing entry-lock convention).
```ts
{ journaled: boolean, today: string /* YYYY-MM-DD in user tz */ }
```
Implementation: `prisma.journalEntry.count({ where: { userId, createdAt: { gte: startOfToday, lt: startOfTomorrow } } }) > 0`.

**`GET /api/me/reminder-line`**
Picks one random line from the shared pool.
```ts
{ line: string }
```

### Shared reminder lines

Today the reminder line pool lives inside `src/app/api/cron/send-reminders/route.ts`. Extract it to:
```
src/lib/reminder-lines.ts
  export const reminderLines: string[] = [...]
  export function pickReminderLine(): string
```
Both the cron route and the new `/api/me/reminder-line` endpoint import from here. No copy changes.

### Tauri scheduler module

New file `src-tauri/src/reminders.rs`:

```rust
// Pseudocode — the actual impl will use reqwest, chrono-tz, tokio
pub async fn scheduler(app: tauri::AppHandle) {
    loop {
        let pref = fetch_reminder_pref(&app).await;
        if !pref.enabled {
            tokio::time::sleep(Duration::from_secs(3600)).await;
            continue;
        }

        let next_fire = compute_next_fire(&pref.time, &pref.timezone);
        tokio::time::sleep_until(next_fire).await;

        let journaled = fetch_journaled_today(&app).await;
        if journaled { continue; } // loop will recompute and sleep until tomorrow

        let line = fetch_reminder_line(&app).await;
        send_notification(&app, &line);
        set_badge(&app, 1);
    }
}
```

Spawned once from `lib.rs::run()` after the app builder is set up.

### Auth from Rust

The Tauri app loads `https://hearth-sage.vercel.app` and the user logs in via Supabase OAuth in the webview. The auth cookie lives in the webview's cookie jar. Rust's reqwest client must share that jar — Tauri 2 exposes the webview cookie store via `app.webview_windows()` → `cookies()`. The scheduler fetches with those cookies attached.

If cookie-sharing turns out to be fragile, fallback: expose a Tauri command `getAuthHeaders()` from JS that returns the bearer token, and have JS re-trigger the scheduler whenever auth changes. This is a fallback path, not the primary plan.

### Notifications

```rust
use tauri_plugin_notification::NotificationExt;

app.notification()
    .builder()
    .title("Hearth")
    .body(line)
    .show()?;
```

First call triggers macOS permission prompt. We do not preflight permission with a dialog — the system prompt is acceptable.

### Dock badge

macOS only in v1. Tauri 2 exposes `app.set_badge_count(Some(1))`. Cleared by:
1. **Window focus event:** `app.on_window_event(|event| if let WindowEvent::Focused(true) = event { app.set_badge_count(None) })`
2. **Entry save:** frontend calls `invoke('clear_badge')` on successful save. Rust command runs `app.set_badge_count(None)`.

We deliberately *do not* clear the badge when the notification is clicked alone — only when the user actually engages (focuses window or writes).

## Files

### New

| Path | Purpose |
| --- | --- |
| `src/lib/desktop/isTauri.ts` | Single source of truth for "are we in Tauri webview" |
| `src/lib/desktop/badge.ts` | Helper: `clearBadgeIfTauri()` called after entry save |
| `src/lib/reminder-lines.ts` | Extracted shared reminder copy pool |
| `src/app/api/me/reminder-pref/route.ts` | New endpoint |
| `src/app/api/me/journaled-today/route.ts` | New endpoint |
| `src/app/api/me/reminder-line/route.ts` | New endpoint |
| `src-tauri/src/reminders.rs` | Tokio scheduler module |

### Modified

| Path | Change |
| --- | --- |
| `src/hooks/useFullscreen.ts` | sessionStorage read/write; Tauri branch; web one-shot listener |
| `src/app/api/cron/send-reminders/route.ts` | Replace inline line pool with import from `lib/reminder-lines.ts` |
| `src-tauri/Cargo.toml` | Add `tauri-plugin-notification`, `reqwest`, `tokio` (with rt-multi-thread + time), `chrono`, `chrono-tz` |
| `src-tauri/src/lib.rs` | Register notification plugin, register `clear_badge` command, spawn scheduler, listen for window focus |
| `src-tauri/capabilities/default.json` | Add `core:window:allow-set-fullscreen`, `notification:default`, `core:app:allow-set-badge-count` (exact name confirmed during impl) |
| `src-tauri/tauri.conf.json` | Bump version to 0.1.4 |
| `src/components/desk/...` (entry save path) | Call `clearBadgeIfTauri()` on successful save (one line in the existing post-save handler) |

## Edge cases

1. **User logs out on desktop.** Scheduler's next API call returns 401. Catch → sleep 5min → retry. When user logs back in, scheduler resumes with new identity. No restart needed.
2. **User changes reminder time on web.** Scheduler re-reads pref every 1h, so within 1h the new time takes effect. (Tighter sync is a v2 concern.)
3. **User journals at 8:55pm, reminder is at 9:00pm.** Scheduler checks `journaled-today` *at fire time*, so it sees the entry and skips. Good.
4. **Clock change / DST.** `chrono-tz` handles tz transitions; sleep_until uses an absolute instant computed from the user's IANA tz, so DST doesn't double-fire or skip.
5. **App was closed at fire time.** No notification. macOS does not retroactively fire missed app notifications. v1 accepts this — the dock badge will not appear retroactively either. (Web push covers this case for users who also have a browser tab subscribed.)
6. **Multiple desktop instances on the same machine.** Should not happen (single-instance lock not in scope). If it did, both fire — duplicate, ugly, but not data-corrupting.
7. **iOS Safari / mobile web** — out of scope for fullscreen behavior change, since iOS Safari's Fullscreen API is unsupported (existing `supported` check still gates the button).
8. **`Esc` exits webview fullscreen but pref stays true.** On web, this is intentional — pref is "did the user click the fullscreen icon to exit"; `Esc` is a passing exit. Next interaction will restore. On desktop we use window-level fullscreen, where `Esc` doesn't exit, so this case doesn't apply.

## Open questions

1. **Tauri 2 + reqwest cookie sharing** — needs a 30min spike during implementation. Fallback (JS-pushed token) is documented above.
2. **Badge support on Windows/Linux** — Tauri's `set_badge_count` is macOS-only currently. v1 ships macOS-only; non-mac users see notifications without badges, which is fine.
3. **Permission denial UX** — if the user denies the macOS notification permission, the scheduler will get an error each fire. We log it and keep trying daily; v1 has no in-app surface to re-request. (Acceptable: user can re-enable in System Settings.)

## Build / verification

- `docker compose up -d --build` to rebuild the web app
- `cd src-tauri && cargo build` for Rust changes
- `npm run desktop:dev` to run Tauri in dev
- Manual fullscreen test plan:
  1. Web: enter fullscreen, refresh page, click anywhere — fullscreen restored
  2. Web: enter fullscreen, click exit icon, refresh — windowed (pref cleared)
  3. Web: enter fullscreen, close tab, reopen — windowed (sessionStorage gone)
  4. Desktop: enter fullscreen, refresh — fullscreen still on (no click needed)
  5. Desktop: quit app, relaunch — windowed
- Manual notification test plan:
  1. Set reminder for 2 minutes from now in profile
  2. Wait — verify native banner appears + dock badge shows 1
  3. Click banner — window focuses, badge clears
  4. Wait for next day's fire, dismiss banner, write entry — badge clears on save
  5. Set reminder, write an entry first, wait — verify no notification (journaled-today guard)
