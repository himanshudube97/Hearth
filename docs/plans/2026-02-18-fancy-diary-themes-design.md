# Fancy Diary Themes Design

**Date:** 2026-02-18
**Status:** Approved
**Approach:** Hybrid (CSS + SVG decorations + Framer Motion interactions)

## Overview

Add 6 selectable diary book themes that are independent of the existing 11 environment themes. Default is a glass/transparent diary that adapts to the environment. Users can mix any diary theme with any environment theme.

## Diary Themes

### 1. Glass (Default)
**Vibe:** Modern, minimal, blends with any background

**Cover:**
- Frosted glass panel with soft glow matching environment theme
- No visible spine - floats seamlessly
- Subtle shimmer animation on hover

**Pages:**
- Semi-transparent white with environment color tint
- Soft dotted grid (very subtle)
- No borders - clean and minimal
- Gentle glass reflection line across top

---

### 2. Aged Leather
**Vibe:** Classic, timeless, adventurer's journal

**Cover:**
- Brown leather texture with visible grain (CSS gradient + noise overlay)
- Brass corner protectors (golden triangles)
- Center embossed crest (SVG medallion)
- Visible stitching along spine (dashed border pattern)
- Worn edges with darker patina

**Pages:**
- Tea-stained cream `hsl(40, 35%, 88%)` with noise texture
- Faded blue-gray ruled lines
- Ink splatter watermarks in corners
- Red vertical margin line on left page
- Coffee ring stain decoration (subtle)

**Interactive:**
- Ribbon bookmark (brown)
- Wax seal stamp on saved entries (crest design)
- Brass clasp animation when opening

---

### 3. Enchanted Grimoire
**Vibe:** Mystical, whimsical, fantasy lover

**Cover:**
- Deep purple velvet texture (gradient with subtle pattern)
- Glowing golden runes around border (animated pulse)
- Ornate corner brackets with gem accents
- Central eye or moon symbol
- Faint magical particles emanating from edges

**Pages:**
- Warm vellum `hsl(45, 30%, 90%)`
- No lines - free-form magical feeling
- Mystical symbols in margins (moons, stars, runes)
- Ornate magical flourishes in corners

**Interactive:**
- Ribbon bookmark (purple)
- Glowing ink effect - text glows as you type
- Magical sparkle on save
- Tiny magical particles floating around pages

---

### 4. Victorian Rose
**Vibe:** Elegant, romantic, vintage

**Cover:**
- Rich burgundy with damask pattern overlay
- Gold filigree frame (intricate SVG border)
- Satin ribbon bookmark hanging from top
- Small rose cameo in center
- Gilded page edges (gold line on right side)

**Pages:**
- Ivory white `hsl(40, 20%, 95%)`
- Elegant thin gray ruled lines
- Gold ornate corners with rose vine details
- Faint rose watermark in center
- Decorative divider under date

**Interactive:**
- Ribbon bookmark (burgundy satin)
- Wax seal stamp (rose design)
- Elegant page curl animation

---

### 5. Cottagecore
**Vibe:** Cozy, handmade, nature-inspired

**Cover:**
- Kraft paper brown with visible fiber texture
- Pressed flower illustration (watercolor-style SVG)
- Twine binding detail on spine
- Hand-drawn border (slightly imperfect lines)
- Washi tape accent in corner

**Pages:**
- Warm cream with visible paper fiber texture
- Hand-drawn imperfect lines (slightly wavy)
- Botanical illustrations in corners (leaves, herbs)
- Small bee or butterfly decoration
- Pressed flower silhouettes in margins

**Interactive:**
- Occasional floating seed/petal animation
- Doodle tools styled as chalk/pencil

---

### 6. Midnight Celestial
**Vibe:** Cosmic, dreamy, night owl

**Cover:**
- Deep navy leather with subtle shimmer
- Silver constellation map embossed on cover
- Crescent moon clasp detail
- Star scatter along edges
- Metallic silver page edges

**Pages:**
- Dark navy-gray `hsl(220, 20%, 18%)` with light text
- Subtle constellation dot pattern instead of lines
- Scattered stars in margins
- Silver/white ink color for text

**Interactive:**
- Moon clasp unlatch animation
- Shooting star animation occasionally
- Subtle twinkling in margins

---

## Shared Interactive Elements

### Page Curl (All themes)
- Bottom-right corner curls up on hover
- Reveals hint of previous/next page underneath
- Smooth Framer Motion spring animation
- Click to turn page

### Ribbon Bookmark (Leather, Grimoire, Victorian)
- Dangles from top of book spine
- Sways gently with idle animation
- Click to jump to last entry
- Color matches theme

### Wax Seal Stamp (Leather, Victorian)
- Appears on saved entries
- Animated stamp-down effect when saving
- Different seal designs per theme
- Satisfying press micro-interaction

### Doodle Canvas Integration
- Canvas background matches page color
- Border style matches theme
- Tools can be styled to theme (quill, chalk, etc.)

---

## Theme Selector UI

**Location:** Small book/palette icon in corner of desk scene

**Behavior:**
1. Click icon → slide-out panel appears
2. Shows 6 book cover thumbnails in 2x3 grid
3. Current selection highlighted
4. Hover shows theme name tooltip
5. Click to select → smooth transition to new theme
6. Selection persists to localStorage

---

## Technical Implementation

### New Files
- `src/lib/diaryThemes.ts` - Theme definitions
- `src/components/desk/DiaryThemeSelector.tsx` - Selection UI
- `src/components/desk/BookCover.tsx` - Cover rendering
- `src/components/desk/PageDecorations.tsx` - SVG decorations
- `src/components/desk/InteractiveElements.tsx` - Animations
- `src/store/diary.ts` - Diary theme state (Zustand)

### Modified Files
- `src/components/desk/DeskScene.tsx` - Add theme selector
- `src/components/desk/BookSpread.tsx` - Apply page themes
- `src/components/desk/DeskBook.tsx` - Apply cover themes
- `src/components/desk/LeftPage.tsx` - Theme-aware doodle canvas
- `src/components/desk/RightPage.tsx` - Theme-aware text area

### Theme Data Structure
```typescript
interface DiaryTheme {
  id: string
  name: string
  description: string
  cover: {
    background: string       // CSS gradient or color
    texture?: string         // Optional texture overlay
    border?: string          // SVG border pattern
    corners?: string         // Corner decoration SVG
    emblem?: string          // Center emblem SVG
    edgeColor?: string       // Gilded edges
  }
  pages: {
    background: string
    textColor: string
    lineColor?: string
    lineStyle: 'ruled' | 'dotted' | 'none' | 'constellation'
    borderDecoration?: string  // SVG
    cornerDecoration?: string  // SVG
    watermark?: string         // SVG
    marginLine?: boolean
  }
  interactive: {
    ribbon?: { color: string; enabled: boolean }
    waxSeal?: { design: string; enabled: boolean }
    pageCurl: boolean
    glowingInk?: boolean
    floatingParticles?: 'magical' | 'botanical' | 'stars' | null
    clasp?: boolean
  }
}
```

---

## Success Criteria

1. All 6 themes render correctly with distinct visual identity
2. Themes work with all 11 environment backgrounds
3. Interactive elements animate smoothly (60fps)
4. Theme selection persists across sessions
5. Doodle canvas adapts to page colors
6. No performance regression on page turns
