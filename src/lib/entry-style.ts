// src/lib/entry-style.ts
//
// Per-entry styling: font / ink color / effect. Stored on JournalEntry.style
// as plain JSON. All three sub-fields are optional; missing field = default.
//
// Palette vetting checklist (run by eye when adding a new ink color):
//   - Readable on the cream/parchment glass-diary backgrounds (light themes).
//   - Readable on the moonlit / midnight glass-diary backgrounds (dark themes).
//   - Visually distinct from the other 6 named colors.

export type FontKey =
  | 'caveat'
  | 'patrick-hand'
  | 'shadows-into-light'
  | 'indie-flower'
  | 'homemade-apple'

export type ColorKey =
  | 'charcoal'
  | 'sepia'
  | 'indigo'
  | 'forest'
  | 'plum'
  | 'dusty-rose'

export type EffectKey = 'sparkle' | 'wet-ink'

export interface EntryStyle {
  font?: FontKey
  // null = "Default" (resolves to theme body text dynamically).
  // undefined = field not set (treated as null).
  color?: ColorKey | null
  effect?: EffectKey
}

export const DEFAULT_FONT: FontKey = 'caveat'

export const FONT_KEYS: readonly FontKey[] = [
  'caveat',
  'patrick-hand',
  'shadows-into-light',
  'indie-flower',
  'homemade-apple',
] as const

export const COLOR_KEYS: readonly ColorKey[] = [
  'charcoal',
  'sepia',
  'indigo',
  'forest',
  'plum',
  'dusty-rose',
] as const

export const EFFECT_KEYS: readonly EffectKey[] = ['sparkle', 'wet-ink'] as const

export const FONT_DEFS: Record<FontKey, { label: string; cssFamily: string }> = {
  'caveat':              { label: 'Caveat',             cssFamily: `var(--font-caveat), Georgia, serif` },
  'patrick-hand':        { label: 'Patrick Hand',       cssFamily: `var(--font-patrick-hand), Georgia, serif` },
  'shadows-into-light':  { label: 'Shadows Into Light', cssFamily: `var(--font-shadows), Georgia, serif` },
  'indie-flower':        { label: 'Indie Flower',       cssFamily: `var(--font-indie), Georgia, serif` },
  'homemade-apple':      { label: 'Homemade Apple',     cssFamily: `var(--font-homemade), Georgia, serif` },
}

export const COLOR_DEFS: Record<ColorKey, { label: string; hex: string }> = {
  'charcoal':   { label: 'Charcoal',   hex: '#2A2A2A' },
  'sepia':      { label: 'Sepia',      hex: '#6B4423' },
  'indigo':     { label: 'Indigo',     hex: '#283593' },
  'forest':     { label: 'Forest',     hex: '#2E5D3A' },
  'plum':       { label: 'Plum',       hex: '#5E3A5C' },
  'dusty-rose': { label: 'Dusty Rose', hex: '#A85462' },
}

export const EFFECT_DEFS: Record<EffectKey, { label: string }> = {
  'sparkle':  { label: 'Sparkle' },
  'wet-ink':  { label: 'Wet Ink' },
}

export function resolveFontFamily(font: FontKey | undefined): string {
  return FONT_DEFS[font ?? DEFAULT_FONT].cssFamily
}

export function resolveInkColor(
  color: ColorKey | null | undefined,
  themeBodyText: string,
): string {
  if (color == null) return themeBodyText
  return COLOR_DEFS[color].hex
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
  if (r.color === null) {
    out.color = null
  } else if (typeof r.color === 'string' && (COLOR_KEYS as readonly string[]).includes(r.color)) {
    out.color = r.color as ColorKey
  }
  if (typeof r.effect === 'string' && (EFFECT_KEYS as readonly string[]).includes(r.effect)) {
    out.effect = r.effect as EffectKey
  }
  return out
}
