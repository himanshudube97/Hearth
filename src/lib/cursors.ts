// Cursor definitions with SVG data URIs
export type CursorName = 'golden' | 'quill' | 'leaf' | 'star' | 'heart' | 'moon' | 'feather' | 'crystal'

export interface CursorSet {
  name: string
  description: string
  default: string
  pointer: string
  text: string
  hotspot: { x: number; y: number }
  pointerHotspot: { x: number; y: number }
  textHotspot: { x: number; y: number }
}

export const cursors: Record<CursorName, CursorSet> = {
  golden: {
    name: 'Golden Orb',
    description: 'Warm golden dot',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='6' cy='6' r='5' fill='%23D4A84B' stroke='%235E8B5A' stroke-width='1.5'/%3E%3Ccircle cx='6' cy='6' r='2' fill='%23081408'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 2 L4 18 L8 14 L12 22 L15 20 L11 12 L17 12 Z' fill='%23D4A84B' stroke='%235E8B5A' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23D4A84B' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 6, y: 6 },
    pointerHotspot: { x: 4, y: 2 },
    textHotspot: { x: 8, y: 12 },
  },
  quill: {
    name: 'Quill Pen',
    description: 'Elegant writing quill',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M26 2C20 8 14 16 8 24L6 30L12 28C18 22 24 14 28 6C28 4 26 2 26 2Z' fill='%23F5E6D3' stroke='%238B4513' stroke-width='1.5'/%3E%3Cpath d='M8 24L6 30L12 28' fill='%238B4513'/%3E%3Cpath d='M10 22C14 18 20 12 24 6' stroke='%23D4A84B' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M26 2C20 8 14 16 8 24L6 30L12 28C18 22 24 14 28 6C28 4 26 2 26 2Z' fill='%23FFE4B5' stroke='%238B4513' stroke-width='2'/%3E%3Cpath d='M8 24L6 30L12 28' fill='%23D4A84B'/%3E%3Cpath d='M10 22C14 18 20 12 24 6' stroke='%23D4A84B' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M26 2C20 8 14 16 8 24L6 30L12 28C18 22 24 14 28 6C28 4 26 2 26 2Z' fill='%23F5E6D3' stroke='%238B4513' stroke-width='1.5'/%3E%3Cpath d='M8 24L6 30L12 28' fill='%238B4513'/%3E%3C/svg%3E")`,
    hotspot: { x: 6, y: 30 },
    pointerHotspot: { x: 6, y: 30 },
    textHotspot: { x: 6, y: 30 },
  },
  leaf: {
    name: 'Forest Leaf',
    description: 'Nature-inspired leaf',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M4 24C4 24 6 14 14 8C22 2 26 4 26 4C26 4 24 12 16 18C8 24 4 24 4 24Z' fill='%235E8B5A' stroke='%233D5C3A' stroke-width='1.5'/%3E%3Cpath d='M4 24C8 20 14 14 20 8' stroke='%233D5C3A' stroke-width='1' fill='none'/%3E%3Cpath d='M10 18C12 16 14 14 16 12' stroke='%2390C67C' stroke-width='0.75' fill='none'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M4 24C4 24 6 14 14 8C22 2 26 4 26 4C26 4 24 12 16 18C8 24 4 24 4 24Z' fill='%2390C67C' stroke='%233D5C3A' stroke-width='2'/%3E%3Cpath d='M4 24C8 20 14 14 20 8' stroke='%233D5C3A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%235E8B5A' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 4, y: 24 },
    pointerHotspot: { x: 4, y: 24 },
    textHotspot: { x: 8, y: 12 },
  },
  star: {
    name: 'Twinkling Star',
    description: 'Magical starlight',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5Z' fill='%23FFD700' stroke='%23DAA520' stroke-width='1'/%3E%3Cpath d='M8 5L8.5 7.5L11 8L8.5 8.5L8 11L7.5 8.5L5 8L7.5 7.5Z' fill='%23FFFACD'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8Z' fill='%23FFD700' stroke='%23DAA520' stroke-width='1.5'/%3E%3Cpath d='M10 6L11 9L14 10L11 11L10 14L9 11L6 10L9 9Z' fill='%23FFFACD'/%3E%3Ccircle cx='20' cy='4' r='2' fill='%23FFD700'/%3E%3Ccircle cx='22' cy='16' r='1.5' fill='%23FFD700' opacity='0.7'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23FFD700' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 8, y: 8 },
    pointerHotspot: { x: 10, y: 10 },
    textHotspot: { x: 8, y: 12 },
  },
  heart: {
    name: 'Warm Heart',
    description: 'Gentle loving heart',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 21C12 21 3 13 3 8C3 4 6 2 9 2C10.5 2 12 3 12 5C12 3 13.5 2 15 2C18 2 21 4 21 8C21 13 12 21 12 21Z' fill='%23E8A0A0' stroke='%23C67070' stroke-width='1.5'/%3E%3Cellipse cx='7' cy='7' rx='2' ry='1.5' fill='%23FFB6C1' opacity='0.6'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M14 24C14 24 4 15 4 9C4 4.5 7.5 2 11 2C12.8 2 14 3.5 14 6C14 3.5 15.2 2 17 2C20.5 2 24 4.5 24 9C24 15 14 24 14 24Z' fill='%23FF8A8A' stroke='%23C67070' stroke-width='2'/%3E%3Cellipse cx='9' cy='8' rx='2.5' ry='2' fill='%23FFB6C1' opacity='0.7'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23E8A0A0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 12, y: 12 },
    pointerHotspot: { x: 14, y: 14 },
    textHotspot: { x: 8, y: 12 },
  },
  moon: {
    name: 'Crescent Moon',
    description: 'Dreamy night moon',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M16 4C10 4 6 9 6 14C6 19 10 22 16 22C12 22 8 18 8 12C8 6 12 4 16 4Z' fill='%23F4E99B' stroke='%23DAA520' stroke-width='1.5'/%3E%3Ccircle cx='18' cy='6' r='1' fill='%23FFFACD'/%3E%3Ccircle cx='20' cy='10' r='0.5' fill='%23FFFACD'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M18 4C11 4 6 10 6 16C6 22 11 26 18 26C13 26 9 21 9 14C9 7 13 4 18 4Z' fill='%23FFE87C' stroke='%23DAA520' stroke-width='2'/%3E%3Ccircle cx='21' cy='7' r='1.5' fill='%23FFFACD'/%3E%3Ccircle cx='24' cy='12' r='1' fill='%23FFFACD'/%3E%3Ccircle cx='22' cy='18' r='0.75' fill='%23FFFACD'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23F4E99B' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 10, y: 12 },
    pointerHotspot: { x: 12, y: 14 },
    textHotspot: { x: 8, y: 12 },
  },
  feather: {
    name: 'Soft Feather',
    description: 'Light as air',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M24 2C24 2 22 6 18 10C14 14 8 18 4 26' stroke='%23A0522D' stroke-width='1.5' fill='none'/%3E%3Cpath d='M24 2C20 4 16 8 14 12C16 10 20 6 24 2Z' fill='%23DEB887' stroke='%23A0522D' stroke-width='1'/%3E%3Cpath d='M14 12C10 16 6 20 4 26C6 22 10 16 14 12Z' fill='%23F5DEB3' stroke='%23A0522D' stroke-width='1'/%3E%3Cpath d='M18 6C16 8 14 10 12 14' stroke='%23D2B48C' stroke-width='0.75' fill='none'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M28 2C28 2 25 7 20 12C15 17 8 22 4 30' stroke='%238B4513' stroke-width='2' fill='none'/%3E%3Cpath d='M28 2C23 5 18 10 15 15C18 12 23 7 28 2Z' fill='%23DEB887' stroke='%238B4513' stroke-width='1.5'/%3E%3Cpath d='M15 15C10 20 6 25 4 30C7 26 11 20 15 15Z' fill='%23FAEBD7' stroke='%238B4513' stroke-width='1.5'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23DEB887' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 4, y: 26 },
    pointerHotspot: { x: 4, y: 30 },
    textHotspot: { x: 8, y: 12 },
  },
  crystal: {
    name: 'Magic Crystal',
    description: 'Mystical gem',
    default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L4 10L12 22L20 10Z' fill='%23B19CD9' stroke='%238B7CB3' stroke-width='1.5'/%3E%3Cpath d='M12 2L8 10L12 22' fill='%23D8BFD8' stroke='none'/%3E%3Cpath d='M12 2L12 22' stroke='%239370DB' stroke-width='0.5'/%3E%3Cpath d='M4 10L20 10' stroke='%239370DB' stroke-width='0.5'/%3E%3C/svg%3E")`,
    pointer: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M14 2L5 12L14 26L23 12Z' fill='%23DA70D6' stroke='%238B7CB3' stroke-width='2'/%3E%3Cpath d='M14 2L9 12L14 26' fill='%23E6E6FA' stroke='none'/%3E%3Cpath d='M14 2L14 26' stroke='%23BA55D3' stroke-width='0.75'/%3E%3Cpath d='M5 12L23 12' stroke='%23BA55D3' stroke-width='0.75'/%3E%3Ccircle cx='12' cy='8' r='1.5' fill='white' opacity='0.5'/%3E%3C/svg%3E")`,
    text: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 4 Q8 4 8 6 L8 18 Q8 20 6 20 M10 4 Q8 4 8 6 L8 18 Q8 20 10 20 M8 12 L6 12 M8 12 L10 12' fill='none' stroke='%23B19CD9' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    hotspot: { x: 12, y: 12 },
    pointerHotspot: { x: 14, y: 14 },
    textHotspot: { x: 8, y: 12 },
  },
}

export const cursorIcons: Record<CursorName, string> = {
  golden: '🔮',
  quill: '🪶',
  leaf: '🍃',
  star: '⭐',
  heart: '💗',
  moon: '🌙',
  feather: '🪽',
  crystal: '💎',
}
