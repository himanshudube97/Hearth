# Shelf Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/calendar` with a `/shelf` route that renders each year as a wooden bookshelf with one diary spine per month. Tapping a spine pulls out a closed book; a second tap opens it into a read-only book spread that flips through the month's entries day-by-day, mirroring the `/write` reading experience.

**Architecture:** New `src/app/shelf/page.tsx` route, hosting a `ShelfScene` that owns three URL-driven states (`shelf`, `pulled`, `open`) via query params. Shelf and spine components are pure presentation; data comes from existing hooks (`useEntryStats`, `useEntries`). The open-book read view is a new sibling component `ShelfBookSpread` that reuses `LeftPage` and `RightPage` (which already have read-only branches when `isNewEntry={false}`) wrapped around a `react-pageflip` `HTMLFlipBook`. `BookSpread` itself is **not modified** — autosave, photo upload, doodle canvas, and draft machinery stay confined to `/write`. `/calendar` becomes a one-line redirect.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion v12, `react-pageflip`, `date-fns`, existing Zustand stores (`useThemeStore` only — we deliberately don't touch `useDeskStore` or `useJournalStore`).

**Verification model:** This codebase has no test runner. Each task ends with `npm run lint`, `npx tsc --noEmit`, and (for tasks that touch UI) explicit manual verification steps. Treat lint + typecheck as the equivalent of "tests pass."

**Spec:** `docs/superpowers/specs/2026-04-29-shelf-redesign-design.md`.

---

## File map

**Create**
- `src/app/shelf/page.tsx`
- `src/app/shelf/loading.tsx`
- `src/components/shelf/index.ts`
- `src/components/shelf/shelfPalette.ts`
- `src/components/shelf/ShelfScene.tsx`
- `src/components/shelf/ShelfHeader.tsx`
- `src/components/shelf/YearTabs.tsx`
- `src/components/shelf/Shelf.tsx`
- `src/components/shelf/BookSpine.tsx`
- `src/components/shelf/EmptyMonthSpine.tsx`
- `src/components/shelf/PulledOutBook.tsx`
- `src/components/shelf/ShelfBookSpread.tsx`
- `src/components/shelf/ShelfMobileBook.tsx`

**Modify**
- `src/components/Navigation.tsx` (relabel and re-route the Calendar tab to Shelf)
- `src/app/calendar/page.tsx` (replace contents with a redirect)

**Reused without modification**
- `src/components/desk/LeftPage.tsx`, `RightPage.tsx` (read-only branches already exist)
- `src/lib/glassDiaryColors.ts` (`getGlassDiaryColors`)
- `src/hooks/useEntries.ts` (`useEntries`, `useEntryStats`)
- `src/store/theme.ts` (`useThemeStore`)
- `src/middleware.ts` (auth applies to `/shelf` automatically)

---

## Task 1: Add the shelf palette helper

**Files:**
- Create: `src/components/shelf/shelfPalette.ts`

- [ ] **Step 1: Write the palette module.**

```ts
// src/components/shelf/shelfPalette.ts

// One curated color per month (index 0 = January, 11 = December).
// Spec: "Same color for the same month across years; year is conveyed
// by the etched roman numeral year on the spine label."
const MONTH_SPINE_COLORS: readonly string[] = [
  '#1f3656', // Jan — winter navy
  '#3a3760', // Feb — slate plum
  '#4a6b3a', // Mar — early spring moss
  '#6f8b4a', // Apr — sage
  '#88a35a', // May — fresh leaf
  '#c08a3e', // Jun — summer ochre
  '#b66a3a', // Jul — terracotta
  '#a3553a', // Aug — late summer rust
  '#8c4a2e', // Sep — autumn russet
  '#6e3a2c', // Oct — burnished brown
  '#553344', // Nov — wine plum
  '#3e2530', // Dec — deep aubergine
] as const

export function spineColor(monthIndex: number): string {
  return MONTH_SPINE_COLORS[monthIndex % 12]
}

const ROMAN_DIGITS: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function toRoman(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return ''
  let n = num
  let out = ''
  for (const [value, symbol] of ROMAN_DIGITS) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const

export function monthLabel(monthIndex: number): string {
  return MONTH_NAMES[monthIndex % 12]
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

Both must succeed.

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/shelfPalette.ts
git commit -m "feat(shelf): add month palette + roman/label helpers"
```

---

## Task 2: Update navigation tab + add /shelf placeholder route

The navigation currently links to `/calendar`. We re-point it to `/shelf` and add a placeholder route so the link doesn't 404 while we build the rest. The placeholder is replaced in Task 5.

**Files:**
- Modify: `src/components/Navigation.tsx` (line 16)
- Create: `src/app/shelf/page.tsx`
- Create: `src/app/shelf/loading.tsx`

- [ ] **Step 1: Update the nav tab.**

In `src/components/Navigation.tsx`, replace the calendar tab entry:

```tsx
// before:
{ href: '/calendar', label: 'Calendar', icon: '▣' },

// after:
{ href: '/shelf', label: 'Shelf', icon: '❒' },
```

Leave the rest of the file unchanged.

- [ ] **Step 2: Create the placeholder shelf page.**

Create `src/app/shelf/page.tsx`:

```tsx
'use client'

export default function ShelfPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p className="text-sm opacity-50">shelf — coming together…</p>
    </div>
  )
}
```

- [ ] **Step 3: Create the loading state.**

Create `src/app/shelf/loading.tsx`:

```tsx
export default function ShelfLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p className="text-sm opacity-50">opening the shelf…</p>
    </div>
  )
}
```

- [ ] **Step 4: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 5: Manual check.**

Run `docker compose restart app`. Navigate the app, log in, click the **Shelf** tab in the top nav. Confirm:
- Tab label reads "Shelf" (not "Calendar")
- Clicking it lands on `/shelf` and renders "shelf — coming together…"
- The old `/calendar` URL still loads its existing page (we'll redirect it in Task 11)

- [ ] **Step 6: Commit.**

```bash
git add src/components/Navigation.tsx src/app/shelf/page.tsx src/app/shelf/loading.tsx
git commit -m "feat(shelf): nav tab + placeholder /shelf route"
```

---

## Task 3: ShelfHeader component

The page title and totals line. Pure presentation, gets data via props.

**Files:**
- Create: `src/components/shelf/ShelfHeader.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/shelf/ShelfHeader.tsx
'use client'

import { useThemeStore } from '@/store/theme'

interface ShelfHeaderProps {
  selectedYear: number
  entriesThisYear: number
  totalEntries: number
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export default function ShelfHeader({
  selectedYear,
  entriesThisYear,
  totalEntries,
}: ShelfHeaderProps) {
  const { theme } = useThemeStore()

  const today = new Date()
  const monthSlash = `${pad(today.getMonth() + 1)}/${today.getFullYear() % 100}`

  return (
    <header className="text-center mb-8">
      <h1
        className="text-3xl mb-2"
        style={{
          color: theme.text.primary,
          fontFamily: 'Georgia, Palatino, serif',
          fontStyle: 'italic',
          fontWeight: 300,
        }}
      >
        your shelf
      </h1>
      <p
        className="text-[11px] tracking-[0.2em] uppercase"
        style={{ color: theme.text.muted }}
      >
        {monthSlash} · {entriesThisYear} entries this year · {totalEntries} in total
        {selectedYear !== today.getFullYear() && (
          <> · viewing {selectedYear}</>
        )}
      </p>
    </header>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/ShelfHeader.tsx
git commit -m "feat(shelf): header component with year + totals"
```

---

## Task 4: YearTabs component

Pill segmented control. Years come from props (filtered to ones with entries by the parent).

**Files:**
- Create: `src/components/shelf/YearTabs.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/shelf/YearTabs.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface YearTabsProps {
  years: number[] // ascending, e.g. [2024, 2025, 2026]
  selectedYear: number
  onSelect: (year: number) => void
}

export default function YearTabs({ years, selectedYear, onSelect }: YearTabsProps) {
  const { theme } = useThemeStore()

  if (years.length <= 1) {
    // No tabs to show when the user has only one year of data.
    return null
  }

  return (
    <div
      role="tablist"
      aria-label="Year"
      className="flex justify-center gap-1 mb-8"
    >
      {years.map((year) => {
        const isActive = year === selectedYear
        return (
          <motion.button
            key={year}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(year)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-4 py-1.5 rounded-full text-sm relative"
            style={{
              color: isActive ? theme.text.primary : theme.text.muted,
              fontFamily: 'Georgia, Palatino, serif',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="shelf-year-active"
                className="absolute inset-0 rounded-full"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              />
            )}
            <span className="relative z-10">{year}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/YearTabs.tsx
git commit -m "feat(shelf): year tabs segmented control"
```

---

## Task 5: BookSpine and EmptyMonthSpine components

The two spine variants that sit on the shelf. `BookSpine` has the shared `layoutId` so it can morph into `PulledOutBook` later (Task 7).

**Files:**
- Create: `src/components/shelf/BookSpine.tsx`
- Create: `src/components/shelf/EmptyMonthSpine.tsx`

- [ ] **Step 1: Write `BookSpine.tsx`.**

```tsx
// src/components/shelf/BookSpine.tsx
'use client'

import { motion } from 'framer-motion'
import { spineColor, monthLabel, toRoman } from './shelfPalette'

export interface BookSpineProps {
  year: number
  monthIndex: number // 0..11
  entryCount: number
  onClick: () => void
  // When true the page is in 'pulled' state and this slot must hide
  // (the layoutId is currently animating on the PulledOutBook).
  hidden?: boolean
}

// Dimensions tuned to fit 12 spines on a standard shelf. Mobile orientation
// is handled by the parent (Shelf.tsx) via Tailwind classes — this component
// stays orientation-agnostic by using a fixed shape.
const SPINE_WIDTH = 56
const SPINE_HEIGHT = 280

export default function BookSpine({
  year,
  monthIndex,
  entryCount,
  onClick,
  hidden = false,
}: BookSpineProps) {
  const color = spineColor(monthIndex)
  const label = monthLabel(monthIndex)
  const yearRoman = toRoman(year)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label} ${year}, ${entryCount} entries`}
      layoutId={`book-${year}-${monthIndex}`}
      whileHover={{ y: -6 }}
      whileTap={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      style={{
        width: `${SPINE_WIDTH}px`,
        height: `${SPINE_HEIGHT}px`,
        background: `linear-gradient(180deg, ${color} 0%, ${color} 92%, rgba(0,0,0,0.2) 100%)`,
        borderRadius: '3px 3px 2px 2px',
        boxShadow:
          'inset 1px 0 0 rgba(255,255,255,0.08), inset -2px 0 0 rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.18)',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      className="relative flex flex-col items-center justify-between py-4 cursor-pointer"
    >
      {/* Decorative top band */}
      <div
        style={{
          width: '70%',
          height: '8px',
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 4px)',
          borderRadius: '1px',
        }}
      />

      {/* Vertical paper label with month name */}
      <div
        className="flex-1 mx-1 my-2 flex items-center justify-center px-1 py-3"
        style={{
          background: 'rgba(248, 244, 232, 0.95)',
          color: '#2a241a',
          borderRadius: '2px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'Georgia, Palatino, serif',
          fontSize: '14px',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>

      {/* Etched entry count + year roman numerals at the base */}
      <div
        className="text-[9px] tracking-[0.2em]"
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Georgia, Palatino, serif',
        }}
      >
        · {entryCount} ·
      </div>
      <div
        className="text-[8px] tracking-[0.15em]"
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Georgia, Palatino, serif',
        }}
      >
        {yearRoman}
      </div>
    </motion.button>
  )
}
```

- [ ] **Step 2: Write `EmptyMonthSpine.tsx`.**

```tsx
// src/components/shelf/EmptyMonthSpine.tsx
'use client'

import { useThemeStore } from '@/store/theme'
import { monthLabel } from './shelfPalette'

interface EmptyMonthSpineProps {
  monthIndex: number
}

const SPINE_WIDTH = 56
const SPINE_HEIGHT = 280

export default function EmptyMonthSpine({ monthIndex }: EmptyMonthSpineProps) {
  const { theme } = useThemeStore()
  return (
    <div
      aria-hidden="true"
      title={`no entries in ${monthLabel(monthIndex)}`}
      style={{
        width: `${SPINE_WIDTH}px`,
        height: `${SPINE_HEIGHT}px`,
        background: theme.glass.bg,
        border: `1px dashed ${theme.glass.border}`,
        borderRadius: '3px',
        opacity: 0.35,
      }}
    />
  )
}
```

- [ ] **Step 3: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/shelf/BookSpine.tsx src/components/shelf/EmptyMonthSpine.tsx
git commit -m "feat(shelf): book spine + empty month placeholder"
```

---

## Task 6: Shelf component (the wooden plank with 12 slots)

Lays out 12 spines (filled or empty) on a wooden plank. Orientation-aware: horizontal on `≥ md`, vertical on `< md`. Receives entry counts per month from the parent.

**Files:**
- Create: `src/components/shelf/Shelf.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/shelf/Shelf.tsx
'use client'

import BookSpine from './BookSpine'
import EmptyMonthSpine from './EmptyMonthSpine'

export interface ShelfMonth {
  monthIndex: number   // 0..11
  entryCount: number   // 0 means render an EmptyMonthSpine
}

interface ShelfProps {
  year: number
  months: ShelfMonth[] // length 12, in calendar order
  onMonthClick: (monthIndex: number) => void
  pulledMonthIndex: number | null
}

const PLANK_HEIGHT = 14
const PLANK_GRAIN =
  'repeating-linear-gradient(90deg, #5a3a22 0 6px, #4d3119 6px 7px, #5a3a22 7px 14px)'

export default function Shelf({
  year,
  months,
  onMonthClick,
  pulledMonthIndex,
}: ShelfProps) {
  return (
    <div className="relative">
      {/* Desktop: horizontal row. Mobile: vertical stack with rotated spines. */}
      <div
        className={[
          'flex gap-3',
          // Desktop: spines stand upright on a horizontal plank.
          'md:flex-row md:items-end md:justify-center',
          // Mobile: spines lie on their sides, stacked vertically.
          'flex-col items-center',
        ].join(' ')}
      >
        {months.map((m) => {
          if (m.entryCount === 0) {
            return (
              <div key={m.monthIndex} className="md:rotate-0 -rotate-90 md:transform-none">
                <EmptyMonthSpine monthIndex={m.monthIndex} />
              </div>
            )
          }
          return (
            <div key={m.monthIndex} className="md:rotate-0 -rotate-90 md:transform-none">
              <BookSpine
                year={year}
                monthIndex={m.monthIndex}
                entryCount={m.entryCount}
                onClick={() => onMonthClick(m.monthIndex)}
                hidden={pulledMonthIndex === m.monthIndex}
              />
            </div>
          )
        })}
      </div>

      {/* Wooden plank — desktop is a horizontal bar under the row; mobile is a
          vertical bar to the left of the stack. */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute left-0 right-0"
        style={{
          bottom: `-${PLANK_HEIGHT + 4}px`,
          height: `${PLANK_HEIGHT}px`,
          background: PLANK_GRAIN,
          borderRadius: '2px',
          boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
        }}
      />
      <div
        aria-hidden="true"
        className="md:hidden absolute top-0 bottom-0"
        style={{
          left: `-${PLANK_HEIGHT + 4}px`,
          width: `${PLANK_HEIGHT}px`,
          background: PLANK_GRAIN,
          borderRadius: '2px',
          boxShadow: '6px 0 12px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/Shelf.tsx
git commit -m "feat(shelf): wooden plank shelf with horizontal/vertical orientation"
```

---

## Task 7: PulledOutBook component (closed-book intermediate state)

The tilted closed book that appears when the user taps a spine. Uses the same `layoutId` as `BookSpine` so Framer Motion morphs the spine into the cover.

**Files:**
- Create: `src/components/shelf/PulledOutBook.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/shelf/PulledOutBook.tsx
'use client'

import { motion } from 'framer-motion'
import { spineColor, monthLabel, toRoman } from './shelfPalette'

interface PulledOutBookProps {
  year: number
  monthIndex: number
  entryCount: number
  lastDayOfMonth: number // 28..31
  onOpen: () => void
  onClose: () => void // ← shelf
}

const COVER_WIDTH = 280
const COVER_HEIGHT = 380

export default function PulledOutBook({
  year,
  monthIndex,
  entryCount,
  lastDayOfMonth,
  onOpen,
  onClose,
}: PulledOutBookProps) {
  const color = spineColor(monthIndex)
  const label = monthLabel(monthIndex)
  const yearRoman = toRoman(year)
  const monthRoman = toRoman(monthIndex + 1).toLowerCase()
  const monthNum = String(monthIndex + 1).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(10,8,6,0.55)', backdropFilter: 'blur(4px)' }}
    >
      {/* Back to shelf */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 text-sm tracking-wide opacity-80 hover:opacity-100"
        style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
      >
        ← shelf
      </button>

      <div className="flex flex-col items-center gap-6">
        <motion.button
          type="button"
          onClick={onOpen}
          layoutId={`book-${year}-${monthIndex}`}
          aria-label={`Open ${label} ${year}`}
          whileHover={{ rotate: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          style={{
            width: `${COVER_WIDTH}px`,
            height: `${COVER_HEIGHT}px`,
            background: `linear-gradient(135deg, ${color} 0%, ${color} 60%, rgba(0,0,0,0.25) 100%)`,
            borderRadius: '4px 6px 6px 4px',
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.5), inset -8px 0 16px rgba(0,0,0,0.2), inset 2px 0 0 rgba(255,255,255,0.08)',
            transform: 'rotate(-8deg)',
          }}
          className="relative flex flex-col items-center justify-center cursor-pointer"
        >
          {/* Red ribbon bookmark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '32px',
              width: '14px',
              height: '60px',
              background: '#a02828',
              borderRadius: '0 0 2px 2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />

          {/* Decorative double frame on the cover */}
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              top: '24px',
              right: '24px',
              bottom: '24px',
              left: '24px',
              border: '1px solid rgba(245,240,225,0.4)',
              borderRadius: '2px',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              top: '30px',
              right: '30px',
              bottom: '30px',
              left: '30px',
              border: '1px solid rgba(245,240,225,0.2)',
              borderRadius: '2px',
            }}
          />

          {/* Title */}
          <div className="flex flex-col items-center gap-3 z-10">
            <span
              style={{
                color: 'rgba(245,240,225,0.95)',
                fontFamily: 'Georgia, Palatino, serif',
                fontStyle: 'italic',
                fontSize: '52px',
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            <span
              className="tracking-[0.4em]"
              style={{
                color: 'rgba(245,240,225,0.7)',
                fontFamily: 'Georgia, Palatino, serif',
                fontSize: '12px',
              }}
            >
              {yearRoman}
            </span>
          </div>

          {/* Volume marker at the base */}
          <div
            className="absolute bottom-10 tracking-[0.3em]"
            style={{
              color: 'rgba(245,240,225,0.55)',
              fontFamily: 'Georgia, Palatino, serif',
              fontSize: '10px',
              fontStyle: 'italic',
            }}
          >
            vol. {monthRoman}
          </div>
        </motion.button>

        {/* "tap to open" caption + per-month stats */}
        <div className="text-center">
          <p
            className="text-sm italic mb-1"
            style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
          >
            tap to open
          </p>
          <p
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: 'rgba(245,240,225,0.55)' }}
          >
            {entryCount} entries · {monthNum}/01 → {monthNum}/{lastDayOfMonth}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/PulledOutBook.tsx
git commit -m "feat(shelf): pulled-out closed-book intermediate state"
```

---

## Task 8: ShelfBookSpread (read-only book reading view)

Reuses `LeftPage`/`RightPage` (in their `isNewEntry={false}` branch — already read-only) wrapped in a `react-pageflip` flipbook. No autosave, no draft state, no new-entry spread, no shared Zustand spread state. Local React state only.

**Files:**
- Create: `src/components/shelf/ShelfBookSpread.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/shelf/ShelfBookSpread.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, memo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from '@/components/desk/LeftPage'
import RightPage from '@/components/desk/RightPage'
import DateTabRail from '@/components/desk/DateTabRail'
import EntrySelector from '@/components/desk/EntrySelector'
import { JournalEntry } from '@/store/journal'
import { monthLabel, toRoman } from './shelfPalette'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false })

const PAGE_WIDTH = 650
const PAGE_HEIGHT = 820

interface ShelfBookSpreadProps {
  year: number
  monthIndex: number     // 0..11
  entries: JournalEntry[] // entries in the selected month, decrypted
  onClose: () => void
}

const PageWrapper = memo(
  forwardRef<HTMLDivElement, {
    children: React.ReactNode
    side: 'left' | 'right'
  }>(function PageWrapper({ children, side }, ref) {
    const isLeft = side === 'left'
    // Page background/border live in CSS classes (.diary-page in globals.css)
    // because react-pageflip wipes inline styles mid-flip. Width/height stay
    // inline because the library overrides them either way.
    return (
      <div
        ref={ref}
        className={`diary-page ${isLeft ? 'diary-page--left' : 'diary-page--right'}`}
        style={{
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 10,
            padding: isLeft ? '20px 20px 20px 50px' : '20px 50px 20px 20px',
          }}
        >
          {children}
        </div>
      </div>
    )
  }),
)

// Group entries by calendar day. The flipbook renders one spread per entry,
// so multi-entry days surface via EntrySelector instead of duplicate spreads.
function groupByDay(entries: JournalEntry[]): JournalEntry[][] {
  const map = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const key = new Date(e.createdAt).toDateString()
    const arr = map.get(key) ?? []
    arr.push(e)
    map.set(key, arr)
  }
  // Sort days ascending; within a day, sort entries newest-first to match
  // EntrySelector's own sort.
  return [...map.values()]
    .sort(
      (a, b) =>
        new Date(a[0].createdAt).getTime() - new Date(b[0].createdAt).getTime(),
    )
    .map((arr) =>
      [...arr].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    )
}

export default function ShelfBookSpread({
  year,
  monthIndex,
  entries,
  onClose,
}: ShelfBookSpreadProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null)

  // One day per spread; multiple entries on the same day are switched via
  // EntrySelector.
  const days = useMemo(() => groupByDay(entries), [entries])
  const totalSpreads = days.length || 1

  // Visible spread index (0..days.length-1). Local state — does NOT touch
  // useDeskStore so /write's spread state stays untouched.
  const [visibleSpread, setVisibleSpread] = useState(0)
  const [bookReady, setBookReady] = useState(false)

  // Per-day "currently selected entry" for multi-entry days. Defaults to the
  // first (newest) entry of each day.
  const [selectedEntryIds, setSelectedEntryIds] = useState<Record<number, string>>({})

  const currentDay = days[visibleSpread] ?? []
  const currentEntryId =
    selectedEntryIds[visibleSpread] ?? currentDay[0]?.id ?? null
  const currentEntry =
    currentDay.find((e) => e.id === currentEntryId) ?? currentDay[0] ?? null

  const handleEntrySelect = useCallback(
    (entryId: string | null) => {
      if (!entryId) return
      setSelectedEntryIds((prev) => ({ ...prev, [visibleSpread]: entryId }))
    },
    [visibleSpread],
  )

  const handleFlip = useCallback((e: { data: number }) => {
    setVisibleSpread(Math.floor(e.data / 2))
  }, [])

  const handlePrev = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev()
  }, [])

  const handleNext = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext()
  }, [])

  const handleJumpToSpread = useCallback((idx: number) => {
    const pf = flipBookRef.current?.pageFlip?.()
    pf?.turnToPage?.(idx * 2)
  }, [])

  // Esc closes the book.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Build the rail's entry list: one representative entry per day (first).
  const railEntries = useMemo(
    () => days.map((day) => ({ id: day[0].id, createdAt: day[0].createdAt })),
    [days],
  )

  // Empty-month guard: if the user opens a month with zero entries (shouldn't
  // happen via the UI, but defends against direct URL hits), render a stub.
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-30 flex items-center justify-center"
        style={{ background: 'rgba(10,8,6,0.6)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 left-6 text-sm opacity-80 hover:opacity-100"
          style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
        >
          ← shelf
        </button>
        <p style={{ color: 'rgba(245,240,225,0.75)', fontFamily: 'Georgia, serif' }}>
          no entries to read in this month.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(10,8,6,0.6)' }}
    >
      {/* Top bar: back to shelf + volume label */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 text-sm opacity-80 hover:opacity-100"
        style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
      >
        ← shelf
      </button>
      <div
        className="absolute top-6 right-6 text-xs tracking-[0.3em] uppercase"
        style={{ color: 'rgba(245,240,225,0.55)' }}
      >
        {monthLabel(monthIndex)} {toRoman(year)}
      </div>

      {/* Multi-entry-per-day selector floats above the open book */}
      {currentDay.length > 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <EntrySelector
            entries={currentDay}
            currentEntryId={currentEntryId}
            onEntrySelect={handleEntrySelect}
          />
        </div>
      )}

      {/* Book frame */}
      <div
        className="relative inline-block"
        style={{
          ['--book-cover-bg' as string]: colors.cover,
          ['--book-cover-border' as string]: colors.coverBorder,
        } as React.CSSProperties}
      >
        <motion.div
          className="relative"
          style={{
            width: `${PAGE_WIDTH * 2}px`,
            height: `${PAGE_HEIGHT}px`,
            transformStyle: 'preserve-3d',
            ['--page-bg' as string]: colors.pageBg,
            ['--page-bg-solid' as string]: colors.pageBgSolid,
          } as React.CSSProperties}
          initial={{ rotateX: 5, opacity: 0 }}
          animate={bookReady ? { rotateX: 0, opacity: 1 } : { rotateX: 5, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="book-cover" />

          <HTMLFlipBook
            ref={flipBookRef}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            size="fixed"
            minWidth={PAGE_WIDTH}
            maxWidth={PAGE_WIDTH}
            minHeight={PAGE_HEIGHT}
            maxHeight={PAGE_HEIGHT}
            drawShadow={true}
            maxShadowOpacity={0.5}
            flippingTime={1200}
            useMouseEvents={false}
            mobileScrollSupport={false}
            showCover={false}
            startPage={0}
            onFlip={handleFlip}
            onInit={() => setBookReady(true)}
            className=""
            style={{}}
            startZIndex={0}
            autoSize={false}
            clickEventForward={true}
            usePortrait={false}
            swipeDistance={30}
            showPageCorners={false}
            disableFlipByClick={true}
          >
            {days.flatMap((day, idx) => {
              const entry =
                day.find((e) => e.id === (selectedEntryIds[idx] ?? day[0].id)) ?? day[0]
              return [
                <PageWrapper key={`${entry.id}-L`} side="left">
                  <LeftPage entry={entry} isNewEntry={false} />
                </PageWrapper>,
                <PageWrapper key={`${entry.id}-R`} side="right">
                  <RightPage
                    entry={entry}
                    isNewEntry={false}
                    photos={entry.photos || []}
                  />
                </PageWrapper>,
              ]
            })}
          </HTMLFlipBook>

          <DateTabRail
            entries={railEntries}
            visibleSpread={visibleSpread}
            // No new-entry spread in read mode — point this past the end so
            // the rail never highlights a "today" tab.
            newEntrySpreadIdx={totalSpreads}
            onJumpToSpread={handleJumpToSpread}
            colors={colors}
          />

          {/* Edge clickers */}
          {visibleSpread > 0 && (
            <motion.div
              onClick={handlePrev}
              className="absolute left-0 top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, transparent 100%)',
              }}
              whileHover={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 100%)',
              }}
            >
              <span className="text-3xl" style={{ color: theme.text.muted }}>‹</span>
            </motion.div>
          )}
          {visibleSpread < totalSpreads - 1 && (
            <motion.div
              onClick={handleNext}
              className="absolute top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
              style={{
                right: '26px',
                background: 'linear-gradient(270deg, rgba(0,0,0,0.05) 0%, transparent 100%)',
              }}
              whileHover={{
                background: 'linear-gradient(270deg, rgba(0,0,0,0.1) 0%, transparent 100%)',
              }}
            >
              <span className="text-3xl" style={{ color: theme.text.muted }}>›</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

If lint complains about the unused `colors` reference in `PageWrapper`, leave it as written — the ternary form keeps the prop "used" without behavior change. If TypeScript flags `JournalEntry` shape mismatches with `LeftPage`'s local `Entry` type, narrow the inputs at the boundary by spreading only the required fields:

```ts
const entryForLeft = {
  id: entry.id,
  text: entry.text,
  mood: entry.mood,
  song: entry.song ?? null,
  createdAt: entry.createdAt,
}
```
…and pass that to `<LeftPage entry={entryForLeft} />`. Do the same for `RightPage` (add `photos`, `doodles`).

- [ ] **Step 3: Commit.**

```bash
git add src/components/shelf/ShelfBookSpread.tsx
git commit -m "feat(shelf): read-only book spread reusing LeftPage/RightPage"
```

---

## Task 8b: Mobile read view (vertical single-page reader)

The desktop flipbook is fixed-size 1300×820, which overflows a phone viewport. This task adds a sibling component for `< 768px` and wires `ShelfBookSpread` to delegate to it when the viewport is narrow. Pure CSS-driven scroll layout, no flipbook library on mobile (cheaper and avoids touch gesture conflicts).

**Files:**
- Create: `src/components/shelf/ShelfMobileBook.tsx`
- Modify: `src/components/shelf/ShelfBookSpread.tsx`

- [ ] **Step 1: Write `ShelfMobileBook.tsx`.**

```tsx
// src/components/shelf/ShelfMobileBook.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from '@/components/desk/LeftPage'
import RightPage from '@/components/desk/RightPage'
import EntrySelector from '@/components/desk/EntrySelector'
import { JournalEntry } from '@/store/journal'
import { monthLabel, toRoman } from './shelfPalette'

interface ShelfMobileBookProps {
  year: number
  monthIndex: number
  entries: JournalEntry[]
  onClose: () => void
}

function groupByDay(entries: JournalEntry[]): JournalEntry[][] {
  const map = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const key = new Date(e.createdAt).toDateString()
    const arr = map.get(key) ?? []
    arr.push(e)
    map.set(key, arr)
  }
  return [...map.values()]
    .sort(
      (a, b) =>
        new Date(a[0].createdAt).getTime() - new Date(b[0].createdAt).getTime(),
    )
    .map((arr) =>
      [...arr].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    )
}

export default function ShelfMobileBook({
  year,
  monthIndex,
  entries,
  onClose,
}: ShelfMobileBookProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  const days = useMemo(() => groupByDay(entries), [entries])
  const [dayIdx, setDayIdx] = useState(0)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const currentDay = days[dayIdx] ?? []
  const currentEntry =
    currentDay.find((e) => e.id === selectedEntryId) ?? currentDay[0] ?? null

  // Reset selected entry when the day changes.
  useEffect(() => {
    setSelectedEntryId(null)
  }, [dayIdx])

  // Esc closes the book.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handlePrev = useCallback(() => {
    setDayIdx((i) => Math.max(0, i - 1))
  }, [])
  const handleNext = useCallback(() => {
    setDayIdx((i) => Math.min(days.length - 1, i + 1))
  }, [days.length])

  if (entries.length === 0 || !currentEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-30 flex items-center justify-center px-6"
        style={{ background: 'rgba(10,8,6,0.6)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-sm opacity-80"
          style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
        >
          ← shelf
        </button>
        <p style={{ color: 'rgba(245,240,225,0.75)', fontFamily: 'Georgia, serif' }}>
          no entries to read in this month.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-30 flex flex-col"
      style={{ background: colors.pageBgSolid }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          className="text-sm"
          style={{ color: theme.text.muted, fontFamily: 'Georgia, serif' }}
        >
          ← shelf
        </button>
        <div
          className="text-[10px] tracking-[0.3em] uppercase"
          style={{ color: theme.text.muted }}
        >
          {monthLabel(monthIndex)} {toRoman(year)}
        </div>
      </div>

      {/* Multi-entry-per-day selector */}
      {currentDay.length > 1 && (
        <div className="flex justify-center pb-2">
          <EntrySelector
            entries={currentDay}
            currentEntryId={currentEntry.id}
            onEntrySelect={(id) => setSelectedEntryId(id)}
          />
        </div>
      )}

      {/* Reader: stack the read-only branches of LeftPage and RightPage
          vertically. They already have isNewEntry={false} branches that
          render statically. */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-6"
        style={{
          ['--page-bg' as string]: colors.pageBg,
          ['--page-bg-solid' as string]: colors.pageBgSolid,
        } as React.CSSProperties}
      >
        <div className="max-w-md mx-auto">
          <div className="diary-page diary-page--left mb-4 p-4">
            <LeftPage entry={currentEntry} isNewEntry={false} />
          </div>
          <div className="diary-page diary-page--right p-4">
            <RightPage
              entry={currentEntry}
              isNewEntry={false}
              photos={currentEntry.photos || []}
            />
          </div>
        </div>
      </div>

      {/* Day prev/next */}
      <div
        className="flex items-center justify-between px-6 py-3 border-t"
        style={{ borderColor: theme.glass.border, background: theme.glass.bg }}
      >
        <button
          onClick={handlePrev}
          disabled={dayIdx === 0}
          className="text-sm disabled:opacity-30"
          style={{ color: theme.text.primary, fontFamily: 'Georgia, serif' }}
        >
          ‹ prev day
        </button>
        <span
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ color: theme.text.muted }}
        >
          day {dayIdx + 1} of {days.length}
        </span>
        <button
          onClick={handleNext}
          disabled={dayIdx === days.length - 1}
          className="text-sm disabled:opacity-30"
          style={{ color: theme.text.primary, fontFamily: 'Georgia, serif' }}
        >
          next day ›
        </button>
      </div>
    </motion.div>
  )
}
```

> **Note:** The mobile reader stacks the read-only branches of `LeftPage` and `RightPage` vertically. Both components have small fixed heights for their internal sections (song embed, doodle preview). On a narrow viewport this scrolls cleanly inside the scrollable container.

- [ ] **Step 2: Wire `ShelfBookSpread.tsx` to delegate on mobile.**

At the top of `src/components/shelf/ShelfBookSpread.tsx`, add a viewport hook and the import:

```tsx
import ShelfMobileBook from './ShelfMobileBook'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  return isMobile
}
```

Inside the `ShelfBookSpread` component, near the top of the function body (right after `const colors = getGlassDiaryColors(theme)`), add:

```tsx
const isMobile = useIsMobile()

if (isMobile) {
  return (
    <ShelfMobileBook
      year={year}
      monthIndex={monthIndex}
      entries={entries}
      onClose={onClose}
    />
  )
}
```

This short-circuits the desktop flipbook on phone viewports. On SSR / first paint `isMobile` is `false`, so the desktop branch renders briefly and then the mobile branch takes over after hydration — acceptable for a private journaling app, and avoids hydration mismatch warnings (the brief flash matches what `/write`'s desk does today).

- [ ] **Step 3: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: Manual mobile verification.**

Use Chrome DevTools device toolbar (or a real phone) to simulate a 375×812 viewport.
1. On `/shelf`, confirm spines lay out vertically and the plank rail is on the left (already covered by Task 6, but verify here too).
2. Tap a spine → pulled-out closed book renders (Task 7's modal works on mobile because it uses `flex` centering).
3. Tap the closed book → mobile reader opens: top bar with `← shelf` and month label, vertical stack of left-page + right-page contents, bottom bar with day prev/next.
4. Confirm the day prev/next buttons work and `EntrySelector` appears for multi-entry days.
5. Confirm `← shelf` exits cleanly.

- [ ] **Step 5: Commit.**

```bash
git add src/components/shelf/ShelfMobileBook.tsx src/components/shelf/ShelfBookSpread.tsx
git commit -m "feat(shelf): mobile single-page reader for narrow viewports"
```

---

## Task 9: ShelfScene (state machine + data wiring)

Top-level scene that reads `?year&month&open` from the URL, fetches stats, lazy-loads the selected month's entries, and renders one of three states.

**Files:**
- Create: `src/components/shelf/ShelfScene.tsx`
- Create: `src/components/shelf/index.ts`

- [ ] **Step 1: Write the barrel export.**

```ts
// src/components/shelf/index.ts
export { default as ShelfScene } from './ShelfScene'
export { default as ShelfHeader } from './ShelfHeader'
export { default as YearTabs } from './YearTabs'
export { default as Shelf } from './Shelf'
export { default as BookSpine } from './BookSpine'
export { default as EmptyMonthSpine } from './EmptyMonthSpine'
export { default as PulledOutBook } from './PulledOutBook'
export { default as ShelfBookSpread } from './ShelfBookSpread'
```

- [ ] **Step 2: Write `ShelfScene.tsx`.**

```tsx
// src/components/shelf/ShelfScene.tsx
'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useEntries, useEntryStats } from '@/hooks/useEntries'
import ShelfHeader from './ShelfHeader'
import YearTabs from './YearTabs'
import Shelf, { ShelfMonth } from './Shelf'
import PulledOutBook from './PulledOutBook'
import ShelfBookSpread from './ShelfBookSpread'

type Mode = 'shelf' | 'pulled' | 'open'

function parseYear(raw: string | null, fallback: number): number {
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1900 && n <= 9999 ? n : fallback
}

function parseMonth(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n - 1 : null
}

function defaultYear(years: number[]): number {
  const thisYear = new Date().getFullYear()
  if (years.includes(thisYear)) return thisYear
  if (years.length === 0) return thisYear
  return years[years.length - 1] // most recent year with entries
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export default function ShelfScene() {
  const router = useRouter()
  const search = useSearchParams()

  const { stats, loading: statsLoading } = useEntryStats()

  // Years that actually have entries.
  const yearsWithEntries = useMemo(() => {
    if (!stats) return [] as number[]
    return [...stats.years.map((y) => y.year)].sort((a, b) => a - b)
  }, [stats])

  const fallback = defaultYear(yearsWithEntries)
  const selectedYear = parseYear(search.get('year'), fallback)
  const selectedMonth = parseMonth(search.get('month'))
  const isOpen = search.get('open') === '1'

  const mode: Mode = selectedMonth === null
    ? 'shelf'
    : isOpen
      ? 'open'
      : 'pulled'

  // Per-month entry counts for the selected year.
  const months: ShelfMonth[] = useMemo(() => {
    const yearStats = stats?.years.find((y) => y.year === selectedYear)
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`
      const ms = yearStats?.months.find((m) => m.month === monthKey)
      return { monthIndex, entryCount: ms?.entryCount ?? 0 }
    })
  }, [stats, selectedYear])

  const entriesThisYear = useMemo(
    () => months.reduce((sum, m) => sum + m.entryCount, 0),
    [months],
  )
  const totalEntries = stats?.totalEntries ?? 0

  // URL transitions
  const setQuery = useCallback(
    (next: { year?: number; month?: number | null; open?: boolean | null }) => {
      const params = new URLSearchParams(search.toString())
      if (next.year !== undefined) params.set('year', String(next.year))
      if (next.month === null) params.delete('month')
      else if (next.month !== undefined) params.set('month', String(next.month + 1))
      if (next.open === null) params.delete('open')
      else if (next.open === true) params.set('open', '1')
      const qs = params.toString()
      router.replace(qs ? `/shelf?${qs}` : '/shelf', { scroll: false })
    },
    [router, search],
  )

  const handleYearSelect = useCallback(
    (year: number) => setQuery({ year, month: null, open: null }),
    [setQuery],
  )
  const handleMonthClick = useCallback(
    (monthIndex: number) => setQuery({ month: monthIndex, open: null }),
    [setQuery],
  )
  const handleOpen = useCallback(() => setQuery({ open: true }), [setQuery])
  const handleClose = useCallback(
    () => setQuery({ month: null, open: null }),
    [setQuery],
  )

  // Lazy-load entries only when reading.
  const monthKey =
    selectedMonth !== null
      ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      : undefined
  const { entries: monthEntries, loading: entriesLoading } = useEntries(
    mode === 'open' && monthKey
      ? { month: monthKey, includeDoodles: true }
      : { limit: 1 }, // hook is always called; this branch is a no-op fetch we ignore
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <ShelfHeader
        selectedYear={selectedYear}
        entriesThisYear={entriesThisYear}
        totalEntries={totalEntries}
      />
      <YearTabs
        years={yearsWithEntries}
        selectedYear={selectedYear}
        onSelect={handleYearSelect}
      />

      {/* The shelf is always mounted underneath; pulled/open states overlay
          on top via fixed positioning, which keeps the shared layoutId for
          BookSpine ↔ PulledOutBook morphing connected. */}
      {statsLoading ? (
        <p className="text-center text-sm opacity-50 py-16">opening the shelf…</p>
      ) : (
        <div className="pt-12 pb-20">
          <Shelf
            year={selectedYear}
            months={months}
            onMonthClick={handleMonthClick}
            pulledMonthIndex={mode !== 'shelf' ? selectedMonth : null}
          />
        </div>
      )}

      <AnimatePresence>
        {mode === 'pulled' && selectedMonth !== null && (
          <PulledOutBook
            key="pulled"
            year={selectedYear}
            monthIndex={selectedMonth}
            entryCount={months[selectedMonth].entryCount}
            lastDayOfMonth={lastDayOfMonth(selectedYear, selectedMonth)}
            onOpen={handleOpen}
            onClose={handleClose}
          />
        )}

        {mode === 'open' && selectedMonth !== null && (
          entriesLoading ? (
            <div
              key="open-loading"
              className="fixed inset-0 z-30 flex items-center justify-center"
              style={{ background: 'rgba(10,8,6,0.6)' }}
            >
              <p style={{ color: 'rgba(245,240,225,0.75)', fontFamily: 'Georgia, serif' }}>
                turning to the page…
              </p>
            </div>
          ) : (
            <ShelfBookSpread
              key="open"
              year={selectedYear}
              monthIndex={selectedMonth}
              entries={monthEntries}
              onClose={handleClose}
            />
          )
        )}
      </AnimatePresence>
    </div>
  )
}
```

> **Note on `useEntries`:** the hook is always called (Rules of Hooks). When we're not in open mode we pass `{ limit: 1 }` — a cheap throwaway fetch. If profiling shows this is wasteful in practice, follow up by adding an `enabled?: boolean` flag to `useEntries` (one-line change). That follow-up is **out of scope** for this plan to keep `useEntries` untouched and risk-free.

- [ ] **Step 3: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/shelf/ShelfScene.tsx src/components/shelf/index.ts
git commit -m "feat(shelf): scene state machine + data wiring"
```

---

## Task 10: Wire the page route to ShelfScene

Replace the placeholder `/shelf/page.tsx` with the real scene.

**Files:**
- Modify: `src/app/shelf/page.tsx`

- [ ] **Step 1: Replace contents.**

```tsx
// src/app/shelf/page.tsx
'use client'

import { Suspense } from 'react'
import { ShelfScene } from '@/components/shelf'

function Fallback() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p className="text-sm opacity-50">opening the shelf…</p>
    </div>
  )
}

export default function ShelfPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ShelfScene />
    </Suspense>
  )
}
```

> The `Suspense` wrapper is required because `ShelfScene` calls `useSearchParams`, which Next 16 requires to be inside a Suspense boundary at the page level for static prerender compatibility.

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Manual verification.**

```bash
docker compose restart app
docker compose logs -f app  # in another terminal, optional
```

In the browser:
1. Log in. Navigate to `/shelf`. Expect:
   - Header reads "your shelf" with the totals line.
   - Year tabs row appears if you have entries in 2+ years; otherwise hidden.
   - 12 spine slots; months with entries have colored spines, the rest are faint placeholders.
2. Tap a colored spine. Expect:
   - Background dims; the spine animates into a tilted closed book in the center.
   - Caption "tap to open · {N} entries · MM/01 → MM/{last}" below.
   - URL updates to `?year=YYYY&month=MM`.
   - `← shelf` button top-left returns to the shelf state.
3. Tap the closed book. Expect:
   - Closed book opens into the two-page diary spread.
   - `← shelf` top-left, "month MMXX" label top-right.
   - Date tab rail on the right edge shows tabs only for days that have entries; first day pre-selected.
   - Edge clickers (‹/›) navigate spreads.
   - For days with multiple entries: numbered selector dots float above the book; clicking switches between entries on that day.
   - URL is `?year=YYYY&month=MM&open=1`.
   - `Esc` closes the book; back to shelf.
4. Switch year tabs. Expect spines to refresh for the new year.
5. Resize the window to phone width (`< 768px`). Expect:
   - Spines lay out vertically, tilted on their sides.
   - Plank rail moves to the left.
   - Tap-to-pull and open-book still work.
6. Hard-refresh on `?year=2025&month=04&open=1`. Expect to land directly in the open-book state.
7. Lazy-fetch sanity: open Network tab, click a spine without opening (just `'pulled'`). Expect no `/api/entries?month=…` request until you tap the closed book.

- [ ] **Step 4: Commit.**

```bash
git add src/app/shelf/page.tsx
git commit -m "feat(shelf): wire shelf page to the real scene"
```

---

## Task 11: Redirect /calendar → /shelf

The old route still works after Task 2 because we only edited the nav link. Now redirect it.

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Replace contents with a redirect.**

```tsx
// src/app/calendar/page.tsx
import { redirect } from 'next/navigation'

export default function CalendarRedirect() {
  redirect('/shelf')
}
```

- [ ] **Step 2: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Manual verification.**

```bash
docker compose restart app
```

In the browser:
1. Visit `/calendar`. Expect a redirect to `/shelf`.
2. Visit `/calendar?foo=bar`. Expect a redirect to `/shelf` (we drop unknown params; that's intentional — the old `/calendar` had no query state).

- [ ] **Step 4: Commit.**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat(shelf): redirect /calendar to /shelf"
```

---

## Task 12: Final pass — acceptance walk-through

Re-run the full acceptance checklist from the spec end-to-end. No new code; this is a sanity gate before merging.

- [ ] **Step 1: Re-read the spec acceptance section** (`docs/superpowers/specs/2026-04-29-shelf-redesign-design.md`, "Acceptance for v1").

- [ ] **Step 2: Walk every bullet manually.**

  - `/shelf` exists, nav links to it, `/calendar` redirects.
  - Year tabs only show years present in stats.
  - Filled spines show entry count etched at the base; empty months are placeholders.
  - Year/total counts in the header match `useEntryStats` data (cross-check by viewing a known month with X entries on `/write` then opening it on `/shelf`).
  - Spine → closed-book pull-out → open-book read view: shared `layoutId` produces the morph in both directions.
  - Read view renders past entries (text, song embed, photos, doodle) without any editing affordances. Verify in the rendered DOM that there are no `<input>`, `<textarea>`, file upload, or "+ New Entry" buttons inside the open book.
  - Multi-entry day: the numbered selector switches entries; the spread updates without a page-flip animation glitch.
  - Mobile vertical-shelf layout works on `< 768px`.
  - `/write` still works exactly as before — open it after using the shelf, write a draft, leave the page, come back, draft is intact (this confirms `useDeskStore` was not co-opted).
  - Hard-refresh on each URL state lands in the right mode.

- [ ] **Step 3: Run lint + typecheck once more on a clean tree.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: If anything in step 2 fails,** add a follow-up task to this plan and fix it. Do **not** mark this task complete until step 2 is fully green.

- [ ] **Step 5: Commit if any fixes were made; otherwise no commit needed.**

---

## Out of scope (do not implement)

These are listed in the spec under "Out of scope (explicit non-goals)" — restated here so an executor doesn't drift:

- Editing inside the shelf's open book.
- Streak migration to `/me`.
- Swipe-to-close gestures on mobile.
- Hover-prefetch of month entries.
- Multi-year scrolling shelf.
- Per-user shelf customization (cover colors, ribbon styles).
- `/timeline` redesign.

If you find yourself reaching for any of these to "complete the feel," stop and surface it as a follow-up instead.
