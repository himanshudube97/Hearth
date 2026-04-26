'use client'

import React, { useCallback, useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { getGlassDiaryColors, GlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from './LeftPage'
import RightPage from './RightPage'
import PageTurn from './PageTurn'
import EntrySelector from './EntrySelector'
import { RibbonBookmark } from './interactive/RibbonBookmark'
import { StrokeData, useJournalStore } from '@/store/journal'

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

// Memoized page wrapper for performance
const PageWrapper = memo(function PageWrapper({
  children,
  side,
  colors,
}: {
  children: React.ReactNode
  side: 'left' | 'right'
  colors: GlassDiaryColors
}) {
  const isLeft = side === 'left'

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        borderRadius: isLeft ? '6px 0 0 6px' : '0 6px 6px 0',
        boxShadow: isLeft
          ? 'inset -4px 0 12px rgba(255,255,255,0.05), -6px 6px 20px rgba(0,0,0,0.25)'
          : 'inset 4px 0 12px rgba(255,255,255,0.05), 6px 6px 20px rgba(0,0,0,0.25)',
        willChange: 'transform',
      }}
    >
      {/* Faint warm ruled lines */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '70px',
          left: isLeft ? '50px' : '20px',
          right: isLeft ? '20px' : '50px',
          bottom: '40px',
          backgroundImage: `repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent 31px,
            ${colors.ruledLine} 31px,
            ${colors.ruledLine} 32px
          )`,
        }}
      />

      <div
        className="relative h-full overflow-hidden z-10"
        style={{
          padding: isLeft ? '20px 20px 20px 50px' : '20px 50px 20px 20px',
        }}
      >
        {children}
      </div>
    </div>
  )
})

export default function BookSpread() {
  const { theme } = useThemeStore()
  const { setCurrentSong } = useJournalStore()
  const colors = getGlassDiaryColors(theme)
  const {
    currentSpread: globalCurrentSpread,
    totalSpreads,
    turnPage,
    isPageTurning,
    turnDirection,
    finishPageTurn,
    setTotalSpreads,
    goToSpread,
  } = useDeskStore()

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
        setTotalSpreads(fetchedEntries.length)

        // Filter today's entries
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

  useEffect(() => {
    if (!loading && entries.length >= 0) {
      goToSpread(entries.length)
    }
  }, [loading, entries.length, goToSpread])

  const handlePageTurnComplete = useCallback(() => {
    finishPageTurn()
  }, [finishPageTurn])

  const handlePrevPage = useCallback(() => {
    if (globalCurrentSpread > 0 && !isPageTurning) {
      turnPage('backward')
    }
  }, [globalCurrentSpread, isPageTurning, turnPage])

  const handleNextPage = useCallback(() => {
    if (globalCurrentSpread < totalSpreads && !isPageTurning) {
      turnPage('forward')
    }
  }, [globalCurrentSpread, totalSpreads, isPageTurning, turnPage])

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

  // Handle entry selection
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

  const handleNewEntry = useCallback(() => {
    setCurrentEntryId(null)
    setLeftPageText('')
    setRightPageText('')
    setPendingPhotos([])
    goToSpread(entries.length)
  }, [entries.length, goToSpread])

  // Handle photo add
  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1 ? -8 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 6)
    const newPhoto: Photo = {
      url: dataUrl,
      position,
      rotation,
    }
    setPendingPhotos(prev => [...prev.filter(p => p.position !== position), newPhoto])
  }, [])

  // Get the current entry
  const currentEntry = currentEntryId
    ? entries.find(e => e.id === currentEntryId)
    : (globalCurrentSpread < entries.length ? entries[entries.length - 1 - globalCurrentSpread] : null)

  const isNewEntrySpread = currentEntryId === null && globalCurrentSpread === entries.length

  // Get date for the spread
  const spreadDate = currentEntry
    ? new Date(currentEntry.createdAt)
    : new Date()

  // Get photos
  const currentPhotos = [
    ...(currentEntry?.photos || []),
    ...pendingPhotos,
  ]

  return (
    <div
      className="relative"
      style={{
        perspective: '2500px',
        perspectiveOrigin: 'center center',
      }}
    >

      {/* Entry selector for multiple entries per day */}
      {(todayEntries.length > 0 || isNewEntrySpread) && (
        <motion.div
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <EntrySelector
            entries={todayEntries}
            currentEntryId={currentEntryId}
            onEntrySelect={handleEntrySelect}
            onNewEntry={handleNewEntry}
          />
        </motion.div>
      )}

      {/* Page indicator */}
      <motion.div
        className="absolute -top-14 left-0 z-20 px-4 py-2 rounded-full text-xs"
        style={{
          background: theme.glass.bg,
          color: theme.text.muted,
          border: `1px solid ${theme.glass.border}`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isNewEntrySpread ? 'New Entry' : `Entry ${entries.length - globalCurrentSpread} of ${entries.length}`}
      </motion.div>

      {/* Book container */}
      <motion.div
        className="relative flex"
        style={{
          width: '1300px',
          height: '820px',
          transformStyle: 'preserve-3d',
        }}
        initial={{ rotateX: 5, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ribbon bookmark */}
        <RibbonBookmark color={colors.ribbon} />

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

        {/* Left page */}
        <PageWrapper side="left" colors={colors}>
          <LeftPage
            entry={currentEntry || null}
            isNewEntry={isNewEntrySpread}
            text={leftPageText}
            onTextChange={setLeftPageText}
            onPageFull={handleLeftPageFull}
            onNavigateRight={handleNavigateRight}
            focusTrigger={leftTextareaFocusTrigger}
          />
        </PageWrapper>

        {/* Center binding */}
        <div
          className="w-6 relative z-10 flex-shrink-0"
          style={{
            background: colors.spineGradient,
            boxShadow: 'inset 2px 0 4px rgba(255,255,255,0.1), inset -2px 0 4px rgba(255,255,255,0.1)',
          }}
        />

        {/* Right page */}
        <PageWrapper side="right" colors={colors}>
          <RightPage
            entry={currentEntry || null}
            isNewEntry={isNewEntrySpread}
            photos={currentPhotos}
            onPhotoAdd={handlePhotoAdd}
            onSaveComplete={handleSaveComplete}
            leftPageText={leftPageText}
            text={rightPageText}
            onTextChange={setRightPageText}
            focusTrigger={rightTextareaFocusTrigger}
            onNavigateLeft={handleNavigateLeft}
          />
        </PageWrapper>

        {/* Left edge - Previous entry */}
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

        {/* Right edge - Next entry */}
        {globalCurrentSpread < totalSpreads && !isPageTurning && (
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

        {/* Stack of pages hints */}
        {globalCurrentSpread > 0 && (
          <div
            className="absolute top-3 bottom-3 left-0 w-2 pointer-events-none z-20"
            style={{
              background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
              borderRadius: '2px 0 0 2px',
            }}
          />
        )}
        {globalCurrentSpread < entries.length && (
          <div
            className="absolute top-3 bottom-3 right-0 w-2 pointer-events-none z-20"
            style={{
              background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        )}

        {/* Page turn animation overlay */}
        <AnimatePresence>
          {isPageTurning && turnDirection && (
            <PageTurn
              direction={turnDirection}
              onComplete={handlePageTurnComplete}
            />
          )}
        </AnimatePresence>

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
