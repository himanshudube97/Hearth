// src/lib/entry-style.ts
//
// Per-entry styling: font only. Stored on JournalEntry.style as plain JSON.
// Font is optional; missing field = default.

export type FontKey =
  | 'caveat'
  | 'patrick-hand'

export interface EntryStyle {
  font?: FontKey
}

export const DEFAULT_FONT: FontKey = 'caveat'

export const FONT_KEYS: readonly FontKey[] = [
  'caveat',
  'patrick-hand',
] as const

// `sizeScale` lets us optically match fonts that have different x-heights
// at the same nominal font-size. Caveat reads smaller than Patrick Hand at
// the same px size, so we scale it up slightly.
export const FONT_DEFS: Record<FontKey, { label: string; cssFamily: string; sizeScale: number }> = {
  'caveat':              { label: 'Caveat',             cssFamily: `var(--font-caveat), Georgia, serif`,        sizeScale: 1.15 },
  'patrick-hand':        { label: 'Patrick Hand',       cssFamily: `var(--font-patrick-hand), Georgia, serif`,  sizeScale: 1.00 },
}

export function resolveFontFamily(font: FontKey | undefined): string {
  return FONT_DEFS[font ?? DEFAULT_FONT].cssFamily
}

export function resolveFontSize(font: FontKey | undefined, basePx: number): string {
  const scale = FONT_DEFS[font ?? DEFAULT_FONT].sizeScale
  return `${basePx * scale}px`
}

// Sanitize a style payload coming from the wire / DB. Drops unknown keys so
// stale data from a prior schema version doesn't crash rendering.
export function parseStyle(raw: unknown): EntryStyle {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const out: EntryStyle = {}
  if (typeof r.font === 'string' && (FONT_KEYS as readonly string[]).includes(r.font)) {
    out.font = r.font as FontKey
  }
  return out
}
