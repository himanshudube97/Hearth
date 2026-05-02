// Helpers for the scrapbook listing scene: month grouping, picker bounds,
// deterministic sticker/color assignment, date formatting, and adaptive
// card sizing.

export interface ScrapbookSummary {
  id: string
  title: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

export const MONTHS = [
  'JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',
] as const

export const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
] as const

export const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
] as const

export type StickerKey = 'heart' | 'star' | 'leaf' | 'flower' | 'sparkle' | 'sun' | 'moon'

const STICKER_KEYS: StickerKey[] = ['heart','star','leaf','flower','sparkle','sun','moon']

const BAND_PALETTE = [
  '#a85a4a', '#6a8a6a', '#8a6a3a', '#4a5a7a', '#6a4a7a',
  '#9a5a4a', '#4a7a6a', '#8a3a3a', '#3a6a5a', '#b08a4a',
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function stickerForId(id: string): StickerKey {
  return STICKER_KEYS[hashId(id) % STICKER_KEYS.length]
}

export function bandColorForId(id: string): string {
  return BAND_PALETTE[hashId(id) % BAND_PALETTE.length]
}

export function stickerGlyph(s: StickerKey): string {
  switch (s) {
    case 'heart':   return '♥'
    case 'star':    return '★'
    case 'leaf':    return '❦'
    case 'flower':  return '✿'
    case 'sparkle': return '✦'
    case 'sun':     return '☀'
    case 'moon':    return '☾'
  }
}

export function dateLabel(iso: string) {
  const d = new Date(iso)
  return {
    day: d.getDate(),
    monthShort: MONTH_SHORT[d.getMonth()],
    year: d.getFullYear(),
  }
}

/** Group scrapbooks by year+month using browser-local time. Mirrors `groupInboxByMonth`. */
export function groupByMonth(books: ScrapbookSummary[]) {
  const grouped: Record<number, Record<number, ScrapbookSummary[]>> = {}
  for (const b of books) {
    const d = new Date(b.createdAt)
    const y = d.getFullYear()
    const m = d.getMonth()
    if (!grouped[y]) grouped[y] = {}
    if (!grouped[y][m]) grouped[y][m] = []
    grouped[y][m].push(b)
  }
  for (const yKey of Object.keys(grouped)) {
    const y = +yKey
    for (const mKey of Object.keys(grouped[y])) {
      grouped[y][+mKey].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }
  }
  return grouped
}

export function pickerBounds(books: ScrapbookSummary[]) {
  const today = new Date()
  const years = books.map(b => new Date(b.createdAt).getFullYear())
  const yearMin = years.length ? Math.min(...years) : today.getFullYear()
  const yearMax = today.getFullYear()
  const monthMaxForCurrentYear = today.getMonth()
  return { yearMin, yearMax, monthMaxForCurrentYear }
}

export type CardSize = 'lg' | 'md' | 'sm'

export function cardSizeForCount(n: number): CardSize {
  if (n <= 12) return 'lg'
  if (n <= 24) return 'md'
  return 'sm'
}
