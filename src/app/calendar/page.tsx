'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  subYears,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { useEntries, useEntryStats } from '@/hooks/useEntries'

type ViewMode = 'month' | 'year'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const { theme } = useThemeStore()
  const { stats } = useEntryStats()

  // Format month key for API
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  // Fetch entries only for the current month
  const { entries, loading } = useEntries({
    month: monthKey,
    includeDoodles: false, // Don't need doodles for calendar view
  })

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Year view calculations
  const yearStart = startOfYear(currentMonth)
  const yearEnd = endOfYear(currentMonth)
  const yearMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  // Get entries for a specific day
  const getEntriesForDay = (date: Date) => {
    return entries.filter((e) => isSameDay(new Date(e.createdAt), date))
  }

  // Get average mood for a day
  const getAvgMoodForDay = (date: Date): number | null => {
    const dayEntries = getEntriesForDay(date)
    if (dayEntries.length === 0) return null
    return Math.round(
      dayEntries.reduce((sum, e) => sum + e.mood, 0) / dayEntries.length
    )
  }

  // Get month stats from the stats API
  const getMonthStats = (month: Date) => {
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    const yearData = stats?.years.find(y => y.year === month.getFullYear())
    return yearData?.months.find(m => m.month === monthKey)
  }

  // Monthly statistics
  const monthEntries = entries
  const totalEntries = monthEntries.length
  const avgMood = monthEntries.length > 0
    ? (monthEntries.reduce((sum, e) => sum + e.mood, 0) / monthEntries.length).toFixed(1)
    : '-'
  const daysWritten = new Set(
    monthEntries.map((e) => new Date(e.createdAt).toDateString())
  ).size

  // Selected day entries
  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : []

  // Navigate to month from year view
  const handleMonthClick = (month: Date) => {
    setCurrentMonth(month)
    setViewMode('month')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={() => {
            if (viewMode === 'month') {
              setCurrentMonth(subMonths(currentMonth, 1))
            } else {
              setCurrentMonth(subYears(currentMonth, 1))
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
          }}
        >
          ←
        </motion.button>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
            className="text-2xl font-light"
            style={{ color: theme.text.primary }}
          >
            {viewMode === 'month'
              ? format(currentMonth, 'MMMM yyyy')
              : format(currentMonth, 'yyyy')}
          </motion.button>
          <p className="text-xs mt-1" style={{ color: theme.text.muted }}>
            {viewMode === 'month' ? 'tap to see year' : 'tap to see month'}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={() => {
            if (viewMode === 'month') {
              setCurrentMonth(addMonths(currentMonth, 1))
            } else {
              setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
          }}
        >
          →
        </motion.button>
      </div>

      {/* Year View - Heatmap style */}
      {viewMode === 'year' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {yearMonths.map((month) => {
            const monthStats = getMonthStats(month)
            const hasEntries = !!monthStats
            const isCurrentMonth = isSameMonth(month, new Date())

            return (
              <motion.button
                key={month.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMonthClick(month)}
                className="p-4 rounded-2xl text-center relative"
                style={{
                  background: hasEntries
                    ? `${theme.moods[Math.round(monthStats.avgMood) as keyof typeof theme.moods]}20`
                    : theme.glass.bg,
                  border: isCurrentMonth
                    ? `2px solid ${theme.accent.warm}`
                    : `1px solid ${theme.glass.border}`,
                }}
              >
                <p className="text-lg font-light" style={{ color: theme.text.primary }}>
                  {format(month, 'MMM')}
                </p>
                {hasEntries ? (
                  <>
                    <p className="text-2xl mt-1">
                      {theme.moodEmojis[Math.round(monthStats.avgMood)]}
                    </p>
                    <p className="text-xs mt-2" style={{ color: theme.text.muted }}>
                      {monthStats.entryCount} entries
                    </p>
                    <p className="text-xs" style={{ color: theme.text.muted }}>
                      {monthStats.daysWithEntries} days
                    </p>
                  </>
                ) : (
                  <p className="text-xs mt-4" style={{ color: theme.text.muted }}>
                    no entries
                  </p>
                )}
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Month View - Calendar grid */}
      {viewMode === 'month' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 mb-8"
            style={{
              background: theme.glass.bg,
              backdropFilter: `blur(${theme.glass.blur})`,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs py-2"
                  style={{ color: theme.text.muted }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const avgMood = getAvgMoodForDay(day)
                const hasEntries = avgMood !== null
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const isToday = isSameDay(day, new Date())
                const dayEntries = getEntriesForDay(day)

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    onClick={() => setSelectedDay(day)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                    style={{
                      background: isSelected
                        ? `${theme.accent.primary}30`
                        : hasEntries
                        ? `${theme.moods[avgMood as keyof typeof theme.moods]}20`
                        : 'transparent',
                      border: isToday
                        ? `2px solid ${theme.accent.warm}`
                        : isSelected
                        ? `2px solid ${theme.accent.primary}`
                        : '2px solid transparent',
                      opacity: isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    <span className="text-sm" style={{ color: theme.text.primary }}>
                      {format(day, 'd')}
                    </span>
                    {hasEntries && (
                      <span className="text-xs mt-0.5">
                        {theme.moodEmojis[avgMood]}
                      </span>
                    )}
                    {/* Entry count indicator */}
                    {dayEntries.length > 1 && (
                      <span
                        className="absolute top-0.5 right-0.5 text-[8px] w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          background: theme.accent.primary,
                          color: theme.bg.primary,
                        }}
                      >
                        {dayEntries.length}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-4 text-center" style={{ background: theme.glass.bg }}>
              <p className="text-2xl font-light" style={{ color: theme.accent.warm }}>
                {totalEntries}
              </p>
              <p className="text-xs" style={{ color: theme.text.muted }}>entries</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: theme.glass.bg }}>
              <p className="text-2xl font-light" style={{ color: theme.accent.primary }}>
                {daysWritten}
              </p>
              <p className="text-xs" style={{ color: theme.text.muted }}>days written</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: theme.glass.bg }}>
              <p className="text-2xl font-light" style={{ color: theme.text.primary }}>
                {avgMood}
              </p>
              <p className="text-xs" style={{ color: theme.text.muted }}>avg mood</p>
            </div>
          </div>

          {/* Streak info */}
          {stats && (
            <div
              className="rounded-xl p-4 mb-8 flex items-center justify-center gap-8"
              style={{ background: theme.glass.bg }}
            >
              <div className="text-center">
                <p className="text-3xl font-light" style={{ color: theme.accent.warm }}>
                  {stats.currentStreak}
                </p>
                <p className="text-xs" style={{ color: theme.text.muted }}>
                  current streak
                </p>
              </div>
              <div
                className="w-px h-12"
                style={{ background: theme.glass.border }}
              />
              <div className="text-center">
                <p className="text-3xl font-light" style={{ color: theme.accent.primary }}>
                  {stats.longestStreak}
                </p>
                <p className="text-xs" style={{ color: theme.text.muted }}>
                  longest streak
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Day Entries */}
      {selectedDay && viewMode === 'month' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-lg mb-4" style={{ color: theme.text.secondary }}>
            {format(selectedDay, 'EEEE, MMMM d')}
          </h2>

          {loading ? (
            <p className="text-sm" style={{ color: theme.text.muted }}>
              Loading...
            </p>
          ) : selectedDayEntries.length > 0 ? (
            <div className="space-y-4">
              {selectedDayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl"
                  style={{ background: theme.glass.bg }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>{theme.moodEmojis[entry.mood]}</span>
                    <span className="text-sm" style={{ color: theme.text.muted }}>
                      {format(new Date(entry.createdAt), 'h:mm a')}
                    </span>
                    {entry.song && (
                      <span className="text-sm" style={{ color: theme.accent.warm }}>
                        ♫ {entry.song}
                      </span>
                    )}
                  </div>
                  <div
                    className="prose prose-invert max-w-none text-sm"
                    style={{
                      color: theme.text.primary,
                      fontFamily: 'Georgia, Palatino, serif',
                    }}
                    dangerouslySetInnerHTML={{ __html: entry.text }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: theme.text.muted }}>
              No entries on this day.
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
