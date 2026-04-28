// Scrapbook canvas — types & helpers

export type ScrapbookItemType = 'text' | 'sticker'

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
  color: string
  fontFamily: 'caveat' | 'playfair'
  fontSize: number // px at canvas's reference width
}

export interface StickerItemData extends BaseItem {
  type: 'sticker'
  stickerId: string
}

export type ScrapbookItem = TextItemData | StickerItemData

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
  return {
    id: makeId(),
    type: 'text',
    x: 30,
    y: 35,
    width: 40,
    height: 14,
    rotation: randomTilt(),
    z: nextZ(items),
    text,
    color: '#3a3429',
    fontFamily: 'caveat',
    fontSize: 28,
  }
}

export function makeStickerItem(stickerId: string, items: ScrapbookItem[]): StickerItemData {
  return {
    id: makeId(),
    type: 'sticker',
    x: 45,
    y: 45,
    width: 10,
    height: 10,
    rotation: randomTilt(),
    z: nextZ(items),
    stickerId,
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
