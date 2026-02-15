import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch all entries for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doodles: true,
      },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}

// POST - Create new entry for current user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, mood, song, tags, doodles } = body

    const entry = await prisma.journalEntry.create({
      data: {
        text,
        mood: mood ?? 2,
        song,
        tags: tags ?? [],
        userId: user.id,
        doodles: doodles && doodles.length > 0
          ? {
              create: doodles.map((d: { strokes: unknown; positionInEntry?: number }, index: number) => ({
                strokes: d.strokes,
                positionInEntry: d.positionInEntry ?? index,
              })),
            }
          : undefined,
      },
      include: {
        doodles: true,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    )
  }
}
