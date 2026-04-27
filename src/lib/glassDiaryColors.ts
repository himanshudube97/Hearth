import { Theme } from './themes'

/**
 * Color set for the glass diary, derived from the active page theme.
 * Every visual on the diary's pages, spine, ribbon, and accents reads from here.
 */
export interface GlassDiaryColors {
  pageBg: string
  /** Same hue as pageBg but with alpha forced to 1. Used as the base for
   *  the "page opacity" mix in CSS so 100% really means fully opaque. */
  pageBgSolid: string
  pageBlur: string
  pageBorder: string
  ruledLine: string
  sectionLabel: string
  prompt: string
  date: string
  bodyText: string
  photoBorder: string
  doodleBorder: string
  doodleBg: string
  spineGradient: string
  ribbon: string
  saveButton: string
  buttonBg: string
  buttonBorder: string
}

const stripAlpha = (rgba: string): string => {
  // rgba(r, g, b, a) → rgb(r, g, b). Pass-through for hex / named colors.
  const m = rgba.match(/rgba?\(([^)]+)\)/i)
  if (!m) return rgba
  const [r, g, b] = m[1].split(',').map((s) => s.trim())
  return `rgb(${r}, ${g}, ${b})`
}

const warm = (theme: Theme, alpha: number): string => {
  // Convert hex `theme.accent.warm` to rgba with the given alpha.
  // Accepts #RGB, #RRGGBB. Falls back to passing the original color through.
  const hex = theme.accent.warm.trim()
  if (!hex.startsWith('#')) return hex
  const cleaned = hex.length === 4
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex
  const r = parseInt(cleaned.slice(1, 3), 16)
  const g = parseInt(cleaned.slice(3, 5), 16)
  const b = parseInt(cleaned.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getGlassDiaryColors(theme: Theme): GlassDiaryColors {
  return {
    pageBg: theme.glass.bg,
    pageBgSolid: stripAlpha(theme.glass.bg),
    pageBlur: theme.glass.blur,
    pageBorder: warm(theme, 0.18),
    ruledLine: warm(theme, 0.1),
    sectionLabel: warm(theme, 0.7),
    prompt: warm(theme, 0.6),
    date: warm(theme, 0.85),
    bodyText: theme.text.primary,
    photoBorder: warm(theme, 0.3),
    doodleBorder: warm(theme, 0.2),
    doodleBg: 'rgba(255, 255, 255, 0.03)',
    spineGradient: `linear-gradient(180deg, ${warm(theme, 0.12)}, ${warm(theme, 0.05)}, ${warm(theme, 0.12)})`,
    ribbon: theme.accent.primary,
    saveButton: theme.accent.warm,
    buttonBg: 'rgba(255, 255, 255, 0.06)',
    buttonBorder: warm(theme, 0.2),
  }
}
