'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes, DiaryTheme } from '@/lib/diaryThemes'
import { useJournalStore } from '@/store/journal'
import { getRandomPrompt } from '@/lib/themes'

// Line height must match the line pattern spacing
const LINE_HEIGHT = 32
// Top offset to match the left page's line positioning (70px from page - 20px padding = 50px from content)
const TOP_OFFSET = 50

// Helper to get line pattern based on diary theme (for text areas)
function getLinePattern(diaryTheme: DiaryTheme): string {
  switch (diaryTheme.pages.lineStyle) {
    case 'ruled':
      // Line appears at bottom of each 32px cell, text sits above it
      return `repeating-linear-gradient(
        180deg,
        transparent 0px,
        transparent ${LINE_HEIGHT - 1}px,
        ${diaryTheme.pages.lineColor} ${LINE_HEIGHT - 1}px,
        ${diaryTheme.pages.lineColor} ${LINE_HEIGHT}px
      )`
    case 'dotted':
      return `radial-gradient(circle, ${diaryTheme.pages.lineColor} 1px, transparent 1px)`
    case 'wavy':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='${LINE_HEIGHT}'%3E%3Cpath d='M0 ${LINE_HEIGHT - 4} Q25 ${LINE_HEIGHT - 8} 50 ${LINE_HEIGHT - 4} T100 ${LINE_HEIGHT - 4}' fill='none' stroke='${encodeURIComponent(diaryTheme.pages.lineColor)}' stroke-width='1'/%3E%3C/svg%3E")`
    case 'constellation':
    case 'none':
    default:
      return 'none'
  }
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  doodles?: Array<{ strokes: unknown[] }>
  createdAt: string
}

interface RightPageProps {
  entry: Entry | null
  isNewEntry: boolean
  onSaveComplete?: () => void
}

const RightPage = memo(function RightPage({ entry, isNewEntry, onSaveComplete }: RightPageProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentMood, currentSong, currentDoodleStrokes, resetCurrentEntry } = useJournalStore()
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const accentColor = theme.accent.warm
  const isGlass = currentDiaryTheme === 'glass'

  // Use theme colors for glass, diary theme colors otherwise
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor

  // Get line pattern for this theme
  const linePattern = getLinePattern(diaryTheme)

  useEffect(() => {
    setPrompt(getRandomPrompt())
  }, [])

  const refreshPrompt = useCallback(() => {
    setPrompt(getRandomPrompt())
  }, [])

  const handleSave = useCallback(async () => {
    if (!text.trim()) return

    setSaving(true)
    try {
      // Build doodles array from current strokes
      const doodlesToSave = currentDoodleStrokes.length > 0
        ? [{ strokes: currentDoodleStrokes }]
        : []

      console.log('[RightPage] Saving entry with doodles:', {
        strokeCount: currentDoodleStrokes.length,
        doodlesToSave,
      })

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `<p>${text.replace(/\n/g, '</p><p>')}</p>`,
          mood: currentMood,
          song: currentSong || null,
          doodles: doodlesToSave,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setText('')
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        // Clear doodle draft from localStorage
        try {
          localStorage.removeItem('hearth_desk_doodle_draft')
        } catch (e) {
          console.error('Failed to clear doodle draft:', e)
        }

        // Notify parent and reset after delay
        setTimeout(() => {
          setSaved(false)
          onSaveComplete?.()
        }, 1500)
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
  }, [text, currentMood, currentSong, currentDoodleStrokes, resetCurrentEntry, onSaveComplete])

  if (isNewEntry) {
    // New entry mode - show editor
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="h-full flex flex-col relative"
      >
        {/* Prompt - positioned at top */}
        <div className="absolute top-0 left-0 right-0 z-10 flex-shrink-0" style={{ height: `${TOP_OFFSET - 10}px` }}>
          <div className="flex items-start gap-2">
            <div
              className="text-sm italic flex-1 leading-relaxed"
              style={{ color: mutedColor }}
            >
              {prompt}
            </div>
            <button
              onClick={refreshPrompt}
              className="text-sm opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
              style={{ color: accentColor }}
              title="New prompt"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Writing area with integrated line pattern - starts below prompt */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Begin writing your thoughts..."
            className="w-full h-full resize-none outline-none"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              fontSize: '22px',
              lineHeight: `${LINE_HEIGHT}px`,
              caretColor: accentColor,
              backgroundColor: 'transparent',
              backgroundImage: linePattern !== 'none' ? linePattern : 'none',
              backgroundSize: diaryTheme.pages.lineStyle === 'dotted' ? '20px 20px' : undefined,
              backgroundPositionY: `${TOP_OFFSET}px`, // Shift lines down to match left page
              backgroundAttachment: 'local', // Lines scroll with text
              paddingTop: `${TOP_OFFSET}px`, // Match left page offset
            }}
          />
        </div>

        {/* Footer with save */}
        <div className="mt-4 flex justify-between items-center flex-shrink-0">
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
                className="flex items-center gap-2 text-sm font-medium"
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
                className="px-6 py-2.5 rounded-full text-sm font-medium"
                style={{
                  background: accentColor,
                  color: 'white',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Decorative corner */}
        <div
          className="absolute bottom-4 right-4 w-8 h-8 pointer-events-none"
          style={{
            borderRight: `2px solid ${accentColor}20`,
            borderBottom: `2px solid ${accentColor}20`,
          }}
        />
      </motion.div>
    )
  }

  // Viewing existing entry - show text content
  // Convert HTML back to plain text without creating extra newlines
  const plainText = entry?.text
    ? entry.text
        .replace(/<\/p><p>/g, '\n')     // Replace paragraph breaks with single newline
        .replace(/<br\s*\/?>/gi, '\n')  // Replace <br> with newline
        .replace(/<[^>]*>/g, '')        // Remove all remaining HTML tags (don't add newlines)
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
    : ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="h-full flex flex-col"
    >
      {/* Entry content with integrated line pattern - matches write mode offset */}
      <div
        className="flex-1 overflow-auto whitespace-pre-wrap"
        style={{
          color: textColor,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: '20px',
          lineHeight: `${LINE_HEIGHT}px`,
          backgroundColor: 'transparent',
          backgroundImage: linePattern !== 'none' ? linePattern : 'none',
          backgroundSize: diaryTheme.pages.lineStyle === 'dotted' ? '20px 20px' : undefined,
          backgroundPositionY: `${TOP_OFFSET}px`, // Shift lines down to match left page
          backgroundAttachment: 'local', // Lines scroll with text
          paddingTop: `${TOP_OFFSET}px`, // Match write mode and left page offset
        }}
      >
        {plainText || (
          <span style={{ color: mutedColor, fontStyle: 'italic' }}>
            No text content
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t flex-shrink-0" style={{ borderColor: `${mutedColor}20` }}>
        <div className="flex justify-between items-center">
          <div className="text-xs" style={{ color: mutedColor }}>
            {plainText.length} characters
          </div>
          <div className="text-xs" style={{ color: mutedColor }}>
            {entry && new Date(entry.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default RightPage
