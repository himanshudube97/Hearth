import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encrypt, decryptEntryFields } from '@/lib/encryption'

// Helper to strip HTML and create preview
function createPreview(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// GET - Fetch single entry (only if owned by user)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        doodles: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    if (entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Decrypt before returning
    const decryptedEntry = decryptEntryFields(entry)
    return NextResponse.json(decryptedEntry)
  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    )
  }
}

// PUT - Update entry (only if owned by user)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { text, mood, song, tags } = body

    // Create preview from text (before encryption)
    const textPreview = text ? createPreview(text) : undefined

    // Encrypt text fields if provided
    const encryptedText = text ? encrypt(text) : undefined
    const encryptedTextPreview = textPreview ? encrypt(textPreview) : undefined

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(encryptedText && { text: encryptedText }),
        ...(encryptedTextPreview && { textPreview: encryptedTextPreview }),
        mood,
        song,
        tags,
      },
      include: {
        doodles: true,
      },
    })

    // Decrypt before returning
    const decryptedEntry = decryptEntryFields(entry)
    return NextResponse.json(decryptedEntry)
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}

// DELETE - Delete entry (only if owned by user)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.journalEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}
