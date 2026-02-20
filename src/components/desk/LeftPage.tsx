'use client'

import React, { memo, useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import { useJournalStore } from '@/store/journal'
import SongEmbed from '@/components/SongEmbed'

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
  const [isPageFull, setIsPageFull] = useState(false)

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const textarea = textareaRef.current

    // When adding text, check overflow BEFORE accepting (DOM already has new value)
    if (newText.length > text.length && textarea) {
      if (textarea.scrollHeight > textarea.clientHeight + 2) {
        // Reject this character - React will revert textarea to `text`
        // Pass the rejected characters so they appear on the right page
        setIsPageFull(true)
        onPageFull?.(newText.slice(text.length))
        return
      }
    }

    // When deleting, allow and check if page is no longer full
    if (newText.length < text.length && isPageFull) {
      setIsPageFull(false)
    }

    onTextChange?.(newText)
  }, [text, isPageFull, onPageFull, onTextChange])

  if (isNewEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Music Section */}
        <div className="mb-2 flex-shrink-0">
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

  // Viewing existing entry - show only left page text (before page-break marker)
  const fullText = entry?.text || ''
  const pageBreakMarker = '<!--page-break-->'
  const pageBreakIdx = fullText.indexOf(pageBreakMarker)
  const leftRawText = pageBreakIdx >= 0
    ? fullText.substring(0, pageBreakIdx)
    : fullText

  const plainText = leftRawText
    ? leftRawText
        .replace(/<\/p><p>/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
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
      transition={{ delay: 0.2, duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Song display */}
      {entry?.song && (
        <div className="mb-3 flex-shrink-0">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
            style={{ color: mutedColor }}
          >
            Listening to
          </div>
          <SongEmbed url={entry.song} compact audioOnly />
        </div>
      )}

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
