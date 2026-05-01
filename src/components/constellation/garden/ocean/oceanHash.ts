// Simple deterministic string hash → unsigned 32-bit int.
// Mirrors the FNV-1a hash used in `roseHash.ts`.
function hash(id: string, salt = ''): number {
  let h = 2166136261
  const s = id + salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface OceanBoatHash {
  /** Slot 0..4 in PaperBoats. PaperBoats handles mobile fallback. */
  slotIndex: number
  /** Rotation in degrees, in [-4, +4]. */
  tilt: number
  /** Size multiplier, in [0.85, 1.0]. */
  scale: number
  /** True for ~1 in 3 boats. */
  glow: boolean
}

export function oceanHashForId(id: string): OceanBoatHash {
  const slotIndex = hash(id, '-slot') % 5
  const tilt = ((hash(id, '-tilt') % 1000) / 1000) * 8 - 4 // [-4, +4]
  const scale = 0.85 + ((hash(id, '-scale') % 1000) / 1000) * 0.15 // [0.85, 1.0]
  const glow = hash(id, '-glow') % 3 === 0 // ~1 in 3
  return { slotIndex, tilt, scale, glow }
}
