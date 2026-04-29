// src/components/shelf/ShelfScene.tsx
'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEntries, useEntryStats } from '@/hooks/useEntries'
import { useThemeStore } from '@/store/theme'
import ShelfHeader from './ShelfHeader'
import YearTabs from './YearTabs'
import Shelf, { ShelfMonth } from './Shelf'
import ShelfBookSpread from './ShelfBookSpread'

type Mode = 'shelf' | 'open'

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

export default function ShelfScene() {
  const router = useRouter()
  const search = useSearchParams()
  const { theme } = useThemeStore()

  const { stats, loading: statsLoading } = useEntryStats()

  // Years that actually have entries.
  const yearsWithEntries = useMemo(() => {
    if (!stats) return [] as number[]
    return [...stats.years.map((y) => y.year)].sort((a, b) => a - b)
  }, [stats])

  const fallback = defaultYear(yearsWithEntries)
  const selectedYear = parseYear(search.get('year'), fallback)
  const selectedMonth = parseMonth(search.get('month'))

  // Two states only: browsing the shelf, or reading a month. Tapping a spine
  // jumps directly to reading — no closed-cover intermediate. Removing that
  // middle state simplifies the AnimatePresence/react-pageflip mount sequence
  // that was causing reconciliation crashes.
  const mode: Mode = selectedMonth === null ? 'shelf' : 'open'

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
    (next: { year?: number; month?: number | null }) => {
      const params = new URLSearchParams(search.toString())
      if (next.year !== undefined) params.set('year', String(next.year))
      if (next.month === null) params.delete('month')
      else if (next.month !== undefined) params.set('month', String(next.month + 1))
      // `open` was a v1 flag for the closed-cover intermediate; the spread
      // now opens directly on month click, so strip it from any URL we write.
      params.delete('open')
      const qs = params.toString()
      router.replace(qs ? `/shelf?${qs}` : '/shelf', { scroll: false })
    },
    [router, search],
  )

  const handleYearSelect = useCallback(
    (year: number) => setQuery({ year, month: null }),
    [setQuery],
  )
  const handleMonthClick = useCallback(
    (monthIndex: number) => setQuery({ month: monthIndex }),
    [setQuery],
  )
  const handleClose = useCallback(
    () => setQuery({ month: null }),
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

  // useEntries holds stale data from the prior options across the render
  // immediately after monthKey changes (its effect runs post-commit). Mounting
  // ShelfBookSpread with that stale entry, then unmounting one render later
  // when `loading` flips true, crashes react-pageflip on cleanup. Treat the
  // spread as "ready" only when entries are absent (genuine empty month) or
  // their first item is dated within the current monthKey.
  const spreadReady =
    !entriesLoading &&
    !!monthKey &&
    (monthEntries.length === 0 || monthEntries[0].createdAt.startsWith(monthKey))

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

      {/* Spread overlay. Mounted as a plain conditional (no AnimatePresence) so
          react-pageflip controls its own DOM lifecycle without a parent
          managing exit animations on top of it. The internal motion.div on
          ShelfBookSpread still fades in. */}
      {mode === 'open' && selectedMonth !== null && (
        spreadReady ? (
          <ShelfBookSpread
            year={selectedYear}
            monthIndex={selectedMonth}
            entries={monthEntries}
            onClose={handleClose}
          />
        ) : (
          <div
            className="fixed inset-0 z-30 flex items-center justify-center"
            style={{ background: theme.bg.gradient }}
          >
            <p style={{ color: theme.text.muted, fontFamily: 'Georgia, serif' }}>
              turning to the page…
            </p>
          </div>
        )
      )}
    </div>
  )
}
