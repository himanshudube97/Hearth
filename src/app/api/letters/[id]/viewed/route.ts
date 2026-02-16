import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the letter belongs to the user and is a self-letter
    const letter = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: user.id,
        entryType: 'letter',
        recipientEmail: null, // Self-letter only
      },
    })

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    // Mark as viewed
    await prisma.journalEntry.update({
      where: { id },
      data: { isViewed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark letter as viewed:', error)
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 })
  }
}
