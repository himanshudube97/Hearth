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
import { RibbonBookmark } from '@/components/desk/interactive/RibbonBookmark'
import RibbonTag from '@/components/desk/interactive/RibbonTag'
import { JournalEntry } from '@/store/journal'
import { monthLabel, toRoman } from './shelfPalette'
import ShelfMobileBook from './ShelfMobileBook'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false })

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
  const isMobile = useIsMobile()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null)
  const diaryRootRef = useRef<HTMLDivElement>(null)

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

  // Two-finger trackpad swipe = page flip. Mirrors BookSpread on /write:
  // accumulate wheel delta and fire one full library flip past a threshold,
  // then lock for the animation duration so one swipe == one page.
  useEffect(() => {
    const el = diaryRootRef.current
    if (!el) return

    const THRESHOLD = 60
    const FLIP_LOCK_MS = 1300

    let accumulated = 0
    let isFlipping = false

    const handler = (e: WheelEvent) => {
      const dominant =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault()
      if (isFlipping || dominant === 0) return

      accumulated += dominant
      if (Math.abs(accumulated) < THRESHOLD) return

      isFlipping = true
      const pf = flipBookRef.current?.pageFlip?.()
      if (accumulated > 0) pf?.flipNext()
      else pf?.flipPrev()
      accumulated = 0
      setTimeout(() => {
        isFlipping = false
      }, FLIP_LOCK_MS)
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Build the rail's entry list: one representative entry per day (first).
  const railEntries = useMemo(
    () => days.map((day) => ({ id: day[0].id, createdAt: day[0].createdAt })),
    [days],
  )

  // Mobile delegation: < 768px viewports get a vertical single-page reader
  // instead of the fixed 1300×820 flipbook. This must run after all hooks
  // above to satisfy the rules of hooks.
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

  // Empty-month guard: if the user opens a month with zero entries (shouldn't
  // happen via the UI, but defends against direct URL hits), render a stub.
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-30 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
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
      style={{ background: theme.bg.gradient }}
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
        ref={diaryRootRef}
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

          {/* Ribbon bookmark with hangtag dating the visible day —
              same component /write uses so the read view feels continuous. */}
          {currentDay[0] && (
            <RibbonBookmark color={colors.ribbon}>
              <RibbonTag date={new Date(currentDay[0].createdAt)} colors={colors} />
            </RibbonBookmark>
          )}

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
              // Narrow JournalEntry to the local Entry shapes that LeftPage and
              // RightPage expect (song must be string|null, not string|undefined;
              // photo position must be 1|2, not number; doodles only need strokes).
              const entryForLeft = {
                id: entry.id,
                text: entry.text,
                mood: entry.mood,
                song: entry.song ?? null,
                createdAt: entry.createdAt,
              }
              const narrowedPhotos = (entry.photos ?? []).map((p) => ({
                id: p.id,
                url: p.url,
                rotation: p.rotation,
                position: p.position as 1 | 2,
              }))
              const entryForRight = {
                ...entryForLeft,
                photos: narrowedPhotos,
                doodles: entry.doodles?.map((d) => ({ strokes: d.strokes })),
              }
              return [
                <PageWrapper key={`${entry.id}-L`} side="left">
                  <LeftPage entry={entryForLeft} isNewEntry={false} />
                </PageWrapper>,
                <PageWrapper key={`${entry.id}-R`} side="right">
                  <RightPage
                    entry={entryForRight}
                    isNewEntry={false}
                    photos={narrowedPhotos}
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
