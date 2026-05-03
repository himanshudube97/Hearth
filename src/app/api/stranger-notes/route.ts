import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  validateNoteContent,
  encryptStrangerContent,
  canSendToday,
} from '@/lib/stranger-notes'
import { tryDeliverQueued } from '@/lib/stranger-matcher'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const validation = validateNoteContent(body.content)
  if (!validation.ok) {
    const map: Record<typeof validation.error, string> = {
      empty: 'Write something first.',
      too_short: 'A little longer — at least 10 characters.',
      too_long: 'A little shorter — at most 200 characters.',
    }
    return NextResponse.json({ error: map[validation.error] }, { status: 400 })
  }

  // Daily rate limit (per user, per local calendar day).
  const userTz = req.headers.get('X-User-TZ')
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastStrangerNoteSentAt: true },
  })
  if (!canSendToday(userRow?.lastStrangerNoteSentAt ?? null, userTz)) {
    return NextResponse.json(
      { error: 'Your light is on its way. Come back tomorrow.' },
      { status: 429 }
    )
  }

  // TODO BLOCKER before public launch: run validation.trimmed through a
  // moderation API here. Reject (status 400) if flagged. Keep this comment
  // until the moderation spec ships.

  const ciphertext = encryptStrangerContent(validation.trimmed)

  const note = await prisma.strangerNote.create({
    data: {
      senderId: user.id,
      content: ciphertext,
      status: 'queued',
    },
    select: { id: true },
  })

  // Bump sender counter and rate-limit timestamp.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      strangerNotesSent: { increment: 1 },
      lastStrangerNoteSentAt: new Date(),
    },
  })

  // Try to deliver immediately. If no eligible recipient, leave queued for cron.
  const delivered = await tryDeliverQueued(note.id, user.id)

  return NextResponse.json(
    { id: note.id, status: delivered ? 'delivered' : 'queued' },
    { status: 201 }
  )
}
