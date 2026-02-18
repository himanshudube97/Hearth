'use client'

import React, { memo, useState, useCallback, useEffect } from 'react'
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
  spreads?: number
  createdAt: string
}

interface LeftPageProps {
  entry: Entry | null
  isNewEntry: boolean
  spreadDate: Date
  currentSpread?: number // 1-based spread number
  text?: string
  onTextChange?: (text: string) => void
  disabled?: boolean // For append-only mode on existing entries
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
  spreadDate,
  currentSpread = 1,
  text = '',
  onTextChange,
  disabled = false,
}: LeftPageProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentSong, setCurrentSong, currentMood, setCurrentMood } = useJournalStore()
  const [songInput, setSongInput] = useState(entry?.song || currentSong || '')

  const isGlass = currentDiaryTheme === 'glass'
  const accentColor = theme.accent.warm
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const linePattern = getLinePattern(diaryTheme)

  // Show music block only on first spread
  const showMusicBlock = currentSpread === 1

  // Mood options
  const moods = [
    { value: 0, emoji: theme.moodEmojis[0], label: theme.moodLabels[0] },
    { value: 1, emoji: theme.moodEmojis[1], label: theme.moodLabels[1] },
    { value: 2, emoji: theme.moodEmojis[2], label: theme.moodLabels[2] },
    { value: 3, emoji: theme.moodEmojis[3], label: theme.moodLabels[3] },
    { value: 4, emoji: theme.moodEmojis[4], label: theme.moodLabels[4] },
  ]

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
  }, [setCurrentSong])

  // Sync song input when entry changes - use initializer pattern
  const entrySong = entry?.song
  useEffect(() => {
    if (entrySong) {
      setSongInput(entrySong)
    } else if (isNewEntry && currentSong) {
      setSongInput(currentSong)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrySong, isNewEntry])

  if (isNewEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="h-full flex flex-col"
      >
        {/* First spread only: Mood + Music */}
        {showMusicBlock && (
          <>
            {/* Mood Section - Compact */}
            <div className="mb-3 flex-shrink-0">
              <div
                className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
                style={{ color: mutedColor }}
              >
                How are you feeling?
              </div>
              <div className="flex items-center gap-1.5">
                {moods.map((mood) => (
                  <motion.button
                    key={mood.value}
                    onClick={() => setCurrentMood(mood.value)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base relative"
                    style={{
                      background: currentMood === mood.value
                        ? `${theme.moods[mood.value as keyof typeof theme.moods]}25`
                        : 'rgba(0,0,0,0.02)',
                      border: currentMood === mood.value
                        ? `2px solid ${theme.moods[mood.value as keyof typeof theme.moods]}`
                        : '1px solid rgba(0,0,0,0.05)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </motion.button>
                ))}
              </div>
              <div className="mt-1 text-[10px]" style={{ color: mutedColor }}>
                {theme.moodLabels[currentMood]}
              </div>
            </div>

            {/* Music Section */}
            <div className="mb-3 flex-shrink-0">
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
              {songInput && (
                <div className="mt-2">
                  <SongEmbed url={songInput} compact audioOnly />
                </div>
              )}
            </div>
          </>
        )}

        {/* Writing Area */}
        <div className="flex-1 min-h-0 relative">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium flex-shrink-0"
            style={{ color: mutedColor }}
          >
            {currentSpread === 1 ? 'Write your thoughts' : `Continue writing (page ${(currentSpread - 1) * 2 + 1})`}
          </div>
          <textarea
            value={text}
            onChange={(e) => onTextChange?.(e.target.value)}
            placeholder={currentSpread === 1 ? "What's on your mind today..." : "Continue your thoughts..."}
            className="w-full h-full resize-none outline-none flex-1"
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
            }}
          />
        </div>

        {/* Decorative flourish */}
        <div className="mt-auto pt-2 flex justify-center flex-shrink-0">
          <motion.div
            className="text-lg"
            style={{ color: accentColor, opacity: 0.3 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            ✦
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Viewing existing entry
  const plainText = entry?.text
    ? entry.text
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
      className="h-full flex flex-col"
    >
      {/* First spread: Show mood and song */}
      {showMusicBlock && (
        <>
          {/* Mood display */}
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.moodEmojis[entry?.mood ?? 2]}</span>
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>
                  {theme.moodLabels[entry?.mood ?? 2]}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {spreadDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

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
        </>
      )}

      {/* Text content with append capability */}
      <div
        className="flex-1 overflow-auto whitespace-pre-wrap"
        style={{
          color: textColor,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: '18px',
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

      {/* Append area for existing entries (append-only editing) */}
      {!disabled && onTextChange && (
        <div className="mt-2 pt-2 border-t flex-shrink-0" style={{ borderColor: `${mutedColor}20` }}>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Add more thoughts..."
            className="w-full h-16 resize-none outline-none text-sm"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      )}

      {/* Decorative flourish */}
      <div className="mt-auto pt-2 flex justify-center flex-shrink-0">
        <motion.div
          className="text-lg"
          style={{ color: accentColor, opacity: 0.3 }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ✦
        </motion.div>
      </div>
    </motion.div>
  )
})

export default LeftPage
