import { prisma } from '@/lib/db'

/**
 * Try to find an eligible random recipient for a stranger note from `senderId`.
 * Eligibility v1: any other user that exists.
 *
 * Uses a single SQL query with ORDER BY random() to keep selection cheap and
 * uniformly random at our scale. Revisit if user count crosses ~100k.
 *
 * Returns the recipient user id, or null if no eligible user exists.
 *
 * TODO BLOCKER before public launch: extend the eligibility predicate alongside
 * the moderation spec. Required additional WHERE clauses:
 *   - exclude users who set the receive-opt-out toggle (profile setting)
 *   - exclude shadow-suspended senders' candidate pools? (no — shadow-suspend
 *     is enforced at send-time, not match-time)
 *   - exclude soft-deleted accounts (when soft-delete is added)
 *   - exclude pairs where the recipient has reported this anonymous sender
 */
export async function pickRandomRecipient(senderId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM users
    WHERE id <> ${senderId}
    ORDER BY random()
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

/**
 * Atomically transition a queued note to delivered, assigning a recipient and
 * stamping matchedAt = now(). Bumps the recipient's strangerNotesReceived counter.
 *
 * Returns true if the note was matched, false if it was already non-queued
 * (e.g., raced by a concurrent matcher).
 */
export async function deliverNoteToRecipient(noteId: string, recipientId: string): Promise<boolean> {
  const result = await prisma.$transaction(async (tx) => {
    const update = await tx.strangerNote.updateMany({
      where: { id: noteId, status: 'queued' },
      data: { recipientId, matchedAt: new Date(), status: 'delivered' },
    })
    if (update.count === 0) return false
    await tx.user.update({
      where: { id: recipientId },
      data: { strangerNotesReceived: { increment: 1 } },
    })
    return true
  })
  return result
}

/**
 * Convenience wrapper — try to match an existing queued note. Returns true on
 * delivery; false if no eligible recipient or the note was no longer queued.
 */
export async function tryDeliverQueued(noteId: string, senderId: string): Promise<boolean> {
  const recipientId = await pickRandomRecipient(senderId)
  if (!recipientId) return false
  return deliverNoteToRecipient(noteId, recipientId)
}
