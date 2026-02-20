import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeDecrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const letters = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        entryType: 'letter',
        isReceivedLetter: true,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        unlockDate: true,
        isSealed: true,
        letterLocation: true,
        senderName: true,
        originalSenderId: true,
        isViewed: true,
        isDelivered: true,
        deliveredAt: true,
        song: true,
        photos: {
          select: { url: true, position: true, spread: true, rotation: true }
        },
        doodles: {
          select: { strokes: true, positionInEntry: true, spread: true }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Determine if letters have arrived and decrypt sensitive fields
    const now = new Date()
    const lettersWithStatus = letters.map(letter => ({
      ...letter,
      // Decrypt sensitive fields
      text: safeDecrypt(letter.text),
      letterLocation: safeDecrypt(letter.letterLocation),
      senderName: safeDecrypt(letter.senderName),
      // Format dates
      createdAt: letter.createdAt.toISOString(),
      unlockDate: letter.unlockDate?.toISOString() || null,
      deliveredAt: letter.deliveredAt?.toISOString() || null,
      hasArrived: letter.unlockDate ? new Date(letter.unlockDate) <= now : true,
    }))

    return NextResponse.json({ letters: lettersWithStatus })
  } catch (error) {
    console.error('Failed to fetch received letters:', error)
    return NextResponse.json({ error: 'Failed to fetch received letters' }, { status: 500 })
  }
}
