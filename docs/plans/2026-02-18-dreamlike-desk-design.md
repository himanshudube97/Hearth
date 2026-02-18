# Dreamlike Writer's Desk - Design Document

**Date**: 2026-02-18
**Status**: Implemented
**Approach**: CSS + Framer Motion (illustrated 2D with depth illusions)
**Last Updated**: 2026-02-18

## Overview

Transform Hearth from a traditional app navigation into an immersive, abstract **writer's desk scene** - a dreamlike, illustrated environment where:

- A **book** on the desk is the journal (write/read entries with page-folding)
- A **window** reveals the constellation/stars view
- A **drawer** contains letters (sealed, unsent, delivered)
- A **candle** controls themes/ambiance

The aesthetic is abstract and dreamlike - think *Monument Valley* or *Gris* - flat illustration with clever depth, not photorealistic.

## Goals

1. **Immersive writing experience** - Feel like sitting at a cozy desk
2. **Magical page-turning** - Satisfying fold/flip animations when browsing or finishing entries
3. **Spatial navigation** - Features discovered through environment, not menus
4. **Theme integration** - All 10 themes affect the entire scene
5. **Performance** - Smooth 60fps on all devices using CSS/Framer Motion

## Scene Composition

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          ░░░░░ AMBIENT BACKGROUND (theme particles) ░░░░░  │
│                                                             │
│                    ┌───────────────┐                        │
│                    │    WINDOW     │   ← Constellation      │
│                    │   (starlight) │      view access       │
│                    └───────────────┘                        │
│                                                             │
│         ┌────────────────────────────────┐                  │
│         │      ╭──────────╮╭──────────╮  │                  │
│         │      │   LEFT   ││  RIGHT   │  │  ← Open Book     │
│         │      │   PAGE   ││  PAGE    │  │    (journal)     │
│         │      │          ││          │  │                  │
│         │      ╰──────────╯╰──────────╯  │                  │
│         └────────────────────────────────┘                  │
│                                                             │
│   🕯️ CANDLE                              ┌────────┐         │
│   (theme picker)                         │ DRAWER │         │
│                                          │(letters)│        │
│                                          └────────┘         │
│                                                             │
│   ─────────────── DESK SURFACE ───────────────────────────  │
└─────────────────────────────────────────────────────────────┘
```

### Layer Stack (back to front)

1. **Background layer** - Theme-specific ambient (existing `Background.tsx`)
2. **Room layer** - Soft vignette, atmospheric depth
3. **Window layer** - Floating ethereally, soft glow
4. **Desk layer** - Wooden surface with subtle grain texture
5. **Objects layer** - Book, candle, drawer with shadows
6. **Foreground layer** - Floating particles, dust motes, light rays

## Component Architecture

### Implemented Components

```
src/components/desk/
├── index.ts               # Barrel exports
├── DeskScene.tsx          # Main container with vignette, ambient lighting, dust particles
├── DeskBook.tsx           # Leather-bound book with open/close states
├── DeskWindow.tsx         # Window linking to /constellation
├── DeskDrawer.tsx         # Drawer linking to /letters
├── DeskCandle.tsx         # Theme picker with flame animation
├── BookSpread.tsx         # Open book container (920x600px), fetches entries
├── LeftPage.tsx           # Media page: mood picker, song input, doodle/image placeholders
├── RightPage.tsx          # Text page: writing area with prompt, or read-only view
└── PageTurn.tsx           # 3D page-turning animation (rotateY 0 → -180deg)
```

### Two-Page-Per-Entry Model

Each spread represents a single entry/day:
- **Left Page (LeftPage.tsx)**: Media content
  - New entry: Mood picker (5 levels), song link input, doodle placeholder, image upload placeholder
  - Viewing: Displays saved mood, song, doodle preview
- **Right Page (RightPage.tsx)**: Text content
  - New entry: Writing prompt, textarea, save button
  - Viewing: Read-only display of entry text

### State Management

Implemented in `src/store/desk.ts` using Zustand with persist middleware:

```typescript
interface DeskStore {
  // Book state
  isBookOpen: boolean;
  currentSpread: number;        // 0 = newest entries, entries.length = new entry spread
  totalSpreads: number;
  isPageTurning: boolean;
  turnDirection: 'forward' | 'backward' | null;

  // Scene state
  activeElement: 'book' | 'window' | 'drawer' | 'candle' | null;
  isDrawerOpen: boolean;
  isWindowActive: boolean;

  // Key actions
  openBook: () => void;
  closeBook: () => void;
  turnPage: (direction: 'forward' | 'backward') => void;
  finishPageTurn: () => void;
  goToSpread: (spread: number) => void;
  setTotalSpreads: (total: number) => void;
  openAtLatestSpread: (totalEntries: number) => void;  // Opens at "new entry" spread
}
```

Only `isDrawerOpen` is persisted to localStorage.

## Detailed Element Specifications

### 1. The Book (Journal)

**Dimensions**: 920px × 600px (open state)

**Closed State (DeskBook.tsx)**
- Leather-bound appearance with theme-colored accent
- Title embossed: "Journal" with decorative corner elements
- Subtle breathing animation (scale 1.0 → 1.02)
- Soft drop shadow that shifts with hover
- Metallic corner ornaments

**Open State (BookSpread.tsx)**
- Two-page spread representing ONE entry/day
- Left page: Media content (mood, song, doodle, image)
- Right page: Text content (writing or reading)
- Visible binding spine in center (24px with stitches)
- Page edges visible (stack hints) when more pages exist
- Gentle paper texture overlay (SVG fractal noise)
- Date header spanning both pages
- Page indicator showing "New Entry" or "Entry X of Y"

**Open at Latest Behavior**
- Book opens at the "new entry" spread (spread index = entries.length)
- Navigate backward (‹) to view older entries
- Navigate forward (›) to return to newer entries / new entry

**Page-Turn Animation Sequence**

```
1. INITIATE (user clicks next or drags corner)
   └─ Corner lifts, subtle shadow appears underneath

2. CURL (page follows finger/auto-animates)
   └─ CSS transform: rotateY(-15deg) + skewY(2deg)
   └─ Bezier curve on page edge (clip-path or SVG)
   └─ Back-of-page shows through (slight texture/color diff)

3. FLIP (crosses midpoint)
   └─ rotateY(-90deg) → rotateY(-180deg)
   └─ Shadow intensity peaks at 90deg
   └─ Spring physics for natural momentum

4. SETTLE (page lands)
   └─ Soft bounce (spring: { damping: 20, stiffness: 300 })
   └─ Shadow fades
   └─ New content fades in (opacity 0 → 1, 200ms delay)
```

**Technical Implementation**
- `perspective: 2000px` on book container
- `transform-style: preserve-3d` for real depth
- Framer Motion `useSpring` for physics
- `backface-visibility` for two-sided pages

### 2. The Window (Constellation)

**Idle State**
- Floats slightly above desk plane (subtle parallax on mouse move)
- Soft starlight glow pulses (theme-dependent)
- Window frame with slight depth/bevel
- "Glass" has subtle reflection/sheen

**Interaction**
- Hover: Stars inside twinkle faster, frame glows
- Click: Zoom transition into full constellation view
- Transition: Window expands to fill screen, frame dissolves

**Theme Variations**
| Theme | Window Shows |
|-------|--------------|
| Cosmos | Purple nebula, bright stars |
| Northern Lights | Aurora ribbons |
| Gentle Rain | Raindrops on glass, grey sky |
| Winter/Snow | Snowfall, frosted edges |
| Others | Starfield with theme-colored tint |

### 3. The Drawer (Letters)

**Closed State**
- Wooden drawer with brass/gold handle
- Slight gap showing envelope peek (teaser)
- Envelope has wax seal (for sealed letters)

**Interaction**
- Hover: Slides out 20px, envelope wiggles
- Click: Slides fully open with spring physics
- Open reveals: Stack of envelopes (letters list)

**Open State**
- Envelopes arranged in overlapping stack
- Each envelope shows: recipient, date, sealed/unsealed icon
- Click envelope → Letter detail view

### 4. The Candle (Themes)

**Idle State**
- Melted wax, warm glow on desk surface
- Flame flickers (CSS animation, random timing)
- Smoke wisps rise (subtle, CSS or SVG path animation)

**Interaction**
- Hover: Flame grows brighter/taller
- Click: Theme carousel appears in smoke/glow

**Theme Picker**
- Circular carousel around candle
- Each theme as a colored orb/flame
- Selection causes room-wide color transition
- Smooth 600ms theme crossfade

## Page-Turning Mechanics (Deep Dive)

### Navigation Triggers (Implemented)

**Edge-Only Click Zones** (14px wide strips on left/right edges)
- Allows writing/interaction on the rest of the page
- Visual feedback: gradient overlay on hover, animated arrow indicator

| Action | Result |
|--------|--------|
| Click left edge (14px strip) | Turn backward → newer entries |
| Click right edge (14px strip) | Turn forward → older entries |
| Save entry | Refresh entries, stay on new entry spread |

**Not Yet Implemented**
- Swipe gestures
- Keyboard navigation
- Corner drag

### Page Content Mapping (Implemented)

Each spread = one entry (or new entry page):

```typescript
// In BookSpread.tsx:
// entries are fetched from API, ordered newest first
// currentSpread index determines which entry to show

const currentEntry = currentSpread < entries.length
  ? entries[entries.length - 1 - currentSpread]  // Reverse index
  : null;
const isNewEntrySpread = currentSpread === entries.length;

// Spread mapping:
// Spread 0: Newest entry (or new entry if no entries exist)
// Spread 1: Second newest entry
// Spread N: Oldest entry
// Spread entries.length: New entry spread (blank for writing)
```

**Left Page Content (LeftPage.tsx)**
- New entry mode: Mood picker, song input, doodle/image placeholders
- View mode: Saved mood emoji + label, song link, doodle preview

**Right Page Content (RightPage.tsx)**
- New entry mode: Random prompt, textarea, character count, save button
- View mode: Entry text (HTML stripped), character count, timestamp

### Page-Turn CSS Structure

```css
.book {
  perspective: 2000px;
  perspective-origin: center center;
}

.page {
  transform-style: preserve-3d;
  transform-origin: left center; /* For right-side pages */
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-front, .page-back {
  position: absolute;
  backface-visibility: hidden;
}

.page-back {
  transform: rotateY(180deg);
}

.page.turning {
  transform: rotateY(-180deg);
}
```

## Visual Style Guide

### Color Palette (Base - Modified by Themes)

```
Desk Wood:     hsl(30, 30%, 25%)  → warm brown
Paper:         hsl(40, 30%, 92%)  → cream/off-white
Shadows:       hsla(0, 0%, 0%, 0.2-0.4)
Highlights:    hsla(45, 80%, 70%, 0.3)  → warm light
Vignette:      radial-gradient, dark edges
```

### Typography in Book

- **Entry text**: Georgia or theme-specific font (existing)
- **Page numbers**: Small, bottom corners, muted color
- **Date headers**: Elegant script or small caps

### Illustration Style

- **Soft edges**: No harsh lines, slight blur on edges
- **Watercolor gradients**: CSS gradients with noise texture overlay
- **Depth via shadow**: Multiple layered box-shadows
- **Warm lighting**: Candle casts gradient glow (CSS radial-gradient)

## Animation Specifications

### Easing Curves

```typescript
const EASE = {
  smooth: [0.22, 1, 0.36, 1],      // Existing Hearth standard
  bounce: [0.34, 1.56, 0.64, 1],   // For playful moments
  page: [0.4, 0, 0.2, 1],          // Page turn specific
};
```

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Page turn | 600ms | page |
| Drawer open | 400ms | smooth |
| Window zoom | 800ms | smooth |
| Candle flame | infinite, random | linear |
| Hover effects | 200ms | smooth |
| Theme transition | 600ms | smooth |

### Framer Motion Variants

```typescript
const pageVariants = {
  flat: { rotateY: 0, z: 0 },
  lifting: { rotateY: -15, z: 20 },
  turning: { rotateY: -180, z: 0 },
};

const drawerVariants = {
  closed: { x: 0 },
  peeking: { x: 20 },
  open: { x: 200 },
};
```

## Integration with Existing Features

### Implemented Integrations

| Current Feature | Desk Integration |
|-----------------|------------------|
| Entry Text | Plain textarea in RightPage (not TipTap, for simplicity) |
| Mood Picker | Integrated into LeftPage with 5-level emoji selector |
| Song Input | Text input in LeftPage for Spotify/YouTube/SoundCloud links |
| Entry API | RightPage POSTs to /api/entries on save |
| Background particles | Remain as ambient layer (existing Background.tsx) |
| Theme system | useThemeStore drives scene colors, mood colors |
| Journal store | useJournalStore for currentMood, currentSong state |
| Desk store | New useDeskStore for book/scene state |

### API Integration

```typescript
// RightPage.tsx - Save entry
const res = await fetch('/api/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: `<p>${text.replace(/\n/g, '</p><p>')}</p>`,
    mood: currentMood,
    song: currentSong || null,
    doodles: [],
  }),
});
```

### Navigation Flow (Implemented)

```
/desk → Desk Scene
           │
           ├─→ Book (click) → Opens BookSpread
           │                      │
           │                      ├─→ New Entry spread (write on both pages)
           │                      ├─→ ‹ Left edge → Newer entries
           │                      ├─→ › Right edge → Older entries
           │                      └─→ "Close Book" → Return to closed book
           │
           ├─→ Window (click) → Navigate to /constellation
           │
           ├─→ Drawer (click) → Navigate to /letters
           │
           └─→ Candle (click) → Theme picker popover (10 themes)
```

## Responsive Considerations

### Desktop (>1024px)
- Full desk scene with all elements visible
- Book opens to two-page spread

### Tablet (768px - 1024px)
- Slightly zoomed in on desk
- All elements accessible
- Book may be single-page on smaller tablets

### Mobile (<768px)
- Further zoomed, book is primary focus
- Window/drawer/candle as floating icons or slide-up drawer
- Single-page book view
- Swipe gestures for page turn

## Performance Optimizations (Implemented)

1. **CSS transforms only** - No layout thrashing during animations
2. **will-change hints** - Applied to PageWrapper components
3. **React.memo** - LeftPage, RightPage, PageWrapper are memoized
4. **useCallback** - All handlers wrapped to prevent re-renders
5. **GPU acceleration** - `transform: translateZ(0)` on animated layers
6. **Efficient re-fetching** - Only fetch entries on save complete, not on every page turn

**Future Optimizations**
- Lazy load pages (only render visible spread + 1)
- Throttle parallax effects
- Reduce particles on mobile

## Accessibility

- **Keyboard navigation**: Arrow keys for pages, Tab between elements
- **Screen reader**: Semantic HTML, ARIA labels for desk elements
- **Reduced motion**: Respect `prefers-reduced-motion`, instant transitions
- **Focus indicators**: Visible focus rings on interactive elements

## Open Questions / Future Enhancements

1. **Sound effects?** - Page rustle, drawer slide, flame crackle (optional toggle)
2. **Day/night cycle?** - Scene lighting changes based on time
3. **Desk customization?** - User chooses desk wood, book cover color
4. **More desk objects?** - Coffee cup (break reminder), plant (streak growth), clock

---

## Implementation Status

### Completed
- [x] DeskScene container with vignette, ambient lighting, dust particles
- [x] DeskBook with leather-bound closed state and decorative elements
- [x] BookSpread (920x600px) with two-page layout
- [x] LeftPage with mood picker, song input, doodle/image placeholders
- [x] RightPage with writing prompt, textarea, save functionality
- [x] PageTurn animation (3D rotateY with 600ms duration)
- [x] Edge-only click zones for page navigation
- [x] Open at latest spread behavior
- [x] Entry save API integration
- [x] DeskWindow linking to /constellation
- [x] DeskDrawer linking to /letters
- [x] DeskCandle with theme picker
- [x] Performance optimizations (memo, useCallback, will-change)

### Remaining / Future Enhancements
- [ ] Doodle canvas implementation (currently placeholder)
- [ ] Image upload functionality (currently placeholder)
- [ ] Keyboard navigation (arrow keys)
- [ ] Swipe gestures for mobile
- [ ] Responsive layout for tablet/mobile
- [ ] Sound effects (optional)
- [ ] Day/night cycle based on time
