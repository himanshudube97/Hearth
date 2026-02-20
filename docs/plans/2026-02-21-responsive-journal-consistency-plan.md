# Responsive Journal Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the journal responsive (mobile form / tablet scaled / desktop book spread) with a fixed character limit ensuring cross-device consistency.

**Architecture:** Two layouts sharing one data model. A `useMediaQuery` hook selects between the desktop book spread (<1024px = mobile form, 1024-1399px = scaled book, >=1400px = full book). Text is stored as one continuous string (no `<!--page-break-->`). Desktop splits text at render time using a line-count formula. Character limit (~1200) is enforced everywhere.

**Tech Stack:** React 19, Next.js 16, Framer Motion v12, Zustand, Tailwind CSS

---

## Phase 1: Foundation

### Task 1: Create Shared Journal Constants

**Files:**
- Create: `src/lib/journal-constants.ts`

**Step 1: Create the constants file**

```typescript
// src/lib/journal-constants.ts

export const JOURNAL = {
  LINE_HEIGHT: 32,             // px - matches line pattern spacing
  FONT_SIZE: 20,               // px - Caveat font size
  MAX_CHARS: 1200,             // Total character limit per entry (both pages combined)

  // Desktop book dimensions
  BOOK_WIDTH: 1300,            // px
  BOOK_HEIGHT: 820,            // px
  PAGE_PADDING_TOP: 20,        // px
  PAGE_PADDING_BOTTOM: 20,     // px
  LEFT_SONG_SECTION_HEIGHT: 80,  // px - compact song embed + label
  LEFT_LABEL_HEIGHT: 20,       // px - "Write your thoughts" label
  RIGHT_PHOTO_SECTION_HEIGHT: 110, // px - photos + label
  RIGHT_DOODLE_SECTION_HEIGHT: 155, // px - doodle canvas + label + margin
  RIGHT_SAVE_SECTION_HEIGHT: 50,    // px - save button area
  RIGHT_PROMPT_HEIGHT: 30,     // px - writing prompt

  // Responsive breakpoints
  BREAKPOINT_DESKTOP: 1400,    // px - full book spread
  BREAKPOINT_TABLET: 1024,     // px - scaled book spread (below = mobile form)

  // Chars per line estimate for Caveat at 20px in ~560px writing area
  CHARS_PER_LINE: 38,
} as const

/**
 * Calculate how many lines fit in the left page writing area.
 * Uses known layout heights, not DOM measurement.
 */
export function getLeftPageMaxLines(bookHeight: number = JOURNAL.BOOK_HEIGHT): number {
  const availableHeight = bookHeight
    - JOURNAL.PAGE_PADDING_TOP
    - JOURNAL.PAGE_PADDING_BOTTOM
    - JOURNAL.LEFT_SONG_SECTION_HEIGHT
    - JOURNAL.LEFT_LABEL_HEIGHT
  return Math.floor(availableHeight / JOURNAL.LINE_HEIGHT)
}

/**
 * Calculate how many lines fit in the right page writing area.
 */
export function getRightPageMaxLines(bookHeight: number = JOURNAL.BOOK_HEIGHT): number {
  const availableHeight = bookHeight
    - JOURNAL.PAGE_PADDING_TOP
    - JOURNAL.PAGE_PADDING_BOTTOM
    - JOURNAL.RIGHT_PHOTO_SECTION_HEIGHT
    - JOURNAL.RIGHT_PROMPT_HEIGHT
    - JOURNAL.RIGHT_DOODLE_SECTION_HEIGHT
    - JOURNAL.RIGHT_SAVE_SECTION_HEIGHT
  return Math.floor(availableHeight / JOURNAL.LINE_HEIGHT)
}
```

**Step 2: Verify lint passes**

Run: `cd /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth && npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/lib/journal-constants.ts
git commit -m "feat: add shared journal constants for responsive layout"
```

---

### Task 2: Create useMediaQuery Hook

**Files:**
- Create: `src/hooks/useMediaQuery.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/useMediaQuery.ts
'use client'

import { useState, useEffect } from 'react'

/**
 * React hook that tracks a CSS media query match.
 * Returns false during SSR (safe default).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Returns the current layout mode based on viewport width.
 * - 'mobile': < 1024px — simple form layout
 * - 'tablet': 1024-1399px — scaled book spread
 * - 'desktop': >= 1400px — full book spread
 */
export function useLayoutMode(): 'mobile' | 'tablet' | 'desktop' {
  const isDesktop = useMediaQuery('(min-width: 1400px)')
  const isTablet = useMediaQuery('(min-width: 1024px)')

  if (isDesktop) return 'desktop'
  if (isTablet) return 'tablet'
  return 'mobile'
}
```

**Step 2: Verify lint passes**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/hooks/useMediaQuery.ts
git commit -m "feat: add useMediaQuery and useLayoutMode hooks"
```

---

### Task 3: Create Text Utilities

**Files:**
- Create: `src/lib/text-utils.ts`

**Step 1: Create text utility functions**

```typescript
// src/lib/text-utils.ts

import { JOURNAL, getLeftPageMaxLines } from './journal-constants'

const PAGE_BREAK_MARKER = '<!--page-break-->'

/**
 * Strip the <!--page-break--> marker from stored HTML and join into one string.
 * Handles legacy entries that have the marker.
 */
export function stripPageBreak(html: string): string {
  if (!html) return ''
  return html.replace(PAGE_BREAK_MARKER, '')
}

/**
 * Convert stored HTML to an array of plain-text lines.
 * Each <p>...</p> becomes one line. Empty <p></p> becomes ''.
 */
export function htmlToLines(html: string): string[] {
  if (!html) return ['']
  const cleaned = stripPageBreak(html)
  // Split on </p><p> boundaries
  const paragraphs = cleaned
    .replace(/^<p>/, '')
    .replace(/<\/p>$/, '')
    .split(/<\/p><p>/g)
    .map(p =>
      p
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    )
  return paragraphs
}

/**
 * Count how many display lines a text string occupies,
 * accounting for word wrap at CHARS_PER_LINE.
 */
export function countDisplayLines(lines: string[], charsPerLine: number = JOURNAL.CHARS_PER_LINE): number {
  let total = 0
  for (const line of lines) {
    if (line.length === 0) {
      total += 1 // blank line still takes a line
    } else {
      total += Math.ceil(line.length / charsPerLine)
    }
  }
  return total
}

/**
 * Split plain text into left-page and right-page portions
 * based on the left page's line capacity.
 *
 * Returns [leftText, rightText] as plain text with \n separators.
 */
export function splitTextForSpread(
  fullPlainText: string,
  maxLeftLines: number = getLeftPageMaxLines(),
  charsPerLine: number = JOURNAL.CHARS_PER_LINE,
): [string, string] {
  const lines = fullPlainText.split('\n')
  let displayLineCount = 0
  let splitIndex = lines.length // default: everything on left

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineDisplayLines = line.length === 0 ? 1 : Math.ceil(line.length / charsPerLine)

    if (displayLineCount + lineDisplayLines > maxLeftLines) {
      splitIndex = i
      break
    }
    displayLineCount += lineDisplayLines
  }

  const leftLines = lines.slice(0, splitIndex)
  const rightLines = lines.slice(splitIndex)

  return [leftLines.join('\n'), rightLines.join('\n')]
}

/**
 * Convert stored HTML entry text to plain text (full, no split).
 */
export function htmlToPlainText(html: string): string {
  const lines = htmlToLines(html)
  return lines.join('\n')
}

/**
 * Find the last word boundary in a string that fits within maxChars.
 * Returns the index to split at. If no space found, returns maxChars.
 */
export function findWordBoundary(text: string, maxChars: number): number {
  if (text.length <= maxChars) return text.length
  // Look backwards from maxChars for a space
  const lastSpace = text.lastIndexOf(' ', maxChars)
  if (lastSpace > 0) return lastSpace
  // No space found — break at maxChars (very long word)
  return maxChars
}

/**
 * Convert plain textarea text (\n-separated) to HTML paragraphs for storage.
 */
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return ''
  return '<p>' + text.replace(/\n/g, '</p><p>') + '</p>'
}
```

**Step 2: Verify lint passes**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/lib/text-utils.ts
git commit -m "feat: add text utilities for page split and HTML conversion"
```

---

## Phase 2: Desktop Improvements

### Task 4: Update LeftPage — Line-Count Overflow

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`

**Context:** Replace DOM `scrollHeight` measurement with a line-count formula. The left page calls `onPageFull` when text exceeds the calculated line capacity. Word-boundary aware — never splits a word.

**Step 1: Add imports and update overflow logic**

In `LeftPage.tsx`, add import at top:
```typescript
import { JOURNAL, getLeftPageMaxLines } from '@/lib/journal-constants'
import { findWordBoundary } from '@/lib/text-utils'
```

**Step 2: Replace `handleTextChange` with line-count based overflow**

Replace the current `handleTextChange` callback (lines 99-120) and the `isPageFull` state + `textareaRef`:

Remove:
- `const textareaRef = useRef<HTMLTextAreaElement>(null)` (line 96)
- `const [isPageFull, setIsPageFull] = useState(false)` (line 97)

Replace `handleTextChange` with:

```typescript
const maxLines = getLeftPageMaxLines()

const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newText = e.target.value

  // Calculate display lines for the new text
  const lines = newText.split('\n')
  let displayLines = 0
  for (const line of lines) {
    displayLines += line.length === 0 ? 1 : Math.ceil(line.length / JOURNAL.CHARS_PER_LINE)
  }

  if (displayLines > maxLines && newText.length > text.length) {
    // Page is full — find word boundary and overflow
    // Find where the overflow starts by rebuilding up to maxLines
    const allLines = newText.split('\n')
    let accumulated = 0
    let overflowStartLine = allLines.length

    for (let i = 0; i < allLines.length; i++) {
      const lineDisplayLines = allLines[i].length === 0 ? 1 : Math.ceil(allLines[i].length / JOURNAL.CHARS_PER_LINE)
      if (accumulated + lineDisplayLines > maxLines) {
        overflowStartLine = i
        break
      }
      accumulated += lineDisplayLines
    }

    const fitsText = allLines.slice(0, overflowStartLine).join('\n')
    const overflowText = allLines.slice(overflowStartLine).join('\n')

    onTextChange?.(fitsText)
    if (overflowText) {
      onPageFull?.(overflowText)
    }
    return
  }

  onTextChange?.(newText)
}, [text, maxLines, onPageFull, onTextChange])
```

**Step 3: Remove `ref={textareaRef}` from the textarea**

In the new-entry textarea (around line 180), remove the `ref={textareaRef}` prop. Keep `overflow: 'hidden'` style.

**Step 4: Update character limit enforcement**

Add to `handleTextChange`, before the line-count check:

```typescript
// Enforce global character limit (combined with right page text tracked by parent)
if (newText.length > JOURNAL.MAX_CHARS) {
  return // reject — at capacity
}
```

**Step 5: Verify build passes**

Run: `docker compose exec app npm run build` (or `npm run lint` locally)

**Step 6: Commit**

```bash
git add src/components/desk/LeftPage.tsx
git commit -m "refactor: replace DOM overflow with line-count formula in LeftPage"
```

---

### Task 5: Update RightPage — Consume Overflow + Char Limit

**Files:**
- Modify: `src/components/desk/RightPage.tsx`

**Context:** RightPage now receives overflow text as a prop change (not via focus-based ref transfer). Enforce character limit. Use line-count for its own overflow detection.

**Step 1: Add imports**

```typescript
import { JOURNAL, getRightPageMaxLines } from '@/lib/journal-constants'
import { htmlToPlainText, stripPageBreak, splitTextForSpread } from '@/lib/text-utils'
```

**Step 2: Simplify overflow consumption**

The `handleTextareaFocus` + `consumeOverflow` pattern is removed. Instead, BookSpread will set the right page text directly when left page overflows.

Update `RightPageProps` interface — remove `consumeOverflow`, add:
```typescript
interface RightPageProps {
  entry: Entry | null
  isNewEntry: boolean
  photos?: Photo[]
  onPhotoAdd?: (position: 1 | 2, dataUrl: string) => void
  onSaveComplete?: () => void
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  leftPageText?: string
  text?: string            // NEW: controlled text from parent
  onTextChange?: (text: string) => void  // NEW: text change handler
}
```

**Step 3: Update text handling in the component body**

Remove internal `const [text, setText] = useState('')` and `handleTextChange` that uses scrollHeight. Replace with:

```typescript
const text = externalText ?? ''  // rename the prop to avoid conflict
const setText = onTextChange ?? (() => {})

const maxLines = getRightPageMaxLines()

const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newText = e.target.value

  // Enforce character limit (combined with left page)
  const totalChars = (leftPageText?.length || 0) + newText.length
  if (totalChars > JOURNAL.MAX_CHARS && newText.length > text.length) {
    return // reject
  }

  // Check right page line capacity
  const lines = newText.split('\n')
  let displayLines = 0
  for (const line of lines) {
    displayLines += line.length === 0 ? 1 : Math.ceil(line.length / JOURNAL.CHARS_PER_LINE)
  }

  if (displayLines > maxLines && newText.length > text.length) {
    return // right page is full — reject (no third page)
  }

  setText(newText)
}, [text, leftPageText, maxLines, setText])
```

**Step 4: Remove `handleTextareaFocus` and `onFocus={handleTextareaFocus}` from textarea**

**Step 5: Update the save handler**

In `handleSave`, replace the text combination logic:

```typescript
// Combine left and right page text with plain text to HTML conversion
const leftHtml = leftPageText?.trim() ? `<p>${leftPageText.replace(/\n/g, '</p><p>')}</p>` : ''
const rightHtml = text.trim() ? `<p>${text.replace(/\n/g, '</p><p>')}</p>` : ''
// Store as one continuous string — NO page-break marker
const combinedText = leftHtml && rightHtml
  ? `${leftHtml}${rightHtml}`
  : leftHtml || rightHtml
```

Note: No `<!--page-break-->` marker. Just concatenated HTML.

**Step 6: Fix photo save — add spread field**

In the `handleSave` fetch body, ensure photos include `spread: 1`:

```typescript
photos: photos.map(p => ({
  url: p.url,
  position: p.position,
  rotation: p.rotation,
  spread: 1,
})),
```

**Step 7: Update viewing mode — render-time split**

Replace the existing viewing mode text parsing (lines 578-596):

```typescript
// Viewing existing entry - dynamic split at render time
const fullText = entry?.text || ''
const plainText = htmlToPlainText(fullText)
const [, rightPlainText] = splitTextForSpread(plainText)
```

Use `rightPlainText` instead of the old `plainText` variable for the display.

**Step 8: Verify build**

Run: `npm run lint`

**Step 9: Commit**

```bash
git add src/components/desk/RightPage.tsx
git commit -m "refactor: line-count overflow and char limit in RightPage, fix photo spread"
```

---

### Task 6: Update BookSpread — Render-Time Split + Fix Navigation

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

**Step 1: Add imports**

```typescript
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToPlainText, splitTextForSpread } from '@/lib/text-utils'
```

**Step 2: Add right page text state**

Add alongside existing state:
```typescript
const [rightPageText, setRightPageText] = useState('')
```

**Step 3: Replace overflow mechanism**

Remove:
- `const rightPageTextareaRef = useRef<HTMLTextAreaElement>(null)` (line 203)
- `const pendingOverflowRef = useRef('')` (line 204)
- `handleLeftPageFull` callback (lines 265-268)
- `consumeOverflow` callback (lines 270-274)

Replace `handleLeftPageFull` with:
```typescript
const handleLeftPageFull = useCallback((overflowText: string) => {
  // Directly set the right page text with the overflow
  setRightPageText(prev => overflowText + prev)
}, [])
```

**Step 4: Update RightPage props**

Replace the RightPage JSX to pass new props:
```typescript
<RightPage
  entry={currentEntry || null}
  isNewEntry={isNewEntrySpread}
  photos={currentPhotos}
  onPhotoAdd={handlePhotoAdd}
  onSaveComplete={handleSaveComplete}
  leftPageText={leftPageText}
  text={rightPageText}
  onTextChange={setRightPageText}
/>
```

Remove `textareaRef`, `consumeOverflow` props.

**Step 5: Update handleSaveComplete to reset right page text**

```typescript
const handleSaveComplete = useCallback(() => {
  setShowSavedOverlay(true)
  setLeftPageText('')
  setRightPageText('')
  setPendingPhotos([])
  setCurrentSong('')
  fetchEntries()
  setTimeout(() => setShowSavedOverlay(false), 2000)
}, [fetchEntries, setCurrentSong])
```

**Step 6: Fix right-arrow navigation dead-end**

Change line 502 from:
```typescript
{globalCurrentSpread < entries.length && (
```
To:
```typescript
{globalCurrentSpread < entries.length && !isNewEntrySpread && (
```

Wait — actually the issue is that at `globalCurrentSpread === entries.length - 1` (newest past entry), the condition `< entries.length` hides the forward arrow, but `entries.length` (the new-entry spread) is valid. Fix:

```typescript
{globalCurrentSpread < totalSpreads && !isPageTurning && (
```

This uses `totalSpreads` (which equals `entries.length`) so the arrow shows when you're at `entries.length - 1`, allowing navigation to `entries.length` (new entry spread).

Also update `handleNextPage` guard (already uses `totalSpreads`, so this is already correct in `desk.ts`).

**Step 7: Fix EntrySelector desync**

When selecting an entry via EntrySelector, also update the spread:
```typescript
const handleEntrySelect = useCallback((entryId: string | null) => {
  setCurrentEntryId(entryId)
  setLeftPageText('')
  setRightPageText('')
  setPendingPhotos([])
  // Sync spread position
  if (entryId) {
    const idx = entries.findIndex(e => e.id === entryId)
    if (idx >= 0) {
      goToSpread(entries.length - 1 - idx)
    }
  }
}, [entries, goToSpread])
```

**Step 8: Update handleNewEntry**

```typescript
const handleNewEntry = useCallback(() => {
  setCurrentEntryId(null)
  setLeftPageText('')
  setRightPageText('')
  setPendingPhotos([])
  goToSpread(entries.length) // go to new-entry spread
}, [entries.length, goToSpread])
```

**Step 9: Increase API limit**

Change `fetch('/api/entries?limit=100')` to `fetch('/api/entries?limit=50')` to match the server cap, or better: update the API route to allow higher limits for the book view.

For now, just match the server: change to `limit=50`.

**Step 10: Verify build**

Run: `npm run lint`

**Step 11: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "refactor: render-time page split, fix navigation and EntrySelector sync"
```

---

## Phase 3: Mobile Layout

### Task 7: Create MobileJournalEntry Component

**Files:**
- Create: `src/components/desk/MobileJournalEntry.tsx`

**Context:** This is the mobile/small-screen journal writing and viewing form. Single scrollable screen: song input, writing area with character counter, photo upload, doodle canvas, save button. Uses the same Zustand stores and API as the desktop book spread.

**Step 1: Create the component**

```typescript
// src/components/desk/MobileJournalEntry.tsx
'use client'

import React, { useState, useCallback, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import { useJournalStore, StrokeData } from '@/store/journal'
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToPlainText, stripPageBreak } from '@/lib/text-utils'
import { getRandomPrompt } from '@/lib/themes'
import SongEmbed from '@/components/SongEmbed'
import PhotoBlock from './PhotoBlock'
import EntrySelector from './EntrySelector'

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  photos?: Photo[]
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface MobileJournalEntryProps {
  onClose: () => void
}

export default function MobileJournalEntry({ onClose }: MobileJournalEntryProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentSong, setCurrentSong, currentMood, currentDoodleStrokes, setDoodleStrokes, resetCurrentEntry } = useJournalStore()

  const isGlass = currentDiaryTheme === 'glass'
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const accentColor = theme.accent.warm
  const pageBg = isGlass ? theme.glass.bg : diaryTheme.pages.background

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [songInput, setSongInput] = useState(currentSong || '')
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [prompt, setPrompt] = useState('')

  useEffect(() => { setPrompt(getRandomPrompt()) }, [])

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=50')
      if (res.ok) {
        const data = await res.json()
        const fetched = data.entries || []
        setEntries(fetched)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        setTodayEntries(fetched.filter((e: Entry) => {
          const d = new Date(e.createdAt)
          return d >= today && d <= todayEnd
        }))
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Current entry (null = new entry)
  const currentEntry = currentEntryId
    ? entries.find(e => e.id === currentEntryId) || null
    : null
  const isNewEntry = currentEntryId === null

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length > JOURNAL.MAX_CHARS) return
    setText(newText)
  }, [])

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
  }, [setCurrentSong])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1 ? -8 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 6)
    setPendingPhotos(prev => [...prev.filter(p => p.position !== position), { url: dataUrl, position, rotation }])
  }, [])

  const handleSave = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const html = '<p>' + text.replace(/\n/g, '</p><p>') + '</p>'
      const photos = pendingPhotos.map(p => ({
        url: p.url, position: p.position, rotation: p.rotation, spread: 1,
      }))
      const doodles = currentDoodleStrokes.length > 0 ? [{ strokes: currentDoodleStrokes }] : []

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: html,
          mood: currentMood,
          song: songInput && /https?:\/\//.test(songInput) ? songInput : null,
          photos,
          doodles,
        }),
      })

      if (res.ok) {
        setText('')
        setSongInput('')
        setPendingPhotos([])
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        setShowSaved(true)
        fetchEntries()
        setTimeout(() => setShowSaved(false), 2000)
      } else {
        const data = await res.json()
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }, [text, songInput, pendingPhotos, currentMood, currentDoodleStrokes, resetCurrentEntry, fetchEntries])

  const handleEntrySelect = useCallback((entryId: string | null) => {
    setCurrentEntryId(entryId)
    setText('')
    setPendingPhotos([])
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <span style={{ color: mutedColor }}>Loading...</span>
      </div>
    )
  }

  // Viewing existing entry
  if (!isNewEntry && currentEntry) {
    const plainText = htmlToPlainText(currentEntry.text)
    const entryPhotos = currentEntry.photos || []
    const entryDoodle = currentEntry.doodles?.[0]

    return (
      <div className="fixed inset-0 overflow-y-auto" style={{ background: theme.bg.primary }}>
        <div className="max-w-lg mx-auto px-4 py-6 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
              style={{ background: theme.glass.bg, color: textColor, border: `1px solid ${theme.glass.border}` }}>
              Close
            </button>
            <span className="text-sm" style={{ color: mutedColor }}>
              {new Date(currentEntry.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Entry selector */}
          {todayEntries.length > 0 && (
            <div className="flex justify-center mb-4">
              <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
                onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
            </div>
          )}

          {/* Song */}
          {currentEntry.song && (
            <div className="mb-4">
              <SongEmbed url={currentEntry.song} compact audioOnly />
            </div>
          )}

          {/* Text */}
          <div className="whitespace-pre-wrap mb-4" style={{
            color: textColor, fontFamily: 'var(--font-caveat), Georgia, serif',
            fontSize: '20px', lineHeight: '32px',
          }}>
            {plainText || <span style={{ color: mutedColor, fontStyle: 'italic' }}>No text</span>}
          </div>

          {/* Photos */}
          {entryPhotos.length > 0 && (
            <div className="mb-4">
              <PhotoBlock photos={entryPhotos} disabled />
            </div>
          )}

          {/* Doodle */}
          {entryDoodle?.strokes && entryDoodle.strokes.length > 0 && (
            <div className="mb-4 h-32 rounded-lg overflow-hidden"
              style={{ background: isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground,
                border: `1px solid ${isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}` }}>
              {/* Render doodle SVG - reuse DoodlePreview pattern from RightPage */}
              <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Strokes rendered by parent or inline */}
              </svg>
            </div>
          )}
        </div>
      </div>
    )
  }

  // New entry form
  const charCount = text.length
  const currentPhotos = [...pendingPhotos]

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: theme.bg.primary }}>
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
            style={{ background: theme.glass.bg, color: textColor, border: `1px solid ${theme.glass.border}` }}>
            Close
          </button>
          <span className="text-sm" style={{ color: mutedColor }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Entry selector */}
        {todayEntries.length > 0 && (
          <div className="flex justify-center mb-4">
            <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
              onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
          </div>
        )}

        {/* Song input */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: mutedColor }}>
            Add a Song
          </div>
          {songInput && /https?:\/\//.test(songInput) ? (
            <div className="relative">
              <SongEmbed url={songInput} compact audioOnly />
              <button onClick={() => setSongInput('')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: `${mutedColor}20`, color: mutedColor }}>
                x
              </button>
            </div>
          ) : (
            <input type="text" value={songInput} onChange={e => handleSongChange(e.target.value)}
              placeholder="Paste Spotify, YouTube, or SoundCloud link..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}`,
                color: textColor, background: isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground }} />
          )}
        </div>

        {/* Writing area */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: mutedColor }}>
              Write your thoughts
            </div>
            <div className="text-[10px]" style={{ color: charCount > JOURNAL.MAX_CHARS * 0.9 ? accentColor : mutedColor }}>
              {charCount} / {JOURNAL.MAX_CHARS}
            </div>
          </div>
          <div className="text-xs italic mb-2" style={{ color: mutedColor }}>
            {prompt}
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="What's on your mind today..."
            rows={10}
            className="w-full resize-none outline-none rounded-lg p-3"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              fontSize: '20px',
              lineHeight: '32px',
              caretColor: accentColor,
              background: isGlass ? 'rgba(255,255,255,0.05)' : `${pageBg}`,
              border: `1px solid ${isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBorder}`,
            }}
          />
        </div>

        {/* Photos */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: mutedColor }}>
            Add Photos
          </div>
          <PhotoBlock photos={currentPhotos} onPhotoAdd={handlePhotoAdd} />
        </div>

        {/* TODO: Doodle canvas — import CompactDoodleCanvas from RightPage or extract to shared component */}

        {/* Save button */}
        <AnimatePresence mode="wait">
          {text.trim().length > 0 && (
            <motion.button
              key="save"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-full text-sm font-medium"
              style={{
                background: accentColor,
                color: 'white',
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Saved overlay */}
        <AnimatePresence>
          {showSaved && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <motion.div className="flex flex-col items-center gap-2"
                initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl text-white"
                  style={{ background: accentColor }}>
                  ✓
                </div>
                <span className="text-lg font-serif" style={{ color: theme.text.primary }}>Saved</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

**Step 2: Verify lint**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/components/desk/MobileJournalEntry.tsx
git commit -m "feat: add MobileJournalEntry component for mobile/tablet portrait"
```

---

### Task 8: Update DeskScene for Responsive Layout Switching

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`

**Context:** DeskScene becomes the responsive wrapper. It uses `useLayoutMode()` to decide: mobile form, scaled book, or full book. The DeskBook component is rendered with a CSS scale transform for tablet.

**Step 1: Add imports**

```typescript
import { useLayoutMode } from '@/hooks/useMediaQuery'
import { JOURNAL } from '@/lib/journal-constants'
import MobileJournalEntry from './MobileJournalEntry'
```

**Step 2: Add layout mode detection**

Inside `DeskScene`, after `const { theme } = useThemeStore()`:

```typescript
const layoutMode = useLayoutMode()
```

**Step 3: Add mobile close handler**

```typescript
const handleMobileClose = useCallback(() => {
  // Navigate back or close — depends on app routing
  // For now, this could toggle a state or use router
  window.history.back()
}, [])
```

Actually, looking at DeskScene more carefully, it doesn't have a close concept — it IS the scene. The `onClose` for the book is handled by `DeskBook`. For mobile, the close button should behave similarly.

**Step 4: Conditionally render mobile vs desktop**

Replace the `{/* Book - center */}` section with:

```typescript
{layoutMode === 'mobile' ? (
  <MobileJournalEntry onClose={() => {/* handled by parent */}} />
) : (
  <>
    {/* Book - center */}
    <motion.div
      className="absolute z-30"
      style={{
        top: '50%',
        left: '50%',
        transform: layoutMode === 'tablet'
          ? `translate(-50%, -50%) scale(${Math.min(1, (typeof window !== 'undefined' ? window.innerWidth : 1400) / 1500)})`
          : 'translate(-50%, -50%)',
        transformOrigin: 'center center',
      }}
    >
      <DeskBook />
    </motion.div>

    {/* Diary Theme Selector — only on desktop/tablet */}
    <DiaryThemeSelector />
  </>
)}
```

Note: For tablet scaling, we calculate scale factor as `window.innerWidth / 1500` (giving some margin around the 1300px book). This should be wrapped in a state to avoid SSR issues:

```typescript
const [scaleForTablet, setScaleForTablet] = useState(1)

useEffect(() => {
  if (layoutMode === 'tablet') {
    const calcScale = () => setScaleForTablet(Math.min(1, window.innerWidth / 1500))
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }
}, [layoutMode])
```

Then use `scale(${scaleForTablet})` in the transform.

**Step 5: Move floating particles and ambiance outside the conditional**

The background, vignette, desk surface, and dust particles should render for ALL layouts. Only the book/form switches.

**Step 6: Verify build**

Run: `npm run lint`

**Step 7: Commit**

```bash
git add src/components/desk/DeskScene.tsx
git commit -m "feat: responsive layout switching in DeskScene (mobile form / tablet scaled / desktop full)"
```

---

## Phase 4: Polish

### Task 9: Fix PageTurn Theme Colors

**Files:**
- Modify: `src/components/desk/PageTurn.tsx`

**Step 1: Add diary theme imports**

```typescript
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
```

**Step 2: Replace hardcoded colors**

Inside the component, replace:
```typescript
const paperColor = 'hsl(40, 30%, 94%)'
const paperColorDark = 'hsl(40, 25%, 88%)'
```

With:
```typescript
const { currentDiaryTheme } = useDiaryStore()
const diaryTheme = diaryThemes[currentDiaryTheme]
const paperColor = currentDiaryTheme === 'glass'
  ? theme.glass.bg
  : diaryTheme.pages.background
const paperColorDark = currentDiaryTheme === 'glass'
  ? 'rgba(255,255,255,0.08)'
  : paperColor.replace(/(\d+)%\)$/, (_: string, l: string) => `${Math.max(0, parseInt(l) - 6)}%)`)
```

**Step 3: Verify build**

Run: `npm run lint`

**Step 4: Commit**

```bash
git add src/components/desk/PageTurn.tsx
git commit -m "fix: use diary theme colors in page turn animation"
```

---

### Task 10: LeftPage Viewing Mode — Render-Time Split

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`

**Context:** When viewing existing entries, LeftPage should use the render-time split instead of the stored `<!--page-break-->` marker.

**Step 1: Add import**

```typescript
import { htmlToPlainText, splitTextForSpread } from '@/lib/text-utils'
```

**Step 2: Replace viewing mode text parsing**

Replace lines 204-221 (the existing viewing mode text extraction):

```typescript
// Viewing existing entry - dynamic split at render time
const fullText = entry?.text || ''
const fullPlainText = htmlToPlainText(fullText)
const [leftPlainText] = splitTextForSpread(fullPlainText)

const plainText = leftPlainText
```

Remove the old `pageBreakMarker`, `pageBreakIdx`, `leftRawText`, and manual HTML stripping code.

**Step 3: Verify build**

Run: `npm run lint`

**Step 4: Commit**

```bash
git add src/components/desk/LeftPage.tsx
git commit -m "refactor: use render-time split for viewing entries in LeftPage"
```

---

### Task 11: Extract CompactDoodleCanvas for Reuse

**Files:**
- Create: `src/components/desk/CompactDoodleCanvas.tsx`
- Modify: `src/components/desk/RightPage.tsx` (import from new file)
- Modify: `src/components/desk/MobileJournalEntry.tsx` (import and use)

**Step 1: Extract CompactDoodleCanvas**

Move the `CompactDoodleCanvas` component from `RightPage.tsx` into its own file at `src/components/desk/CompactDoodleCanvas.tsx`. Export it as default.

**Step 2: Update RightPage import**

Replace the inline `CompactDoodleCanvas` definition with:
```typescript
import CompactDoodleCanvas from './CompactDoodleCanvas'
```

**Step 3: Add doodle canvas to MobileJournalEntry**

Import and render the `CompactDoodleCanvas` in the mobile form (replacing the TODO comment).

**Step 4: Verify build**

Run: `npm run lint`

**Step 5: Commit**

```bash
git add src/components/desk/CompactDoodleCanvas.tsx src/components/desk/RightPage.tsx src/components/desk/MobileJournalEntry.tsx
git commit -m "refactor: extract CompactDoodleCanvas for reuse in mobile and desktop"
```

---

### Task 12: Full Integration Verification

**Step 1: Run lint**

```bash
npm run lint
```
Expected: No errors

**Step 2: Run build**

```bash
docker compose exec app npm run build
```
Expected: Build succeeds

**Step 3: Manual browser testing**

1. Open app at `http://localhost:3111` in a desktop browser
   - Verify book spread renders correctly
   - Write text, verify overflow to right page works
   - Verify character counter (if visible)
   - Navigate between entries with arrows
   - Verify right arrow reaches new-entry spread

2. Open DevTools, toggle device toolbar to iPhone/mobile width (<1024px)
   - Verify mobile form layout renders
   - Write text, verify character limit enforced
   - Add photos, verify they display
   - Save entry, verify it appears in entry list
   - Switch to an existing entry, verify text displays fully

3. Toggle to tablet width (1024-1399px)
   - Verify scaled book spread
   - Verify all interactions work at scaled size

4. Write an entry on "mobile" (devtools), switch to "desktop" (full width)
   - Verify the text renders correctly in the book spread

**Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: integration fixes from manual testing"
```

---

## Summary of All Files

| File | Action | Phase |
|------|--------|-------|
| `src/lib/journal-constants.ts` | Create | 1 |
| `src/hooks/useMediaQuery.ts` | Create | 1 |
| `src/lib/text-utils.ts` | Create | 1 |
| `src/components/desk/LeftPage.tsx` | Modify | 2, 4 |
| `src/components/desk/RightPage.tsx` | Modify | 2, 4 |
| `src/components/desk/BookSpread.tsx` | Modify | 2 |
| `src/components/desk/MobileJournalEntry.tsx` | Create | 3 |
| `src/components/desk/DeskScene.tsx` | Modify | 3 |
| `src/components/desk/PageTurn.tsx` | Modify | 4 |
| `src/components/desk/CompactDoodleCanvas.tsx` | Create (extract) | 4 |
