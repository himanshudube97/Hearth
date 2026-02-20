import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeDecrypt } from '@/lib/encryption'

// GET - Fetch arrived self-letters that are ready to be revealed
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find self-letters (no recipientEmail) that have unlocked and are delivered
    // but haven't been viewed yet
    const arrivedLetters = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        entryType: 'letter',
        isSealed: true,
        recipientEmail: null, // Self-letters only
        unlockDate: {
          lte: now,
        },
        // Letter has been delivered (processed by cron) OR unlockDate has simply passed
        // We check both to handle cases before cron setup
      },
      orderBy: {
        unlockDate: 'asc', // Show oldest first
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        unlockDate: true,
        letterLocation: true,
        isDelivered: true,
        song: true,
        photos: {
          select: { url: true, position: true, spread: true, rotation: true }
        },
        doodles: {
          select: { strokes: true, positionInEntry: true, spread: true }
        },
      },
    })

    // Decrypt sensitive fields
    const decryptedLetters = arrivedLetters.map(letter => ({
      ...letter,
      text: safeDecrypt(letter.text),
      letterLocation: safeDecrypt(letter.letterLocation),
      song: letter.song,
      photos: letter.photos || [],
      doodles: letter.doodles || [],
    }))

    return NextResponse.json({
      letters: decryptedLetters,
      count: decryptedLetters.length,
    })
  } catch (error) {
    console.error('Error fetching arrived letters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch arrived letters' },
      { status: 500 }
    )
  }
}
