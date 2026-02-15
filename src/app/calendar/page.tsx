'use client'

import { useState, useEffect } from 'react'
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
} from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { JournalEntry } from '@/store/journal'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const { theme } = useThemeStore()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/entries')
      const data = await res.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEntriesForDay = (date: Date): JournalEntry[] => {
    return entries.filter((e) => isSameDay(new Date(e.createdAt), date))
  }

  const getAvgMoodForDay = (date: Date): number | null => {
    const dayEntries = getEntriesForDay(date)
    if (dayEntries.length === 0) return null
    return Math.round(
      dayEntries.reduce((sum, e) => sum + e.mood, 0) / dayEntries.length
    )
  }

  const monthEntries = entries.filter((e) =>
    isSameMonth(new Date(e.createdAt), currentMonth)
  )
  const totalEntries = monthEntries.length
  const avgMood = monthEntries.length > 0
    ? (monthEntries.reduce((sum, e) => sum + e.mood, 0) / monthEntries.length).toFixed(1)
    : '-'
  const daysWritten = new Set(
    monthEntries.map((e) => new Date(e.createdAt).toDateString())
  ).size

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : []

  return (
    <div className="max-w-2xl mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
          }}
        >
          ←
        </motion.button>

        <h1 className="text-2xl font-light" style={{ color: theme.text.primary }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h1>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
          }}
        >
          →
        </motion.button>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-2xl p-4 mb-8"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
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

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const avgMood = getAvgMoodForDay(day)
            const hasEntries = avgMood !== null
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isToday = isSameDay(day, new Date())

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
              </motion.button>
            )
          })}
        </div>
      </div>

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

      {/* Selected Day Entries */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-lg mb-4" style={{ color: theme.text.secondary }}>
            {format(selectedDay, 'EEEE, MMMM d')}
          </h2>

          {selectedDayEntries.length > 0 ? (
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
