# Dreamlike Writer's Desk Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Hearth into an immersive writer's desk scene with page-folding book, window (stars), drawer (letters), and candle (themes).

**Architecture:** New `DeskScene` component replaces the standard layout for authenticated pages. Uses CSS transforms + Framer Motion for 3D-like page turns. New Zustand store tracks desk state (book open/closed, current page spread, drawer state).

**Tech Stack:** React 19, Next.js 16, Framer Motion v12, Zustand, TipTap, CSS transforms with perspective

---

## Task 1: Create Desk Store

**Files:**
- Create: `src/store/desk.ts`

**Step 1: Create the desk state store**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeskElement = 'book' | 'window' | 'drawer' | 'candle' | null

interface DeskStore {
  // Book state
  isBookOpen: boolean
  currentSpread: number
  isPageTurning: boolean
  turnDirection: 'forward' | 'backward' | null

  // Scene state
  activeElement: DeskElement
  isDrawerOpen: boolean
  isWindowActive: boolean

  // Actions
  openBook: () => void
  closeBook: () => void
  turnPage: (direction: 'forward' | 'backward') => void
  finishPageTurn: () => void
  setActiveElement: (element: DeskElement) => void
  toggleDrawer: () => void
  setWindowActive: (active: boolean) => void
  goToSpread: (spread: number) => void
}

export const useDeskStore = create<DeskStore>()(
  persist(
    (set) => ({
      isBookOpen: false,
      currentSpread: 0,
      isPageTurning: false,
      turnDirection: null,
      activeElement: null,
      isDrawerOpen: false,
      isWindowActive: false,

      openBook: () => set({ isBookOpen: true, activeElement: 'book' }),
      closeBook: () => set({ isBookOpen: false, activeElement: null }),

      turnPage: (direction) => set({
        isPageTurning: true,
        turnDirection: direction
      }),

      finishPageTurn: () => set((state) => ({
        isPageTurning: false,
        turnDirection: null,
        currentSpread: state.turnDirection === 'forward'
          ? state.currentSpread + 1
          : Math.max(0, state.currentSpread - 1)
      })),

      setActiveElement: (element) => set({ activeElement: element }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setWindowActive: (active) => set({ isWindowActive: active }),
      goToSpread: (spread) => set({ currentSpread: spread }),
    }),
    {
      name: 'hearth-desk',
    }
  )
)
```

**Step 2: Verify file created**

Run: `ls -la src/store/desk.ts`
Expected: File exists

---

## Task 2: Create DeskScene Container

**Files:**
- Create: `src/components/desk/DeskScene.tsx`

**Step 1: Create the main desk scene container**

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import DeskBook from './DeskBook'
import DeskWindow from './DeskWindow'
import DeskDrawer from './DeskDrawer'
import DeskCandle from './DeskCandle'

export default function DeskScene() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useThemeStore()
  const { activeElement } = useDeskStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: theme.bg.gradient,
        perspective: '2000px',
      }}
    >
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Desk surface */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: `linear-gradient(180deg,
            ${theme.bg.secondary}00 0%,
            ${theme.bg.secondary}40 20%,
            ${theme.bg.secondary}80 100%
          )`,
        }}
      />

      {/* Window - top area */}
      <motion.div
        className="absolute"
        style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
        animate={{
          scale: activeElement === 'window' ? 1.05 : 1,
          y: activeElement === 'window' ? -10 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <DeskWindow />
      </motion.div>

      {/* Book - center */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DeskBook />
      </motion.div>

      {/* Candle - left side */}
      <motion.div
        className="absolute"
        style={{ bottom: '20%', left: '12%' }}
        animate={{
          scale: activeElement === 'candle' ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <DeskCandle />
      </motion.div>

      {/* Drawer - right side */}
      <motion.div
        className="absolute"
        style={{ bottom: '15%', right: '10%' }}
      >
        <DeskDrawer />
      </motion.div>

      {/* Ambient dust particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: `${theme.accent.warm}40`,
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/DeskScene.tsx`
Expected: File exists

---

## Task 3: Create DeskBook Component (Closed State)

**Files:**
- Create: `src/components/desk/DeskBook.tsx`

**Step 1: Create the book component with closed/open states**

```tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import BookSpread from './BookSpread'

export default function DeskBook() {
  const { theme } = useThemeStore()
  const { isBookOpen, openBook, closeBook } = useDeskStore()

  return (
    <div className="relative" style={{ perspective: '2000px' }}>
      <AnimatePresence mode="wait">
        {!isBookOpen ? (
          // Closed book
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, rotateY: -30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={openBook}
            className="cursor-pointer relative"
            style={{ transformStyle: 'preserve-3d' }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Book cover */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                width: '280px',
                height: '360px',
                background: `linear-gradient(135deg,
                  ${theme.accent.warm}30 0%,
                  ${theme.accent.warm}15 50%,
                  ${theme.accent.warm}25 100%
                )`,
                boxShadow: `
                  8px 8px 24px rgba(0,0,0,0.4),
                  inset 2px 0 4px rgba(255,255,255,0.1),
                  inset -2px 0 4px rgba(0,0,0,0.2)
                `,
                border: `1px solid ${theme.accent.warm}20`,
              }}
            >
              {/* Spine detail */}
              <div
                className="absolute left-0 top-0 bottom-0 w-8"
                style={{
                  background: `linear-gradient(90deg,
                    ${theme.accent.warm}40 0%,
                    ${theme.accent.warm}20 50%,
                    transparent 100%
                  )`,
                  borderRight: `1px solid ${theme.accent.warm}30`,
                }}
              />

              {/* Title area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <motion.div
                    className="text-2xl font-serif mb-2"
                    style={{
                      color: theme.accent.warm,
                      textShadow: `0 2px 8px ${theme.accent.warm}40`,
                    }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Journal
                  </motion.div>
                  <div
                    className="text-xs tracking-widest uppercase"
                    style={{ color: theme.text.muted }}
                  >
                    Click to open
                  </div>
                </div>
              </div>

              {/* Page edges (right side) */}
              <div
                className="absolute right-0 top-2 bottom-2 w-2"
                style={{
                  background: `repeating-linear-gradient(
                    180deg,
                    ${theme.text.primary}08 0px,
                    ${theme.text.primary}08 2px,
                    transparent 2px,
                    transparent 4px
                  )`,
                }}
              />

              {/* Corner decoration */}
              <div
                className="absolute bottom-4 right-4 w-12 h-12"
                style={{
                  borderRight: `2px solid ${theme.accent.warm}30`,
                  borderBottom: `2px solid ${theme.accent.warm}30`,
                }}
              />
            </div>

            {/* Book shadow */}
            <motion.div
              className="absolute -bottom-4 left-4 right-4 h-8 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.3)',
                filter: 'blur(12px)',
              }}
              animate={{
                opacity: [0.3, 0.4, 0.3],
                scaleX: [1, 1.02, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        ) : (
          // Open book
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookSpread onClose={closeBook} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/DeskBook.tsx`
Expected: File exists

---

## Task 4: Create BookSpread Component (Open Book with Pages)

**Files:**
- Create: `src/components/desk/BookSpread.tsx`

**Step 1: Create the open book spread with two pages**

```tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import PageContent from './PageContent'

interface BookSpreadProps {
  onClose: () => void
}

export default function BookSpread({ onClose }: BookSpreadProps) {
  const { theme } = useThemeStore()
  const { currentSpread, turnPage, isPageTurning } = useDeskStore()

  const handlePrevPage = () => {
    if (currentSpread > 0 && !isPageTurning) {
      turnPage('backward')
    }
  }

  const handleNextPage = () => {
    if (!isPageTurning) {
      turnPage('forward')
    }
  }

  return (
    <div
      className="relative"
      style={{
        perspective: '2500px',
        perspectiveOrigin: 'center center',
      }}
    >
      {/* Close button */}
      <motion.button
        onClick={onClose}
        className="absolute -top-12 right-0 z-20 px-4 py-2 rounded-full text-sm"
        style={{
          background: theme.glass.bg,
          color: theme.text.muted,
          border: `1px solid ${theme.glass.border}`,
        }}
        whileHover={{ scale: 1.05, background: theme.glass.bg }}
        whileTap={{ scale: 0.95 }}
      >
        Close Book
      </motion.button>

      {/* Book container */}
      <div
        className="relative flex"
        style={{
          width: '700px',
          height: '480px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Left page */}
        <motion.div
          className="relative flex-1 cursor-pointer"
          onClick={handlePrevPage}
          style={{
            background: `linear-gradient(90deg,
              ${theme.bg.secondary}F0 0%,
              ${theme.bg.secondary}F8 100%
            )`,
            borderRadius: '4px 0 0 4px',
            boxShadow: `
              inset -4px 0 12px rgba(0,0,0,0.15),
              -4px 4px 16px rgba(0,0,0,0.2)
            `,
            transformOrigin: 'right center',
          }}
          whileHover={{
            x: currentSpread > 0 ? -5 : 0,
            boxShadow: currentSpread > 0
              ? `inset -4px 0 12px rgba(0,0,0,0.15), -8px 4px 20px rgba(0,0,0,0.25)`
              : undefined
          }}
        >
          {/* Page texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Margin line */}
          <div
            className="absolute top-8 bottom-8 w-px"
            style={{
              left: '40px',
              background: `${theme.accent.warm}30`,
            }}
          />

          {/* Page content */}
          <div className="p-8 pl-12 h-full overflow-hidden">
            <PageContent
              side="left"
              spreadIndex={currentSpread}
            />
          </div>

          {/* Page number */}
          <div
            className="absolute bottom-4 left-8 text-xs"
            style={{ color: theme.text.muted }}
          >
            {currentSpread * 2 > 0 ? currentSpread * 2 : ''}
          </div>

          {/* Turn hint */}
          {currentSpread > 0 && (
            <motion.div
              className="absolute top-1/2 left-4 -translate-y-1/2"
              style={{ color: theme.text.muted }}
              animate={{ x: [-2, 2, -2], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ‹
            </motion.div>
          )}
        </motion.div>

        {/* Center binding */}
        <div
          className="w-4 relative z-10"
          style={{
            background: `linear-gradient(90deg,
              ${theme.bg.secondary}D0 0%,
              ${theme.bg.secondary}60 30%,
              ${theme.bg.secondary}60 70%,
              ${theme.bg.secondary}D0 100%
            )`,
            boxShadow: `
              inset 2px 0 4px rgba(0,0,0,0.3),
              inset -2px 0 4px rgba(0,0,0,0.3)
            `,
          }}
        />

        {/* Right page */}
        <motion.div
          className="relative flex-1 cursor-pointer"
          onClick={handleNextPage}
          style={{
            background: `linear-gradient(90deg,
              ${theme.bg.secondary}F8 0%,
              ${theme.bg.secondary}F0 100%
            )`,
            borderRadius: '0 4px 4px 0',
            boxShadow: `
              inset 4px 0 12px rgba(0,0,0,0.1),
              4px 4px 16px rgba(0,0,0,0.2)
            `,
            transformOrigin: 'left center',
          }}
          whileHover={{
            x: 5,
            boxShadow: `inset 4px 0 12px rgba(0,0,0,0.1), 8px 4px 20px rgba(0,0,0,0.25)`
          }}
        >
          {/* Page texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Page content */}
          <div className="p-8 pr-12 h-full overflow-hidden">
            <PageContent
              side="right"
              spreadIndex={currentSpread}
            />
          </div>

          {/* Page number */}
          <div
            className="absolute bottom-4 right-8 text-xs"
            style={{ color: theme.text.muted }}
          >
            {currentSpread * 2 + 1}
          </div>

          {/* Turn hint */}
          <motion.div
            className="absolute top-1/2 right-4 -translate-y-1/2"
            style={{ color: theme.text.muted }}
            animate={{ x: [2, -2, 2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ›
          </motion.div>

          {/* Stack of pages hint */}
          <div
            className="absolute top-2 bottom-2 right-0 w-1"
            style={{
              background: `repeating-linear-gradient(
                180deg,
                ${theme.text.primary}06 0px,
                ${theme.text.primary}06 3px,
                transparent 3px,
                transparent 5px
              )`,
            }}
          />
        </motion.div>
      </div>

      {/* Book shadow */}
      <div
        className="absolute -bottom-6 left-8 right-8 h-12 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.25)',
          filter: 'blur(16px)',
        }}
      />
    </div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/BookSpread.tsx`
Expected: File exists

---

## Task 5: Create PageContent Component

**Files:**
- Create: `src/components/desk/PageContent.tsx`

**Step 1: Create the page content component that shows entries or editor**

```tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import Editor from '@/components/Editor'
import { getRandomPrompt } from '@/lib/themes'

interface PageContentProps {
  side: 'left' | 'right'
  spreadIndex: number
}

export default function PageContent({ side, spreadIndex }: PageContentProps) {
  const { theme } = useThemeStore()

  // First spread (index 0): left is decorative, right is editor
  // Other spreads: show entries (to be connected later)

  if (spreadIndex === 0) {
    if (side === 'left') {
      // Decorative first page
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="h-full flex flex-col items-center justify-center text-center"
        >
          <div
            className="text-4xl font-serif mb-4"
            style={{ color: theme.accent.warm }}
          >
            ✦
          </div>
          <div
            className="text-lg font-serif italic mb-2"
            style={{ color: theme.text.secondary }}
          >
            Your thoughts,
          </div>
          <div
            className="text-lg font-serif italic"
            style={{ color: theme.text.secondary }}
          >
            your sanctuary.
          </div>
          <div
            className="mt-8 text-xs tracking-widest uppercase"
            style={{ color: theme.text.muted }}
          >
            Hearth Journal
          </div>
        </motion.div>
      )
    } else {
      // Editor on right page
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="h-full flex flex-col"
        >
          <div
            className="text-xs uppercase tracking-wider mb-4"
            style={{ color: theme.text.muted }}
          >
            Today's Entry
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor prompt={getRandomPrompt()} />
          </div>
        </motion.div>
      )
    }
  }

  // Placeholder for other spreads (entries)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex items-center justify-center"
    >
      <div
        className="text-sm italic"
        style={{ color: theme.text.muted }}
      >
        {side === 'left' ? 'Previous entries...' : 'More entries...'}
      </div>
    </motion.div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/PageContent.tsx`
Expected: File exists

---

## Task 6: Create DeskWindow Component

**Files:**
- Create: `src/components/desk/DeskWindow.tsx`

**Step 1: Create the window component for constellation view**

```tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'

export default function DeskWindow() {
  const { theme } = useThemeStore()
  const { setActiveElement, isWindowActive, setWindowActive } = useDeskStore()
  const router = useRouter()

  const handleClick = () => {
    setWindowActive(true)
    setActiveElement('window')
    // Navigate to constellation after animation
    setTimeout(() => {
      router.push('/constellation')
    }, 400)
  }

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setActiveElement('window')}
      onHoverEnd={() => setActiveElement(null)}
      className="relative cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Window frame */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: '200px',
          height: '160px',
          background: `linear-gradient(180deg,
            ${theme.bg.primary}80 0%,
            ${theme.bg.primary}60 100%
          )`,
          border: `3px solid ${theme.accent.warm}40`,
          boxShadow: `
            inset 0 0 30px rgba(255,255,255,0.05),
            0 8px 32px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Window panes */}
        <div
          className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px p-1"
          style={{ background: `${theme.accent.warm}20` }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{
                background: `linear-gradient(180deg,
                  #0a0a1a 0%,
                  #151530 100%
                )`,
              }}
            >
              {/* Stars */}
              {[...Array(8)].map((_, j) => (
                <motion.div
                  key={j}
                  className="absolute w-0.5 h-0.5 rounded-full bg-white"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${15 + Math.random() * 70}%`,
                  }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Glass reflection */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg,
              rgba(255,255,255,0.08) 0%,
              transparent 50%,
              transparent 100%
            )`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Starlight glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%,
              rgba(200, 220, 255, 0.1) 0%,
              transparent 60%
            )`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Window sill */}
      <div
        className="h-3 rounded-b-lg"
        style={{
          background: `linear-gradient(180deg,
            ${theme.accent.warm}30 0%,
            ${theme.accent.warm}20 100%
          )`,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      />

      {/* Label */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
        style={{ color: theme.text.muted }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        View Stars
      </motion.div>
    </motion.div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/DeskWindow.tsx`
Expected: File exists

---

## Task 7: Create DeskDrawer Component

**Files:**
- Create: `src/components/desk/DeskDrawer.tsx`

**Step 1: Create the drawer component for letters**

```tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'

export default function DeskDrawer() {
  const { theme } = useThemeStore()
  const { isDrawerOpen, toggleDrawer, setActiveElement } = useDeskStore()
  const router = useRouter()

  const handleLettersClick = () => {
    router.push('/letters')
  }

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setActiveElement('drawer')}
      onHoverEnd={() => !isDrawerOpen && setActiveElement(null)}
    >
      {/* Drawer body */}
      <motion.div
        onClick={toggleDrawer}
        className="relative cursor-pointer"
        animate={{
          x: isDrawerOpen ? 60 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ x: isDrawerOpen ? 60 : 15 }}
      >
        {/* Drawer front */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            width: '140px',
            height: '80px',
            background: `linear-gradient(180deg,
              ${theme.accent.warm}25 0%,
              ${theme.accent.warm}15 100%
            )`,
            border: `1px solid ${theme.accent.warm}30`,
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.1),
              0 4px 12px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Wood grain texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent 0px,
                ${theme.accent.warm}40 1px,
                transparent 2px,
                transparent 20px
              )`,
            }}
          />

          {/* Handle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-16 h-3 rounded-full"
              style={{
                background: `linear-gradient(180deg,
                  ${theme.accent.warm}60 0%,
                  ${theme.accent.warm}40 100%
                )`,
                boxShadow: `
                  inset 0 1px 2px rgba(255,255,255,0.2),
                  0 2px 4px rgba(0,0,0,0.3)
                `,
              }}
            />
          </div>

          {/* Envelope peeking out */}
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2"
            animate={{
              y: isDrawerOpen ? -10 : 0,
              rotate: isDrawerOpen ? -5 : 0,
            }}
          >
            <div
              className="w-12 h-8 rounded-sm"
              style={{
                background: `linear-gradient(135deg,
                  #f5f0e8 0%,
                  #e8e0d8 100%
                )`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {/* Envelope flap */}
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{
                  background: `linear-gradient(180deg,
                    #ebe5dd 0%,
                    #f5f0e8 100%
                  )`,
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                }}
              />
              {/* Wax seal */}
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                style={{
                  background: theme.accent.warm,
                  boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.3)`,
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Open drawer content */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 -left-4"
            onClick={handleLettersClick}
          >
            <motion.button
              className="px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: theme.text.primary,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Letters
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
        style={{ color: theme.text.muted }}
        animate={{ opacity: isDrawerOpen ? 1 : 0 }}
      >
        Letters
      </motion.div>

      {/* Shadow */}
      <div
        className="absolute -bottom-2 left-2 right-2 h-4 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.2)',
          filter: 'blur(6px)',
        }}
      />
    </motion.div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/DeskDrawer.tsx`
Expected: File exists

---

## Task 8: Create DeskCandle Component

**Files:**
- Create: `src/components/desk/DeskCandle.tsx`

**Step 1: Create the candle component for theme switching**

```tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { themes, ThemeName } from '@/lib/themes'

export default function DeskCandle() {
  const { theme, themeName, setTheme } = useThemeStore()
  const { setActiveElement } = useDeskStore()
  const [showPicker, setShowPicker] = useState(false)

  const themeNames = Object.keys(themes) as ThemeName[]

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setActiveElement('candle')}
      onHoverEnd={() => !showPicker && setActiveElement(null)}
    >
      {/* Candle */}
      <motion.div
        onClick={() => setShowPicker(!showPicker)}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Candle body */}
        <div
          className="relative"
          style={{
            width: '40px',
            height: '80px',
            background: `linear-gradient(180deg,
              #f5f0e8 0%,
              #e8e0d0 50%,
              #ddd5c5 100%
            )`,
            borderRadius: '4px 4px 8px 8px',
            boxShadow: `
              inset -4px 0 8px rgba(0,0,0,0.1),
              4px 4px 12px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Wax drips */}
          <div
            className="absolute top-0 left-1 w-2 h-6 rounded-b-full"
            style={{ background: '#e8e0d0' }}
          />
          <div
            className="absolute top-0 right-2 w-1.5 h-4 rounded-b-full"
            style={{ background: '#ddd5c5' }}
          />
        </div>

        {/* Wick */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-4"
          style={{
            background: '#333',
            borderRadius: '1px',
          }}
        />

        {/* Flame */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2"
          animate={{
            scaleY: [1, 1.1, 0.95, 1.05, 1],
            scaleX: [1, 0.95, 1.05, 0.98, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        >
          {/* Inner flame */}
          <div
            className="w-3 h-6 rounded-full"
            style={{
              background: `linear-gradient(180deg,
                #fff8e0 0%,
                ${theme.accent.warm} 40%,
                #ff6b35 100%
              )`,
              filter: 'blur(1px)',
            }}
          />
          {/* Outer glow */}
          <div
            className="absolute inset-0 w-6 h-8 -left-1.5 -top-1 rounded-full"
            style={{
              background: `radial-gradient(circle,
                ${theme.accent.warm}40 0%,
                transparent 70%
              )`,
              filter: 'blur(4px)',
            }}
          />
        </motion.div>

        {/* Light cast on desk */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full"
          style={{
            background: `radial-gradient(ellipse at center,
              ${theme.accent.warm}20 0%,
              transparent 70%
            )`,
          }}
          animate={{
            opacity: [0.4, 0.6, 0.4],
            scaleX: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Theme picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-4 left-16 z-50"
          >
            <div
              className="p-3 rounded-xl grid grid-cols-3 gap-2"
              style={{
                background: theme.glass.bg,
                backdropFilter: `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {themeNames.map((name) => (
                <motion.button
                  key={name}
                  onClick={() => {
                    setTheme(name)
                    setShowPicker(false)
                  }}
                  className="w-8 h-8 rounded-full relative"
                  style={{
                    background: themes[name].accent.warm,
                    border: name === themeName
                      ? `2px solid ${theme.text.primary}`
                      : '2px solid transparent',
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title={themes[name].name}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
        style={{ color: theme.text.muted }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        Themes
      </motion.div>
    </motion.div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/DeskCandle.tsx`
Expected: File exists

---

## Task 9: Create Index Export File

**Files:**
- Create: `src/components/desk/index.ts`

**Step 1: Create barrel export**

```typescript
export { default as DeskScene } from './DeskScene'
export { default as DeskBook } from './DeskBook'
export { default as DeskWindow } from './DeskWindow'
export { default as DeskDrawer } from './DeskDrawer'
export { default as DeskCandle } from './DeskCandle'
export { default as BookSpread } from './BookSpread'
export { default as PageContent } from './PageContent'
```

**Step 2: Verify file created**

Run: `ls -la src/components/desk/index.ts`
Expected: File exists

---

## Task 10: Create Desk Page Route

**Files:**
- Create: `src/app/desk/page.tsx`

**Step 1: Create the desk page**

```tsx
'use client'

import { DeskScene } from '@/components/desk'
import Background from '@/components/Background'

export default function DeskPage() {
  return (
    <>
      <Background />
      <DeskScene />
    </>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/app/desk/page.tsx`
Expected: File exists

---

## Task 11: Test the Implementation

**Step 1: Ensure Docker is running**

Run: `docker compose ps`
Expected: app container is running

**Step 2: Restart the app to pick up changes**

Run: `docker compose restart app`
Expected: Container restarts

**Step 3: Check for TypeScript errors**

Run: `docker compose exec app npx tsc --noEmit`
Expected: No errors (or only pre-existing ones)

**Step 4: View logs for any runtime errors**

Run: `docker compose logs -f app --tail=50`
Expected: No new errors related to desk components

---

## Task 12: Commit the Initial Implementation

**Step 1: Stage all new files**

Run: `git add src/store/desk.ts src/components/desk/ src/app/desk/`

**Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add dreamlike writer's desk scene

- Add desk store for scene state management
- Create DeskScene container with ambient effects
- Add DeskBook with closed/open states
- Add BookSpread with two-page layout
- Add DeskWindow linking to constellation
- Add DeskDrawer linking to letters
- Add DeskCandle with theme picker
- Create /desk route for the new experience

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Future Tasks (Phase 2)

These are documented for later implementation:

### Task 13: Page Turn Animation
- Add `PageTurn.tsx` component with CSS 3D transforms
- Implement drag-to-turn gesture
- Add page curl shadow effect

### Task 14: Connect Entries to Book
- Fetch entries in `PageContent.tsx`
- Map entries to page spreads
- Add infinite scroll through pages

### Task 15: Add Responsive Layout
- Mobile: Single page view
- Tablet: Smaller desk scene
- Add swipe gestures for mobile

### Task 16: Sound Effects (Optional)
- Page rustle on turn
- Drawer slide sound
- Flame crackle ambient
