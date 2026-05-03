import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  validateNoteContent,
  encryptStrangerContent,
} from '@/lib/stranger-notes'
import { tryDeliverQueued } from '@/lib/stranger-matcher'

function safeIanaTz(raw: string | null | undefined): string {
  const candidate = raw && raw.length > 0 ? raw : 'UTC'
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: candidate })
    return candidate
  } catch {
    return 'UTC'
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
  }

  const validation = validateNoteContent(body.content)
  if (!validation.ok) {
    const map: Record<typeof validation.error, string> = {
      empty: 'Write something first.',
      too_short: 'A little longer — at least 10 characters.',
      too_long: 'A little shorter — at most 200 characters.',
    }
    return NextResponse.json({ error: map[validation.error] }, { status: 400 })
  }

  // TODO BLOCKER before public launch: run validation.trimmed through a
  // moderation API here. Reject (status 400) if flagged. Keep this comment
  // until the moderation spec ships.

  const ciphertext = encryptStrangerContent(validation.trimmed)
  const tz = safeIanaTz(req.headers.get('X-User-TZ'))
  const now = new Date()

  // Atomic daily-rate-limit claim + note creation.
  // The conditional UPDATE checks the user's local-day boundary in SQL so
  // two concurrent sends cannot both pass: only the first request whose
  // UPDATE matches "lastStrangerNoteSentAt is null OR is on an earlier
  // calendar day in the user's tz" will succeed and increment the counter.
  // The second request's UPDATE will affect 0 rows and we return 429.
  // Wrapping the create + claim in a transaction also ensures that if note
  // creation fails after the claim, the slot is rolled back and the user
  // can retry. (Fixes the partial-failure and TOCTOU windows the prior
  // read-then-write pattern allowed.)
  const noteId = await prisma.$transaction(async (tx) => {
    const claimedCount = await tx.$executeRaw`
      UPDATE users
      SET "lastStrangerNoteSentAt" = ${now},
          "strangerNotesSent" = "strangerNotesSent" + 1
      WHERE id = ${user.id}
        AND ("lastStrangerNoteSentAt" IS NULL
             OR date_trunc('day', "lastStrangerNoteSentAt" AT TIME ZONE ${tz})
                < date_trunc('day', ${now}::timestamptz AT TIME ZONE ${tz}))
    `
    if (claimedCount === 0) return null

    const note = await tx.strangerNote.create({
      data: {
        senderId: user.id,
        content: ciphertext,
        status: 'queued',
      },
      select: { id: true },
    })
    return note.id
  })

  if (noteId === null) {
    return NextResponse.json(
      { error: 'Your light is on its way. Come back tomorrow.' },
      { status: 429 }
    )
  }

  // Try to deliver immediately. tryDeliverQueued runs its own transaction
  // for the queued→delivered flip + recipient counter bump, so it stays
  // outside the claim transaction here.
  const delivered = await tryDeliverQueued(noteId, user.id)

  return NextResponse.json(
    { id: noteId, status: delivered ? 'delivered' : 'queued' },
    { status: 201 }
  )
}
