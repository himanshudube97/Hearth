// Scrapbook canvas — types & helpers

import type { ThemeName } from '@/lib/themes'

export type ScrapbookItemType = 'text' | 'sticker' | 'photo' | 'song' | 'doodle'

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
  return type === 'text' || type === 'photo' || type === 'song'
}

export interface StickerItemData extends BaseItem {
  type: 'sticker'
  stickerId: string
}

export interface PhotoItemData extends BaseItem {
  type: 'photo'
  src: string // data URL or remote URL
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

export type ScrapbookItem =
  | TextItemData
  | StickerItemData
  | PhotoItemData
  | SongItemData
  | DoodleItemData

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

export function makePhotoItem(src: string, items: ScrapbookItem[]): PhotoItemData {
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

function parseSongProvider(url: string): SongItemData['provider'] {
  const u = url.toLowerCase()
  if (u.includes('spotify.com')) return 'spotify'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('music.apple.com')) return 'apple'
  if (u.includes('soundcloud.com')) return 'soundcloud'
  return 'unknown'
}

function parseSongTitle(url: string): string {
  // Best-effort: pull a slug out of common URLs.
  // User can edit the title inline in the song card if they want.
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || u.hostname
    return decodeURIComponent(last)
      .replace(/-/g, ' ')
      .replace(/\?.*$/, '')
      .slice(0, 60)
  } catch {
    return url.slice(0, 40)
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
    case 'sticker':
      return { w: 4, h: 4 }
    case 'text':
      return { w: 12, h: 4 }
    case 'photo':
      return { w: 12, h: 12 }
    case 'song':
      return { w: 22, h: 6 }
    case 'doodle':
      return { w: 12, h: 12 }
  }
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
