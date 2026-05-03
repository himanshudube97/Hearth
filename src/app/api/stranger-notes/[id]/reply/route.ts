import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  validateReplyContent,
  encryptStrangerContent,
} from '@/lib/stranger-notes'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const validation = validateReplyContent(body.content)
  if (!validation.ok) {
    const map: Record<typeof validation.error, string> = {
      empty: 'Write something first.',
      too_many_words: 'Twenty words at most.',
    }
    return NextResponse.json({ error: map[validation.error] }, { status: 400 })
  }

  const note = await prisma.strangerNote.findUnique({
    where: { id },
    select: { recipientId: true, status: true, reply: { select: { id: true } } },
  })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (note.status !== 'delivered') {
    return NextResponse.json({ error: 'This note can no longer be replied to.' }, { status: 409 })
  }
  if (note.reply) {
    return NextResponse.json({ error: 'You have already replied.' }, { status: 409 })
  }

  // TODO BLOCKER before public launch: moderation pre-check on reply text too.

  const ciphertext = encryptStrangerContent(validation.trimmed)

  // Atomic claim: only proceed if the note is still 'delivered'. Mirrors the
  // matcher's queued→delivered pattern. Protects against concurrent reply
  // requests (e.g., recipient double-tap, or a race with cron expiry) slipping
  // past the pre-check above.
  const claimed = await prisma.$transaction(async (tx) => {
    const updated = await tx.strangerNote.updateMany({
      where: { id, status: 'delivered' },
      data: { status: 'replied' },
    })
    if (updated.count === 0) return false
    await tx.strangerReply.create({
      data: { noteId: id, content: ciphertext },
    })
    return true
  })

  if (!claimed) {
    return NextResponse.json(
      { error: 'This note can no longer be replied to.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
