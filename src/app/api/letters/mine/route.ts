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
        isReceivedLetter: false,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        unlockDate: true,
        isSealed: true,
        letterLocation: true,
        recipientEmail: true,
        recipientName: true,
        isViewed: true,
        song: true,
        encryptionType: true,
        e2eeIVs: true,
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

    // For E2EE letters, return ciphertext + IVs untouched so the client can
    // decrypt with its master key. For server-encrypted, decrypt server-side.
    const now = new Date()
    const lettersWithStatus = letters.map(letter => {
      const isE2EE = letter.encryptionType === 'e2ee'
      return {
        ...letter,
        text: isE2EE ? letter.text : safeDecrypt(letter.text),
        letterLocation: isE2EE ? letter.letterLocation : safeDecrypt(letter.letterLocation),
        recipientName: isE2EE ? letter.recipientName : safeDecrypt(letter.recipientName),
        createdAt: letter.createdAt.toISOString(),
        unlockDate: letter.unlockDate?.toISOString() || null,
        hasArrived: letter.unlockDate && new Date(letter.unlockDate) <= now && !letter.recipientEmail,
        song: letter.song,
        photos: letter.photos || [],
        doodles: letter.doodles || [],
      }
    })

    return NextResponse.json({ letters: lettersWithStatus })
  } catch (error) {
    console.error('Failed to fetch letters:', error)
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 })
  }
}
