// src/components/letters/lettersData.ts
import type { InboxLetter } from './letterTypes'

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const
export const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'] as const

/** Group inbox letters by `unlockDate` into year → month → letters[]. */
export function groupInboxByMonth(letters: InboxLetter[]) {
  const out: Record<number, Record<typeof MONTHS[number], InboxLetter[]>> = {}
  for (const l of letters) {
    if (!l.unlockDate) continue
    const d = new Date(l.unlockDate)
    const y = d.getFullYear()
    const m = MONTHS[d.getMonth()]
    if (!out[y]) out[y] = {} as Record<typeof MONTHS[number], InboxLetter[]>
    if (!out[y][m]) out[y][m] = []
    out[y][m].push(l)
  }
  return out
}

/** Total unread (across all months/years). */
export function countUnread(letters: InboxLetter[]) {
  return letters.filter(l => !l.isViewed).length
}
