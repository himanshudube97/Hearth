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

  // Render letter card (sealed, no content shown)
  if (isLetter) {
    return (
      <motion.div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${theme.glass.bg} 0%, ${moodColor}10 100%)`,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${moodColor}30`,
        }}
        layout
        transition={{ layout: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }}
      >
        {/* Letter Header */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ background: `${moodColor}20` }}
          >
            ✉️
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
              {isLetterToFriend
                ? `Letter to ${entry.recipientName || 'a friend'}`
                : 'Letter to future self'}
            </p>
            <p className="text-xs" style={{ color: theme.text.muted }}>
              {format(new Date(entry.createdAt), 'h:mm a')}
            </p>
          </div>
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: `${theme.text.muted}15` }}
            title="Sealed"
          >
            🔒
          </span>
        </div>

        {/* Letter Body - Envelope Style */}
        <div
          className="relative rounded-xl p-4 overflow-hidden"
          style={{
            background: `${theme.bg.primary}60`,
            border: `1px dashed ${moodColor}40`,
          }}
        >
          {/* Decorative stamp */}
          <div
            className="absolute top-2 right-2 w-8 h-10 rounded flex items-center justify-center text-sm"
            style={{
              background: `${moodColor}20`,
              border: `1px solid ${moodColor}30`,
            }}
          >
            {moodEmoji}
          </div>

          {/* Letter preview text */}
          <p
            className="text-sm italic pr-10"
            style={{ color: theme.text.muted }}
          >
            {isLetterToFriend
              ? `A letter waiting to reach ${entry.recipientName || 'someone special'}...`
              : 'A message from your past self, sealed until the right moment...'}
          </p>

          {/* Unlock info */}
          {entry.unlockDate && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.glass.border}` }}>
              <p className="text-xs" style={{ color: theme.text.muted }}>
                {new Date(entry.unlockDate) > new Date() ? (
                  <>
                    <span style={{ color: moodColor }}>⏳</span>{' '}
                    Opens {format(new Date(entry.unlockDate), 'MMMM d, yyyy')}
                  </>
                ) : (
                  <>
                    <span style={{ color: theme.accent.warm }}>✨</span>{' '}
                    {isLetterToFriend ? 'Delivered' : 'Ready to reveal'}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Location if present */}
          {entry.letterLocation && (
            <p className="text-xs mt-2" style={{ color: theme.text.muted }}>
              📍 Written from {entry.letterLocation}
            </p>
          )}
        </div>
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
