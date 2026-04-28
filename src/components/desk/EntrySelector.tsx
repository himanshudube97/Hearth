'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface Entry {
  id: string
  mood?: number
  createdAt: string
}

interface EntrySelectorProps {
  entries: Entry[]
  currentEntryId: string | null
  onEntrySelect: (entryId: string | null) => void
  className?: string
}

const EntrySelector = memo(function EntrySelector({
  entries,
  currentEntryId,
  onEntrySelect,
  className = '',
}: EntrySelectorProps) {
  const { theme } = useThemeStore()

  const textColor = theme.text.primary
  const mutedColor = theme.text.muted
  const bgColor = theme.glass.bg

  // Sort entries by creation time (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Entry dots */}
      {sortedEntries.map((entry, index) => {
        const isActive = entry.id === currentEntryId
        const entryNumber = sortedEntries.length - index
        const moodColor = entry.mood !== undefined
          ? theme.moods[entry.mood as keyof typeof theme.moods]
          : mutedColor

        return (
          <motion.button
            key={entry.id}
            onClick={() => onEntrySelect(entry.id)}
            className="relative group"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={`Entry ${entryNumber} - ${new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
          >
            {/* Entry dot with mood color */}
            <motion.div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all"
              style={{
                background: isActive ? moodColor : 'transparent',
                border: `2px solid ${isActive ? moodColor : mutedColor}`,
                color: isActive ? 'white' : mutedColor,
                opacity: isActive ? 1 : 0.6,
              }}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
            >
              {entryNumber}
            </motion.div>

            {/* Hover tooltip */}
            <motion.div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{
                background: bgColor,
                color: textColor,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </motion.div>
          </motion.button>
        )
      })}

    </div>
  )
})

export default EntrySelector
