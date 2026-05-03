'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Theme } from '@/lib/themes'
import type { MemoryStar } from './ConstellationRenderer'
import { MemoryDiaryView } from './MemoryDiaryView'

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
}

export function MemoryModal({ selectedStar, setSelectedStar, theme }: MemoryModalProps) {
  return (
    <AnimatePresence>
      {selectedStar && (() => {
        const isLetter =
          selectedStar.entry.entryType === 'letter' && selectedStar.entry.isSealed
        const isLetterToFriend = isLetter && !!selectedStar.entry.recipientEmail
        const accentColor = theme.accent.primary

        // Regular entry → torn-paper diary spread (preserves the original
        // two-page layout: ruled lines, photo block, song, doodle in their
        // original positions).
        if (!isLetter) {
          return (
            <MemoryDiaryView
              key={selectedStar.entry.id}
              entry={selectedStar.entry}
              theme={theme}
              onClose={() => setSelectedStar(null)}
            />
          )
        }

        // Sealed letter → keep the small envelope card so the still-sealed
        // state reads as a letter, not a page.
        return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedStar(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div
                className="rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, ${theme.glass.bg} 0%, ${accentColor}10 100%)`,
                  backdropFilter: `blur(${theme.glass.blur})`,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ background: `${accentColor}20` }}
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

                <div
                  className="relative rounded-xl p-6 text-center"
                  style={{
                    background: `${theme.bg.primary}60`,
                    border: `1px dashed ${accentColor}40`,
                  }}
                >
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-sm italic" style={{ color: theme.text.muted }}>
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

                <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                  {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                </p>
              </div>
            </motion.div>
          </>
        )
      })()}
    </AnimatePresence>
  )
}
