/**
 * Server-side helpers for the calendar-day lock + append-only diff check.
 *
 * The lock window is "the same calendar date as createdAt, in the user's
 * local timezone." We accept the IANA tz from the client; if it's missing or
 * invalid we fall back to UTC. Travelling across timezones gives the user a
 * slightly different window — that's an acceptable edge case.
 */

function dayKey(date: Date, tz: string): string {
  // YYYY-MM-DD in the given tz. en-CA happens to format that way.
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }
}

export interface EntryLockOpts {
  /** Entry kind. 'normal' (or undefined) → calendar-day lock applies. Anything
   *  else (letter, unsent_letter, ephemeral) → lock only when sealed. */
  entryType?: string | null
  isSealed?: boolean | null
}

export function isEntryLocked(
  createdAt: Date | string,
  tz: string = 'UTC',
  opts?: EntryLockOpts,
): boolean {
  // Letters are time-locked by sealing, not by the calendar day. While a
  // letter draft is unsealed it stays fully editable across days; once sealed
  // it becomes immutable until delivery.
  if (opts?.entryType && opts.entryType !== 'normal') {
    return opts.isSealed === true
  }
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return dayKey(created, tz) !== dayKey(new Date(), tz)
}

export interface LockedDiffInput {
  oldText: string                  // already decrypted plain HTML
  newText?: string                 // candidate replacement (full replace)
  appendText?: string              // candidate append
  oldSong: string | null
  newSong?: string | null
  oldPhotos: { spread: number; position: number }[]
  newPhotoSlots?: { spread: number; position: number }[]
  oldDoodleSpreads: number[]
  newDoodleSpreads?: number[]
  oldMood: number
  newMood?: number
  oldStyle: unknown            // existing JournalEntry.style as stored (Prisma Json)
  newStyle?: unknown           // candidate replacement
}

export type DiffResult = { ok: true } | { ok: false; reason: string }

export function validateAppendOnlyDiff(input: LockedDiffInput): DiffResult {
  if (input.newMood !== undefined && input.newMood !== input.oldMood) {
    return { ok: false, reason: 'Mood is locked after the day of writing' }
  }
  if (input.newStyle !== undefined) {
    const oldJson = JSON.stringify(input.oldStyle ?? null)
    const newJson = JSON.stringify(input.newStyle ?? null)
    if (oldJson !== newJson) {
      return { ok: false, reason: 'Entry style is locked after the day of writing' }
    }
  }
  if (input.newSong !== undefined && input.oldSong && input.newSong !== input.oldSong) {
    return { ok: false, reason: 'Song is locked once added' }
  }
  if (input.newText !== undefined && input.newText !== input.oldText) {
    return { ok: false, reason: 'Existing text is locked; only new lines can be added' }
  }
  if (input.newPhotoSlots) {
    for (const slot of input.newPhotoSlots) {
      const taken = input.oldPhotos.some(p => p.spread === slot.spread && p.position === slot.position)
      if (taken) return { ok: false, reason: 'A photo already exists in that slot' }
    }
  }
  if (input.newDoodleSpreads) {
    for (const s of input.newDoodleSpreads) {
      if (input.oldDoodleSpreads.includes(s)) {
        return { ok: false, reason: 'A doodle already exists for that spread' }
      }
    }
  }
  return { ok: true }
}
