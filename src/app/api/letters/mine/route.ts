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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Determine if letters are "arrived" (unlockDate has passed and it's a self letter)
    const now = new Date()
    const lettersWithStatus = letters.map(letter => ({
      ...letter,
      // Decrypt sensitive fields
      text: safeDecrypt(letter.text),
      letterLocation: safeDecrypt(letter.letterLocation),
      recipientName: safeDecrypt(letter.recipientName),
      // Format dates
      createdAt: letter.createdAt.toISOString(),
      unlockDate: letter.unlockDate?.toISOString() || null,
      hasArrived: letter.unlockDate && new Date(letter.unlockDate) <= now && !letter.recipientEmail,
    }))

    return NextResponse.json({ letters: lettersWithStatus })
  } catch (error) {
    console.error('Failed to fetch letters:', error)
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 })
  }
}
