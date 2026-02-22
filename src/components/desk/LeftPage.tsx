'use client'

import React, { memo, useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import { useJournalStore } from '@/store/journal'
import SongEmbed from '@/components/SongEmbed'
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToPlainText, splitTextForSpread } from '@/lib/text-utils'

// Line height must match the line pattern spacing
const LINE_HEIGHT = 32

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  createdAt: string
}

interface LeftPageProps {
  entry: Entry | null
  isNewEntry: boolean
  text?: string
  onTextChange?: (text: string) => void
  onPageFull?: (overflowText: string) => void
  onNavigateRight?: () => void
  focusTrigger?: number
}

// Helper to get line pattern based on diary theme
function getLinePattern(diaryTheme: typeof diaryThemes[keyof typeof diaryThemes]): string {
  switch (diaryTheme.pages.lineStyle) {
    case 'ruled':
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

const LeftPage = memo(function LeftPage({
  entry,
  isNewEntry,
  text = '',
  onTextChange,
  onPageFull,
  onNavigateRight,
  focusTrigger = 0,
}: LeftPageProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mood picker commented out, keeping for future use
  const { currentSong, setCurrentSong, currentMood, setCurrentMood } = useJournalStore()
  const [songInput, setSongInput] = useState(entry?.song || currentSong || '')
  const [isEditingSong, setIsEditingSong] = useState(!songInput)

  const isGlass = currentDiaryTheme === 'glass'
  const accentColor = theme.accent.warm
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const linePattern = getLinePattern(diaryTheme)

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
    if (value && /https?:\/\//.test(value)) {
      setIsEditingSong(false)
    }
  }, [setCurrentSong])

  // Sync song input when entry changes
  const entrySong = entry?.song
  useEffect(() => {
    if (entrySong) {
      setSongInput(entrySong)
      setIsEditingSong(false)
    } else if (isNewEntry && currentSong) {
      setSongInput(currentSong)
      setIsEditingSong(false)
    } else {
      setIsEditingSong(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrySong, isNewEntry])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when navigating back from right page
  useEffect(() => {
    if (focusTrigger > 0 && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      const len = textarea.value.length
      textarea.setSelectionRange(len, len)
    }
  }, [focusTrigger])

  // Arrow key navigation: only ArrowRight at the very end of text → right page
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowRight') {
      const textarea = e.currentTarget
      if (textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.value.length) {
        e.preventDefault()
        onNavigateRight?.()
      }
    }
  }, [onNavigateRight])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length > JOURNAL.MAX_CHARS) return

    const textarea = textareaRef.current
    if (!textarea) {
      onTextChange?.(newText)
      return
    }

    // Use DOM measurement to detect overflow instead of character-count formula
    const prevValue = textarea.value
    textarea.value = newText

    if (textarea.scrollHeight <= textarea.clientHeight + 1) {
      // No overflow — accept all text
      textarea.value = prevValue
      onTextChange?.(newText)
      return
    }

    // Overflow detected — binary search for the max chars that fit
    let lo = 0
    let hi = newText.length
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2)
      textarea.value = newText.slice(0, mid)
      if (textarea.scrollHeight <= textarea.clientHeight + 1) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }

    // Snap to a word/newline boundary so we don't split mid-word
    let splitAt = lo
    while (splitAt > 0 && newText[splitAt] !== ' ' && newText[splitAt] !== '\n') {
      splitAt--
    }
    if (splitAt === 0) splitAt = lo

    textarea.value = prevValue

    const fitsText = newText.slice(0, splitAt)
    const overflowText = newText.slice(splitAt).replace(/^\s+/, '')

    onTextChange?.(fitsText)
    // Always notify overflow — even if overflowText is empty (e.g. Enter on last line)
    // so that focus moves to the right page
    if (onPageFull) {
      onPageFull(overflowText)
    }
  }, [onTextChange, onPageFull])

  if (isNewEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Music Section — fixed height to prevent textarea resize on song add */}
        <div className="mb-2 flex-shrink-0" style={{ minHeight: '68px' }}>
          {isEditingSong || !songInput ? (
            <>
              <div
                className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
                style={{ color: mutedColor }}
              >
                Add a Song
              </div>
              <input
                type="text"
                value={songInput}
                onChange={(e) => handleSongChange(e.target.value)}
                placeholder="Paste Spotify, YouTube, or SoundCloud link..."
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none"
                style={{
                  border: isGlass ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${diaryTheme.doodle.canvasBorder}`,
                  color: textColor,
                  background: isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground,
                }}
              />
            </>
          ) : (
            <div className="relative">
              <SongEmbed url={songInput} compact audioOnly />
              <button
                onClick={() => setIsEditingSong(true)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-50 hover:opacity-100 transition-opacity"
                style={{
                  background: `${mutedColor}20`,
                  color: mutedColor,
                }}
                title="Change song"
              >
                ✎
              </button>
            </div>
          )}
        </div>

        {/* Writing Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium flex-shrink-0"
            style={{ color: mutedColor }}
          >
            Write your thoughts
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind today..."
            className="flex-1 min-h-0 w-full resize-none outline-none"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              fontSize: '20px',
              lineHeight: `${LINE_HEIGHT}px`,
              caretColor: accentColor,
              backgroundColor: 'transparent',
              backgroundImage: linePattern !== 'none' ? linePattern : 'none',
              backgroundSize: diaryTheme.pages.lineStyle === 'dotted' ? '20px 20px' : undefined,
              backgroundAttachment: 'local',
              overflow: 'hidden',
            }}
          />
        </div>
      </motion.div>
    )
  }

  // Viewing existing entry - dynamic split at render time
  const fullText = entry?.text || ''
  const fullPlainText = htmlToPlainText(fullText)
  const [leftPlainText] = splitTextForSpread(fullPlainText)
  const plainText = leftPlainText

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Song display — same UI as new entry template */}
      <div className="mb-2 flex-shrink-0" style={{ minHeight: '68px' }}>
        {entry?.song ? (
          <>
            <div
              className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
              style={{ color: mutedColor }}
            >
              Listening to
            </div>
            <SongEmbed url={entry.song} compact audioOnly />
          </>
        ) : (
          <>
            <div
              className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
              style={{ color: mutedColor }}
            >
              Add a Song
            </div>
            <input
              type="text"
              disabled
              placeholder="Paste Spotify, YouTube, or SoundCloud link..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none opacity-50"
              style={{
                border: isGlass ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${diaryTheme.doodle.canvasBorder}`,
                color: textColor,
                background: isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground,
              }}
            />
          </>
        )}
      </div>

      {/* Text content - no scroll */}
      <div
        className="flex-1 overflow-hidden whitespace-pre-wrap"
        style={{
          color: textColor,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: '20px',
          lineHeight: `${LINE_HEIGHT}px`,
          backgroundColor: 'transparent',
          backgroundImage: linePattern !== 'none' ? linePattern : 'none',
          backgroundSize: diaryTheme.pages.lineStyle === 'dotted' ? '20px 20px' : undefined,
          backgroundAttachment: 'local',
        }}
      >
        {plainText || (
          <span style={{ color: mutedColor, fontStyle: 'italic' }}>
            No text content
          </span>
        )}
      </div>
    </motion.div>
  )
})

export default LeftPage
