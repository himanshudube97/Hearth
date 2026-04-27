'use client'

import React, { useCallback, useEffect, useRef, useState, memo, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { getGlassDiaryColors, GlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from './LeftPage'
import RightPage from './RightPage'
import EntrySelector from './EntrySelector'
import { RibbonBookmark } from './interactive/RibbonBookmark'
import ThemeOrnament from './decorations/ThemeOrnament'
import WhisperFooter from './WhisperFooter'
import { StrokeData, useJournalStore } from '@/store/journal'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false })

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

// Fixed page dimensions for the flipbook
const PAGE_WIDTH = 650
const PAGE_HEIGHT = 820

// Pages need to read as solid paper during the flip, otherwise the curl
// shadow washes through and adjacent pages bleed into each other. Stack the
// theme's translucent tint over an opaque dark base so the resting look is
// preserved but each face is fully opaque.
const OPAQUE_PAPER_BASE = 'rgba(15, 20, 18, 1)'

const PageWrapper = memo(
  forwardRef<HTMLDivElement, {
    children: React.ReactNode
    side: 'left' | 'right'
    colors: GlassDiaryColors
  }>(function PageWrapper({ children, side, colors }, ref) {
    const isLeft = side === 'left'
    return (
      <div
        ref={ref}
        style={{
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
          backgroundColor: OPAQUE_PAPER_BASE,
          backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg})`,
          border: `1px solid ${colors.pageBorder}`,
          borderRadius: isLeft ? '6px 0 0 6px' : '0 6px 6px 0',
          boxShadow: isLeft
            ? 'inset -4px 0 12px rgba(255,255,255,0.05), -6px 6px 20px rgba(0,0,0,0.25)'
            : 'inset 4px 0 12px rgba(255,255,255,0.05), 6px 6px 20px rgba(0,0,0,0.25)',
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
  })
)

export default function BookSpread() {
  const { theme, themeName } = useThemeStore()
  const { setCurrentSong } = useJournalStore()
  const colors = getGlassDiaryColors(theme)
  const {
    currentSpread: globalCurrentSpread,
    totalSpreads,
    setTotalSpreads,
    goToSpread,
  } = useDeskStore()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null)

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [leftPageText, setLeftPageText] = useState('')
  const [rightPageText, setRightPageText] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [showSavedOverlay, setShowSavedOverlay] = useState(false)
  const [rightTextareaFocusTrigger, setRightTextareaFocusTrigger] = useState(0)
  const [leftTextareaFocusTrigger, setLeftTextareaFocusTrigger] = useState(0)

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=50')
      if (res.ok) {
        const data = await res.json()
        const fetchedEntries = data.entries || []
        setEntries(fetchedEntries)
        // N existing spreads + 1 new-entry spread
        setTotalSpreads(fetchedEntries.length + 1)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const todaysEntries = fetchedEntries.filter((e: Entry) => {
          const entryDate = new Date(e.createdAt)
          return entryDate >= today && entryDate <= todayEnd
        })
        setTodayEntries(todaysEntries)
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }, [setTotalSpreads])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // After loading, jump to the new-entry spread (last)
  useEffect(() => {
    if (!loading) {
      goToSpread(entries.length)
    }
  }, [loading, entries.length, goToSpread])

  // Library's onFlip event: convert page index -> spread index and sync store
  const handleFlip = useCallback((e: { data: number }) => {
    goToSpread(Math.floor(e.data / 2))
  }, [goToSpread])

  // Programmatic external goToSpread() calls (e.g. EntrySelector clicks)
  // need to be pushed back to the library so its visible page matches.
  useEffect(() => {
    const pageFlip = flipBookRef.current?.pageFlip?.()
    if (!pageFlip) return
    const targetPage = globalCurrentSpread * 2
    if (pageFlip.getCurrentPageIndex?.() !== targetPage) {
      pageFlip.turnToPage?.(targetPage)
    }
  }, [globalCurrentSpread])

  const handlePrevPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev()
  }, [])

  const handleNextPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext()
  }, [])

  const handleLeftPageFull = useCallback((overflowText: string) => {
    if (overflowText) {
      setRightPageText(prev => overflowText + prev)
    }
    setRightTextareaFocusTrigger(prev => prev + 1)
  }, [])

  const handleNavigateRight = useCallback(() => {
    setRightTextareaFocusTrigger(prev => prev + 1)
  }, [])

  const handleNavigateLeft = useCallback(() => {
    setLeftTextareaFocusTrigger(prev => prev + 1)
  }, [])

  const handleSaveComplete = useCallback(() => {
    setShowSavedOverlay(true)
    setLeftPageText('')
    setRightPageText('')
    setPendingPhotos([])
    setCurrentSong('')

    fetchEntries()
    setTimeout(() => {
      setShowSavedOverlay(false)
    }, 2000)
  }, [fetchEntries, setCurrentSong])

  const handleEntrySelect = useCallback((entryId: string | null) => {
    setCurrentEntryId(entryId)
    setLeftPageText('')
    setRightPageText('')
    setPendingPhotos([])
    if (entryId) {
      const idx = entries.findIndex(e => e.id === entryId)
      if (idx >= 0) {
        // Reverse-chronological list -> spread index of newest = 0
        goToSpread(idx)
      }
    }
  }, [entries, goToSpread])

  const handleNewEntry = useCallback(() => {
    setCurrentEntryId(null)
    setLeftPageText('')
    setRightPageText('')
    setPendingPhotos([])
    goToSpread(entries.length)
  }, [entries.length, goToSpread])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1 ? -8 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 6)
    const newPhoto: Photo = {
      url: dataUrl,
      position,
      rotation,
    }
    setPendingPhotos(prev => [...prev.filter(p => p.position !== position), newPhoto])
  }, [])

  const isNewEntrySpread = globalCurrentSpread === entries.length

  // Floating date pill: derive from the spread currently visible
  const visibleEntry = !isNewEntrySpread && globalCurrentSpread < entries.length
    ? entries[globalCurrentSpread]
    : null
  const spreadDate = visibleEntry ? new Date(visibleEntry.createdAt) : new Date()

  return (
    <div
      className="relative"
      style={{
        perspective: '2500px',
        perspectiveOrigin: 'center center',
      }}
    >
      {/* Top controls */}
      <motion.div
        className="absolute -top-14 left-0 z-20 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div
          className="px-4 py-2 rounded-full text-xs"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {isNewEntrySpread
            ? 'New Entry'
            : `Entry ${entries.length - globalCurrentSpread} of ${entries.length}`}
        </div>

        {(todayEntries.length > 0 || isNewEntrySpread) && (
          <EntrySelector
            entries={todayEntries}
            currentEntryId={currentEntryId}
            onEntrySelect={handleEntrySelect}
            onNewEntry={handleNewEntry}
          />
        )}
      </motion.div>

      {/* Book wrapper. Sized for the spread (1300x820), relative so chrome
          can be positioned absolutely on top. */}
      <motion.div
        className="relative"
        style={{
          width: `${PAGE_WIDTH * 2}px`,
          height: `${PAGE_HEIGHT}px`,
          transformStyle: 'preserve-3d',
        }}
        initial={{ rotateX: 5, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ribbon bookmark */}
        <RibbonBookmark color={colors.ribbon} />

        {/* Whisper + ornaments below the spread */}
        <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-4 pointer-events-none z-10">
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} flip />
          <WhisperFooter color={colors.prompt} />
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} />
        </div>

        {/* Date header */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 px-6 py-1.5 rounded-b-lg"
          style={{
            background: colors.pageBg,
            backdropFilter: `blur(${colors.pageBlur})`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `1px solid ${colors.pageBorder}`,
          }}
        >
          <span
            className="text-sm font-serif"
            style={{ color: colors.date }}
          >
            {spreadDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Flipbook (only after entries are loaded so startPage is correct) */}
        {!loading && (
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
            flippingTime={650}
            useMouseEvents={true}
            mobileScrollSupport={false}
            showCover={false}
            startPage={entries.length * 2}
            onFlip={handleFlip}
            className=""
            style={{}}
            startZIndex={0}
            autoSize={false}
            clickEventForward={true}
            usePortrait={false}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={true}
          >
            {/* Existing entries: oldest first so the newest sits next to the
                new-entry spread at the back of the book. Reverse-chronological
                navigation: ‹ goes to older entries, › advances toward the new-entry. */}
            {[...entries].reverse().flatMap((entry) => [
              <PageWrapper key={`${entry.id}-L`} side="left" colors={colors}>
                <LeftPage
                  entry={entry}
                  isNewEntry={false}
                />
              </PageWrapper>,
              <PageWrapper key={`${entry.id}-R`} side="right" colors={colors}>
                <RightPage
                  entry={entry}
                  isNewEntry={false}
                  photos={entry.photos || []}
                />
              </PageWrapper>,
            ])}

            {/* New-entry spread (always last) */}
            <PageWrapper key="new-L" side="left" colors={colors}>
              <LeftPage
                entry={null}
                isNewEntry={true}
                text={leftPageText}
                onTextChange={setLeftPageText}
                onPageFull={handleLeftPageFull}
                onNavigateRight={handleNavigateRight}
                focusTrigger={leftTextareaFocusTrigger}
              />
            </PageWrapper>
            <PageWrapper key="new-R" side="right" colors={colors}>
              <RightPage
                entry={null}
                isNewEntry={true}
                photos={pendingPhotos}
                onPhotoAdd={handlePhotoAdd}
                onSaveComplete={handleSaveComplete}
                leftPageText={leftPageText}
                text={rightPageText}
                onTextChange={setRightPageText}
                focusTrigger={rightTextareaFocusTrigger}
                onNavigateLeft={handleNavigateLeft}
              />
            </PageWrapper>
          </HTMLFlipBook>
        )}

        {/* Left edge clicker */}
        {globalCurrentSpread > 0 && (
          <motion.div
            onClick={handlePrevPage}
            className="absolute left-0 top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
            }}
            whileHover={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
            }}
          >
            <motion.div
              className="text-3xl"
              style={{ color: theme.text.muted }}
              animate={{ x: [-4, 4, -4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ‹
            </motion.div>
          </motion.div>
        )}

        {/* Right edge clicker */}
        {globalCurrentSpread < totalSpreads - 1 && (
          <motion.div
            onClick={handleNextPage}
            className="absolute right-0 top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
            style={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
            }}
            whileHover={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
            }}
          >
            <motion.div
              className="text-3xl"
              style={{ color: theme.text.muted }}
              animate={{ x: [4, -4, 4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ›
            </motion.div>
          </motion.div>
        )}

        {/* Save success overlay */}
        <AnimatePresence>
          {showSavedOverlay && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(0, 0, 0, 0.15)',
                borderRadius: '4px',
                backdropFilter: 'blur(2px)',
              }}
            >
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: theme.accent.warm,
                    boxShadow: `0 4px 20px ${theme.accent.warm}40`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                >
                  <motion.span
                    className="text-2xl text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✓
                  </motion.span>
                </motion.div>
                <motion.span
                  className="text-lg font-serif font-medium"
                  style={{ color: theme.text.primary }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Entry Saved
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Book shadow */}
      <div
        className="absolute -bottom-10 left-16 right-16 h-16 rounded-[50%]"
        style={{
          background: 'rgba(0,0,0,0.3)',
          filter: 'blur(24px)',
        }}
      />
    </div>
  )
}
