'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { useJournalStore, JournalEntry } from '@/store/journal'
import { useEntries, useEntryStats } from '@/hooks/useEntries'
import EntryCard from '@/components/EntryCard'

interface GroupedEntries {
  date: Date
  entries: JournalEntry[]
  avgMood: number
}

export default function TimelinePage() {
  const router = useRouter()
  const { theme } = useThemeStore()
  const { stats, loading: statsLoading } = useEntryStats()

  // Navigation state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [moodFilter, setMoodFilter] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Expanded entry state
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  // Fetch entries for selected month
  const {
    entries,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useEntries({
    month: searchQuery ? undefined : selectedMonth,
    search: searchQuery || undefined,
    mood: moodFilter.length > 0 ? moodFilter : undefined,
    limit: 30,
  })

  // Journal store for editing
  const {
    setCurrentText,
    setCurrentMood,
    setCurrentSong,
    clearDoodleStrokes,
    addDoodleStroke,
  } = useJournalStore()

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  // Group entries by date
  const groupedEntries = useCallback((): GroupedEntries[] => {
    const groups: { [key: string]: JournalEntry[] } = {}

    entries.forEach((entry) => {
      const dateKey = new Date(entry.createdAt).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return Object.entries(groups).map(([dateStr, entries]) => {
      const avgMood = Math.round(
        entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      )
      return {
        date: new Date(dateStr),
        entries,
        avgMood,
      }
    })
  }, [entries])

  // Handle edit entry
  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentText(entry.text)
    setCurrentMood(entry.mood)
    setCurrentSong(entry.song || '')
    clearDoodleStrokes()
    if (entry.doodles && entry.doodles.length > 0) {
      entry.doodles[0]?.strokes.forEach(stroke => addDoodleStroke(stroke))
    }
    sessionStorage.setItem('editingEntryId', entry.id)
    sessionStorage.setItem('editingEntryCreatedAt', entry.createdAt)
    router.push('/write')
  }

  // Format date label
  const formatDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Get available years and months from stats
  const availableYears = stats?.years.map(y => y.year) || [new Date().getFullYear()]
  const availableMonths = stats?.years.find(y => y.year === selectedYear)?.months || []

  // Month names for tabs
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    // Select the most recent month in that year
    const yearData = stats?.years.find(y => y.year === year)
    if (yearData && yearData.months.length > 0) {
      setSelectedMonth(yearData.months[0].month)
    } else {
      setSelectedMonth(`${year}-01`)
    }
  }

  // Handle month change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    setSearchQuery('')
    setSearchInput('')
  }

  // Toggle mood filter
  const toggleMoodFilter = (mood: number) => {
    setMoodFilter(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    )
  }

  const groups = groupedEntries()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with search and filters */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl font-light text-center mb-6"
          style={{ color: theme.text.primary }}
        >
          your story unfolds
        </motion.h1>

        {/* Stats bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center gap-6 mb-6 text-sm"
            style={{ color: theme.text.muted }}
          >
            <span>{stats.totalEntries} entries</span>
            <span>·</span>
            <span>{stats.currentStreak} day streak</span>
            {stats.longestStreak > stats.currentStreak && (
              <>
                <span>·</span>
                <span>best: {stats.longestStreak} days</span>
              </>
            )}
          </motion.div>
        )}

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div
            className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            <span style={{ color: theme.text.muted }}>🔍</span>
            <input
              type="text"
              placeholder="Search your entries..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: theme.text.primary }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearchQuery('')
                }}
                className="text-sm"
                style={{ color: theme.text.muted }}
              >
                ✕
              </button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-full"
            style={{
              background: showFilters || moodFilter.length > 0
                ? `${theme.accent.primary}30`
                : theme.glass.bg,
              border: `1px solid ${showFilters || moodFilter.length > 0 ? theme.accent.primary : theme.glass.border}`,
              color: theme.text.primary,
            }}
          >
            ☰
          </motion.button>
        </div>

        {/* Mood filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div
                className="p-4 rounded-xl"
                style={{ background: theme.glass.bg }}
              >
                <p className="text-xs mb-3" style={{ color: theme.text.muted }}>
                  Filter by mood
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => toggleMoodFilter(mood)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-transform"
                      style={{
                        background: moodFilter.includes(mood)
                          ? `${theme.moods[mood as keyof typeof theme.moods]}50`
                          : `${theme.moods[mood as keyof typeof theme.moods]}20`,
                        border: moodFilter.includes(mood)
                          ? `2px solid ${theme.moods[mood as keyof typeof theme.moods]}`
                          : '2px solid transparent',
                        transform: moodFilter.includes(mood) ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {theme.moodEmojis[mood]}
                    </button>
                  ))}
                  {moodFilter.length > 0 && (
                    <button
                      onClick={() => setMoodFilter([])}
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ color: theme.accent.primary }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Year selector */}
        {!searchQuery && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {availableYears.map((year) => (
              <motion.button
                key={year}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleYearChange(year)}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  background: selectedYear === year
                    ? `${theme.accent.primary}30`
                    : 'transparent',
                  border: selectedYear === year
                    ? `1px solid ${theme.accent.primary}`
                    : `1px solid ${theme.glass.border}`,
                  color: selectedYear === year
                    ? theme.accent.primary
                    : theme.text.muted,
                }}
              >
                {year}
              </motion.button>
            ))}
          </div>
        )}

        {/* Month tabs */}
        {!searchQuery && (
          <div
            className="flex gap-1 p-1 rounded-full overflow-x-auto scrollbar-hide"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            {monthNames.map((name, index) => {
              const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`
              const monthData = availableMonths.find(m => m.month === monthKey)
              const hasEntries = !!monthData
              const isSelected = selectedMonth === monthKey

              return (
                <button
                  key={monthKey}
                  onClick={() => hasEntries && handleMonthChange(monthKey)}
                  className="flex-1 min-w-[48px] py-2 px-1 rounded-full text-xs relative transition-all"
                  style={{
                    background: isSelected ? `${theme.accent.primary}30` : 'transparent',
                    color: hasEntries
                      ? isSelected
                        ? theme.accent.primary
                        : theme.text.primary
                      : theme.text.muted,
                    opacity: hasEntries ? 1 : 0.4,
                    cursor: hasEntries ? 'pointer' : 'default',
                  }}
                >
                  {name}
                  {monthData && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                      style={{
                        background: theme.moods[monthData.avgMood as keyof typeof theme.moods],
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Search results indicator */}
        {searchQuery && (
          <div
            className="text-center py-2 px-4 rounded-full text-sm"
            style={{
              background: `${theme.accent.warm}20`,
              color: theme.text.primary,
            }}
          >
            Searching all entries for "{searchQuery}"
            {entries.length > 0 && ` · ${entries.length} result${entries.length === 1 ? '' : 's'}`}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12" style={{ color: theme.text.muted }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading your entries...
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: theme.text.muted }}>
            {searchQuery
              ? `No entries found for "${searchQuery}"`
              : 'No entries this month. Start writing to see your timeline.'}
          </p>
        </div>
      )}

      {/* Entries list */}
      {!loading && entries.length > 0 && (
        <div className="space-y-8">
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.date.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5 + Math.min(groupIndex * 0.15, 0.6),
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{
                    background: `${theme.moods[group.avgMood as keyof typeof theme.moods]}30`,
                  }}
                >
                  {theme.moodEmojis[group.avgMood]}
                </span>
                <div>
                  <h2 className="text-lg" style={{ color: theme.text.primary }}>
                    {formatDateLabel(group.date)}
                  </h2>
                  <p className="text-xs" style={{ color: theme.text.muted }}>
                    {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>

              {/* Entries for this date */}
              <div
                className="space-y-3 ml-4 border-l-2 pl-6"
                style={{ borderColor: theme.glass.border }}
              >
                {group.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    expanded={expandedEntry === entry.id}
                    onClick={() => setExpandedEntry(
                      expandedEntry === entry.id ? null : entry.id
                    )}
                    onEdit={handleEditEntry}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="py-4">
            {loadingMore && (
              <div className="text-center" style={{ color: theme.text.muted }}>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading more...
                </motion.div>
              </div>
            )}
            {!hasMore && entries.length > 0 && (
              <p className="text-center text-sm" style={{ color: theme.text.muted }}>
                {searchQuery ? 'End of search results' : 'You\'ve reached the beginning'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
