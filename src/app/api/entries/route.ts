import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encrypt, decryptEntryFields } from '@/lib/encryption'

// Helper to strip HTML and create preview
function createPreview(html: string | null | undefined, maxLength = 150): string {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// GET - Fetch entries with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination params
    const cursor = searchParams.get('cursor') // Entry ID for cursor-based pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Filter params
    const year = searchParams.get('year') // e.g., "2024"
    const month = searchParams.get('month') // e.g., "2024-02"
    const mood = searchParams.get('mood') // e.g., "3" or "2,3,4" for multiple
    const search = searchParams.get('search') // Full text search
    const today = searchParams.get('today') === 'true' // Only today's entries
    const entryType = searchParams.get('entryType') // e.g., "letter" or "normal"

    // What to include
    const includeDoodles = searchParams.get('includeDoodles') !== 'false'
    const previewOnly = searchParams.get('previewOnly') === 'true' // Don't include full text

    // Build date range filter
    let dateFilter: { gte?: Date; lt?: Date } | undefined

    if (today) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      dateFilter = { gte: todayStart, lt: todayEnd }
    } else if (month) {
      // month format: "2024-02"
      const [y, m] = month.split('-').map(Number)
      const monthStart = new Date(y, m - 1, 1)
      const monthEnd = new Date(y, m, 1)
      dateFilter = { gte: monthStart, lt: monthEnd }
    } else if (year) {
      const y = parseInt(year)
      const yearStart = new Date(y, 0, 1)
      const yearEnd = new Date(y + 1, 0, 1)
      dateFilter = { gte: yearStart, lt: yearEnd }
    }

    // Build mood filter
    let moodFilter: number[] | undefined
    if (mood) {
      moodFilter = mood.split(',').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 4)
    }

    // Build where clause
    const where: {
      userId: string
      createdAt?: { gte?: Date; lt?: Date }
      mood?: { in: number[] }
      text?: { contains: string; mode: 'insensitive' }
      entryType?: string
    } = {
      userId: user.id,
    }

    if (dateFilter) {
      where.createdAt = dateFilter
    }

    if (moodFilter && moodFilter.length > 0) {
      where.mood = { in: moodFilter }
    }

    if (search) {
      where.text = { contains: search, mode: 'insensitive' }
    }

    if (entryType) {
      where.entryType = entryType
    }

    // Build query - always include all fields for simplicity
    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to check if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      include: {
        doodles: includeDoodles,
      },
    })

    // Check if there are more entries
    const hasMore = entries.length > limit
    const returnEntries = hasMore ? entries.slice(0, -1) : entries
    const nextCursor = hasMore ? returnEntries[returnEntries.length - 1]?.id : null

    // Decrypt and transform entries
    const transformedEntries = returnEntries.map(entry => {
      const decrypted = decryptEntryFields(entry)
      return {
        ...decrypted,
        // Generate preview on the fly if not stored
        textPreview: decrypted.textPreview || createPreview(decrypted.text),
        // Include doodles array even if empty
        doodles: entry.doodles || [],
      }
    })

    return NextResponse.json({
      entries: transformedEntries,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    })
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
    console.log('[POST /api/entries] Starting...')

    const user = await getCurrentUser()
    console.log('[POST /api/entries] User:', user ? user.id : 'null')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[POST /api/entries] Body:', JSON.stringify(body).slice(0, 200))

    const {
      text, mood, song, tags, doodles, entryType, unlockDate, isSealed,
      recipientEmail, recipientName, senderName, letterLocation
    } = body

    // Create preview from text (before encryption)
    const textPreview = createPreview(text)
    console.log('[POST /api/entries] Preview:', textPreview?.slice(0, 50))

    // Encrypt sensitive fields
    const encryptedText = encrypt(text)
    const encryptedTextPreview = encrypt(textPreview)
    const encryptedSenderName = senderName ? encrypt(senderName) : null
    const encryptedRecipientName = recipientName ? encrypt(recipientName) : null
    const encryptedLetterLocation = letterLocation ? encrypt(letterLocation) : null

    console.log('[POST /api/entries] Creating entry for user:', user.id)

    const entry = await prisma.journalEntry.create({
      data: {
        text: encryptedText,
        textPreview: encryptedTextPreview,
        mood: mood ?? 2,
        song: song || null,
        tags: tags ?? [],
        userId: user.id,
        entryType: entryType || 'normal',
        unlockDate: unlockDate ? new Date(unlockDate) : null,
        isSealed: isSealed ?? false,
        // Letter-specific fields (recipientEmail NOT encrypted - needed for sending)
        recipientEmail: recipientEmail || null,
        recipientName: encryptedRecipientName,
        senderName: encryptedSenderName,
        letterLocation: encryptedLetterLocation,
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

    console.log('[POST /api/entries] Created entry:', entry.id)

    // Decrypt before returning to client
    const decryptedEntry = decryptEntryFields(entry)
    return NextResponse.json(decryptedEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    // Return more details in development
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create entry', details: message },
      { status: 500 }
    )
  }
}
