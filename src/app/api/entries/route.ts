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
      // Only server-decrypt entries that use server encryption
      // E2EE entries are decrypted client-side
      const isE2EE = entry.encryptionType === 'e2ee'
      const decrypted = isE2EE ? entry : decryptEntryFields(entry)

      return {
        ...decrypted,
        // Generate preview on the fly if not stored (only for server-encrypted)
        textPreview: isE2EE ? decrypted.textPreview : (decrypted.textPreview || createPreview(decrypted.text)),
        // Include doodles array even if empty
        doodles: entry.doodles || [],
        // Include E2EE fields
        encryptionType: entry.encryptionType,
        e2eeIV: entry.e2eeIV,
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
      recipientEmail, recipientName, senderName, letterLocation,
      encryptionType, e2eeIV // E2EE fields
    } = body

    // Check if this is an E2EE entry (already encrypted client-side)
    const isE2EE = encryptionType === 'e2ee'

    // Create preview from text (before encryption) - only for server-encrypted entries
    // For E2EE entries, we can't create a meaningful preview since text is encrypted
    const textPreview = isE2EE ? '[Encrypted]' : createPreview(text)
    console.log('[POST /api/entries] Preview:', textPreview?.slice(0, 50), 'E2EE:', isE2EE)

    // Encrypt sensitive fields only for server-encrypted entries
    // E2EE entries are already encrypted client-side
    const encryptedText = isE2EE ? text : encrypt(text)
    const encryptedTextPreview = isE2EE ? textPreview : encrypt(textPreview)
    const encryptedSenderName = senderName ? (isE2EE ? senderName : encrypt(senderName)) : null
    const encryptedRecipientName = recipientName ? (isE2EE ? recipientName : encrypt(recipientName)) : null
    const encryptedLetterLocation = letterLocation ? (isE2EE ? letterLocation : encrypt(letterLocation)) : null

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
        // E2EE fields
        encryptionType: encryptionType || 'server',
        e2eeIV: e2eeIV || null,
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

    // Only server-decrypt if it's a server-encrypted entry
    // E2EE entries are returned as-is for client-side decryption
    const responseEntry = isE2EE ? entry : decryptEntryFields(entry)
    return NextResponse.json({
      ...responseEntry,
      encryptionType: entry.encryptionType,
      e2eeIV: entry.e2eeIV,
    }, { status: 201 })
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
