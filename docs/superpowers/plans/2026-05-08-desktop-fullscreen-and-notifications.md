# Desktop Fullscreen + Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Tauri desktop app's fullscreen sticky across reloads (and across browser refresh on web), and add native macOS notifications + dock-icon badge for the daily reminder.

**Architecture:** `sessionStorage`-backed fullscreen pref. On Tauri, read on launch and call the core window API directly. On web, attach a one-shot capture-phase `pointerdown` listener that re-enters fullscreen on the user's next click. JS-driven reminder scheduler in the webview hits a new `GET /api/me/reminder-status` endpoint and invokes thin Rust commands to show native notifications and set the dock badge. No schema changes.

**Tech Stack:** Next.js 16 (App Router), Tauri 2.11, `tauri-plugin-notification`, `@tauri-apps/api`, Prisma + existing User/PushSubscription models.

**Testing convention:** Per project preference, no formal unit tests. Each task ends with a concrete manual-verification step before committing.

**Spec:** [`docs/superpowers/specs/2026-05-08-desktop-fullscreen-and-notifications-design.md`](../specs/2026-05-08-desktop-fullscreen-and-notifications-design.md)

---

## Task 1: Add `isTauri` utility

A single source of truth for "are we running inside the Tauri webview" — used by `useFullscreen`, the scheduler hook, and the badge helper.

**Files:**
- Create: `src/lib/desktop/isTauri.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/desktop/isTauri.ts

// Tauri 2 exposes window.__TAURI_INTERNALS__ in the webview. This check is
// the conventional Tauri-2 sniff and works in both dev and production builds.
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/desktop/isTauri.ts
git commit -m "feat(desktop): add isTauri() runtime check helper"
```

---

## Task 2: Add `@tauri-apps/api` to package.json

The fullscreen hook and scheduler will both use the JS API. We use npm only (per project convention).

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
docker compose exec app npm install @tauri-apps/api
```

- [ ] **Step 2: Verify it's listed in package.json under `dependencies`**

```bash
grep '@tauri-apps/api' package.json
```
Expected output: a line like `"@tauri-apps/api": "^2.x.x",`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @tauri-apps/api"
```

---

## Task 3: Update `useFullscreen` hook for sessionStorage + Tauri branch + web one-shot listener

Replace the entire hook with the sticky-fullscreen version. The exit branch always clears the pref; the enter branch always sets it.

**Files:**
- Modify: `src/hooks/useFullscreen.ts`

- [ ] **Step 1: Replace file contents**

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { isTauri } from '@/lib/desktop/isTauri'

const PREF_KEY = 'hearth.fullscreenPreferred'

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

function getFsElement(): Element | null {
  const d = document as FsDocument
  return document.fullscreenElement || d.webkitFullscreenElement || null
}

async function setTauriFullscreen(value: boolean) {
  // Lazy-import so the web bundle stays clean.
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().setFullscreen(value)
}

async function enterWebFullscreen() {
  const el = document.documentElement as FsElement
  if (typeof el.requestFullscreen === 'function') await el.requestFullscreen()
  else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen()
}

async function exitWebFullscreen() {
  const d = document as FsDocument
  if (typeof document.exitFullscreen === 'function') await document.exitFullscreen()
  else if (typeof d.webkitExitFullscreen === 'function') await d.webkitExitFullscreen()
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [supported, setSupported] = useState(false)

  // Mount: detect support, sync state, restore pref.
  useEffect(() => {
    if (isTauri()) {
      // On desktop the JS Fullscreen API may also work in the webview, but we
      // drive window-level fullscreen via Tauri. Treat as always supported.
      setSupported(true)
      const pref = sessionStorage.getItem(PREF_KEY) === 'true'
      if (pref) {
        void setTauriFullscreen(true).then(() => setIsFullscreen(true))
      }
      return
    }

    const el = document.documentElement as FsElement
    const has = typeof el.requestFullscreen === 'function'
      || typeof el.webkitRequestFullscreen === 'function'
    setSupported(has)
    if (!has) return

    const sync = () => setIsFullscreen(!!getFsElement())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)

    // Web: if pref is set and we're not in fullscreen, attach a one-shot
    // capture-phase pointerdown that re-enters on next user gesture.
    const pref = sessionStorage.getItem(PREF_KEY) === 'true'
    let onFirstGesture: ((e: PointerEvent) => void) | null = null
    if (pref && !getFsElement()) {
      onFirstGesture = () => {
        void enterWebFullscreen()
      }
      // Capture phase + once so it fires before normal handlers and removes
      // itself. We do NOT preventDefault — the click still does its job.
      document.addEventListener('pointerdown', onFirstGesture, { capture: true, once: true })
    }

    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
      if (onFirstGesture) document.removeEventListener('pointerdown', onFirstGesture, true)
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (isTauri()) {
        const next = !isFullscreen
        await setTauriFullscreen(next)
        setIsFullscreen(next)
        if (next) sessionStorage.setItem(PREF_KEY, 'true')
        else sessionStorage.removeItem(PREF_KEY)
        return
      }

      if (getFsElement()) {
        await exitWebFullscreen()
        sessionStorage.removeItem(PREF_KEY)
      } else {
        await enterWebFullscreen()
        sessionStorage.setItem(PREF_KEY, 'true')
      }
    } catch {
      // User-cancelled, or browser refused. Nothing to recover from.
    }
  }, [isFullscreen])

  return { isFullscreen, supported, toggle }
}
```

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```
Expected: no errors related to this file.

- [ ] **Step 3: Manual web verification**

1. `docker compose up -d` and open `http://localhost:3111` in Chrome
2. Click the fullscreen button (top-right) — page goes fullscreen
3. Refresh the page (Cmd-R) — page exits fullscreen briefly
4. Click anywhere — fullscreen is restored
5. Click the fullscreen button to exit — windowed
6. Refresh — stays windowed (pref was cleared)
7. Re-enter fullscreen, close the tab, reopen — windowed (sessionStorage cleared)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useFullscreen.ts
git commit -m "feat(fullscreen): persist pref in sessionStorage; restore on web via one-shot pointerdown"
```

---

## Task 4: Grant fullscreen capability to Tauri

Without this, `getCurrentWindow().setFullscreen(true)` will throw a permission error in the desktop app.

**Files:**
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Update capabilities**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": [
    "main"
  ],
  "permissions": [
    "core:default",
    "core:window:allow-set-fullscreen"
  ]
}
```

- [ ] **Step 2: Verify the Tauri build is happy**

```bash
cd src-tauri && cargo check
```
Expected: no errors. Capability files are validated against the schema.

- [ ] **Step 3: Manual desktop verification**

1. Run `npm run desktop:dev`
2. In the app, click the fullscreen button — window goes fullscreen
3. Refresh (`Cmd-R` inside webview, or however the dev menu surfaces it) — fullscreen *immediately* persists, no click needed
4. Click button again — exits

- [ ] **Step 4: Commit**

```bash
git add src-tauri/capabilities/default.json
git commit -m "feat(desktop): grant set-fullscreen capability"
```

---

## Task 5: Add `GET /api/me/reminder-status` endpoint

Single endpoint the JS scheduler polls. Reads from `User.profile` (encrypted JSON) + `PushSubscription`.

**Files:**
- Create: `src/app/api/me/reminder-status/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { decryptJson } from '@/lib/encryption'

function localDateStr(now: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function startOfLocalDayUTC(now: Date, tz: string): Date {
  const dateStr = localDateStr(now, tz)
  const naiveUtc = new Date(`${dateStr}T00:00:00Z`)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  })
  const parts = fmt.formatToParts(naiveUtc)
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00'
  const m = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/)
  const tzOffsetMinutes = m
    ? (m[1] === '+' ? 1 : -1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
    : 0
  return new Date(naiveUtc.getTime() - tzOffsetMinutes * 60_000)
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Timezone: prefer the most recent active subscription's tz; else header; else UTC.
  const headerTz = request.headers.get('x-user-tz') || ''
  const activeSub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id, pausedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { tz: true },
  })
  const timezone = activeSub?.tz || headerTz || 'UTC'

  // Enabled = at least one unpaused subscription exists.
  const enabled = !!activeSub

  // Time: decrypt User.profile, look for reminderTime (string "HH:MM").
  let time: string | null = null
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profile: true },
  })
  if (userRow?.profile) {
    const profile = decryptJson<Record<string, unknown>>(userRow.profile as string) ?? {}
    if (typeof profile.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(profile.reminderTime)) {
      time = profile.reminderTime
    }
  }

  // Journaled today?
  const now = new Date()
  const startOfToday = startOfLocalDayUTC(now, timezone)
  const todayEntry = await prisma.journalEntry.findFirst({
    where: { userId: user.id, createdAt: { gte: startOfToday } },
    select: { id: true },
  })

  return NextResponse.json({
    enabled,
    time,
    timezone,
    journaledToday: !!todayEntry,
    today: localDateStr(now, timezone),
  })
}
```

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
# Get the dev auth cookie from the browser session, then:
curl -s http://localhost:3111/api/me/reminder-status \
  -H "Cookie: hearth-auth-token=<paste-token>" \
  -H "X-User-TZ: Asia/Kolkata" | jq
```

Expected JSON shape:
```json
{
  "enabled": false,
  "time": null,
  "timezone": "UTC",
  "journaledToday": false,
  "today": "2026-05-08"
}
```
(Specific values depend on the user's state.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/me/reminder-status/route.ts
git commit -m "feat(api): add /api/me/reminder-status for desktop scheduler"
```

---

## Task 6: Add `tauri-plugin-notification` (Cargo + JS)

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `package.json`

- [ ] **Step 1: Add Cargo dependency**

Open `src-tauri/Cargo.toml` and append to the `[dependencies]` block:

```toml
tauri-plugin-notification = "2"
```

After the change the `[dependencies]` block looks like:

```toml
[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.11.0", features = [] }
tauri-plugin-log = "2"
tauri-plugin-notification = "2"
```

- [ ] **Step 2: Add JS plugin dep**

```bash
docker compose exec app npm install @tauri-apps/plugin-notification
```

- [ ] **Step 3: Verify Cargo build**

```bash
cd src-tauri && cargo build
```
Expected: builds successfully (will pull crates on first build).

- [ ] **Step 4: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock package.json package-lock.json
git commit -m "chore(deps): add tauri-plugin-notification"
```

---

## Task 7: Register notification plugin + add `show_notification` / `set_badge` / `clear_badge` Rust commands

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Read current lib.rs**

```bash
cat src-tauri/src/lib.rs
```
Note the current `run()` function so the changes can be merged in.

- [ ] **Step 2: Replace `src-tauri/src/lib.rs`**

```rust
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_notification::NotificationExt;

#[tauri::command]
async fn show_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_badge(app: AppHandle, count: u32) -> Result<(), String> {
    // macOS-only. On other platforms this is a no-op (Ok(())) so the JS side
    // doesn't need to branch.
    #[cfg(target_os = "macos")]
    {
        return app
            .set_badge_count(Some(count as i64))
            .map_err(|e| e.to_string());
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, count);
        Ok(())
    }
}

#[tauri::command]
fn clear_badge(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        return app.set_badge_count(None).map_err(|e| e.to_string());
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            show_notification,
            set_badge,
            clear_badge
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(true) = event {
                let app = window.app_handle().clone();
                #[cfg(target_os = "macos")]
                let _ = app.set_badge_count(None);
                #[cfg(not(target_os = "macos"))]
                let _ = app;
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Update capabilities to permit notifications**

Open `src-tauri/capabilities/default.json` and update permissions:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": [
    "main"
  ],
  "permissions": [
    "core:default",
    "core:window:allow-set-fullscreen",
    "notification:default"
  ]
}
```

(The custom `show_notification` / `set_badge` / `clear_badge` commands defined with `#[tauri::command]` are auto-allowed for the `main` window; no extra entries needed.)

- [ ] **Step 4: Verify Cargo build**

```bash
cd src-tauri && cargo build
```
Expected: builds successfully. If `set_badge_count` does not exist on `AppHandle` for the installed Tauri 2.11 minor version, check `app.set_dock_label`/the generated docs and adjust the macOS-only block — the rest of the file stays the same.

- [ ] **Step 5: Manual smoke test**

1. `npm run desktop:dev`
2. Open Tauri's webview devtools (right-click → Inspect, or `Cmd-Option-I` if enabled)
3. In the console:
   ```js
   const { invoke } = await import('@tauri-apps/api/core')
   await invoke('show_notification', { title: 'hearth', body: 'test' })
   await invoke('set_badge', { count: 1 })
   await invoke('clear_badge')
   ```
4. Confirm: macOS asks for notification permission on first call → after granting, banner shows; dock badge appears; dock badge clears.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "feat(desktop): add show_notification/set_badge/clear_badge commands + window focus listener"
```

---

## Task 8: Add `clearBadgeIfTauri` helper + wire scheduler hook into the app

**Files:**
- Create: `src/lib/desktop/badge.ts`
- Create: `src/hooks/useDesktopReminderScheduler.ts`

- [ ] **Step 1: Create badge helper**

```ts
// src/lib/desktop/badge.ts
import { isTauri } from './isTauri'

export async function clearBadgeIfTauri(): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('clear_badge')
  } catch {
    // Best-effort: don't break the entry-save flow if the bridge is missing.
  }
}

export async function setBadgeIfTauri(count: number): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_badge', { count })
  } catch {
    // Same posture as above.
  }
}

export async function showNotificationIfTauri(title: string, body: string): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('show_notification', { title, body })
  } catch {
    // Permission denied or plugin missing — quietly skip.
  }
}
```

- [ ] **Step 2: Create the scheduler hook**

```ts
// src/hooks/useDesktopReminderScheduler.ts
'use client'

import { useEffect } from 'react'
import { isTauri } from '@/lib/desktop/isTauri'
import { setBadgeIfTauri, showNotificationIfTauri } from '@/lib/desktop/badge'
import { pickReminderLine, REMINDER_TITLE } from '@/lib/reminder-messages'

const FALLBACK_RECHECK_MS = 60 * 60_000 // 1 hour

type ReminderStatus = {
  enabled: boolean
  time: string | null
  timezone: string
  journaledToday: boolean
  today: string
}

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

async function fetchStatus(): Promise<ReminderStatus | null> {
  try {
    const res = await fetch('/api/me/reminder-status', {
      headers: { 'X-User-TZ': browserTz() },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as ReminderStatus
  } catch {
    return null
  }
}

// Compute ms from `now` until the next "HH:MM" instant in the given IANA tz.
// If today's instant is in the past, returns the delta to tomorrow's.
function msUntilNextFire(time: string, timezone: string, now: Date = new Date()): number {
  const [h, m] = time.split(':').map(n => parseInt(n, 10))
  // Find today's date string in the target tz, then build an ISO with the
  // target HH:MM and convert to UTC instant via the same trick used in cron.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]))
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`
  const offsetFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
  const offsetParts = offsetFmt.formatToParts(now)
  const offsetPart = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00'
  const offsetMatch = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/)
  const tzOffsetMinutes = offsetMatch
    ? (offsetMatch[1] === '+' ? 1 : -1) * (parseInt(offsetMatch[2], 10) * 60 + parseInt(offsetMatch[3], 10))
    : 0

  const targetUTC = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
    .getTime() - tzOffsetMinutes * 60_000

  const delta = targetUTC - now.getTime()
  if (delta > 0) return delta
  // Past — schedule for tomorrow.
  return delta + 24 * 60 * 60_000
}

export function useDesktopReminderScheduler() {
  useEffect(() => {
    if (!isTauri()) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    function clearPending() {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    async function scheduleNext() {
      if (cancelled) return
      const status = await fetchStatus()
      if (cancelled) return

      if (!status || !status.enabled || !status.time) {
        // Re-check in 1h in case opt-in or time gets set.
        timeoutId = setTimeout(() => void scheduleNext(), FALLBACK_RECHECK_MS)
        return
      }

      const wait = msUntilNextFire(status.time, status.timezone)
      timeoutId = setTimeout(async () => {
        if (cancelled) return
        // Re-fetch status at fire time so we don't notify if user just journaled.
        const fresh = await fetchStatus()
        if (cancelled) return
        if (fresh && fresh.enabled && !fresh.journaledToday) {
          await showNotificationIfTauri(REMINDER_TITLE, pickReminderLine())
          await setBadgeIfTauri(1)
        }
        // Schedule tomorrow.
        void scheduleNext()
      }, wait)
    }

    void scheduleNext()
    return () => {
      cancelled = true
      clearPending()
    }
  }, [])
}
```

- [ ] **Step 3: Mount the hook at the app root**

Find the topmost client component in `src/app/layout.tsx` (or wherever app-wide client effects live). Add an import and call the hook inside the component body:

```tsx
import { useDesktopReminderScheduler } from '@/hooks/useDesktopReminderScheduler'

// inside the client component body, near the top:
useDesktopReminderScheduler()
```

If `src/app/layout.tsx` is a server component, find the existing client wrapper that already runs hooks (e.g., a `<Providers>` component or similar). Add the hook there. Do NOT add a new client wrapper just for this hook — reuse what exists.

- [ ] **Step 4: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Manual end-to-end test on desktop**

1. In a browser tab logged into Hearth, set `reminderTime` in your profile to **2 minutes from now** (HH:MM in your local time)
2. Make sure you have at least one active web push subscription (so `enabled: true` returns)
3. Run `npm run desktop:dev`
4. Wait — a native macOS notification should appear at the set time
5. Dock icon should show a `1` badge
6. Focus the desktop window — badge clears
7. Re-trigger by setting reminder for 2 min from now again, write a new journal entry first, then wait — verify NO notification fires (journaledToday guard works)

- [ ] **Step 6: Commit**

```bash
git add src/lib/desktop/badge.ts src/hooks/useDesktopReminderScheduler.ts src/app/layout.tsx
git commit -m "feat(desktop): JS-driven reminder scheduler + native notification + dock badge"
```

(If `layout.tsx` wasn't the right file, swap in whatever client wrapper you actually edited.)

---

## Task 9: Wire `clearBadgeIfTauri` into the entry-save success path

**Files:**
- Modify: the entry-save success callback (component to be located in this task)

- [ ] **Step 1: Locate the entry-save success path**

The autosave flow is in `src/hooks/useAutosaveEntry.ts` per CLAUDE.md. Inspect it:

```bash
grep -n "POST\|PUT\|onSuccess\|onSaved\|response" src/hooks/useAutosaveEntry.ts | head -20
```

Find the spot where a successful create/update returns. That's where we'll call `clearBadgeIfTauri()`.

- [ ] **Step 2: Add the call**

Import:
```ts
import { clearBadgeIfTauri } from '@/lib/desktop/badge'
```

After the line where the successful POST/PUT is awaited and state is updated:
```ts
void clearBadgeIfTauri()
```

(Fire-and-forget; don't block the autosave on a Tauri IPC.)

- [ ] **Step 3: Manual verification**

1. With desktop app running, trigger a notification (use Task 8's procedure, set reminder 2 min away, don't journal)
2. After badge appears, write any journal entry
3. Confirm dock badge clears within ~2s of the autosave firing

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAutosaveEntry.ts
git commit -m "feat(desktop): clear dock badge on entry-save success"
```

---

## Task 10: Bump Tauri version + final integration test

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Bump version**

In `src-tauri/tauri.conf.json` change `"version": "0.1.3"` to `"version": "0.1.4"`.

- [ ] **Step 2: Full manual test plan (run all)**

Fullscreen:
1. Web: enter fullscreen → refresh → click anywhere → fullscreen restored ✓
2. Web: enter fullscreen → click exit icon → refresh → windowed ✓
3. Web: enter fullscreen → close tab → reopen → windowed ✓
4. Desktop: enter fullscreen → refresh → still fullscreen, no click needed ✓
5. Desktop: quit app → relaunch → windowed ✓

Notifications:
1. Set reminder for 2 min from now → wait → native banner + dock badge appear ✓
2. Click banner → window focuses, badge clears ✓
3. Set reminder, write entry first, wait → no notification fires ✓
4. Set reminder, let banner appear, dismiss banner without focusing window, then write entry → badge clears on save ✓

- [ ] **Step 3: Commit + push**

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore(desktop): bump version to 0.1.4 (sticky fullscreen + native reminders)"
git push -u origin feat/desktop-fullscreen-notifications
```

---

## Summary of changes

**New files:**
- `src/lib/desktop/isTauri.ts`
- `src/lib/desktop/badge.ts`
- `src/hooks/useDesktopReminderScheduler.ts`
- `src/app/api/me/reminder-status/route.ts`

**Modified files:**
- `src/hooks/useFullscreen.ts` (significant rewrite)
- `src/hooks/useAutosaveEntry.ts` (one-line addition)
- `src/app/layout.tsx` (or whichever client wrapper holds app-wide hooks; one-line addition)
- `package.json` + `package-lock.json` (two new deps)
- `src-tauri/Cargo.toml` (one new dep)
- `src-tauri/Cargo.lock` (regenerated)
- `src-tauri/src/lib.rs` (rewrite — adds 3 commands + window focus listener + plugin registration)
- `src-tauri/capabilities/default.json` (two added permissions)
- `src-tauri/tauri.conf.json` (version bump)

**Out of scope (deferred to later work):**
- No notification action buttons
- No deep link from notification click
- No system tray icon
- No global hotkey
- No dedup between web push and desktop notification (both fire by design)
- No standalone desktop opt-in (still requires web push subscription somewhere)
