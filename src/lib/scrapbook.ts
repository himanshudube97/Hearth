// Scrapbook canvas — types & helpers

import type { ThemeName } from '@/lib/themes'

export type ScrapbookItemType =
  | 'text' | 'sticker' | 'photo' | 'song' | 'doodle'
  | 'clip' | 'mood' | 'stamp' | 'date'

export interface BaseItem {
  id: string
  // All coords are % of canvas (0–100)
  x: number
  y: number
  width: number
  height: number
  rotation: number // degrees
  z: number
}

export interface TextItemData extends BaseItem {
  type: 'text'
  text: string
  color: string // ink color
  bg: string // sticky note background
  tape: string // little tape strip color at top
  fontFamily: 'caveat' | 'playfair'
  fontSize: number // px at canvas's reference width
}

// Colorful sticky-note palettes — cycled when adding text items so a
// page naturally builds up a varied palette without choice paralysis.
export const NOTE_PALETTE = [
  { bg: '#fde68a', color: '#5a4020', tape: '#f3c74a' }, // sunny
  { bg: '#fbcfe8', color: '#5a2046', tape: '#e58cb4' }, // pink
  { bg: '#bae6fd', color: '#1a3a5a', tape: '#6fb6d8' }, // sky
  { bg: '#bbf7d0', color: '#1a4a2a', tape: '#7fc991' }, // mint
  { bg: '#fed7aa', color: '#5a2a1a', tape: '#ee9a66' }, // peach
  { bg: '#ddd6fe', color: '#3a2a5a', tape: '#a392e0' }, // lavender
]

export function isEditableType(type: ScrapbookItemType): boolean {
  return (
    type === 'text' ||
    type === 'photo' ||
    type === 'song' ||
    type === 'doodle' ||
    type === 'clip' ||
    type === 'stamp' ||
    type === 'date'
  )
}

export interface StickerItemData extends BaseItem {
  type: 'sticker'
  stickerId: string
}

export interface PhotoItemData extends BaseItem {
  type: 'photo'
  src: string | null // null = placeholder, awaiting upload/capture
  caption?: string
  polaroid: boolean
}

export interface SongItemData extends BaseItem {
  type: 'song'
  url: string
  title: string
  provider: 'spotify' | 'youtube' | 'apple' | 'soundcloud' | 'unknown'
}

export interface DoodleStroke {
  points: [number, number, number?][]
  color: string
  size: number
}

export interface DoodleItemData extends BaseItem {
  type: 'doodle'
  strokes: DoodleStroke[]
}

export type ClipVariant = 'index-card' | 'ticket-stub' | 'receipt'

export interface ClipItemData extends BaseItem {
  type: 'clip'
  variant: ClipVariant
  lines: string[] // e.g. ['L TRAIN · 04·28·26', 'Bedford → 1st']
}

export interface MoodItemData extends BaseItem {
  type: 'mood'
  level: 0 | 1 | 2 | 3 | 4
}

export interface StampItemData extends BaseItem {
  type: 'stamp'
  topLine: string
  midLine: string
  bottomLine: string
  ink: 'red' | 'blue' | 'black'
}

export interface DateItemData extends BaseItem {
  type: 'date'
  isoDate: string         // 'YYYY-MM-DD'
  displayText?: string    // user override; falls back to formatted isoDate
}

export type ScrapbookItem =
  | TextItemData
  | StickerItemData
  | PhotoItemData
  | SongItemData
  | DoodleItemData
  | ClipItemData
  | MoodItemData
  | StampItemData
  | DateItemData

export function makeId(): string {
  return Math.random().toString(36).slice(2, 11)
}

// Random tilt between -4° and +4° — never zero, that's the trick
export function randomTilt(): number {
  const sign = Math.random() < 0.5 ? -1 : 1
  return sign * (1 + Math.random() * 3)
}

export function nextZ(items: ScrapbookItem[]): number {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.z)) + 1
}

export function makeTextItem(text: string, items: ScrapbookItem[]): TextItemData {
  // Cycle palette by text-item count so adding feels varied but
  // deterministic — every Nth note is the same color.
  const textCount = items.filter((i) => i.type === 'text').length
  const swatch = NOTE_PALETTE[textCount % NOTE_PALETTE.length]
  return {
    id: makeId(),
    type: 'text',
    x: 30 + ((textCount * 7) % 18),
    y: 30 + ((textCount * 11) % 18),
    width: 28,
    height: 18,
    rotation: randomTilt(),
    z: nextZ(items),
    text,
    color: swatch.color,
    bg: swatch.bg,
    tape: swatch.tape,
    fontFamily: 'caveat',
    fontSize: 26,
  }
}

export function makeStickerItem(stickerId: string, items: ScrapbookItem[]): StickerItemData {
  // Washi tape is wider than it is tall; default to a strip shape
  const isWashi = stickerId === 'washi-tape'
  return {
    id: makeId(),
    type: 'sticker',
    x: isWashi ? 30 : 45,
    y: 45,
    width: isWashi ? 40 : 12,
    height: isWashi ? 6 : 12,
    rotation: randomTilt(),
    z: nextZ(items),
    stickerId,
  }
}

export function makePhotoItem(
  src: string | null,
  items: ScrapbookItem[],
): PhotoItemData {
  return {
    id: makeId(),
    type: 'photo',
    x: 30,
    y: 30,
    width: 28,
    height: 32,
    rotation: randomTilt(),
    z: nextZ(items),
    src,
    polaroid: true,
  }
}

export function makeSongItem(url: string, items: ScrapbookItem[]): SongItemData {
  return {
    id: makeId(),
    type: 'song',
    x: 30,
    y: 50,
    width: 40,
    height: 12,
    rotation: randomTilt(),
    z: nextZ(items),
    url,
    title: parseSongTitle(url),
    provider: parseSongProvider(url),
  }
}

export function makeDoodleItem(items: ScrapbookItem[]): DoodleItemData {
  return {
    id: makeId(),
    type: 'doodle',
    x: 35,
    y: 40,
    width: 30,
    height: 30,
    rotation: randomTilt(),
    z: nextZ(items),
    strokes: [],
  }
}

export function deriveSongMeta(url: string): { title: string; provider: SongItemData['provider'] } {
  return { title: parseSongTitle(url), provider: parseSongProvider(url) }
}

export function getSongEmbedUrl(item: SongItemData): { src: string; height: number } | null {
  const url = item.url
  if (item.provider === 'youtube') {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
    if (m) return { src: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1`, height: 180 }
  }
  if (item.provider === 'spotify') {
    const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/)
    if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`, height: 80 }
  }
  if (item.provider === 'apple') {
    return { src: url.replace('://music.apple.com', '://embed.music.apple.com'), height: 175 }
  }
  if (item.provider === 'soundcloud') {
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&color=%23ff7700&visual=false`,
      height: 120,
    }
  }
  return null
}

function parseSongProvider(url: string): SongItemData['provider'] {
  const u = url.toLowerCase()
  if (u.includes('spotify.com')) return 'spotify'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('music.apple.com')) return 'apple'
  if (u.includes('soundcloud.com')) return 'soundcloud'
  return 'unknown'
}

function parseSongTitle(url: string): string {
  // Best-effort: pull a slug out of common URLs. We deliberately skip
  // opaque IDs (YouTube video IDs, raw track hashes) and fall back to
  // a human label — users can rename inline.
  const provider = parseSongProvider(url)
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || ''

    // YouTube + short links: opaque 11-char IDs. Don't show these.
    if (provider === 'youtube') return 'a youtube song'

    // Spotify track/album/playlist URLs end in a 22-char base62 ID
    // and have a slug-free path — show provider rather than the ID.
    if (provider === 'spotify') return 'a spotify track'

    // Apple Music: paths often include a song slug like
    // /us/album/song-name/1234?i=5678 — pull the slug.
    if (provider === 'apple') {
      const slug = segments.find(
        (s) => /[a-z]/i.test(s) && !/^\d+$/.test(s) && s.length < 60,
      )
      if (slug) return decodeURIComponent(slug).replace(/-/g, ' ')
      return 'an apple music track'
    }

    // SoundCloud: /artist/track-name
    if (provider === 'soundcloud' && last) {
      return decodeURIComponent(last).replace(/-/g, ' ').slice(0, 60)
    }

    if (last && /[a-z]/i.test(last) && last.length < 60) {
      return decodeURIComponent(last).replace(/-/g, ' ')
    }
    return u.hostname
  } catch {
    return 'a song'
  }
}

export function clampToCanvas(item: ScrapbookItem): ScrapbookItem {
  // Allow items to peek slightly off the edge for that scrapbook feel
  const minX = -5
  const maxX = 100 - item.width + 5
  const minY = -5
  const maxY = 100 - item.height + 5
  return {
    ...item,
    x: Math.max(minX, Math.min(maxX, item.x)),
    y: Math.max(minY, Math.min(maxY, item.y)),
  }
}

export function lockAspectFor(type: ScrapbookItemType): boolean {
  return type === 'sticker' || type === 'photo'
}

export function minSizeFor(type: ScrapbookItemType): { w: number; h: number } {
  switch (type) {
    case 'sticker': return { w: 4, h: 4 }
    case 'text':    return { w: 12, h: 4 }
    case 'photo':   return { w: 12, h: 12 }
    case 'song':    return { w: 22, h: 6 }
    case 'doodle':  return { w: 12, h: 12 }
    case 'clip':    return { w: 16, h: 6 }
    case 'mood':    return { w: 6, h: 6 }
    case 'stamp':   return { w: 10, h: 10 }
    case 'date':    return { w: 14, h: 4 }
  }
}

export function makeClipItem(
  variant: ClipVariant,
  lines: string[],
  items: ScrapbookItem[],
): ClipItemData {
  const sizeByVariant: Record<ClipVariant, { width: number; height: number }> = {
    'index-card': { width: 26, height: 14 },
    'ticket-stub': { width: 24, height: 8 },
    'receipt': { width: 16, height: 14 },
  }
  const { width, height } = sizeByVariant[variant]
  return {
    id: makeId(),
    type: 'clip',
    x: 35,
    y: 50,
    width,
    height,
    rotation: randomTilt(),
    z: nextZ(items),
    variant,
    lines,
  }
}

export function makeMoodItem(level: 0 | 1 | 2 | 3 | 4, items: ScrapbookItem[]): MoodItemData {
  return {
    id: makeId(),
    type: 'mood',
    x: 50,
    y: 55,
    width: 8,
    height: 8,
    rotation: randomTilt(),
    z: nextZ(items),
    level,
  }
}

export function makeStampItem(
  topLine: string,
  midLine: string,
  bottomLine: string,
  items: ScrapbookItem[],
): StampItemData {
  return {
    id: makeId(),
    type: 'stamp',
    x: 70,
    y: 30,
    width: 14,
    height: 14,
    rotation: randomTilt() * 1.5,
    z: nextZ(items),
    topLine,
    midLine,
    bottomLine,
    ink: 'red',
  }
}

export function makeDateItem(date: Date, items: ScrapbookItem[]): DateItemData {
  const iso = date.toISOString().slice(0, 10)
  return {
    id: makeId(),
    type: 'date',
    x: 42,
    y: 6,
    width: 18,
    height: 5,
    rotation: 0,
    z: nextZ(items),
    isoDate: iso,
  }
}

// Default mood color palette — reused by MoodItem and any other surface
// that wants to render the 0-4 mood scale.
export const MOOD_COLORS: Record<number, string> = {
  0: '#5b6b7a', // Heavy — slate
  1: '#5e80a8', // Low — blue
  2: '#c97da3', // Tender — pink
  3: '#d39a4f', // Warm — amber
  4: '#d3a84f', // Radiant — gold
}

export type AttachmentKind =
  | 'pin'           // push-pin top-center
  | 'tape'          // washi tape top edge
  | 'corners'       // photo corners (four corners)
  | 'grommets'      // two grommets on left edge
  | 'paper-clip'    // tiny clip top-left
  | 'none'          // no attachment

export function attachmentForItem(item: ScrapbookItem): AttachmentKind {
  switch (item.type) {
    case 'text':    return 'pin'
    case 'photo':   return hashId(item.id) % 2 === 0 ? 'tape' : 'pin'
    case 'song':    return 'tape'
    case 'doodle':  return 'corners'
    case 'sticker': return 'none'
    case 'mood':    return 'none'
    case 'stamp':   return 'none'
    case 'date':    return 'pin'
    case 'clip':
      if (item.variant === 'ticket-stub') return 'grommets'
      if (item.variant === 'receipt')     return 'paper-clip'
      return 'pin'
  }
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Theme-aware paper colors. For now: cream paper for all themes (works
// well on the existing dark-leaning palette). Theme-specific paper packs
// can replace this map later without changing call sites.
export function paperForTheme(_themeName: ThemeName): {
  base: string
  grain: string
} {
  return {
    base: '#f3ead2',
    grain: 'rgba(120, 90, 50, 0.04)',
  }
}
