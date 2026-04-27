import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * Seal a letter draft. After sealing, isSealed=true makes the entry
 * immutable (the lock check in PUT /api/entries/[id] returns 403 for any
 * write). The cron job that delivers letters reads isSealed + unlockDate to
 * find letters whose time has come.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: {
        userId: true,
        entryType: true,
        isSealed: true,
        unlockDate: true,
        recipientEmail: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existing.entryType === 'normal') {
      return NextResponse.json({ error: 'Only letters can be sealed' }, { status: 400 })
    }
    if (existing.isSealed) {
      return NextResponse.json({ error: 'Already sealed' }, { status: 400 })
    }
    if (!existing.unlockDate) {
      return NextResponse.json(
        { error: 'Choose when this letter should arrive before sealing' },
        { status: 400 },
      )
    }

    await prisma.journalEntry.update({
      where: { id },
      data: { isSealed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sealing entry:', error)
    return NextResponse.json({ error: 'Failed to seal entry' }, { status: 500 })
  }
}
