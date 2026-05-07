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
