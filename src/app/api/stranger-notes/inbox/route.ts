import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  decryptStrangerContent,
  canSendToday,
  noteExpiresAt,
  replyExpiresAt,
} from '@/lib/stranger-notes'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userTz = req.headers.get('X-User-TZ')

  // Notes I have received (delivered or replied; not yet expired).
  const received = await prisma.strangerNote.findMany({
    where: {
      recipientId: user.id,
      status: { in: ['delivered', 'replied'] },
    },
    include: { reply: true },
    orderBy: { matchedAt: 'desc' },
  })

  // Replies to notes I sent.
  const replies = await prisma.strangerReply.findMany({
    where: {
      note: { senderId: user.id },
    },
    include: { note: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      lastStrangerNoteSentAt: true,
      strangerNotesSent: true,
      strangerNotesReceived: true,
    },
  })

  return NextResponse.json({
    receivedNotes: received.map((n) => ({
      id: n.id,
      content: decryptStrangerContent(n.content),
      matchedAt: n.matchedAt,
      expiresAt: n.matchedAt ? noteExpiresAt(n.matchedAt) : null,
      readAt: n.readAt,
      myReply: n.reply ? decryptStrangerContent(n.reply.content) : null,
    })),
    receivedReplies: replies.map((r) => ({
      id: r.id,
      content: decryptStrangerContent(r.content),
      createdAt: r.createdAt,
      expiresAt: replyExpiresAt(r.createdAt),
      readAt: r.readAt,
    })),
    canSendToday: canSendToday(userRow?.lastStrangerNoteSentAt ?? null, userTz),
    counters: {
      sent: userRow?.strangerNotesSent ?? 0,
      received: userRow?.strangerNotesReceived ?? 0,
    },
  })
}
