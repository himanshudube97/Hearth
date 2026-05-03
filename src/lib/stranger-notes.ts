import { encrypt, decrypt } from '@/lib/encryption'

// Min/max char length for outgoing note body (after trim).
export const MIN_NOTE_CHARS = 10
export const MAX_NOTE_CHARS = 200

// Max words for a reply.
export const MAX_REPLY_WORDS = 20

// 24h lifetime once delivered (note) or once written (reply).
export const NOTE_LIFETIME_MS = 24 * 60 * 60 * 1000
export const REPLY_LIFETIME_MS = 24 * 60 * 60 * 1000

export type NoteValidationError =
  | 'empty'
  | 'too_short'
  | 'too_long'

export type ReplyValidationError =
  | 'empty'
  | 'too_many_words'

export function validateNoteContent(raw: string): { ok: true; trimmed: string } | { ok: false; error: NoteValidationError } {
  const trimmed = (raw ?? '').trim()
  if (trimmed.length === 0) return { ok: false, error: 'empty' }
  if (trimmed.length < MIN_NOTE_CHARS) return { ok: false, error: 'too_short' }
  if (trimmed.length > MAX_NOTE_CHARS) return { ok: false, error: 'too_long' }
  return { ok: true, trimmed }
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export function validateReplyContent(raw: string): { ok: true; trimmed: string } | { ok: false; error: ReplyValidationError } {
  const trimmed = (raw ?? '').trim()
  if (trimmed.length === 0) return { ok: false, error: 'empty' }
  if (countWords(trimmed) > MAX_REPLY_WORDS) return { ok: false, error: 'too_many_words' }
  return { ok: true, trimmed }
}

/**
 * Returns true if the user is allowed to send a note now.
 * Rule: at most one note per calendar day in the user's timezone.
 *
 * `lastSentAt` is the User.lastStrangerNoteSentAt field.
 * `userTz` should come from the X-User-TZ request header (IANA name); falls back to UTC.
 */
export function canSendToday(lastSentAt: Date | null | undefined, userTz: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastSentAt) return true
  const tz = userTz && userTz.length > 0 ? userTz : 'UTC'
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    return fmt.format(lastSentAt) !== fmt.format(now)
  } catch {
    // Invalid TZ — fall back to UTC behavior
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
    return fmt.format(lastSentAt) !== fmt.format(now)
  }
}

export function encryptStrangerContent(plaintext: string): string {
  return encrypt(plaintext)
}

export function decryptStrangerContent(ciphertext: string): string {
  return decrypt(ciphertext)
}

/**
 * Compute the absolute expiry instant for a delivered note (24h from matchedAt).
 */
export function noteExpiresAt(matchedAt: Date): Date {
  return new Date(matchedAt.getTime() + NOTE_LIFETIME_MS)
}

/**
 * Compute the absolute expiry instant for a reply (24h from createdAt).
 */
export function replyExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + REPLY_LIFETIME_MS)
}
