import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { consumeToken } from '@/lib/letter-tokens'
import { safeDecrypt } from '@/lib/encryption'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const status = await consumeToken(token)
  if (!status.ok) {
    return NextResponse.json({ reason: status.reason }, { status: 410 })
  }

  const entry = await prisma.journalEntry.findUnique({
    where: { id: status.tokenRow.letterId },
    include: {
      photos: { select: { url: true, position: true, spread: true, rotation: true } },
      doodles: { select: { strokes: true, positionInEntry: true, spread: true } },
      user: { select: { name: true } },
    },
  })

  if (!entry) {
    return NextResponse.json({ reason: 'not_found' }, { status: 404 })
  }

  // Friend letters are server-side encrypted (see Plan B notes — true E2EE
  // isn't possible for time-delayed letters to non-account recipients).
  const senderName = safeDecrypt(entry.senderName) || entry.user.name || 'Someone special'
  const recipientName = safeDecrypt(entry.recipientName) || 'Friend'
  const text = safeDecrypt(entry.text)
  const letterLocation = safeDecrypt(entry.letterLocation)

  return NextResponse.json({
    text,
    senderName,
    recipientName,
    letterLocation,
    writtenAt: entry.createdAt,
    song: entry.song ?? null,
    photos: entry.photos,
    doodles: entry.doodles,
    readsRemaining: status.tokenRow.readsRemaining,
    expiresAt: status.tokenRow.expiresAt,
  })
}
