'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { JournalEntry } from '@/store/journal'
import DoodlePreview from './DoodlePreview'
import SongEmbed from './SongEmbed'

interface EntryCardProps {
  entry: JournalEntry
  expanded?: boolean
  onClick?: () => void
  onEdit?: (entry: JournalEntry) => void
}

export default function EntryCard({ entry, expanded = false, onClick, onEdit }: EntryCardProps) {
  const { theme } = useThemeStore()
  const moodEmoji = theme.moodEmojis[entry.mood]
  const moodColor = theme.moods[entry.mood as keyof typeof theme.moods]

  // Check if this is a sealed letter
  const isLetter = entry.entryType === 'letter' && entry.isSealed
  const isLetterToFriend = isLetter && !!entry.recipientEmail
  const isLetterToSelf = isLetter && !entry.recipientEmail

  // Strip HTML tags for preview
  const textPreview = entry.text.replace(/<[^>]*>/g, '').slice(0, 100)

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(entry)
  }

  // Render letter card (sealed, compact)
  if (isLetter) {
    const isUnlocked = entry.unlockDate && new Date(entry.unlockDate) <= new Date()

    return (
      <motion.div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
        layout
        transition={{ layout: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }}
      >
        <span className="text-lg">✉️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: theme.text.primary }}>
            {isLetterToFriend ? 'Letter to friend' : 'Letter to self'}
          </p>
          {entry.unlockDate && (
            <p className="text-xs" style={{ color: theme.text.muted }}>
              {isUnlocked
                ? isLetterToFriend ? 'Delivered' : 'Ready to open'
                : `${isLetterToFriend ? 'Delivers' : 'Opens'} ${format(new Date(entry.unlockDate), 'MMM d, yyyy')}`
              }
            </p>
          )}
        </div>
        <span className="text-sm" style={{ color: theme.text.muted }}>
          {isUnlocked ? '✨' : '🔒'}
        </span>
      </motion.div>
    )
  }

  // Regular entry card
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
        {onEdit && (
          <button
            onClick={handleEdit}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm opacity-50 hover:opacity-100 transition-opacity"
            style={{
              background: theme.glass.bg,
              color: theme.text.muted,
            }}
            title="Edit entry"
          >
            ✎
          </button>
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
        <div className="mt-4">
          <SongEmbed url={entry.song} compact />
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
