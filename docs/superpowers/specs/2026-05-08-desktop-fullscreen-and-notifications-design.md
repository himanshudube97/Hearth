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
5. **No schema changes.** Reuse the existing reminder signals: opt-in is implicit in the presence of an unpaused `PushSubscription` row, `reminderTime` lives inside encrypted `User.profile` JSON, timezone lives on each `PushSubscription` row. Desktop is just another delivery client reading the same data.
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

The scheduler lives in **JavaScript inside the Tauri webview**, not in Rust. The webview already holds the auth cookie and can hit `/api/me/*` directly with no cookie-sharing acrobatics. Tauri's webview doesn't throttle background timers, so a long `setTimeout` survives even when the window is hidden. Rust's only role is to expose thin native commands (`show_notification`, `set_badge`, `clear_badge`) and listen for window focus.

```
┌─── DESKTOP (Tauri) ───────────────────────────────────────────────┐
│                                                                   │
│  Rust (src-tauri/src/lib.rs)                                      │
│   ├─ register tauri-plugin-notification                           │
│   ├─ Tauri 2 core window API for fullscreen (no extra plugin)     │
│   ├─ command: show_notification(title, body)                      │
│   ├─ command: set_badge(count: u32)                               │
│   ├─ command: clear_badge()                                       │
│   └─ on WindowEvent::Focused(true): clear badge                   │
│                                                                   │
│  WebView JS (Next.js, same as web)                                │
│   ├─ useFullscreen — sessionStorage + Tauri/web branches          │
│   │                                                               │
│   ├─ useDesktopReminderScheduler (mounted at app root, Tauri-only)│
│   │   ├─ on mount: GET /api/me/reminder-status                    │
│   │   ├─ if !enabled or no time → no-op                           │
│   │   ├─ compute next fire (user's time in user's tz)             │
│   │   ├─ setTimeout(fire, msUntilNextFire)                        │
│   │   ├─ on fire: GET /api/me/reminder-status (re-check journaled)│
│   │   │   if !journaledToday → invoke('show_notification')        │
│   │   │                       + invoke('set_badge', { count: 1 }) │
│   │   ├─ schedule next day                                        │
│   │   └─ also re-fetches every 1h to pick up pref changes         │
│   │                                                               │
│   └─ on entry-save success → invoke('clear_badge') if Tauri       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌─── SERVER (Next.js, unchanged + 1 small endpoint) ────────────────┐
│                                                                   │
│  Existing:                                                        │
│   /api/cron/send-reminders   ← unchanged, still fires web push    │
│   /api/push/subscribe         ← unchanged                         │
│   service worker              ← unchanged                         │
│                                                                   │
│  New (read-only, auth required):                                  │
│   GET /api/me/reminder-status   → {                               │
│     enabled: boolean,        // any unpaused PushSubscription     │
│     time: string | null,     // User.profile.reminderTime         │
│     timezone: string,        // any active sub's tz, else "UTC"   │
│     journaledToday: boolean, // re-checked at fire time           │
│     today: string,           // YYYY-MM-DD in user tz             │
│   }                                                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

Reminder copy stays in `src/lib/reminder-messages.ts` (already exists). The JS scheduler imports `pickReminderLine()` directly — no new endpoint needed.

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
Server (existing data — no changes)
  User.profile (encrypted JSON) → may contain { reminderTime: "HH:MM" }
  PushSubscription[] per user → has tz, pausedAt, lastFiredAt
  Implicit opt-in: ≥1 PushSubscription with pausedAt=null

           ↓ GET /api/me/reminder-status

WebView JS scheduler (useDesktopReminderScheduler hook)
  - reads status on mount + every 1h
  - if !enabled or !time → no-op (web push handles default-window users)
  - computes next fire instant from time + tz
  - setTimeout(fire, msUntilNextFire)
  - at fire time: re-fetch status; if !journaledToday → fire native
```

### v1 scope: explicit reminder time only

For v1, the desktop fires **only when the user has set an explicit `reminderTime`** in their profile. Users on the default random-evening window continue to get web push as today; they do not get desktop notifications. This avoids porting the random-window scheduling logic (`targetMinutesPastSeven` / `isCurrentWindowTarget`) to a second code path. v2 can decouple.

This also implies: a user must have opted into reminders (via web push at least once) AND set a custom time to get desktop notifications. Documented as an "open caveat" — fine for v1.

### One new endpoint

**`GET /api/me/reminder-status`** (auth required, reads `X-User-TZ` header for "today")

```ts
{
  enabled: boolean,        // user has ≥1 unpaused PushSubscription
  time: string | null,     // User.profile.reminderTime if set, else null
  timezone: string,        // any active subscription's tz, else "UTC"
  journaledToday: boolean, // entry exists in [startOfToday, startOfTomorrow)
  today: string,           // YYYY-MM-DD in user tz
}
```

Implementation notes:
- `enabled`: `prisma.pushSubscription.count({ where: { userId, pausedAt: null } }) > 0`
- `time`: decrypt `User.profile` via existing `decryptJson` helper, read `reminderTime`
- `timezone`: pick the most recently created active subscription's `tz`, or `"UTC"`
- `journaledToday`: reuse the same TZ helpers from `cron/send-reminders/route.ts` (`localDateStr`, `startOfLocalDayUTC`)

### Reminder copy

`src/lib/reminder-messages.ts` already exists and exports `pickReminderLine()` and `REMINDER_TITLE`. The desktop scheduler imports them directly. **No extraction task needed.**

### Tauri Rust commands

Three commands, registered in `lib.rs`. All take primitive args, return `Result<(), String>`.

```rust
#[tauri::command]
async fn show_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification().builder().title(title).body(body).show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_badge(app: AppHandle, count: u32) -> Result<(), String> {
    app.set_badge_count(Some(count as i64)).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_badge(app: AppHandle) -> Result<(), String> {
    app.set_badge_count(None).map_err(|e| e.to_string())
}
```

Plus a window-event listener that calls `clear_badge` on `WindowEvent::Focused(true)`.

### JS scheduler hook

```ts
// src/hooks/useDesktopReminderScheduler.ts (mounted once at app root)
export function useDesktopReminderScheduler() {
  useEffect(() => {
    if (!isTauri()) return
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    async function scheduleNext() {
      if (cancelled) return
      const status = await fetch('/api/me/reminder-status', { headers: { 'X-User-TZ': tz() } }).then(r => r.json())
      if (!status.enabled || !status.time) {
        timeoutId = setTimeout(scheduleNext, 60 * 60_000) // re-check in 1h
        return
      }
      const nextFireMs = msUntilNextFire(status.time, status.timezone)
      timeoutId = setTimeout(async () => {
        const fresh = await fetch('/api/me/reminder-status', { headers: { 'X-User-TZ': tz() } }).then(r => r.json())
        if (fresh.enabled && !fresh.journaledToday) {
          await invoke('show_notification', { title: REMINDER_TITLE, body: pickReminderLine() })
          await invoke('set_badge', { count: 1 })
        }
        scheduleNext() // schedule tomorrow
      }, nextFireMs)
    }

    void scheduleNext()
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId) }
  }, [])
}
```

Mounted once in `app/layout.tsx` (or wherever the global root client component lives) — `useEffect` ensures it only runs in the browser/webview.

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
| `src/hooks/useDesktopReminderScheduler.ts` | JS scheduler hook (Tauri-only no-op on web) |
| `src/app/api/me/reminder-status/route.ts` | Single new endpoint returning all status fields |

### Modified

| Path | Change |
| --- | --- |
| `src/hooks/useFullscreen.ts` | sessionStorage read/write; Tauri branch; web one-shot listener |
| `src/app/layout.tsx` (or root client wrapper) | Mount `useDesktopReminderScheduler` once |
| `src-tauri/Cargo.toml` | Add `tauri-plugin-notification` |
| `src-tauri/src/lib.rs` | Register notification plugin; register `show_notification` / `set_badge` / `clear_badge` commands; listen for window focus to clear badge |
| `src-tauri/capabilities/default.json` | Add `core:window:allow-set-fullscreen`, `notification:default`, badge permission (exact name confirmed during impl) |
| `src-tauri/tauri.conf.json` | Bump version to 0.1.4 |
| `package.json` | Add `@tauri-apps/api` and `@tauri-apps/plugin-notification` JS deps |
| Entry save success path (component to be confirmed during impl) | Call `clearBadgeIfTauri()` after successful save |

## Edge cases

1. **User logs out on desktop.** JS scheduler's next API call returns 401. Catch → schedule a 5-min retry. When user logs back in (cookie restored in webview), the next poll succeeds. No app restart needed.
2. **User changes reminder time on web.** Hook re-fetches `/api/me/reminder-status` every 1h, so within 1h the new time takes effect. (Tighter sync is a v2 concern.)
3. **User journals at 8:55pm, reminder is at 9:00pm.** Hook re-fetches status *at fire time*, sees `journaledToday: true`, and skips. Good.
4. **Clock change / DST.** Use `Intl.DateTimeFormat` + the user's IANA tz to compute the next fire instant — same approach as `cron/send-reminders/route.ts`, which already handles DST correctly.
5. **App was closed at fire time.** No notification. macOS does not retroactively fire missed app notifications. v1 accepts this — the dock badge will not appear retroactively either. (Web push covers this case for users who also have a browser tab subscribed.)
6. **Multiple desktop instances on the same machine.** Should not happen (single-instance lock not in scope). If it did, both fire — duplicate, ugly, but not data-corrupting.
7. **iOS Safari / mobile web** — out of scope for fullscreen behavior change, since iOS Safari's Fullscreen API is unsupported (existing `supported` check still gates the button).
8. **`Esc` exits webview fullscreen but pref stays true.** On web, this is intentional — pref is "did the user click the fullscreen icon to exit"; `Esc` is a passing exit. Next interaction will restore. On desktop we use window-level fullscreen, where `Esc` doesn't exit, so this case doesn't apply.
9. **User's browser session expires while desktop is running.** Same as logout — 401 on next poll. Hook backs off; resumes once session is refreshed by the webview's normal auth flow.
10. **User has no PushSubscription anywhere.** `enabled === false` → hook no-ops indefinitely (re-checks every 1h in case they opt in later).
11. **User is opted in but has no `reminderTime` set.** Falls back on web push's random-evening window (handled by existing cron). Desktop does not fire — by design for v1.

## Open questions

1. **Badge support on Windows/Linux.** Tauri's `set_badge_count` is macOS-only currently. v1 ships macOS-only badges; non-mac users see notifications without badges, which is fine.
2. **Permission denial UX.** If the user denies the macOS notification permission, the `invoke('show_notification')` call will resolve without showing anything. v1 has no in-app surface to re-request. (Acceptable: user can re-enable in System Settings.)
3. **Decoupling desktop opt-in from web push.** v1 requires the user to have opted in via web push at least once for desktop to fire. v2 should allow desktop to be a standalone reminder channel.

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
