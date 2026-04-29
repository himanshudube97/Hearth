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
