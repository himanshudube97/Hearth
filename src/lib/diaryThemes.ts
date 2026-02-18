// src/lib/diaryThemes.ts
export type DiaryThemeName = 'glass' | 'agedLeather' | 'grimoire' | 'victorianRose' | 'cottagecore' | 'celestial'

export interface DiaryTheme {
  id: DiaryThemeName
  name: string
  description: string
  cover: {
    background: string
    texture?: string
    borderColor?: string
    cornerStyle?: 'brass' | 'gold' | 'silver' | 'gem' | 'none'
    emblem?: 'crest' | 'moon' | 'rose' | 'flower' | 'constellation' | 'none'
    hasStitching?: boolean
    hasGildedEdges?: boolean
    ribbonColor?: string
  }
  pages: {
    background: string
    textColor: string
    mutedColor: string
    lineColor: string
    lineStyle: 'ruled' | 'dotted' | 'none' | 'wavy' | 'constellation'
    hasMarginLine?: boolean
    marginLineColor?: string
    cornerStyle?: 'ornate' | 'botanical' | 'magical' | 'stars' | 'none'
    watermark?: 'rose' | 'inkSplatter' | 'runes' | 'none'
    noiseTexture?: boolean
  }
  interactive: {
    ribbon: { enabled: boolean; color: string }
    waxSeal: { enabled: boolean; design: 'crest' | 'rose' | 'moon' | 'none' }
    pageCurl: boolean
    glowingInk: boolean
    floatingParticles: 'magical' | 'botanical' | 'stars' | 'none'
    clasp: { enabled: boolean; style: 'brass' | 'silver' | 'none' }
  }
  doodle: {
    canvasBackground: string
    canvasBorder: string
    defaultColors: string[]
  }
}

// Glass Theme (Default)
export const glassTheme: DiaryTheme = {
  id: 'glass',
  name: 'Glass',
  description: 'Modern and minimal, blends with any background',
  cover: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    cornerStyle: 'none',
    emblem: 'none',
  },
  pages: {
    background: 'rgba(255, 255, 255, 0.85)',
    textColor: 'hsl(25, 30%, 25%)',
    mutedColor: 'hsl(25, 20%, 45%)',
    lineColor: 'rgba(0, 0, 0, 0.06)',
    lineStyle: 'dotted',
    cornerStyle: 'none',
    watermark: 'none',
  },
  interactive: {
    ribbon: { enabled: false, color: '' },
    waxSeal: { enabled: false, design: 'none' },
    pageCurl: true,
    glowingInk: false,
    floatingParticles: 'none',
    clasp: { enabled: false, style: 'none' },
  },
  doodle: {
    canvasBackground: 'rgba(255, 255, 255, 0.4)',
    canvasBorder: 'rgba(0, 0, 0, 0.08)',
    defaultColors: ['hsl(25, 30%, 25%)', 'hsl(25, 40%, 40%)', 'hsl(200, 30%, 35%)', 'hsl(150, 30%, 35%)', 'hsl(350, 40%, 45%)'],
  },
}

// Aged Leather Theme
export const agedLeatherTheme: DiaryTheme = {
  id: 'agedLeather',
  name: 'Aged Leather',
  description: 'Classic adventurer\'s journal with brass accents',
  cover: {
    background: 'linear-gradient(145deg, hsl(25, 35%, 25%) 0%, hsl(25, 40%, 18%) 50%, hsl(25, 35%, 15%) 100%)',
    texture: 'leather',
    borderColor: 'hsl(35, 50%, 35%)',
    cornerStyle: 'brass',
    emblem: 'crest',
    hasStitching: true,
  },
  pages: {
    background: 'hsl(40, 35%, 88%)',
    textColor: 'hsl(25, 35%, 20%)',
    mutedColor: 'hsl(25, 25%, 40%)',
    lineColor: 'hsl(210, 15%, 70%)',
    lineStyle: 'ruled',
    hasMarginLine: true,
    marginLineColor: 'hsl(0, 40%, 65%)',
    cornerStyle: 'none',
    watermark: 'inkSplatter',
    noiseTexture: true,
  },
  interactive: {
    ribbon: { enabled: true, color: 'hsl(25, 40%, 30%)' },
    waxSeal: { enabled: true, design: 'crest' },
    pageCurl: true,
    glowingInk: false,
    floatingParticles: 'none',
    clasp: { enabled: true, style: 'brass' },
  },
  doodle: {
    canvasBackground: 'hsl(40, 30%, 85%)',
    canvasBorder: 'hsl(25, 25%, 60%)',
    defaultColors: ['hsl(25, 35%, 20%)', 'hsl(210, 30%, 35%)', 'hsl(0, 40%, 40%)', 'hsl(35, 50%, 35%)', 'hsl(150, 25%, 30%)'],
  },
}

// Enchanted Grimoire Theme
export const grimoireTheme: DiaryTheme = {
  id: 'grimoire',
  name: 'Enchanted Grimoire',
  description: 'Mystical spellbook with glowing runes',
  cover: {
    background: 'linear-gradient(145deg, hsl(270, 35%, 20%) 0%, hsl(280, 40%, 15%) 50%, hsl(270, 35%, 12%) 100%)',
    texture: 'velvet',
    borderColor: 'hsl(45, 70%, 50%)',
    cornerStyle: 'gem',
    emblem: 'moon',
  },
  pages: {
    background: 'hsl(45, 30%, 90%)',
    textColor: 'hsl(270, 25%, 20%)',
    mutedColor: 'hsl(270, 20%, 45%)',
    lineColor: 'transparent',
    lineStyle: 'none',
    cornerStyle: 'magical',
    watermark: 'runes',
  },
  interactive: {
    ribbon: { enabled: true, color: 'hsl(270, 50%, 40%)' },
    waxSeal: { enabled: false, design: 'none' },
    pageCurl: true,
    glowingInk: true,
    floatingParticles: 'magical',
    clasp: { enabled: false, style: 'none' },
  },
  doodle: {
    canvasBackground: 'hsl(45, 25%, 88%)',
    canvasBorder: 'hsl(45, 60%, 50%)',
    defaultColors: ['hsl(270, 50%, 35%)', 'hsl(45, 70%, 50%)', 'hsl(200, 50%, 40%)', 'hsl(320, 40%, 45%)', 'hsl(150, 40%, 35%)'],
  },
}

// Victorian Rose Theme
export const victorianRoseTheme: DiaryTheme = {
  id: 'victorianRose',
  name: 'Victorian Rose',
  description: 'Elegant gold filigree with romantic details',
  cover: {
    background: 'linear-gradient(145deg, hsl(345, 45%, 25%) 0%, hsl(345, 50%, 18%) 50%, hsl(345, 45%, 15%) 100%)',
    texture: 'damask',
    borderColor: 'hsl(45, 60%, 55%)',
    cornerStyle: 'gold',
    emblem: 'rose',
    hasGildedEdges: true,
    ribbonColor: 'hsl(345, 50%, 35%)',
  },
  pages: {
    background: 'hsl(40, 20%, 95%)',
    textColor: 'hsl(345, 30%, 20%)',
    mutedColor: 'hsl(345, 20%, 45%)',
    lineColor: 'hsl(0, 0%, 75%)',
    lineStyle: 'ruled',
    cornerStyle: 'ornate',
    watermark: 'rose',
  },
  interactive: {
    ribbon: { enabled: true, color: 'hsl(345, 50%, 35%)' },
    waxSeal: { enabled: true, design: 'rose' },
    pageCurl: true,
    glowingInk: false,
    floatingParticles: 'none',
    clasp: { enabled: false, style: 'none' },
  },
  doodle: {
    canvasBackground: 'hsl(40, 15%, 93%)',
    canvasBorder: 'hsl(45, 50%, 60%)',
    defaultColors: ['hsl(345, 40%, 30%)', 'hsl(45, 60%, 45%)', 'hsl(150, 30%, 35%)', 'hsl(270, 30%, 40%)', 'hsl(25, 35%, 35%)'],
  },
}

// Cottagecore Theme
export const cottagecoreTheme: DiaryTheme = {
  id: 'cottagecore',
  name: 'Cottagecore',
  description: 'Cozy handmade journal with botanical touches',
  cover: {
    background: 'linear-gradient(145deg, hsl(30, 30%, 55%) 0%, hsl(30, 35%, 45%) 50%, hsl(30, 30%, 40%) 100%)',
    texture: 'kraft',
    borderColor: 'hsl(30, 25%, 35%)',
    cornerStyle: 'none',
    emblem: 'flower',
    hasStitching: true,
  },
  pages: {
    background: 'hsl(38, 35%, 92%)',
    textColor: 'hsl(30, 35%, 22%)',
    mutedColor: 'hsl(30, 25%, 45%)',
    lineColor: 'hsl(30, 20%, 70%)',
    lineStyle: 'wavy',
    cornerStyle: 'botanical',
    watermark: 'none',
    noiseTexture: true,
  },
  interactive: {
    ribbon: { enabled: false, color: '' },
    waxSeal: { enabled: false, design: 'none' },
    pageCurl: true,
    glowingInk: false,
    floatingParticles: 'botanical',
    clasp: { enabled: false, style: 'none' },
  },
  doodle: {
    canvasBackground: 'hsl(38, 30%, 90%)',
    canvasBorder: 'hsl(30, 25%, 60%)',
    defaultColors: ['hsl(30, 35%, 25%)', 'hsl(120, 30%, 35%)', 'hsl(45, 50%, 45%)', 'hsl(15, 45%, 45%)', 'hsl(200, 25%, 40%)'],
  },
}

// Midnight Celestial Theme
export const celestialTheme: DiaryTheme = {
  id: 'celestial',
  name: 'Midnight Celestial',
  description: 'Cosmic night journal with silver constellations',
  cover: {
    background: 'linear-gradient(145deg, hsl(220, 40%, 15%) 0%, hsl(230, 45%, 10%) 50%, hsl(220, 40%, 8%) 100%)',
    texture: 'leather',
    borderColor: 'hsl(220, 20%, 60%)',
    cornerStyle: 'silver',
    emblem: 'constellation',
    hasGildedEdges: true,
  },
  pages: {
    background: 'hsl(220, 20%, 18%)',
    textColor: 'hsl(220, 15%, 85%)',
    mutedColor: 'hsl(220, 15%, 55%)',
    lineColor: 'hsl(220, 15%, 25%)',
    lineStyle: 'constellation',
    cornerStyle: 'stars',
    watermark: 'none',
  },
  interactive: {
    ribbon: { enabled: false, color: '' },
    waxSeal: { enabled: false, design: 'none' },
    pageCurl: true,
    glowingInk: false,
    floatingParticles: 'stars',
    clasp: { enabled: true, style: 'silver' },
  },
  doodle: {
    canvasBackground: 'hsl(220, 18%, 22%)',
    canvasBorder: 'hsl(220, 20%, 40%)',
    defaultColors: ['hsl(220, 15%, 85%)', 'hsl(45, 50%, 60%)', 'hsl(200, 40%, 55%)', 'hsl(270, 35%, 60%)', 'hsl(180, 30%, 50%)'],
  },
}

export const diaryThemes: Record<DiaryThemeName, DiaryTheme> = {
  glass: glassTheme,
  agedLeather: agedLeatherTheme,
  grimoire: grimoireTheme,
  victorianRose: victorianRoseTheme,
  cottagecore: cottagecoreTheme,
  celestial: celestialTheme,
}

export const diaryThemeList = Object.values(diaryThemes)
