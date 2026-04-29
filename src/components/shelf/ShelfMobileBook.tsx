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
  // Per-day selection map. Keying by dayIdx avoids needing a reset effect when
  // dayIdx changes (which would trip react-hooks/set-state-in-effect).
  const [selectedEntryIds, setSelectedEntryIds] = useState<Record<number, string>>({})

  const currentDay = days[dayIdx] ?? []
  const currentEntry =
    currentDay.find((e) => e.id === selectedEntryIds[dayIdx]) ??
    currentDay[0] ??
    null

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

  // Narrow JournalEntry to the local Entry shapes that LeftPage and RightPage
  // expect (song must be string|null; photo position must be 1|2; doodles only
  // need strokes). Mirrors the pattern in ShelfBookSpread.tsx.
  const entryForLeft = {
    id: currentEntry.id,
    text: currentEntry.text,
    mood: currentEntry.mood,
    song: currentEntry.song ?? null,
    createdAt: currentEntry.createdAt,
  }
  const narrowedPhotos = (currentEntry.photos ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    rotation: p.rotation,
    position: p.position as 1 | 2,
  }))
  const entryForRight = {
    ...entryForLeft,
    photos: narrowedPhotos,
    doodles: currentEntry.doodles?.map((d) => ({ strokes: d.strokes })),
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
            onEntrySelect={(id) => {
              if (!id) return
              setSelectedEntryIds((prev) => ({ ...prev, [dayIdx]: id }))
            }}
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
            <LeftPage entry={entryForLeft} isNewEntry={false} />
          </div>
          <div className="diary-page diary-page--right p-4">
            <RightPage
              entry={entryForRight}
              isNewEntry={false}
              photos={narrowedPhotos}
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
