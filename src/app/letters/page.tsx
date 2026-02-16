'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, addWeeks, addMonths, addYears, isFuture, isPast } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import Editor from '@/components/Editor'

interface Letter {
  id: string
  text: string
  createdAt: string
  unlockDate: string | null
  isSealed: boolean
  entryType: string
}

const unlockOptions = [
  { label: 'Tomorrow', getValue: () => addDays(new Date(), 1) },
  { label: 'Next week', getValue: () => addWeeks(new Date(), 1) },
  { label: 'Next month', getValue: () => addMonths(new Date(), 1) },
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addYears(new Date(), 1) },
  { label: 'Custom date', getValue: () => null },
]

export default function LettersPage() {
  const { theme } = useThemeStore()
  const [letterText, setLetterText] = useState('')
  const [unlockDate, setUnlockDate] = useState<Date | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)

  // Fetch letters
  const fetchLetters = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?entryType=letter&limit=50')
      const data = await res.json()
      setLetters(data.entries || [])
    } catch (error) {
      console.error('Failed to fetch letters:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLetters()
  }, [fetchLetters])

  const handleSaveLetter = async () => {
    if (!letterText.trim() || letterText === '<p></p>') return

    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: letterText,
          mood: 2,
          entryType: 'letter',
          unlockDate: unlockDate?.toISOString() || null,
          isSealed: unlockDate !== null,
        }),
      })

      if (res.ok) {
        setLetterText('')
        setUnlockDate(null)
        setCustomDate('')
        setShowDatePicker(false)
        fetchLetters()
      }
    } catch (error) {
      console.error('Failed to save letter:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUnlockOption = (option: typeof unlockOptions[0]) => {
    const date = option.getValue()
    if (date === null) {
      setShowDatePicker(true)
    } else {
      setUnlockDate(date)
      setShowDatePicker(false)
    }
  }

  const handleCustomDateChange = (dateStr: string) => {
    setCustomDate(dateStr)
    if (dateStr) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime()) && isFuture(date)) {
        setUnlockDate(date)
      }
    }
  }

  const isLetterUnlocked = (letter: Letter) => {
    if (!letter.unlockDate) return true
    return isPast(new Date(letter.unlockDate))
  }

  const hasContent = letterText.trim() && letterText !== '<p></p>'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1
          className="text-2xl font-light tracking-wide mb-2"
          style={{ color: theme.text.primary }}
        >
          Letters to Yourself
        </h1>
        <p className="text-sm" style={{ color: theme.text.muted }}>
          Write words for your future self to find
        </p>
      </motion.div>

      {/* Letter Writing Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="mb-8"
      >
        {/* Envelope Header */}
        <div
          className="rounded-t-2xl p-4 border-b-0"
          style={{
            background: `linear-gradient(135deg, ${theme.accent.warm}20, ${theme.accent.primary}10)`,
            borderLeft: `1px solid ${theme.glass.border}`,
            borderRight: `1px solid ${theme.glass.border}`,
            borderTop: `1px solid ${theme.glass.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: theme.text.muted }}>
              Dear future me,
            </span>
            <span className="text-2xl">✉</span>
          </div>
        </div>

        {/* Editor */}
        <div
          className="rounded-b-2xl p-4"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
            borderTop: 'none',
          }}
        >
          <Editor
            prompt="What would you like to tell yourself?"
            value={letterText}
            onChange={setLetterText}
          />
        </div>

        {/* Time Capsule Options */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <p className="text-sm mb-3" style={{ color: theme.text.muted }}>
                When should this letter unlock?
              </p>

              {/* Quick Options */}
              <div className="flex flex-wrap gap-2 mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUnlockDate(null)}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{
                    background: unlockDate === null ? `${theme.accent.primary}30` : theme.glass.bg,
                    border: `1px solid ${unlockDate === null ? theme.accent.primary : theme.glass.border}`,
                    color: theme.text.primary,
                  }}
                >
                  Send now
                </motion.button>

                {unlockOptions.slice(0, -1).map((option) => {
                  const optionDate = option.getValue()
                  const isSelected = unlockDate && optionDate &&
                    format(unlockDate, 'yyyy-MM-dd') === format(optionDate as Date, 'yyyy-MM-dd')

                  return (
                    <motion.button
                      key={option.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUnlockOption(option)}
                      className="px-3 py-1.5 rounded-full text-sm"
                      style={{
                        background: isSelected ? `${theme.accent.primary}30` : theme.glass.bg,
                        border: `1px solid ${isSelected ? theme.accent.primary : theme.glass.border}`,
                        color: theme.text.primary,
                      }}
                    >
                      {option.label}
                    </motion.button>
                  )
                })}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{
                    background: showDatePicker ? `${theme.accent.primary}30` : theme.glass.bg,
                    border: `1px solid ${showDatePicker ? theme.accent.primary : theme.glass.border}`,
                    color: theme.text.primary,
                  }}
                >
                  Pick date
                </motion.button>
              </div>

              {/* Custom Date Picker */}
              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => handleCustomDateChange(e.target.value)}
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      className="px-4 py-2 rounded-xl bg-transparent outline-none text-sm"
                      style={{
                        border: `1px solid ${theme.glass.border}`,
                        color: theme.text.primary,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected Date Display */}
              {unlockDate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-3 rounded-xl"
                  style={{ background: `${theme.accent.warm}15` }}
                >
                  <span className="text-sm" style={{ color: theme.text.primary }}>
                    This letter will unlock on{' '}
                    <strong>{format(unlockDate, 'MMMM d, yyyy')}</strong>
                  </span>
                </motion.div>
              )}

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveLetter}
                disabled={saving}
                className="w-full py-3 rounded-full text-sm font-medium"
                style={{
                  background: theme.accent.primary,
                  color: theme.bg.primary,
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Sealing...' : unlockDate ? 'Seal & Send to Future' : 'Send Letter'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Past Letters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <h2 className="text-lg mb-4" style={{ color: theme.text.secondary }}>
          Your Letters
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <span style={{ color: theme.text.muted }}>Loading...</span>
          </div>
        ) : letters.length === 0 ? (
          <div
            className="text-center py-8 rounded-2xl"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            <span className="text-4xl mb-2 block">✉</span>
            <span style={{ color: theme.text.muted }}>
              No letters yet. Write one to your future self.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map((letter) => {
              const unlocked = isLetterUnlocked(letter)

              return (
                <motion.div
                  key={letter.id}
                  whileHover={{ scale: unlocked ? 1.01 : 1 }}
                  onClick={() => unlocked && setSelectedLetter(letter)}
                  className="rounded-2xl p-4 cursor-pointer"
                  style={{
                    background: theme.glass.bg,
                    backdropFilter: `blur(${theme.glass.blur})`,
                    border: `1px solid ${theme.glass.border}`,
                    opacity: unlocked ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {unlocked ? '📬' : '📪'}
                      </span>
                      <div>
                        <p className="text-sm" style={{ color: theme.text.primary }}>
                          {unlocked
                            ? `Written on ${format(new Date(letter.createdAt), 'MMM d, yyyy')}`
                            : 'Sealed letter'
                          }
                        </p>
                        {letter.unlockDate && !unlocked && (
                          <p className="text-xs" style={{ color: theme.text.muted }}>
                            Unlocks {format(new Date(letter.unlockDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    {unlocked && (
                      <span style={{ color: theme.text.muted }}>→</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Letter Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-2xl p-6"
              style={{
                background: theme.bg.primary,
                border: `1px solid ${theme.glass.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Letter Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm" style={{ color: theme.text.muted }}>
                    Written on {format(new Date(selectedLetter.createdAt), 'MMMM d, yyyy')}
                  </p>
                  {selectedLetter.unlockDate && (
                    <p className="text-xs" style={{ color: theme.accent.warm }}>
                      Time capsule from the past
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: theme.glass.bg,
                    color: theme.text.muted,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Letter Content */}
              <div
                className="prose prose-invert max-w-none"
                style={{
                  fontFamily: 'Georgia, Palatino, serif',
                  fontSize: '16px',
                  lineHeight: 2,
                  color: theme.text.primary,
                }}
                dangerouslySetInnerHTML={{ __html: selectedLetter.text }}
              />

              {/* Signature */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.glass.border }}>
                <p className="text-sm italic" style={{ color: theme.text.muted }}>
                  — Past you
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
