import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

function vapidConfigStatus() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT || 'mailto:support@hearth.app'
  const clientPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  return {
    pub,
    priv,
    subj,
    clientPub,
    missing: {
      VAPID_PUBLIC_KEY: !pub,
      VAPID_PRIVATE_KEY: !priv,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !clientPub,
    },
    keysMatch: !!pub && !!clientPub && pub === clientPub,
  }
}

let configured = false
function configureVapid(pub: string, priv: string, subj: string) {
  if (configured) return
  webpush.setVapidDetails(subj, pub, priv)
  configured = true
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = vapidConfigStatus()
  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id, pausedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { endpoint: true, createdAt: true, userAgent: true, tz: true },
  })

  return NextResponse.json({
    missing: status.missing,
    keysMatch: status.keysMatch,
    serverPubPrefix: status.pub ? status.pub.slice(0, 12) : null,
    clientPubPrefix: status.clientPub ? status.clientPub.slice(0, 12) : null,
    subject: status.subj,
    hasActiveSubscription: !!sub,
    subscription: sub
      ? {
          endpointHost: new URL(sub.endpoint).host,
          createdAt: sub.createdAt,
          userAgent: sub.userAgent,
          tz: sub.tz,
        }
      : null,
  })
}

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = vapidConfigStatus()
  if (!status.pub || !status.priv) {
    return NextResponse.json(
      {
        error: 'Server not configured',
        missing: status.missing,
        keysMatch: status.keysMatch,
      },
      { status: 500 }
    )
  }

  try {
    configureVapid(status.pub, status.priv, status.subj)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'VAPID init failed', detail: message, missing: status.missing },
      { status: 500 }
    )
  }

  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id, pausedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })

  const payload = JSON.stringify({
    title: 'hearth',
    body: 'this is what a gentle nudge feels like.',
  })

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode
    // 410 Gone = subscription expired; clean it up
    if (statusCode === 410 || statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
      return NextResponse.json({ error: 'Subscription expired, removed' }, { status: 410 })
    }
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Send failed', detail: message }, { status: 500 })
  }
}
