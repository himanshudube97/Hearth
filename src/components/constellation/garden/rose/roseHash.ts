export const ROSE_PALETTE = [
  '#B12838', // crimson
  '#E27062', // coral
  '#F4B6B0', // blush
  '#F8E8D8', // cream
  '#C898C0', // lavender-rose
] as const

export type RoseColor = (typeof ROSE_PALETTE)[number]

// Simple deterministic string hash → unsigned 32-bit int
function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function roseColorForId(id: string): RoseColor {
  return ROSE_PALETTE[hash(id) % ROSE_PALETTE.length]
}

export function roseSizeForId(id: string): number {
  // Map second-byte slice of hash into [1.0, 1.4]
  const h = hash(id + '-size')
  const t = (h % 1000) / 1000 // 0..0.999
  return 1.0 + t * 0.4
}
