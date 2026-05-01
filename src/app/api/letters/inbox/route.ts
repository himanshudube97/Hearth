// src/app/api/letters/inbox/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeDecrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

interface InboxLetter {
  id: string
  recipientName: string | null
  sealedAt: string
  unlockDate: string | null
  isViewed: boolean
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const letters = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      OR: [
        { entryType: 'letter', isSealed: true, unlockDate: { lte: now } },
        { isReceivedLetter: true },
      ],
    },
    orderBy: { unlockDate: 'desc' },
    select: {
      id: true,
      recipientName: true,
      createdAt: true,
      unlockDate: true,
      isViewed: true,
      encryptionType: true,
    },
  })

  const result: InboxLetter[] = letters.map(l => ({
    id: l.id,
    recipientName: l.recipientName && l.encryptionType === 'server'
      ? safeDecrypt(l.recipientName)
      : l.recipientName,
    sealedAt: l.createdAt.toISOString(),
    unlockDate: l.unlockDate ? l.unlockDate.toISOString() : null,
    isViewed: l.isViewed,
  }))

  return NextResponse.json({ letters: result })
}
