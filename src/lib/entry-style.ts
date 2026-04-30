// src/lib/entry-style.ts
//
// Per-entry styling: just font for now. Stored on JournalEntry.style as
// plain JSON. Sub-fields are optional; missing field = default.

export type FontKey =
  | 'caveat'
  | 'patrick-hand'
  | 'shadows-into-light'
  | 'indie-flower'

export interface EntryStyle {
  font?: FontKey
}

export const DEFAULT_FONT: FontKey = 'caveat'

export const FONT_KEYS: readonly FontKey[] = [
  'caveat',
  'patrick-hand',
  'shadows-into-light',
  'indie-flower',
] as const

export const FONT_DEFS: Record<FontKey, { label: string; cssFamily: string }> = {
  'caveat':              { label: 'Caveat',             cssFamily: `var(--font-caveat), Georgia, serif` },
  'patrick-hand':        { label: 'Patrick Hand',       cssFamily: `var(--font-patrick-hand), Georgia, serif` },
  'shadows-into-light':  { label: 'Shadows Into Light', cssFamily: `var(--font-shadows), Georgia, serif` },
  'indie-flower':        { label: 'Indie Flower',       cssFamily: `var(--font-indie), Georgia, serif` },
}

export function resolveFontFamily(font: FontKey | undefined): string {
  return FONT_DEFS[font ?? DEFAULT_FONT].cssFamily
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
