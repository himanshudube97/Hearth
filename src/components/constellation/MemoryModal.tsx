'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Theme } from '@/lib/themes'
import SongEmbed from '@/components/SongEmbed'
import type { MemoryStar } from './ConstellationRenderer'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'earlier today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

interface MemoryModalProps {
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
  getMoodColor: (mood: number) => string
}

export function MemoryModal({ selectedStar, setSelectedStar, theme, getMoodColor }: MemoryModalProps) {
  return (
    <AnimatePresence>
      {selectedStar && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedStar(null)}
          />

          {/* Memory card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            {(() => {
              const isLetter = selectedStar.entry.entryType === 'letter' && selectedStar.entry.isSealed
              const isLetterToFriend = isLetter && !!selectedStar.entry.recipientEmail
              const moodColor = getMoodColor(selectedStar.entry.mood)

              if (isLetter) {
                // Sealed letter card
                return (
                  <div
                    className="rounded-2xl p-6"
                    style={{
                      background: `linear-gradient(135deg, ${theme.glass.bg} 0%, ${moodColor}10 100%)`,
                      backdropFilter: `blur(${theme.glass.blur})`,
                      border: `1px solid ${moodColor}30`,
                    }}
                  >
                    {/* Letter Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ background: `${moodColor}20` }}
                        >
                          ✉️
                        </span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                            {isLetterToFriend
                              ? `Letter to ${selectedStar.entry.recipientName || 'a friend'}`
                              : 'Letter to future self'}
                          </p>
                          <p className="text-xs" style={{ color: theme.text.muted }}>
                            {format(new Date(selectedStar.entry.createdAt), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStar(null)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ color: theme.text.muted }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Sealed envelope */}
                    <div
                      className="relative rounded-xl p-6 text-center"
                      style={{
                        background: `${theme.bg.primary}60`,
                        border: `1px dashed ${moodColor}40`,
                      }}
                    >
                      <div className="text-4xl mb-3">🔒</div>
                      <p
                        className="text-sm italic"
                        style={{ color: theme.text.muted }}
                      >
                        {isLetterToFriend
                          ? `A sealed letter waiting to reach ${selectedStar.entry.recipientName || 'someone special'}...`
                          : 'A message from your past self, sealed until the right moment...'}
                      </p>

                      {selectedStar.entry.unlockDate && (
                        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.glass.border}` }}>
                          <p className="text-xs" style={{ color: theme.text.muted }}>
                            {new Date(selectedStar.entry.unlockDate) > new Date() ? (
                              <>⏳ Opens {format(new Date(selectedStar.entry.unlockDate), 'MMMM d, yyyy')}</>
                            ) : (
                              <>✨ {isLetterToFriend ? 'Delivered' : 'Ready to reveal'}</>
                            )}
                          </p>
                        </div>
                      )}

                      {selectedStar.entry.letterLocation && (
                        <p className="text-xs mt-3" style={{ color: theme.text.muted }}>
                          📍 Written from {selectedStar.entry.letterLocation}
                        </p>
                      )}
                    </div>

                    {/* Time ago */}
                    <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                      {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                    </p>
                  </div>
                )
              }

              // Regular entry card
              return (
                <div
                  className="rounded-2xl p-6 max-h-[70vh] overflow-y-auto"
                  style={{
                    background: theme.glass.bg,
                    backdropFilter: `blur(${theme.glass.blur})`,
                    border: `1px solid ${theme.glass.border}`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ background: `${moodColor}20` }}
                      >
                        {theme.moodEmojis[selectedStar.entry.mood]}
                      </span>
                      <div>
                        <p className="text-sm" style={{ color: theme.text.primary }}>
                          {format(new Date(selectedStar.entry.createdAt), 'EEEE')}
                        </p>
                        <p className="text-xs" style={{ color: theme.text.muted }}>
                          {format(new Date(selectedStar.entry.createdAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStar(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ color: theme.text.muted }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Content */}
                  <div
                    className="prose prose-invert max-w-none"
                    style={{
                      fontFamily: 'Georgia, Palatino, serif',
                      fontSize: '15px',
                      lineHeight: 1.8,
                      color: theme.text.primary,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedStar.entry.text }}
                  />

                  {/* Song */}
                  {selectedStar.entry.song && (
                    <div className="mt-4">
                      <SongEmbed url={selectedStar.entry.song} compact />
                    </div>
                  )}

                  {/* Time ago */}
                  <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                    {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                  </p>
                </div>
              )
            })()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
