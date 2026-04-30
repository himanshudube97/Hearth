import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encrypt, decryptEntryFields } from '@/lib/encryption'
import { isEntryLocked, validateAppendOnlyDiff } from '@/lib/entry-lock'
import { parseStyle } from '@/lib/entry-style'

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
        photos: true,
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

    const isE2EE = entry.encryptionType === 'e2ee'
    const decryptedEntry = isE2EE ? entry : decryptEntryFields(entry)
    return NextResponse.json({
      ...decryptedEntry,
      encryptionType: entry.encryptionType,
      e2eeIV: entry.e2eeIV,
      spreads: entry.spreads,
      isArchived: entry.isArchived,
      photos: entry.photos,
      style: parseStyle(entry.style),
    })
  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    )
  }
}

// PUT - Update entry (only if owned by user)
// Supports append-only updates: add text, add photos, add doodles, add spreads
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

    // Load enough state up-front to run the lock check below. For letters we
    // also need entryType + isSealed because their lock semantics differ
    // (sealed = locked, draft = fully editable across days).
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: {
        userId: true,
        encryptionType: true,
        createdAt: true,
        text: true,
        song: true,
        mood: true,
        entryType: true,
        isSealed: true,
        style: true,
        photos: { select: { spread: true, position: true } },
        doodles: { select: { spread: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      text, mood, song, tags, encryptionType, e2eeIV,
      spreads, appendText, newPhotos, newDoodles,
      style,
      // Letter-only fields. Drafts can be edited freely; sealed letters reject
      // all writes via the lock check below.
      entryType, recipientEmail, recipientName, senderName, letterLocation, unlockDate,
    } = body

    const isE2EE = encryptionType === 'e2ee' || existing.encryptionType === 'e2ee'
    const isLetter = existing.entryType !== 'normal'

    // Lock check. Letters: sealed = full reject. Journal entries: calendar-day
    // → append-only diff allowed.
    const userTz = request.headers.get('x-user-tz') ?? 'UTC'
    const locked = isEntryLocked(existing.createdAt, userTz, {
      entryType: existing.entryType,
      isSealed: existing.isSealed,
    })
    if (locked) {
      if (isLetter) {
        return NextResponse.json(
          { error: 'This letter is sealed and cannot be modified' },
          { status: 403 },
        )
      }
      const decryptedExisting = isE2EE ? { text: existing.text } : decryptEntryFields({ text: existing.text })
      const diff = validateAppendOnlyDiff({
        oldText: decryptedExisting.text,
        newText: text,
        appendText,
        oldSong: existing.song,
        newSong: song,
        oldStyle: existing.style,
        newStyle: style,
        oldPhotos: existing.photos,
        newPhotoSlots: newPhotos?.map((p: { spread: number; position: number }) => ({
          spread: p.spread,
          position: p.position,
        })),
        oldDoodleSpreads: existing.doodles.map((d) => d.spread),
        newDoodleSpreads: newDoodles?.map((d: { spread?: number }) => d.spread ?? 1),
        oldMood: existing.mood,
        newMood: mood,
      })
      if (!diff.ok) {
        return NextResponse.json({ error: diff.reason }, { status: 403 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Handle text update (for append-only, we'd append to existing)
    if (text !== undefined) {
      const textPreview = !isE2EE ? createPreview(text) : '[Encrypted]'
      updateData.text = isE2EE ? text : encrypt(text)
      updateData.textPreview = isE2EE ? textPreview : encrypt(textPreview)
    }

    // Handle append text (for append-only editing)
    if (appendText) {
      const currentEntry = await prisma.journalEntry.findUnique({
        where: { id },
        select: { text: true },
      })
      if (currentEntry) {
        const decryptedCurrent = isE2EE ? currentEntry.text : decryptEntryFields({ text: currentEntry.text }).text
        const newText = `${decryptedCurrent}<p>${appendText}</p>`
        const textPreview = !isE2EE ? createPreview(newText) : '[Encrypted]'
        updateData.text = isE2EE ? newText : encrypt(newText)
        updateData.textPreview = isE2EE ? textPreview : encrypt(textPreview)
      }
    }

    if (mood !== undefined) updateData.mood = mood
    if (style !== undefined) {
      updateData.style = parseStyle(style)
    }
    if (song !== undefined) updateData.song = song
    if (tags !== undefined) updateData.tags = tags
    if (spreads !== undefined) updateData.spreads = spreads
    if (encryptionType !== undefined) updateData.encryptionType = encryptionType
    if (e2eeIV !== undefined) updateData.e2eeIV = e2eeIV

    // Letter fields. recipientEmail is plaintext (cron job needs it to look up
    // user / send the email). recipientName / senderName / letterLocation get
    // the same server-side encryption as text. unlockDate is a plain date.
    if (entryType !== undefined) updateData.entryType = entryType
    if (recipientEmail !== undefined) updateData.recipientEmail = recipientEmail || null
    if (recipientName !== undefined) {
      updateData.recipientName = recipientName
        ? (isE2EE ? recipientName : encrypt(recipientName))
        : null
    }
    if (senderName !== undefined) {
      updateData.senderName = senderName
        ? (isE2EE ? senderName : encrypt(senderName))
        : null
    }
    if (letterLocation !== undefined) {
      updateData.letterLocation = letterLocation
        ? (isE2EE ? letterLocation : encrypt(letterLocation))
        : null
    }
    if (unlockDate !== undefined) updateData.unlockDate = unlockDate ? new Date(unlockDate) : null

    // Update the entry
    await prisma.journalEntry.update({
      where: { id },
      data: updateData,
    })

    // Add new photos if provided (append-only)
    if (newPhotos && newPhotos.length > 0) {
      await prisma.entryPhoto.createMany({
        data: newPhotos.map((p: { url: string; position: number; spread: number; rotation?: number }) => ({
          entryId: id,
          url: p.url,
          position: p.position,
          spread: p.spread,
          rotation: p.rotation ?? 0,
        })),
        skipDuplicates: true, // Skip if photo already exists at position/spread
      })
    }

    // Add new doodles if provided (append-only)
    if (newDoodles && newDoodles.length > 0) {
      for (const d of newDoodles) {
        // Check if doodle exists for this spread
        const existingDoodle = await prisma.doodle.findFirst({
          where: { journalEntryId: id, spread: d.spread || 1 },
        })

        if (!existingDoodle) {
          await prisma.doodle.create({
            data: {
              journalEntryId: id,
              strokes: d.strokes,
              spread: d.spread || 1,
              positionInEntry: d.positionInEntry || 0,
            },
          })
        }
      }
    }

    // Fetch updated entry with all relations
    const updatedEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        doodles: true,
        photos: true,
      },
    })

    const responseIsE2EE = updatedEntry?.encryptionType === 'e2ee'
    const decryptedEntry = responseIsE2EE ? updatedEntry : decryptEntryFields(updatedEntry!)
    return NextResponse.json({
      ...decryptedEntry,
      encryptionType: updatedEntry?.encryptionType,
      e2eeIV: updatedEntry?.e2eeIV,
      spreads: updatedEntry?.spreads,
      isArchived: updatedEntry?.isArchived,
      photos: updatedEntry?.photos,
      style: parseStyle(updatedEntry?.style),
    })
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}

// PATCH - Archive/unarchive entry
export async function PATCH(
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
    const { isArchived } = body

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json({ error: 'isArchived must be a boolean' }, { status: 400 })
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { isArchived },
      include: {
        doodles: true,
        photos: true,
      },
    })

    return NextResponse.json({
      id: entry.id,
      isArchived: entry.isArchived,
      message: isArchived ? 'Entry archived' : 'Entry restored',
    })
  } catch (error) {
    console.error('Error archiving entry:', error)
    return NextResponse.json(
      { error: 'Failed to archive entry' },
      { status: 500 }
    )
  }
}

// DELETE - Permanently delete entry (only if owned by user)
// For two-step deletion: first archive (PATCH), then permanently delete (DELETE)
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
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Verify ownership
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: { userId: true, isArchived: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If not force delete and not archived, just archive it
    if (!force && !existing.isArchived) {
      const entry = await prisma.journalEntry.update({
        where: { id },
        data: { isArchived: true },
      })
      return NextResponse.json({
        id: entry.id,
        isArchived: true,
        message: 'Entry archived. Use DELETE with ?force=true or from archive view to permanently delete.',
      })
    }

    // Permanently delete
    await prisma.journalEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Entry permanently deleted' })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}
