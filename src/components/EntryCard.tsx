'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { JournalEntry } from '@/store/journal'
import DoodlePreview from './DoodlePreview'

interface EntryCardProps {
  entry: JournalEntry
  expanded?: boolean
  onClick?: () => void
}

export default function EntryCard({ entry, expanded = false, onClick }: EntryCardProps) {
  const { theme } = useThemeStore()
  const moodEmoji = theme.moodEmojis[entry.mood]
  const moodColor = theme.moods[entry.mood as keyof typeof theme.moods]

  // Strip HTML tags for preview
  const textPreview = entry.text.replace(/<[^>]*>/g, '').slice(0, 100)

  return (
    <motion.div
      className="rounded-2xl p-4 cursor-pointer"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
      }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      layout
      transition={{ layout: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: `${moodColor}30` }}
        >
          {moodEmoji}
        </span>
        <div className="flex-1">
          <span className="text-sm" style={{ color: theme.text.muted }}>
            {format(new Date(entry.createdAt), 'h:mm a')}
          </span>
        </div>
        {entry.song && (
          <span className="text-sm" style={{ color: theme.accent.warm }}>
            ♫
          </span>
        )}
      </div>

      {/* Content */}
      {expanded ? (
        <div
          className="prose prose-invert max-w-none"
          style={{
            fontFamily: 'Georgia, Palatino, serif',
            fontSize: '16px',
            lineHeight: 2,
            color: theme.text.primary,
          }}
          dangerouslySetInnerHTML={{ __html: entry.text }}
        />
      ) : (
        <p
          className="text-sm line-clamp-2"
          style={{ color: theme.text.secondary }}
        >
          {textPreview}{textPreview.length >= 100 ? '...' : ''}
        </p>
      )}

      {/* Doodles */}
      {entry.doodles && entry.doodles.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {entry.doodles.map((doodle) => (
            <DoodlePreview key={doodle.id} strokes={doodle.strokes} />
          ))}
        </div>
      )}

      {/* Song */}
      {entry.song && expanded && (
        <div
          className="mt-4 p-3 rounded-xl"
          style={{ background: `${theme.accent.warm}15` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: theme.accent.warm }}>♫</span>
            <span className="text-sm" style={{ color: theme.text.primary }}>
              {entry.song}
            </span>
          </div>
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs"
              style={{
                background: `${theme.accent.primary}30`,
                color: theme.accent.primary,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
