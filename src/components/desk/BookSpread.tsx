'use client'

import React, { useCallback, useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes, DiaryTheme } from '@/lib/diaryThemes'
import LeftPage from './LeftPage'
import RightPage from './RightPage'
import PageTurn from './PageTurn'
import { PageCorners } from './decorations/PageCorners'
import { Watermarks } from './decorations/Watermarks'
import { RibbonBookmark } from './interactive/RibbonBookmark'
import { FloatingParticles } from './interactive/FloatingParticles'

interface StrokeData {
  points: number[][]
  color: string
  size: number
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface BookSpreadProps {
  onClose: () => void
}

// Helper to create darker shade of a color
function getDarkerShade(color: string): string {
  // For HSL colors, reduce lightness
  if (color.startsWith('hsl')) {
    return color.replace(/(\d+)%\)$/, (_, l) => `${Math.max(0, parseInt(l) - 6)}%)`)
  }
  // For rgba, darken slightly
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map((p: string) => p.trim())
      return `rgba(${Math.max(0, parseInt(parts[0]) - 20)}, ${Math.max(0, parseInt(parts[1]) - 20)}, ${Math.max(0, parseInt(parts[2]) - 20)}, ${parts[3]})`
    })
  }
  return color
}

// Helper to get line pattern based on diary theme
function getLinePattern(diaryTheme: DiaryTheme): string {
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
      return 'none' // Stars handled by FloatingParticles
    case 'none':
    default:
      return 'none'
  }
}

// Memoized page wrapper for performance
const PageWrapper = memo(function PageWrapper({
  children,
  side,
  diaryTheme,
  isGlass,
  glassSettings,
}: {
  children: React.ReactNode
  side: 'left' | 'right'
  diaryTheme: DiaryTheme
  isGlass: boolean
  glassSettings: { bg: string; blur: string; border: string }
}) {
  const isLeft = side === 'left'
  const paperColor = diaryTheme.pages.background
  const paperColorDark = getDarkerShade(paperColor)
  const linePattern = getLinePattern(diaryTheme)

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        background: isGlass
          ? glassSettings.bg
          : isLeft
          ? `linear-gradient(90deg, ${paperColorDark} 0%, ${paperColor} 100%)`
          : `linear-gradient(90deg, ${paperColor} 0%, ${paperColorDark} 100%)`,
        backdropFilter: isGlass ? `blur(${glassSettings.blur})` : undefined,
        WebkitBackdropFilter: isGlass ? `blur(${glassSettings.blur})` : undefined,
        borderRadius: isLeft ? '4px 0 0 4px' : '0 4px 4px 0',
        boxShadow: isGlass
          ? isLeft
            ? 'inset -4px 0 12px rgba(255,255,255,0.05), -6px 6px 20px rgba(0,0,0,0.2)'
            : 'inset 4px 0 12px rgba(255,255,255,0.05), 6px 6px 20px rgba(0,0,0,0.2)'
          : isLeft
          ? 'inset -8px 0 20px rgba(0,0,0,0.08), -6px 6px 20px rgba(0,0,0,0.25)'
          : 'inset 8px 0 20px rgba(0,0,0,0.05), 6px 6px 20px rgba(0,0,0,0.25)',
        willChange: 'transform',
      }}
    >
      {/* Page texture (only if theme has noise texture) */}
      {diaryTheme.pages.noiseTexture && (
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Line pattern */}
      {linePattern !== 'none' && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '70px',
            left: isLeft ? '50px' : '20px',
            right: isLeft ? '20px' : '50px',
            bottom: '40px',
            backgroundImage: linePattern,
            backgroundSize: diaryTheme.pages.lineStyle === 'dotted' ? '20px 20px' : undefined,
          }}
        />
      )}

      {/* Margin line (left page only, if theme has it) */}
      {isLeft && diaryTheme.pages.hasMarginLine && (
        <div
          className="absolute top-10 bottom-10 w-px pointer-events-none"
          style={{
            left: '45px',
            background: diaryTheme.pages.marginLineColor || 'rgba(200, 120, 100, 0.2)',
          }}
        />
      )}

      {/* Page decorations */}
      <PageCorners
        style={diaryTheme.pages.cornerStyle || 'none'}
        color={diaryTheme.pages.mutedColor}
      />
      <Watermarks
        style={diaryTheme.pages.watermark || 'none'}
        color={diaryTheme.pages.textColor}
      />

      {/* Floating particles */}
      {diaryTheme.interactive.floatingParticles !== 'none' && (
        <FloatingParticles
          type={diaryTheme.interactive.floatingParticles}
          color={diaryTheme.pages.mutedColor}
        />
      )}

      {/* Page content */}
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

export default function BookSpread({ onClose }: BookSpreadProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const {
    currentSpread,
    totalSpreads,
    turnPage,
    isPageTurning,
    turnDirection,
    finishPageTurn,
    setTotalSpreads,
    goToSpread,
  } = useDeskStore()

  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  // Paper colors from diary theme
  const paperColor = diaryTheme.pages.background
  const paperColorDark = getDarkerShade(paperColor)

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=100')
      if (res.ok) {
        const data = await res.json()
        const fetchedEntries = data.entries || []
        setEntries(fetchedEntries)
        // Total spreads = number of entries + 1 (for new entry page)
        setTotalSpreads(fetchedEntries.length)
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

  // Once entries are loaded, go to the latest spread
  useEffect(() => {
    if (!loading && entries.length >= 0) {
      // Go to the "new entry" spread (after all existing entries)
      goToSpread(entries.length)
    }
  }, [loading, entries.length, goToSpread])

  const handlePageTurnComplete = useCallback(() => {
    finishPageTurn()
  }, [finishPageTurn])

  const handlePrevPage = useCallback(() => {
    if (currentSpread > 0 && !isPageTurning) {
      turnPage('backward')
    }
  }, [currentSpread, isPageTurning, turnPage])

  const handleNextPage = useCallback(() => {
    if (currentSpread < totalSpreads && !isPageTurning) {
      turnPage('forward')
    }
  }, [currentSpread, totalSpreads, isPageTurning, turnPage])

  // Called when an entry is saved
  const handleSaveComplete = useCallback(() => {
    fetchEntries()
  }, [fetchEntries])

  // Get the entry for current spread (null if it's the "new entry" spread)
  const currentEntry = currentSpread < entries.length ? entries[entries.length - 1 - currentSpread] : null
  const isNewEntrySpread = currentSpread === entries.length

  // Get date for the spread
  const spreadDate = currentEntry
    ? new Date(currentEntry.createdAt)
    : new Date()

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
        className="absolute -top-14 right-0 z-20 px-5 py-2.5 rounded-full text-sm font-medium"
        style={{
          background: theme.glass.bg,
          color: theme.text.secondary,
          border: `1px solid ${theme.glass.border}`,
          backdropFilter: `blur(${theme.glass.blur})`,
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Close Book
      </motion.button>

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
        {isNewEntrySpread ? 'New Entry' : `Entry ${entries.length - currentSpread} of ${entries.length}`}
      </motion.div>

      {/* Book container - LARGER SIZE for full-page experience */}
      <motion.div
        className="relative flex"
        style={{
          width: '1100px',
          height: '720px',
          transformStyle: 'preserve-3d',
        }}
        initial={{ rotateX: 5, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ribbon bookmark */}
        {diaryTheme.interactive.ribbon.enabled && (
          <RibbonBookmark color={diaryTheme.interactive.ribbon.color} />
        )}

        {/* Date header spanning both pages */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 px-6 py-1.5 rounded-b-lg"
          style={{
            background: currentDiaryTheme === 'glass' ? theme.glass.bg : paperColor,
            backdropFilter: currentDiaryTheme === 'glass' ? `blur(${theme.glass.blur})` : undefined,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: currentDiaryTheme === 'glass' ? `1px solid ${theme.glass.border}` : undefined,
          }}
        >
          <span
            className="text-sm font-serif"
            style={{ color: currentDiaryTheme === 'glass' ? theme.text.primary : diaryTheme.pages.textColor }}
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
        <PageWrapper side="left" diaryTheme={diaryTheme} isGlass={currentDiaryTheme === 'glass'} glassSettings={theme.glass}>
          <LeftPage
            entry={currentEntry}
            isNewEntry={isNewEntrySpread}
            spreadDate={spreadDate}
          />
        </PageWrapper>

        {/* Center binding */}
        <div
          className="w-6 relative z-10 flex-shrink-0"
          style={{
            background: currentDiaryTheme === 'glass'
              ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)'
              : `linear-gradient(90deg, ${paperColorDark} 0%, ${getDarkerShade(paperColorDark)} 20%, ${getDarkerShade(getDarkerShade(paperColorDark))} 50%, ${getDarkerShade(paperColorDark)} 80%, ${paperColorDark} 100%)`,
            boxShadow: currentDiaryTheme === 'glass'
              ? 'inset 2px 0 4px rgba(255,255,255,0.1), inset -2px 0 4px rgba(255,255,255,0.1)'
              : 'inset 3px 0 6px rgba(0,0,0,0.15), inset -3px 0 6px rgba(0,0,0,0.15)',
          }}
        >
          {/* Binding stitches - hide for glass */}
          {currentDiaryTheme !== 'glass' && [...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-3 rounded-full"
              style={{
                top: `${8 + i * 9}%`,
                background: 'rgba(139, 90, 43, 0.3)',
              }}
            />
          ))}
        </div>

        {/* Right page */}
        <PageWrapper side="right" diaryTheme={diaryTheme} isGlass={currentDiaryTheme === 'glass'} glassSettings={theme.glass}>
          <RightPage
            entry={currentEntry}
            isNewEntry={isNewEntrySpread}
            onSaveComplete={handleSaveComplete}
          />
        </PageWrapper>

        {/* LEFT EDGE - Click to go to newer entries (or stay if at latest) */}
        {currentSpread > 0 && (
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
              style={{ color: currentDiaryTheme === 'glass' ? theme.text.muted : diaryTheme.pages.mutedColor }}
              animate={{ x: [-4, 4, -4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ‹
            </motion.div>
          </motion.div>
        )}

        {/* RIGHT EDGE - Click to go to older entries */}
        {currentSpread < entries.length && (
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
              style={{ color: currentDiaryTheme === 'glass' ? theme.text.muted : diaryTheme.pages.mutedColor }}
              animate={{ x: [4, -4, 4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ›
            </motion.div>
          </motion.div>
        )}

        {/* Stack of pages hints */}
        {currentSpread > 0 && (
          <div
            className="absolute top-3 bottom-3 left-0 w-2 pointer-events-none z-20"
            style={{
              background: currentDiaryTheme === 'glass'
                ? 'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)'
                : `repeating-linear-gradient(180deg, ${paperColor} 0px, ${paperColor} 2px, ${paperColorDark} 2px, ${paperColorDark} 4px)`,
              borderRadius: '2px 0 0 2px',
            }}
          />
        )}
        {currentSpread < entries.length && (
          <div
            className="absolute top-3 bottom-3 right-0 w-2 pointer-events-none z-20"
            style={{
              background: currentDiaryTheme === 'glass'
                ? 'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)'
                : `repeating-linear-gradient(180deg, ${paperColor} 0px, ${paperColor} 2px, ${paperColorDark} 2px, ${paperColorDark} 4px)`,
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
            >
              <div />
            </PageTurn>
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
