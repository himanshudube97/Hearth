// Mirrors src/components/constellation/garden/rose/roseHash.ts.
// Maps entry id → stable slot/tilt/glow so the same memory always
// sits in the same window when surfaced.

// Number of slots on the desktop cottage wall (must match LetterWall).
export const LETTER_SLOT_COUNT = 7

export interface LetterPlacement {
  slotIndex: number  // 0..LETTER_SLOT_COUNT-1
  tilt: number       // degrees, [-8, +8]
  glow: boolean      // ~1 in 3 letters glow
}

// FNV-1a 32-bit unsigned hash — same primitives as roseHash.ts.
function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function letterPlacementForId(id: string): LetterPlacement {
  const slotIndex = hash(id + '-slot') % LETTER_SLOT_COUNT
  const tiltSeed = hash(id + '-tilt') % 1000
  const tilt = (tiltSeed / 1000) * 16 - 8 // map 0..999 → -8..+8
  const glow = hash(id + '-glow') % 3 === 0
  return { slotIndex, tilt, glow }
}
