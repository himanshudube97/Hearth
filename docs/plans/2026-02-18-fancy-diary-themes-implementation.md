# Fancy Diary Themes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 selectable diary book themes with distinct covers, page styles, and interactive elements that work independently of environment themes.

**Architecture:** Create a diary theme system parallel to existing environment themes. Each diary theme defines cover appearance, page styling, and interactive behaviors. A Zustand store manages selection, persisting to localStorage. Theme-aware components render SVG decorations and Framer Motion animations.

**Tech Stack:** React, TypeScript, Zustand, Framer Motion, CSS gradients, inline SVGs

---

## Task 1: Create Diary Theme Type Definitions

**Files:**
- Create: `src/lib/diaryThemes.ts`

**Step 1: Create the diary theme type definitions and all 6 themes**

```typescript
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
```

**Step 2: Verify file created correctly**

Run: `cat src/lib/diaryThemes.ts | head -50`

---

## Task 2: Create Diary Theme Zustand Store

**Files:**
- Create: `src/store/diary.ts`

**Step 1: Create the diary theme store**

```typescript
// src/store/diary.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DiaryThemeName } from '@/lib/diaryThemes'

interface DiaryStore {
  currentDiaryTheme: DiaryThemeName
  setDiaryTheme: (theme: DiaryThemeName) => void
}

export const useDiaryStore = create<DiaryStore>()(
  persist(
    (set) => ({
      currentDiaryTheme: 'glass',
      setDiaryTheme: (theme) => set({ currentDiaryTheme: theme }),
    }),
    {
      name: 'hearth-diary-theme',
    }
  )
)
```

**Step 2: Verify file created**

Run: `cat src/store/diary.ts`

---

## Task 3: Create SVG Decoration Components

**Files:**
- Create: `src/components/desk/decorations/PageCorners.tsx`
- Create: `src/components/desk/decorations/Watermarks.tsx`
- Create: `src/components/desk/decorations/CoverEmblems.tsx`

**Step 1: Create PageCorners component with all corner styles**

```typescript
// src/components/desk/decorations/PageCorners.tsx
'use client'

import { motion } from 'framer-motion'

interface PageCornersProps {
  style: 'ornate' | 'botanical' | 'magical' | 'stars' | 'none'
  color: string
}

export function PageCorners({ style, color }: PageCornersProps) {
  if (style === 'none') return null

  const corners = {
    ornate: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 Q5 5 55 5 M10 55 Q10 10 55 10 M15 55 Q15 15 55 15"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="8" cy="52" r="2" fill={color} opacity="0.4" />
        <path d="M2 58 Q2 40 20 40 Q10 40 10 50 Q10 58 2 58" fill={color} opacity="0.2" />
      </svg>
    ),
    botanical: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 Q15 45 10 35 Q20 40 25 30 M10 50 Q20 45 15 35"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="10" cy="35" r="3" fill={color} opacity="0.3" />
        <circle cx="25" cy="30" r="2" fill={color} opacity="0.25" />
        <ellipse cx="8" cy="48" rx="4" ry="2" fill={color} opacity="0.2" transform="rotate(-30 8 48)" />
      </svg>
    ),
    magical: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 L5 35 M5 55 L25 55"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.6"
        />
        <circle cx="5" cy="30" r="2" fill={color} opacity="0.8" />
        <circle cx="30" cy="55" r="2" fill={color} opacity="0.8" />
        <path d="M8 52 L12 48 L8 44 L4 48 Z" fill={color} opacity="0.4" />
        <circle cx="15" cy="40" r="1" fill={color} opacity="0.5" />
        <circle cx="20" cy="50" r="1" fill={color} opacity="0.5" />
      </svg>
    ),
    stars: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="10" cy="50" r="1.5" fill={color} opacity="0.7" />
        <circle cx="20" cy="45" r="1" fill={color} opacity="0.5" />
        <circle cx="15" cy="55" r="0.8" fill={color} opacity="0.4" />
        <circle cx="25" cy="52" r="1.2" fill={color} opacity="0.6" />
        <circle cx="8" cy="40" r="0.6" fill={color} opacity="0.3" />
        <path d="M12 48 L13 46 L14 48 L13 50 Z" fill={color} opacity="0.8" />
      </svg>
    ),
  }

  return (
    <>
      {/* Top-left */}
      <div className="absolute top-2 left-2 pointer-events-none">
        {corners[style]}
      </div>
      {/* Top-right */}
      <div className="absolute top-2 right-2 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
        {corners[style]}
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-2 left-2 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
        {corners[style]}
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-2 right-2 pointer-events-none" style={{ transform: 'scale(-1)' }}>
        {corners[style]}
      </div>
    </>
  )
}
```

**Step 2: Create Watermarks component**

```typescript
// src/components/desk/decorations/Watermarks.tsx
'use client'

import { motion } from 'framer-motion'

interface WatermarksProps {
  style: 'rose' | 'inkSplatter' | 'runes' | 'none'
  color: string
}

export function Watermarks({ style, color }: WatermarksProps) {
  if (style === 'none') return null

  const watermarks = {
    rose: (
      <svg viewBox="0 0 100 100" className="w-32 h-32 opacity-[0.06]">
        <circle cx="50" cy="50" r="8" fill={color} />
        <ellipse cx="50" cy="35" rx="12" ry="18" fill={color} />
        <ellipse cx="35" cy="50" rx="18" ry="12" fill={color} />
        <ellipse cx="65" cy="50" rx="18" ry="12" fill={color} />
        <ellipse cx="50" cy="65" rx="12" ry="18" fill={color} />
        <ellipse cx="38" cy="38" rx="10" ry="14" fill={color} transform="rotate(-45 38 38)" />
        <ellipse cx="62" cy="38" rx="10" ry="14" fill={color} transform="rotate(45 62 38)" />
      </svg>
    ),
    inkSplatter: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-[0.04]">
        <circle cx="50" cy="50" r="15" fill={color} />
        <circle cx="35" cy="45" r="8" fill={color} />
        <circle cx="65" cy="55" r="10" fill={color} />
        <circle cx="45" cy="65" r="6" fill={color} />
        <circle cx="60" cy="35" r="5" fill={color} />
        <ellipse cx="30" cy="60" rx="4" ry="6" fill={color} />
        <ellipse cx="70" cy="40" rx="3" ry="5" fill={color} />
      </svg>
    ),
    runes: (
      <motion.svg
        viewBox="0 0 100 100"
        className="w-28 h-28 opacity-[0.08]"
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <text x="50" y="30" textAnchor="middle" fontSize="16" fill={color}>᛭</text>
        <text x="30" y="55" textAnchor="middle" fontSize="14" fill={color}>ᚱ</text>
        <text x="70" y="55" textAnchor="middle" fontSize="14" fill={color}>ᚢ</text>
        <text x="50" y="80" textAnchor="middle" fontSize="16" fill={color}>ᛟ</text>
        <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </motion.svg>
    ),
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {watermarks[style]}
    </div>
  )
}
```

**Step 3: Create CoverEmblems component**

```typescript
// src/components/desk/decorations/CoverEmblems.tsx
'use client'

import { motion } from 'framer-motion'

interface CoverEmblemsProps {
  style: 'crest' | 'moon' | 'rose' | 'flower' | 'constellation' | 'none'
  color: string
  glowing?: boolean
}

export function CoverEmblems({ style, color, glowing = false }: CoverEmblemsProps) {
  if (style === 'none') return null

  const Wrapper = glowing ? motion.div : 'div'
  const wrapperProps = glowing ? {
    animate: { filter: ['drop-shadow(0 0 8px ' + color + ')', 'drop-shadow(0 0 15px ' + color + ')', 'drop-shadow(0 0 8px ' + color + ')'] },
    transition: { duration: 2, repeat: Infinity }
  } : {}

  const emblems = {
    crest: (
      <svg viewBox="0 0 60 70" className="w-16 h-20">
        <path
          d="M30 5 L55 20 L55 45 Q55 60 30 65 Q5 60 5 45 L5 20 Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M30 15 L45 25 L45 42 Q45 52 30 55 Q15 52 15 42 L15 25 Z"
          fill={color}
          opacity="0.2"
        />
        <text x="30" y="42" textAnchor="middle" fontSize="18" fill={color}>H</text>
      </svg>
    ),
    moon: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="2" />
        <path
          d="M25 15 Q40 25 40 40 Q25 35 25 15"
          fill={color}
          opacity="0.3"
        />
        <circle cx="38" cy="20" r="2" fill={color} opacity="0.6" />
        <circle cx="42" cy="35" r="1.5" fill={color} opacity="0.5" />
      </svg>
    ),
    rose: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="6" fill={color} />
        <ellipse cx="30" cy="18" rx="8" ry="12" fill={color} opacity="0.7" />
        <ellipse cx="18" cy="30" rx="12" ry="8" fill={color} opacity="0.7" />
        <ellipse cx="42" cy="30" rx="12" ry="8" fill={color} opacity="0.7" />
        <ellipse cx="30" cy="42" rx="8" ry="12" fill={color} opacity="0.7" />
        <path d="M30 55 L30 65" stroke={color} strokeWidth="2" />
        <path d="M25 60 Q30 55 35 60" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    flower: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="5" fill={color} />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse
            key={i}
            cx="30"
            cy="15"
            rx="6"
            ry="10"
            fill={color}
            opacity="0.6"
            transform={`rotate(${angle} 30 30)`}
          />
        ))}
      </svg>
    ),
    constellation: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="15" cy="20" r="2" fill={color} />
        <circle cx="45" cy="15" r="2.5" fill={color} />
        <circle cx="30" cy="35" r="2" fill={color} />
        <circle cx="50" cy="45" r="1.5" fill={color} />
        <circle cx="20" cy="50" r="2" fill={color} />
        <line x1="15" y1="20" x2="45" y2="15" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="45" y1="15" x2="30" y2="35" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="35" x2="50" y2="45" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="35" x2="20" y2="50" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="15" y1="20" x2="20" y2="50" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </svg>
    ),
  }

  return (
    <Wrapper className="absolute inset-0 flex items-center justify-center pointer-events-none" {...wrapperProps}>
      {emblems[style]}
    </Wrapper>
  )
}
```

---

## Task 4: Create Interactive Elements Components

**Files:**
- Create: `src/components/desk/interactive/RibbonBookmark.tsx`
- Create: `src/components/desk/interactive/WaxSeal.tsx`
- Create: `src/components/desk/interactive/PageCurl.tsx`
- Create: `src/components/desk/interactive/FloatingParticles.tsx`

**Step 1: Create RibbonBookmark**

```typescript
// src/components/desk/interactive/RibbonBookmark.tsx
'use client'

import { motion } from 'framer-motion'

interface RibbonBookmarkProps {
  color: string
  onClick?: () => void
}

export function RibbonBookmark({ color, onClick }: RibbonBookmarkProps) {
  return (
    <motion.div
      className="absolute -top-2 right-8 z-40 cursor-pointer"
      onClick={onClick}
      whileHover={{ y: 5 }}
      title="Jump to last entry"
    >
      <motion.svg
        viewBox="0 0 20 80"
        className="w-5 h-20"
        animate={{
          rotateZ: [-1, 1, -1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'top center' }}
      >
        <defs>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M2 0 L18 0 L18 70 L10 60 L2 70 Z"
          fill="url(#ribbonGrad)"
        />
        <path
          d="M2 0 L5 0 L5 68 L2 70 Z"
          fill="rgba(0,0,0,0.15)"
        />
      </motion.svg>
    </motion.div>
  )
}
```

**Step 2: Create WaxSeal**

```typescript
// src/components/desk/interactive/WaxSeal.tsx
'use client'

import { motion } from 'framer-motion'

interface WaxSealProps {
  design: 'crest' | 'rose' | 'moon'
  color?: string
  animate?: boolean
}

export function WaxSeal({ design, color = 'hsl(0, 50%, 35%)', animate = false }: WaxSealProps) {
  const sealDesigns = {
    crest: 'H',
    rose: '❀',
    moon: '☽',
  }

  return (
    <motion.div
      className="relative w-12 h-12"
      initial={animate ? { scale: 1.5, y: -20 } : false}
      animate={animate ? { scale: 1, y: 0 } : false}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <svg viewBox="0 0 50 50" className="w-full h-full">
        <defs>
          <radialGradient id="waxGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </radialGradient>
        </defs>
        {/* Irregular wax blob */}
        <path
          d="M25 5 Q40 8 45 20 Q48 35 40 42 Q30 50 20 45 Q8 40 5 28 Q3 15 15 8 Q20 3 25 5"
          fill="url(#waxGrad)"
        />
        {/* Inner stamp circle */}
        <circle cx="25" cy="25" r="12" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <text
          x="25"
          y="30"
          textAnchor="middle"
          fontSize="14"
          fill="rgba(0,0,0,0.3)"
          fontFamily="serif"
        >
          {sealDesigns[design]}
        </text>
      </svg>
    </motion.div>
  )
}
```

**Step 3: Create FloatingParticles**

```typescript
// src/components/desk/interactive/FloatingParticles.tsx
'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface FloatingParticlesProps {
  type: 'magical' | 'botanical' | 'stars'
  color: string
}

export function FloatingParticles({ type, color }: FloatingParticlesProps) {
  const particles = useMemo(() => {
    const count = type === 'stars' ? 15 : 8
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: type === 'stars' ? 1 + Math.random() * 2 : 3 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
    }))
  }, [type])

  const renderParticle = (p: typeof particles[0]) => {
    switch (type) {
      case 'magical':
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      case 'botanical':
        return (
          <motion.div
            key={p.id}
            className="absolute text-xs"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              color: color,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0, 0.6, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: p.duration * 1.5,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {['🌿', '🍃', '✿', '❀'][p.id % 4]}
          </motion.div>
        )
      case 'stars':
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
            }}
            animate={{
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5 + Math.random() * 2,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(renderParticle)}
    </div>
  )
}
```

---

## Task 5: Create Diary Theme Selector Component

**Files:**
- Create: `src/components/desk/DiaryThemeSelector.tsx`

**Step 1: Create the theme selector UI**

```typescript
// src/components/desk/DiaryThemeSelector.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemeList, DiaryThemeName } from '@/lib/diaryThemes'

export function DiaryThemeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useThemeStore()
  const { currentDiaryTheme, setDiaryTheme } = useDiaryStore()

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Change diary style"
      >
        <span className="text-xl">📖</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-6 z-50 p-6 rounded-2xl max-w-md"
              style={{
                background: theme.glass.bg,
                backdropFilter: `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
              }}
            >
              <h3 className="text-lg font-medium mb-4" style={{ color: theme.text.primary }}>
                Choose Diary Style
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {diaryThemeList.map((diaryTheme) => (
                  <motion.button
                    key={diaryTheme.id}
                    onClick={() => {
                      setDiaryTheme(diaryTheme.id as DiaryThemeName)
                      setIsOpen(false)
                    }}
                    className="relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
                    style={{
                      background: currentDiaryTheme === diaryTheme.id
                        ? `${theme.accent.primary}30`
                        : 'rgba(255,255,255,0.05)',
                      border: currentDiaryTheme === diaryTheme.id
                        ? `2px solid ${theme.accent.primary}`
                        : '2px solid transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Mini book preview */}
                    <div
                      className="w-12 h-16 rounded-sm shadow-md"
                      style={{
                        background: diaryTheme.cover.background,
                        border: `1px solid ${diaryTheme.cover.borderColor || 'transparent'}`,
                      }}
                    />
                    <span className="text-xs text-center" style={{ color: theme.text.secondary }}>
                      {diaryTheme.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-xs mt-4 text-center" style={{ color: theme.text.muted }}>
                Mix any diary style with any background theme
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## Task 6: Update BookSpread to Use Diary Themes

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

**Step 1: Import diary theme system and apply page styles**

Add imports at top:
```typescript
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import { PageCorners } from './decorations/PageCorners'
import { Watermarks } from './decorations/Watermarks'
import { RibbonBookmark } from './interactive/RibbonBookmark'
import { FloatingParticles } from './interactive/FloatingParticles'
```

Inside `BookSpread` component, add:
```typescript
const { currentDiaryTheme } = useDiaryStore()
const diaryTheme = diaryThemes[currentDiaryTheme]
```

**Step 2: Update PageWrapper to use diary theme colors**

Replace the hardcoded `paperColor` and `paperColorDark` with:
```typescript
const paperColor = diaryTheme.pages.background
const paperColorDark = diaryTheme.pages.background // Adjust shade programmatically
```

**Step 3: Add decorations inside PageWrapper**

Inside each page, add:
```tsx
<PageCorners style={diaryTheme.pages.cornerStyle || 'none'} color={diaryTheme.pages.mutedColor} />
<Watermarks style={diaryTheme.pages.watermark || 'none'} color={diaryTheme.pages.textColor} />
```

**Step 4: Add ribbon bookmark if enabled**

```tsx
{diaryTheme.interactive.ribbon.enabled && (
  <RibbonBookmark color={diaryTheme.interactive.ribbon.color} />
)}
```

**Step 5: Add floating particles if enabled**

```tsx
{diaryTheme.interactive.floatingParticles !== 'none' && (
  <FloatingParticles
    type={diaryTheme.interactive.floatingParticles}
    color={diaryTheme.pages.mutedColor}
  />
)}
```

---

## Task 7: Update LeftPage and RightPage for Theme Colors

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`

**Step 1: In LeftPage, use diary theme colors**

Add imports and theme hook:
```typescript
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'

// Inside component:
const { currentDiaryTheme } = useDiaryStore()
const diaryTheme = diaryThemes[currentDiaryTheme]

// Replace hardcoded colors:
const textColor = diaryTheme.pages.textColor
const mutedColor = diaryTheme.pages.mutedColor
```

Update doodle canvas to use theme colors:
```typescript
// In InlineDoodleCanvas, use:
const DOODLE_COLORS = diaryTheme.doodle.defaultColors
// And for canvas styling:
style={{
  background: diaryTheme.doodle.canvasBackground,
  border: `1px solid ${diaryTheme.doodle.canvasBorder}`,
}}
```

**Step 2: In RightPage, use diary theme colors**

Same pattern - import diary store and apply `diaryTheme.pages.textColor` etc.

---

## Task 8: Update DeskScene to Include Theme Selector

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`

**Step 1: Import and add DiaryThemeSelector**

```typescript
import { DiaryThemeSelector } from './DiaryThemeSelector'

// Inside return, add after the book:
<DiaryThemeSelector />
```

---

## Task 9: Add Line Styles to Pages

**Files:**
- Modify: `src/components/desk/BookSpread.tsx` (PageWrapper)

**Step 1: Create dynamic line patterns based on diary theme**

Replace the static ruled lines background with:

```typescript
const getLinePattern = () => {
  switch (diaryTheme.pages.lineStyle) {
    case 'ruled':
      return `repeating-linear-gradient(
        180deg,
        transparent 0px,
        transparent 31px,
        ${diaryTheme.pages.lineColor} 31px,
        ${diaryTheme.pages.lineColor} 32px
      )`
    case 'dotted':
      return `radial-gradient(circle, ${diaryTheme.pages.lineColor} 1px, transparent 1px)`
    case 'wavy':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='32'%3E%3Cpath d='M0 28 Q25 24 50 28 T100 28' fill='none' stroke='${encodeURIComponent(diaryTheme.pages.lineColor)}' stroke-width='1'/%3E%3C/svg%3E")`
    case 'constellation':
      return 'none' // Stars are handled by FloatingParticles
    case 'none':
    default:
      return 'none'
  }
}
```

---

## Task 10: Final Integration and Testing

**Step 1: Create directory structure**

```bash
mkdir -p src/components/desk/decorations
mkdir -p src/components/desk/interactive
```

**Step 2: Test each theme**

- Switch to each diary theme
- Verify cover colors apply
- Verify page colors apply
- Verify decorations render
- Verify interactive elements work
- Test with different environment themes

**Step 3: Test responsive behavior**

- Ensure book stays centered
- Theme selector is accessible
- No overflow issues

---

## Summary

**New Files (9):**
1. `src/lib/diaryThemes.ts`
2. `src/store/diary.ts`
3. `src/components/desk/decorations/PageCorners.tsx`
4. `src/components/desk/decorations/Watermarks.tsx`
5. `src/components/desk/decorations/CoverEmblems.tsx`
6. `src/components/desk/interactive/RibbonBookmark.tsx`
7. `src/components/desk/interactive/WaxSeal.tsx`
8. `src/components/desk/interactive/FloatingParticles.tsx`
9. `src/components/desk/DiaryThemeSelector.tsx`

**Modified Files (4):**
1. `src/components/desk/DeskScene.tsx`
2. `src/components/desk/BookSpread.tsx`
3. `src/components/desk/LeftPage.tsx`
4. `src/components/desk/RightPage.tsx`
