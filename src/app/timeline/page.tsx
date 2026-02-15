'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, isToday, isYesterday } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { JournalEntry } from '@/store/journal'
import EntryCard from '@/components/EntryCard'

interface GroupedEntries {
  date: Date
  entries: JournalEntry[]
  avgMood: number
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([])
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
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
      groupByDate(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupByDate = (entries: JournalEntry[]) => {
    const groups: { [key: string]: JournalEntry[] } = {}

    entries.forEach((entry) => {
      const dateKey = new Date(entry.createdAt).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    const grouped: GroupedEntries[] = Object.entries(groups).map(([dateStr, entries]) => {
      const avgMood = Math.round(
        entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      )
      return {
        date: new Date(dateStr),
        entries,
        avgMood,
      }
    })

    setGroupedEntries(grouped)
  }

  const formatDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12" style={{ color: theme.text.muted }}>
          Loading your entries...
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <p style={{ color: theme.text.muted }}>
            No entries yet. Start writing to see your timeline.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-2xl font-light text-center mb-8"
        style={{ color: theme.text.primary }}
      >
        your story unfolds
      </motion.h1>

      <div className="space-y-8">
        {groupedEntries.map((group, groupIndex) => (
          <motion.div
            key={group.date.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: groupIndex * 0.15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
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

            <div className="space-y-3 ml-4 border-l-2 pl-6" style={{ borderColor: theme.glass.border }}>
              {group.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedEntry === entry.id}
                  onClick={() => setExpandedEntry(
                    expandedEntry === entry.id ? null : entry.id
                  )}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
