# Share Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **No formal tests.** Per project convention (Hearth skips unit tests by default), each task uses manual verification in the Docker dev environment instead of automated tests. Verification steps describe what to look for in the running app.

**Goal:** Add a camera button to the diary spread, scrapbook canvas, and revealed memory; tapping it captures a theme-framed PNG of just that surface, reveals it via a butterfly animation, and offers Share (native share sheet) + Save (download).

**Architecture:** A single `useShareableCapture()` hook wraps the entire flow. It returns `{ CameraButton, Capture }` for each surface to drop in. Internally it renders an off-screen `<ShareCardFrame>` (theme-tinted, theme-stamp top-right, hearth footer) wrapping one of three content variants — `<JournalShareCard>` (diary), `<MemoryShareCard>` (memory; same as journal + time-ago label), or `<ScrapbookShareCard>` — captures it via `html-to-image`, then renders the result inside a butterfly-reveal portal styled like `PromptCard.tsx`. Sharing routes through `lib/share.ts` which prefers `navigator.share({files})` and falls back to download.

**Tech Stack:** React 19, Next.js 16, Framer Motion, Zustand, `html-to-image` (already in `package.json`), Web Share API. Reuses existing `Plant`, `LeftPage`, `RightPage`, `PageSurface`, `themeStamps`.

**Spec:** [docs/superpowers/specs/2026-05-09-share-capture-design.md](../specs/2026-05-09-share-capture-design.md)

---

## File Structure

**New files:**

```
src/components/share/
  ShareCardFrame.tsx         # Theme-tinted 1080×1350 frame: backdrop + stamp + footer
  JournalShareCard.tsx       # Diary spread layout for capture (used by diary AND memory)
  ScrapbookShareCard.tsx     # Scrapbook page layout for capture
  ShareableCapture.tsx       # useShareableCapture() hook + butterfly/preview portal
  CameraIcon.tsx             # Inline SVG camera glyph

src/lib/
  share.ts                   # shareOrDownload() + captureToBlob()
```

**Modified files:**

```
src/components/desk/BookSpread.tsx                # Wire desktop diary
src/components/desk/MobileJournalEntry.tsx        # Wire mobile diary
src/components/scrapbook/ScrapbookCanvas.tsx      # Wire scrapbook
src/components/constellation/MemoryDiaryView.tsx  # Wire memory reveal
```

**Build sequence rationale:** Bottom-up — utilities first (no UI dependency), then visual primitives (frame, cards), then orchestrator, then surface wiring. Each step verifiable on its own.

---

## Task 1: Build `lib/share.ts` — share + capture helpers

**Files:**
- Create: `src/lib/share.ts`

**Why first:** No UI dependency. Once it exists, every later piece can use it.

- [ ] **Step 1.1: Create `src/lib/share.ts`**

```ts
import { toBlob } from 'html-to-image'

export type ShareSurface = 'diary' | 'scrapbook' | 'memory'

export interface ShareResult {
  method: 'share' | 'download' | 'cancelled'
}

/**
 * Capture an HTMLElement to a PNG blob at 2× device pixel ratio.
 * Returns null on failure so callers can show a toast.
 */
export async function captureToBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const blob = await toBlob(element, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: undefined, // let the frame paint its own background
    })
    return blob
  } catch (err) {
    console.error('[share] capture failed', err)
    return null
  }
}

/**
 * Share a PNG blob via the native share sheet when available, else download.
 * Returns the method actually used so callers can show the right toast.
 */
export async function shareOrDownload(blob: Blob, filename: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/png' })

  // Web Share API path — iOS, Android, Mac Safari, recent desktop Chrome
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'A page from Hearth' })
      return { method: 'share' }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return { method: 'cancelled' }
      // Fall through to download
    }
  }

  downloadBlob(blob, filename)
  return { method: 'download' }
}

/** Plain download — used as fallback and as the explicit "Save" button. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** `hearth-diary-2026-05-09.png` */
export function makeShareFilename(surface: ShareSurface, date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `hearth-${surface}-${yyyy}-${mm}-${dd}.png`
}
```

- [ ] **Step 1.2: Verify it compiles**

Run from worktree root:

```bash
docker compose exec app npx tsc --noEmit
```

Expected: no errors mentioning `src/lib/share.ts`. If `html-to-image` types are missing, the package already ships them — re-check `package.json` to confirm `"html-to-image": "^1.11.13"` is present.

- [ ] **Step 1.3: Commit**

```bash
git add src/lib/share.ts
git commit -m "feat(share): add capture + share/download helpers"
```

---

## Task 2: Build `<CameraIcon>` — inline SVG glyph

**Files:**
- Create: `src/components/share/CameraIcon.tsx`

**Why before the frame:** The camera button needs an icon; defining it as its own tiny file avoids inlining the same SVG four times later.

- [ ] **Step 2.1: Create `src/components/share/CameraIcon.tsx`**

```tsx
'use client'

interface CameraIconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

/**
 * Minimalist line-icon camera. Inline SVG to match Hearth's existing icon
 * style (no icon library is installed in this project).
 */
export default function CameraIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: CameraIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7h3l2-2.5h8L18 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
```

- [ ] **Step 2.2: Commit**

```bash
git add src/components/share/CameraIcon.tsx
git commit -m "feat(share): add inline camera icon"
```

---

## Task 3: Build `<ShareCardFrame>` — the theme-tinted frame

**Files:**
- Create: `src/components/share/ShareCardFrame.tsx`

**Why now:** The frame is the visual chrome around all three card variants. Building it standalone (with a placeholder body) lets us verify the framing visually before plumbing real content into it.

- [ ] **Step 3.1: Create `src/components/share/ShareCardFrame.tsx`**

```tsx
'use client'

import { format } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import type { ThemeName } from '@/lib/themes'

// Vintage stamp tokens (mirrors the set from LetterArrivedBanner.tsx).
const themeStamps: Record<ThemeName, { icon: string; color: string }> = {
  rivendell: { icon: '🌲', color: '#5E8B5A' },
  hearth: { icon: '🔥', color: '#C8742C' },
  rose: { icon: '🌸', color: '#9A4555' },
  sage: { icon: '🌿', color: '#6B7A4B' },
  ocean: { icon: '🌊', color: '#2C5260' },
  postal: { icon: '✉️', color: '#1F2750' },
  linen: { icon: '🕊️', color: '#A85530' },
  sunset: { icon: '🌅', color: '#C8472D' },
}

export const SHARE_CARD_W = 1080
export const SHARE_CARD_H = 1350

interface ShareCardFrameProps {
  date: Date
  /** Optional small subtitle line above the date (e.g. "a memory from 3 weeks ago"). */
  subtitle?: string
  children: React.ReactNode
}

/**
 * Fixed-size 1080×1350 (4:5 portrait) container intended to be rendered
 * off-screen, then snapshotted by html-to-image. Theme-tinted backdrop,
 * theme stamp in the top-right corner, hearth + date footer.
 *
 * Children fill the remaining space and are responsible for their own
 * scaling — the frame just gives them a clean, branded canvas.
 */
export default function ShareCardFrame({ date, subtitle, children }: ShareCardFrameProps) {
  const { theme, themeName } = useThemeStore()
  const stamp = themeStamps[themeName] ?? themeStamps.rivendell

  return (
    <div
      style={{
        width: `${SHARE_CARD_W}px`,
        height: `${SHARE_CARD_H}px`,
        position: 'relative',
        background: theme.bg.primary,
        backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 35%, ${theme.accent.warm}22, transparent 70%), radial-gradient(ellipse 60% 50% at 50% 90%, ${theme.accent.primary}1A, transparent 70%)`,
        overflow: 'hidden',
        fontFamily: 'var(--font-serif), Georgia, serif',
        color: theme.text.primary,
      }}
    >
      {/* Theme stamp — top right corner */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 48,
          width: 100,
          height: 120,
          background: 'linear-gradient(145deg, #faf8f5, #f0ebe0)',
          border: '3px dashed rgba(139, 115, 85, 0.5)',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
          transform: 'rotate(4deg)',
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 6 }}>{stamp.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: stamp.color, letterSpacing: 2 }}>
          HEARTH
        </div>
      </div>

      {/* Children fill the middle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingTop: 100,
          paddingBottom: 120,
          paddingLeft: 60,
          paddingRight: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>

      {/* Footer — subtitle + hearth + date */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontStyle: 'italic',
          color: theme.text.muted,
          letterSpacing: '0.05em',
        }}
      >
        {subtitle && (
          <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.85 }}>{subtitle}</div>
        )}
        <div style={{ fontSize: 18 }}>
          hearth · {format(date, 'MMMM d, yyyy')}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3.2: Commit**

```bash
git add src/components/share/ShareCardFrame.tsx
git commit -m "feat(share): add ShareCardFrame with theme stamp + footer"
```

---

## Task 4: Build `<JournalShareCard>` — diary spread for capture

**Files:**
- Create: `src/components/share/JournalShareCard.tsx`

**Reuses:** `<LeftPage>`, `<RightPage>`, the same `entryForPages` adapter pattern from `MemoryDiaryView.tsx`. The journal share card is also used for memory reveals — a memory IS a journal entry, just older. The only difference is the optional time-ago subtitle, which is surfaced via `<ShareCardFrame>`'s `subtitle` prop, NOT inside this component.

**Important: song iframes don't capture.** `LeftPage` renders `<SongEmbed>` as an iframe (Spotify/YouTube embed). `html-to-image` can't snapshot cross-origin iframe contents — they'd render as empty rects. The fix below scopes a CSS rule that hides iframes inside the share card, then overlays a small "🎵 song" pill if the entry has a song.

- [ ] **Step 4.1: Create `src/components/share/JournalShareCard.tsx`**

```tsx
'use client'

import { useMemo } from 'react'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from '@/components/desk/LeftPage'
import RightPage from '@/components/desk/RightPage'
import type { JournalEntry } from '@/store/journal'
import ShareCardFrame from './ShareCardFrame'

const SPREAD_W = 1300 // a single open spread (left page + right page side-by-side)
const SPREAD_H = 820

interface JournalShareCardProps {
  entry: JournalEntry
  /** Optional small label rendered in the footer (e.g. "a memory from 3 weeks ago"). */
  subtitle?: string
}

/**
 * The diary share image. Renders the same LeftPage/RightPage spread the
 * user sees on screen, scaled down to fit inside ShareCardFrame's content
 * area. Used for both the live diary AND memory reveals.
 *
 * Intended to be rendered off-screen at fixed dimensions (the parent
 * container should position it at left:-9999px until capture).
 */
export default function JournalShareCard({ entry, subtitle }: JournalShareCardProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  // LeftPage/RightPage want a stricter Photo position type (1 | 2).
  // Same adapter shape as MemoryDiaryView.tsx.
  const entryForPages = useMemo(() => ({
    id: entry.id,
    text: entry.text,
    song: entry.song ?? null,
    createdAt: entry.createdAt,
    style: entry.style ?? null,
    photos: (entry.photos || []).map((p) => ({
      id: p.id,
      url: p.url,
      rotation: p.rotation,
      position: (p.position === 2 ? 2 : 1) as 1 | 2,
    })),
    doodles: entry.doodles || [],
  }), [entry])

  // Frame inner content area is roughly 960×1130 (1080-2*60, 1350-100-120).
  // The spread is 1300×820 → scale to fit width: 960/1300 ≈ 0.74.
  const FRAME_INNER_W = 960
  const scale = FRAME_INNER_W / SPREAD_W

  return (
    <ShareCardFrame date={new Date(entry.createdAt)} subtitle={subtitle}>
      {/* Scoped style: hide cross-origin iframes (song embeds don't capture). */}
      <style>{`.share-card-spread iframe { display: none !important; }`}</style>
      <div
        className="share-card-spread"
        style={{
          width: `${SPREAD_W}px`,
          height: `${SPREAD_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ['--page-bg' as string]: colors.pageBg,
          ['--page-bg-solid' as string]: colors.pageBgSolid,
          display: 'flex',
          position: 'relative',
        } as React.CSSProperties}
      >
        {/* Left page */}
        <div
          style={{
            width: SPREAD_W / 2,
            height: SPREAD_H,
            backgroundColor: colors.pageBgSolid,
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg})`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ height: '100%', padding: '20px 30px', position: 'relative', overflow: 'hidden' }}>
            <LeftPage entry={entryForPages} isNewEntry={false} />
          </div>
        </div>

        {/* Right page */}
        <div
          style={{
            width: SPREAD_W / 2,
            height: SPREAD_H,
            backgroundColor: colors.pageBgSolid,
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg})`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ height: '100%', padding: '20px 30px', position: 'relative', overflow: 'hidden' }}>
            <RightPage entry={entryForPages} isNewEntry={false} photos={entryForPages.photos} />
          </div>
        </div>

        {/* Song pill — replaces the hidden iframe so the share card stays intentional. */}
        {entry.song && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 30,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'rgba(0,0,0,0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🎵</span>
            <span>song</span>
          </div>
        )}
      </div>
    </ShareCardFrame>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add src/components/share/JournalShareCard.tsx
git commit -m "feat(share): add JournalShareCard (diary + memory composition)"
```

---

## Task 5: Build `<ScrapbookShareCard>` — scrapbook page for capture

**Files:**
- Create: `src/components/share/ScrapbookShareCard.tsx`

**Approach:** Take the same `items` array the canvas uses, render through the same `PageSurface` + `CanvasItemWrapper` chain, but at fixed dimensions and with `pointerEvents: 'none'` so no editing chrome leaks in. Item rotations / positions are already in the data.

- [ ] **Step 5.1: Create `src/components/share/ScrapbookShareCard.tsx`**

```tsx
'use client'

import { useRef } from 'react'
import PageSurface from '@/components/scrapbook/PageSurface'
import CanvasItemWrapper from '@/components/scrapbook/CanvasItemWrapper'
import type { CanvasItem } from '@/lib/scrapbook'
import ShareCardFrame from './ShareCardFrame'

const PAGE_W = 1102
const PAGE_H = 760

interface ScrapbookShareCardProps {
  items: CanvasItem[]
  date: Date
}

/**
 * The scrapbook share image. Mirrors the live canvas layout (1102×760)
 * inside the ShareCardFrame's content area. Items are rendered read-only
 * — no selection, no edit affordances, no toolbars.
 */
export default function ScrapbookShareCard({ items, date }: ScrapbookShareCardProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const FRAME_INNER_W = 960
  const scale = FRAME_INNER_W / PAGE_W

  return (
    <ShareCardFrame date={date}>
      <div
        style={{
          width: `${PAGE_W}px`,
          height: `${PAGE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
        ref={canvasRef}
      >
        <PageSurface>
          {items.map((item) => (
            <CanvasItemWrapper
              key={item.id}
              item={item}
              allItems={items}
              canvasRef={canvasRef}
              selected={false}
              isEditing={false}
              onSelect={() => {}}
              onRequestEdit={() => {}}
              onChange={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
              onCommitEdit={() => {}}
              onCancelEdit={() => {}}
            />
          ))}
        </PageSurface>
      </div>
    </ShareCardFrame>
  )
}
```

- [ ] **Step 5.2: Verify the `CanvasItemWrapper` prop list matches**

The exact list of no-op handlers above must match `CanvasItemWrapper`'s props. Open `src/components/scrapbook/CanvasItemWrapper.tsx` and confirm the props it requires. If any handler name differs, update Step 5.1's code accordingly. If `CanvasItemWrapper` requires additional props, add them as no-ops.

```bash
grep -n "interface.*Props\|type.*Props" src/components/scrapbook/CanvasItemWrapper.tsx
```

- [ ] **Step 5.3: Commit**

```bash
git add src/components/share/ScrapbookShareCard.tsx
git commit -m "feat(share): add ScrapbookShareCard composition"
```

---

## Task 6: Build `useShareableCapture()` — the orchestrator

**Files:**
- Create: `src/components/share/ShareableCapture.tsx`

**This is the biggest task.** It does five things:
1. Renders the off-screen `<ShareCardFrame>`-wrapped content.
2. Fires the `html-to-image` capture in parallel with the butterfly animation.
3. Manages phases: `closed → butterfly → preview`.
4. Renders the butterfly portal (mirrors `PromptCard.tsx`).
5. Renders the preview card with Share + Save buttons.

- [ ] **Step 6.1: Create `src/components/share/ShareableCapture.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plant } from '@/components/constellation/garden/Plant'
import { useThemeStore } from '@/store/theme'
import { captureToBlob, downloadBlob, makeShareFilename, shareOrDownload, type ShareSurface } from '@/lib/share'
import CameraIcon from './CameraIcon'

// Hue rotations matching PromptCard's butterfly palette.
const BUTTERFLY_HUES = [0, -55, 200, 280, 95]

type Phase = 'closed' | 'butterfly' | 'preview'

interface UseShareableCaptureOptions {
  /** The composed off-screen card (e.g. <JournalShareCard entry={...} />). */
  cardContent: React.ReactNode
  surface: ShareSurface
  /** Date used for filename + (if shown) the frame footer. */
  date: Date
}

export function useShareableCapture({ cardContent, surface, date }: UseShareableCaptureOptions) {
  const { theme } = useThemeStore()
  const [phase, setPhase] = useState<Phase>('closed')
  const [butterflyHue, setButterflyHue] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [captureError, setCaptureError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const offscreenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Esc closes
  useEffect(() => {
    if (phase === 'closed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Cleanup blob URL on close / unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const open = useCallback(async () => {
    setCaptureError(false)
    setImageUrl(null)
    setImageBlob(null)
    setButterflyHue(BUTTERFLY_HUES[Math.floor(Math.random() * BUTTERFLY_HUES.length)])
    setPhase('butterfly')

    // Wait for the off-screen card to mount + fonts/images to settle.
    // The phase change above mounts the off-screen container.
    await new Promise((r) => setTimeout(r, 250))

    if (!offscreenRef.current) {
      setCaptureError(true)
      return
    }

    const blob = await captureToBlob(offscreenRef.current)
    if (!blob) {
      setCaptureError(true)
      return
    }
    setImageBlob(blob)
    setImageUrl(URL.createObjectURL(blob))
  }, [])

  const close = useCallback(() => {
    setPhase('closed')
    setCaptureError(false)
    // imageUrl revoked by cleanup effect on next state change
  }, [])

  const reveal = useCallback(() => {
    if (imageUrl) setPhase('preview')
  }, [imageUrl])

  const handleShare = useCallback(async () => {
    if (!imageBlob) return
    await shareOrDownload(imageBlob, makeShareFilename(surface, date))
  }, [imageBlob, surface, date])

  const handleSave = useCallback(() => {
    if (!imageBlob) return
    downloadBlob(imageBlob, makeShareFilename(surface, date))
  }, [imageBlob, surface, date])

  const CameraButton = (
    <button
      type="button"
      onClick={open}
      aria-label="Share this page"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 8,
        cursor: 'pointer',
        color: theme.text.muted,
        opacity: 0.55,
        transition: 'opacity 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.95')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.55')}
    >
      <CameraIcon size={20} />
    </button>
  )

  const Capture = mounted ? createPortal(
    <>
      {/* Off-screen capture container — mounted only while overlay is open */}
      {phase !== 'closed' && (
        <div
          ref={offscreenRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          {cardContent}
        </div>
      )}

      <AnimatePresence>
        {phase !== 'closed' && (
          <motion.div
            key="share-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => {
              if (phase === 'preview') close()
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: phase === 'preview' ? `${theme.bg.primary}E6` : `${theme.bg.primary}99`,
              backdropFilter: 'blur(10px) saturate(1.05)',
              WebkitBackdropFilter: 'blur(10px) saturate(1.05)',
              transition: 'background 0.4s ease',
              cursor: phase === 'preview' ? 'pointer' : 'default',
              pointerEvents: phase === 'preview' ? 'auto' : 'none',
            }}
          >
            {/* Butterfly phase */}
            <AnimatePresence>
              {phase === 'butterfly' && !captureError && (
                <motion.button
                  key="butterfly"
                  type="button"
                  initial={{ opacity: 0, x: -360, y: 220, rotate: -25, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    x: [-360, -120, 60, 0, 0],
                    y: [220, 60, -40, 10, 0],
                    rotate: [-25, 12, -8, 4, 0],
                    scale: [0.6, 0.95, 1.05, 1, 1],
                  }}
                  exit={{ opacity: 0, scale: 0.4, y: -80, rotate: 20, transition: { duration: 0.5 } }}
                  transition={{ duration: 1.6, ease: 'easeOut', times: [0, 0.35, 0.6, 0.85, 1] }}
                  onClick={(e) => { e.stopPropagation(); reveal() }}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: imageUrl ? 'pointer' : 'default',
                    pointerEvents: 'auto',
                  }}
                  disabled={!imageUrl}
                  aria-label="Reveal share preview"
                >
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: '-30%',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,200,140,0.55) 0%, rgba(255,180,90,0.18) 40%, transparent 70%)',
                      filter: 'blur(8px)',
                      pointerEvents: 'none',
                    }}
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      animate={{ scaleX: [1, 0.55, 1, 0.55, 1] }}
                      transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'center' }}
                    >
                      <Plant name="butterfly" width={130} saturate={1.05} hueRotate={butterflyHue} opacity={0.98} />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imageUrl ? 0.85 : 0.45 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                    style={{
                      marginTop: 14,
                      textAlign: 'center',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 13,
                      letterSpacing: '0.08em',
                      color: theme.text.muted,
                    }}
                  >
                    {imageUrl ? 'catch it' : 'preparing…'}
                  </motion.div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Capture failure */}
            <AnimatePresence>
              {captureError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                  style={{
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    color: theme.text.muted,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 15,
                    background: 'rgba(0,0,0,0.25)',
                    padding: '14px 22px',
                    borderRadius: 10,
                  }}
                >
                  couldn't snap that page — tap to dismiss
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview phase */}
            <AnimatePresence>
              {phase === 'preview' && imageUrl && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'relative',
                    background: '#fff',
                    borderRadius: 18,
                    padding: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                    maxWidth: 'min(90vw, 540px)',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Share preview"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(92vh - 100px)',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleShare}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: 'none',
                        background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.warm})`,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                      }}
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#f5f0e6',
                        color: '#5a4a3e',
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  ) : null

  return { CameraButton, Capture, isOpen: phase !== 'closed' }
}
```

- [ ] **Step 6.2: Verify it compiles**

```bash
docker compose exec app npx tsc --noEmit 2>&1 | grep -E "share|ShareableCapture" | head -10
```

Expected: no errors. If any prop type mismatch surfaces, fix it before moving on.

- [ ] **Step 6.3: Commit**

```bash
git add src/components/share/ShareableCapture.tsx
git commit -m "feat(share): add useShareableCapture hook with butterfly reveal"
```

---

## Task 7: Wire into desktop diary (`BookSpread.tsx`)

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

The BookSpread already has absolute-positioned chrome on top of the book (top flourish at line 573, ribbon bookmark, etc.). The camera button is the same pattern: an `absolute top-right` chip on top of the book wrapper.

- [ ] **Step 7.1: Add imports near the top of `BookSpread.tsx`**

Find the existing imports (lines ~1-30). Add at the bottom of the import block:

```tsx
import { useShareableCapture } from '@/components/share/ShareableCapture'
import JournalShareCard from '@/components/share/JournalShareCard'
```

- [ ] **Step 7.2: Inside the `BookSpread` component, after `visibleEntry` is determined (search for `const spreadDate` around line 490)**

Add — directly after the `const spreadDate = ...` line:

```tsx
  const { CameraButton: ShareCameraButton, Capture: ShareCapture } = useShareableCapture({
    cardContent: visibleEntry ? <JournalShareCard entry={visibleEntry} /> : null,
    surface: 'diary',
    date: spreadDate,
  })
```

- [ ] **Step 7.3: Mount the camera button on the spread**

Find the existing top flourish block (around line 573 — starts with `{/* Top flourish */}`). Immediately after that closing `</div>`, add:

```tsx
        {/* Share camera — top-right of the spread */}
        {visibleEntry && (
          <div
            className="absolute pointer-events-auto"
            style={{ top: 8, right: 16, zIndex: 30 }}
          >
            {ShareCameraButton}
          </div>
        )}
```

- [ ] **Step 7.4: Mount the Capture portal**

The Capture is portaled to `document.body` so it can live anywhere in the JSX. Find the outermost `return (` of the BookSpread component and place `{ShareCapture}` just before the closing tag of the outermost wrapper. For example, just before the final `</div>` of the component's return:

```tsx
      {ShareCapture}
    </div>
  )
}
```

- [ ] **Step 7.5: Manual verify**

```bash
docker compose restart app && docker compose logs -f app
```

In a browser at http://localhost:3111:
- Open the diary (write page).
- Confirm a small camera icon appears in the top-right of the spread.
- Click it. The diary should fade behind a blurred overlay; a butterfly flies in from bottom-left and lands centered with a glow.
- After ~250ms the caption changes from "preparing…" to "catch it" — click the butterfly.
- A white card scales in showing the captured PNG. Verify the image shows your diary spread (left + right page) inside a theme-tinted backdrop with a theme stamp top-right and "hearth · {date}" footer.
- Click **Share** → on Mac Safari/iOS/Android the native share sheet opens; on desktop Chrome/Firefox/Tauri the file downloads as `hearth-diary-2026-05-09.png`.
- Click **Save** → file downloads.
- Click outside the card → overlay fades out.

If the captured image looks broken (missing photos, blank pages, etc.), do NOT continue to Task 8 — diagnose first. Common issues: web fonts not loaded (bump the `setTimeout(r, 250)` in `ShareableCapture.tsx` to 500), photos behind CORS (already mitigated because `usePhotoSrc` returns blob URLs, but worth checking the Network tab).

- [ ] **Step 7.6: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "feat(share): wire share-capture into desktop diary spread"
```

---

## Task 8: Wire into mobile diary (`MobileJournalEntry.tsx`)

**Files:**
- Modify: `src/components/desk/MobileJournalEntry.tsx`

Same pattern as Task 7 but on the mobile entry layout. The mobile component is a single column rather than a spread — the camera button should sit top-right of whatever container holds the entry's content.

- [ ] **Step 8.1: Add imports**

```tsx
import { useShareableCapture } from '@/components/share/ShareableCapture'
import JournalShareCard from '@/components/share/JournalShareCard'
```

- [ ] **Step 8.2: Inside the component, near other hooks**

Find the JSX root and identify the entry being shown. Mobile uses a single entry at a time — find the variable holding the current entry (likely `entry` or `currentEntry`; if the file uses a different name, substitute it). Add:

```tsx
  const { CameraButton: ShareCameraButton, Capture: ShareCapture } = useShareableCapture({
    cardContent: entry ? <JournalShareCard entry={entry} /> : null,
    surface: 'diary',
    date: entry ? new Date(entry.createdAt) : new Date(),
  })
```

If the mobile component doesn't expose a single `entry` variable, it's because it renders the new-entry spread bound to a draft. In that case, the camera should only appear once an entry exists (`entry?.id`) — guard the button render below.

- [ ] **Step 8.3: Place the camera button and Capture in the JSX**

Find the outer wrapper of the entry's visible area in the JSX (whatever container the entry's text/photos live inside). Place the button absolutely top-right inside that wrapper, and `{ShareCapture}` anywhere in the tree before the outermost return closes:

```tsx
{entry?.id && (
  <div
    style={{ position: 'absolute', top: 12, right: 12, zIndex: 30 }}
    className="pointer-events-auto"
  >
    {ShareCameraButton}
  </div>
)}
{ShareCapture}
```

- [ ] **Step 8.4: Manual verify**

Restart Docker; in a mobile-sized viewport (Chrome DevTools mobile emulation, or actual phone), repeat the verification flow from Step 7.5. Confirm the camera button is positioned reasonably on a small viewport and doesn't overlap the entry's content.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/desk/MobileJournalEntry.tsx
git commit -m "feat(share): wire share-capture into mobile diary entry"
```

---

## Task 9: Wire into memory reveal (`MemoryDiaryView.tsx`)

**Files:**
- Modify: `src/components/constellation/MemoryDiaryView.tsx`

The `MemoryDiaryView` already takes an `entry` and renders a torn-paper diary spread. We add the same camera/Capture pair, with a `subtitle` prop on the share card showing how long ago the memory was. Reuse the existing `formatTimeAgo` from `MemoryModal.tsx` — extract it to a shared place if needed.

- [ ] **Step 9.1: Decide where `formatTimeAgo` lives**

Check if `formatTimeAgo` is already exported from `MemoryModal.tsx`:

```bash
grep -n "formatTimeAgo" src/components/constellation/MemoryModal.tsx
```

If it's not exported, change the existing declaration in `MemoryModal.tsx` from:

```ts
function formatTimeAgo(date: Date): string {
```

to:

```ts
export function formatTimeAgo(date: Date): string {
```

- [ ] **Step 9.2: Add imports to `MemoryDiaryView.tsx`**

```tsx
import { useShareableCapture } from '@/components/share/ShareableCapture'
import JournalShareCard from '@/components/share/JournalShareCard'
import { formatTimeAgo } from './MemoryModal'
```

- [ ] **Step 9.3: Inside `MemoryDiaryView`, after the existing `entryForPages` useMemo block**

Add:

```tsx
  const subtitle = `a memory from ${formatTimeAgo(new Date(entry.createdAt))}`
  const { CameraButton: ShareCameraButton, Capture: ShareCapture } = useShareableCapture({
    cardContent: <JournalShareCard entry={entry} subtitle={subtitle} />,
    surface: 'memory',
    date: new Date(entry.createdAt),
  })
```

- [ ] **Step 9.4: Mount the camera button next to the existing close button**

Find the existing close button (search for `aria-label="Close memory"` — line ~213). Just BEFORE that button, add a sibling:

```tsx
        {/* Share camera — top-right of the spread, left of the close button */}
        <div
          className="absolute -top-12"
          style={{ right: 38, zIndex: 51 }}
        >
          {ShareCameraButton}
        </div>
```

The existing close button is `-right-2`; placing the camera at `right: 38` (≈40px to the left of the close button) avoids overlap.

- [ ] **Step 9.5: Mount the Capture portal**

At the end of the component's JSX — just before the final `</>` of the fragment return — add:

```tsx
      {ShareCapture}
    </>
  )
}
```

- [ ] **Step 9.6: Manual verify**

Restart Docker. In a browser:
- Go to `/memory`.
- Click any star to open a memory.
- Confirm the camera icon appears top-right (next to the × close button) on the memory spread.
- Click it. Butterfly reveal flow → preview shows the memory diary spread inside the share card with the subtitle "a memory from X ago" in the footer.
- Confirm both Share and Save work.
- Confirm the memory closes when expected (clicking outside the share preview should close JUST the share preview — NOT the underlying memory).

If clicking "outside" the share preview also closes the memory, the share overlay's backdrop click is propagating. The overlay already calls `e.stopPropagation()` for the preview phase via `onClick={(e) => e.stopPropagation()}` on the preview card. If the issue persists, also add `e.stopPropagation()` to the overlay's outer onClick when phase is `'preview'`:

```tsx
onClick={(e) => {
  if (phase === 'preview') {
    e.stopPropagation()
    close()
  }
}}
```

- [ ] **Step 9.7: Commit**

```bash
git add src/components/constellation/MemoryDiaryView.tsx src/components/constellation/MemoryModal.tsx
git commit -m "feat(share): wire share-capture into memory reveal"
```

---

## Task 10: Wire into scrapbook (`ScrapbookCanvas.tsx`)

**Files:**
- Modify: `src/components/scrapbook/ScrapbookCanvas.tsx`

The canvas already holds `items` state (line ~152 area). Add the camera button as a sibling of the existing toolbars; mount Capture at the root.

- [ ] **Step 10.1: Add imports**

```tsx
import { useShareableCapture } from '@/components/share/ShareableCapture'
import ScrapbookShareCard from '@/components/share/ScrapbookShareCard'
```

- [ ] **Step 10.2: Inside `ScrapbookCanvas`, near other state**

Add (using the existing `items` and a sensible date — if the board has a `createdAt` or `updatedAt`, use that; otherwise `new Date()`):

```tsx
  const { CameraButton: ShareCameraButton, Capture: ShareCapture } = useShareableCapture({
    cardContent: <ScrapbookShareCard items={items} date={new Date()} />,
    surface: 'scrapbook',
    date: new Date(),
  })
```

If the board has a meaningful date elsewhere (look for `board.createdAt` in props or initial state), use that instead. Otherwise `new Date()` is fine — the date is just a label on the share card.

- [ ] **Step 10.3: Place the camera button on the canvas**

Find the outer `<div ref={canvasRef}>` (line ~398). Wrap it OR add a sibling positioned absolute top-right of the same parent. The simplest path:

Find the parent that contains the `canvasRef` div. Add immediately after the existing toolbar JSX (search for the closing `</...Toolbar>`-style tag):

```tsx
        <div
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 50 }}
          className="pointer-events-auto"
        >
          {ShareCameraButton}
        </div>
```

If the canvas doesn't have a positioned ancestor that makes this work, place the button INSIDE the `canvasRef` div instead, with `style={{ position: 'absolute', top: 8, right: 8, zIndex: 50, pointerEvents: 'auto' }}`.

- [ ] **Step 10.4: Mount the Capture portal**

At the end of the component's return JSX, before the outermost closing tag:

```tsx
      {ShareCapture}
    </div>
  )
}
```

- [ ] **Step 10.5: Manual verify**

Restart Docker. Navigate to a scrapbook board. Confirm:
- Camera icon appears top-right of the canvas.
- Click it → butterfly reveal → preview shows the captured scrapbook page (page surface + all placed items, no toolbars/selection chrome).
- Items render at their saved positions and rotations.
- Share and Save both work.
- Clicking outside the preview only closes the preview, not the canvas.

If items don't render in the captured PNG, check: (a) `CanvasItemWrapper` probably gates rendering on `canvasRef` being mounted — the off-screen container does mount one in `<ScrapbookShareCard>`, so this should work. If it still fails, verify by adding a `console.log` inside `<ScrapbookShareCard>`'s render that confirms `items.length`. (b) If photos are E2EE blob URLs, they should be present at capture time (they're loaded via `usePhotoSrc` which returns same-origin blob URLs that `html-to-image` handles fine).

- [ ] **Step 10.6: Commit**

```bash
git add src/components/scrapbook/ScrapbookCanvas.tsx
git commit -m "feat(share): wire share-capture into scrapbook canvas"
```

---

## Task 11: Cross-theme + cross-surface QA

**Files:** No code changes unless issues are found.

**Goal:** Sanity-check the feature across all 8 themes and all 4 surfaces before declaring done. This catches subtle issues like "the rose theme's pink stamp is unreadable on a pink backdrop".

- [ ] **Step 11.1: Theme matrix**

For each theme — `rivendell`, `hearth`, `rose`, `sage`, `ocean`, `postal`, `linen`, `sunset` — switch to it via the desk settings panel and:
- Capture a diary page → verify backdrop, stamp, footer all read clearly.
- Note any theme where the stamp icon clashes with the backdrop.

If any theme looks visibly bad, document it in this task and either: (a) adjust the backdrop opacity in `ShareCardFrame.tsx`, or (b) ship and let user direct refinement (per Hearth move-fast convention).

- [ ] **Step 11.2: Platform matrix**

- iOS Safari: Share button → share sheet appears with image attached.
- Android Chrome: same.
- Mac Safari: same.
- Mac/Windows desktop Chrome: Share triggers share sheet OR downloads (varies by Chrome version) — both acceptable.
- Firefox desktop: Share downloads (no Web Share API support).
- Tauri desktop app: Share downloads.

For each: confirm Save always downloads regardless of platform.

- [ ] **Step 11.3: Edge cases**

- Empty diary entry (no photos, no song, no doodle, just text): captures fine, share card looks clean.
- Diary entry with all media (photo, song, doodle, mood): captures all of them.
- Memory entry from many years ago: subtitle renders sensibly.
- Empty scrapbook (no items): share card shows the blank-page placeholder OR an empty page with corner tape — either is acceptable.
- Scrapbook with 20+ items: capture still completes within a few seconds.

- [ ] **Step 11.4: Lint pass**

```bash
docker compose exec app npm run lint
```

Fix any lint errors related to the new files or modifications.

- [ ] **Step 11.5: Final commit if any fixes were needed**

```bash
git add -u
git commit -m "fix(share): QA polish across themes/platforms"
```

---

## Out-of-scope reminders

These are explicitly NOT in this plan (per the spec). Do not implement:

- Letters share (already exists separately).
- Sealed/unrevealed memories.
- Editable captions on share images.
- Multi-spread / date-range exports.
- Redaction or blur tools.
- Public share URLs.

If during implementation a sub-decision pulls toward any of these, stop and surface it to the user — don't expand scope.
