'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useJournalStore } from '@/store/journal'
import { getRandomPrompt } from '@/lib/themes'

interface PageContentProps {
  side: 'left' | 'right'
  spreadIndex: number
  onSaveComplete?: () => void
  entries?: Array<{
    id: string
    text: string
    mood: number
    createdAt: string
  }>
}

export default function PageContent({ side, spreadIndex, onSaveComplete, entries = [] }: PageContentProps) {
  const { theme } = useThemeStore()
  const { currentMood, setCurrentMood } = useJournalStore()
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrompt(getRandomPrompt())
  }, [])

  // Text color for paper - dark brown/sepia
  const textColor = 'hsl(25, 30%, 25%)'
  const mutedColor = 'hsl(25, 20%, 45%)'
  const accentColor = theme.accent.warm

  const handleSave = useCallback(async () => {
    if (!text.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `<p>${text.replace(/\n/g, '</p><p>')}</p>`,
          mood: currentMood,
          song: null,
          doodles: [],
        }),
      })

      if (res.ok) {
        setSaved(true)
        setText('')
        setPrompt(getRandomPrompt())
        // Turn to next page after a brief moment to show "Saved!"
        setTimeout(() => {
          setSaved(false)
          onSaveComplete?.()
        }, 1000)
      } else {
        const data = await res.json()
        console.error('Save failed:', data)
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      alert('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }, [text, currentMood])

  const refreshPrompt = () => {
    setPrompt(getRandomPrompt())
  }

  // Mood options
  const moods = [
    { value: 0, emoji: theme.moodEmojis[0], label: theme.moodLabels[0] },
    { value: 1, emoji: theme.moodEmojis[1], label: theme.moodLabels[1] },
    { value: 2, emoji: theme.moodEmojis[2], label: theme.moodLabels[2] },
    { value: 3, emoji: theme.moodEmojis[3], label: theme.moodLabels[3] },
    { value: 4, emoji: theme.moodEmojis[4], label: theme.moodLabels[4] },
  ]

  // First spread (index 0): left is decorative, right is editor
  if (spreadIndex === 0) {
    if (side === 'left') {
      // Decorative first page
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="h-full flex flex-col items-center justify-center text-center px-4"
        >
          {/* Decorative flourish */}
          <motion.div
            className="text-5xl mb-8"
            style={{ color: accentColor }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            ✦
          </motion.div>

          <div
            className="text-xl font-serif italic mb-2 tracking-wide"
            style={{
              color: textColor,
              fontFamily: 'var(--font-serif), Georgia, serif',
            }}
          >
            Your thoughts,
          </div>
          <div
            className="text-xl font-serif italic mb-8 tracking-wide"
            style={{
              color: textColor,
              fontFamily: 'var(--font-serif), Georgia, serif',
            }}
          >
            your sanctuary.
          </div>

          {/* Decorative line */}
          <div
            className="w-24 h-px mb-8"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
          />

          <div
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: mutedColor }}
          >
            Hearth Journal
          </div>

          {/* Date */}
          <div
            className="mt-8 text-xs"
            style={{ color: mutedColor }}
          >
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </motion.div>
      )
    } else {
      // Writing area on right page
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-full flex flex-col"
        >
          {/* Header with prompt */}
          <div className="mb-3 flex-shrink-0">
            <div
              className="text-[10px] uppercase tracking-[0.2em] mb-1"
              style={{ color: mutedColor }}
            >
              Today&apos;s Entry
            </div>
            <div className="flex items-start gap-2">
              <div
                className="text-xs italic flex-1"
                style={{ color: mutedColor }}
              >
                {prompt}
              </div>
              <button
                onClick={refreshPrompt}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: accentColor }}
              >
                ↻
              </button>
            </div>
          </div>

          {/* Mood picker - compact */}
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider mr-2" style={{ color: mutedColor }}>
                Mood:
              </span>
              {moods.map((mood) => (
                <motion.button
                  key={mood.value}
                  onClick={() => setCurrentMood(mood.value)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: currentMood === mood.value ? `${theme.moods[mood.value as keyof typeof theme.moods]}30` : 'transparent',
                    border: currentMood === mood.value ? `2px solid ${theme.moods[mood.value as keyof typeof theme.moods]}` : '1px solid transparent',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={mood.label}
                >
                  {mood.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Writing area */}
          <div className="flex-1 relative min-h-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Begin writing your thoughts..."
              className="w-full h-full resize-none bg-transparent outline-none leading-[32px] pr-2"
              style={{
                color: textColor,
                fontFamily: 'var(--font-caveat), Georgia, serif',
                fontSize: '20px',
                caretColor: accentColor,
              }}
            />
          </div>

          {/* Save button area */}
          <div className="mt-3 flex justify-between items-center flex-shrink-0">
            <div className="text-xs" style={{ color: mutedColor }}>
              {text.length > 0 && `${text.length} characters`}
            </div>

            <AnimatePresence mode="wait">
              {saved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: theme.moods[4] }}
                >
                  <span>✓</span>
                  <span>Saved!</span>
                </motion.div>
              ) : text.length > 0 ? (
                <motion.button
                  key="save"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: accentColor,
                    color: 'white',
                    opacity: saving ? 0.6 : 1,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      )
    }
  }

  // Other spreads - show entries
  // Calculate which entry to show: spread 1 shows entries 0,1 | spread 2 shows entries 2,3 | etc
  const entryIndex = (spreadIndex - 1) * 2 + (side === 'right' ? 1 : 0)
  const entry = entries[entryIndex]

  if (!entry) {
    // No entry for this page
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center"
      >
        <div
          className="text-sm italic text-center"
          style={{ color: mutedColor }}
        >
          <div className="text-3xl mb-4 opacity-30">📝</div>
          <div>Empty page</div>
          <div className="text-xs mt-2 opacity-60">
            Go back to write more
          </div>
        </div>
      </motion.div>
    )
  }

  // Show the entry
  const entryDate = new Date(entry.createdAt)
  const moodEmoji = theme.moodEmojis[entry.mood] || '📝'

  // Strip HTML tags for display
  const plainText = entry.text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="h-full flex flex-col"
    >
      {/* Entry header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{moodEmoji}</span>
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: mutedColor }}
          >
            {entryDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div
          className="text-[10px]"
          style={{ color: mutedColor }}
        >
          {entryDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Entry content */}
      <div
        className="flex-1 overflow-hidden leading-[32px]"
        style={{
          color: textColor,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: '18px',
        }}
      >
        {plainText}
      </div>
    </motion.div>
  )
}
