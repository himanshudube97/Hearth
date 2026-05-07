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

  // Backward-compat fields consumed by ReminderControls.tsx (pre-existing endpoint shape).
  const latestSub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { pausedAt: true, consecutiveIgnored: true },
  })

  // Time: decrypt User.profile, look for reminderTime (string "HH:MM").
  let time: string | null = null
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profile: true },
  })
  if (userRow?.profile) {
    const profile = decryptJson<Record<string, unknown>>(userRow.profile as unknown as string) ?? {}
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
    paused: Boolean(latestSub?.pausedAt),
    consecutiveIgnored: latestSub?.consecutiveIgnored ?? 0,
  })
}
