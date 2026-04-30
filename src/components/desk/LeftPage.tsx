'use client'

import React, { memo, useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import { useJournalStore } from '@/store/journal'
import { useDeskStore } from '@/store/desk'
import SongEmbed from '@/components/SongEmbed'
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToSplitPlainText } from '@/lib/text-utils'
import {
  isCaretOnLastVisualRow,
  getCaretLeftOffset,
  findPositionOnLastRow,
} from '@/lib/textarea-caret'
import PenMenu from './PenMenu'
import SparkleTrail from './effects/SparkleTrail'
import SaveShimmer from './effects/SaveShimmer'
import WetInkGlow from './effects/WetInkGlow'
import { resolveFontFamily, resolveInkColor, parseStyle, type EntryStyle } from '@/lib/entry-style'
import { isEntryLocked } from '@/lib/entry-lock-client'

// Line height must match the line pattern spacing
const LINE_HEIGHT = 32

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  createdAt: string
  style?: EntryStyle | null
}

interface LeftPageProps {
  entry: Entry | null
  isNewEntry: boolean
  onPageFull?: (overflowText: string, cursorStaysOnLeft: boolean) => void
  onNavigateRight?: (targetLeft?: number) => void
}

export interface LeftPageHandle {
  focusAtEnd: () => void
  focusAtStart: () => void
  focusAtLastRow: (targetLeft: number) => void
}

const LeftPage = memo(forwardRef<LeftPageHandle, LeftPageProps>(function LeftPage({
  entry,
  isNewEntry,
  onPageFull,
  onNavigateRight,
}: LeftPageProps, ref) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mood picker commented out, keeping for future use
  const { currentSong, setCurrentSong, currentMood, setCurrentMood } = useJournalStore()
  // Draft text lives in desk store so typing doesn't re-render BookSpread.
  const text = useDeskStore((s) => s.leftPageDraft)
  const setLeftPageDraft = useDeskStore((s) => s.setLeftPageDraft)
  const entryStyleDraft = useDeskStore((s) => s.entryStyleDraft)
  const setEntryStyleDraft = useDeskStore((s) => s.setEntryStyleDraft)
  const onTextChange = setLeftPageDraft
  const [songInput, setSongInput] = useState(entry?.song || currentSong || '')
  const [isEditingSong, setIsEditingSong] = useState(!songInput)
  const [menuOpen, setMenuOpen] = useState(false)

  const accentColor = theme.accent.warm
  const textColor = colors.bodyText
  const mutedColor = theme.text.muted

  const activeStyle: EntryStyle = isNewEntry
    ? entryStyleDraft
    : parseStyle(entry?.style ?? null)
  const fontFamily = resolveFontFamily(activeStyle.font)
  const inkColor = resolveInkColor(activeStyle.color, colors.bodyText)
  const lockedForEntry = !isNewEntry && entry
    ? isEntryLocked(entry.createdAt, { entryType: 'normal' })
    : false
  const linePattern = `repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent ${LINE_HEIGHT - 1}px,
    ${colors.ruledLine} ${LINE_HEIGHT - 1}px,
    ${colors.ruledLine} ${LINE_HEIGHT}px
  )`

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

  // Imperative focus API. Lives on the page component itself so the parent
  // (BookSpread) doesn't have to hold focus state — any setState in BookSpread
  // would re-render the flipbook, whose updateFromHtml destroys/recreates page
  // DOM and kills focus.
  useImperativeHandle(ref, () => ({
    focusAtEnd: () => {
      const t = textareaRef.current
      if (!t) return
      t.focus()
      const len = t.value.length
      t.setSelectionRange(len, len)
    },
    focusAtStart: () => {
      const t = textareaRef.current
      if (!t) return
      t.focus()
      t.setSelectionRange(0, 0)
    },
    focusAtLastRow: (targetLeft: number) => {
      const t = textareaRef.current
      if (!t) return
      t.focus()
      const pos = findPositionOnLastRow(t, targetLeft)
      t.setSelectionRange(pos, pos)
    },
  }))

  // Arrow key navigation: cross the spine into the right page when the caret
  // is at the trailing edge of the left textarea.
  // - ArrowRight at end-of-value
  // - ArrowDown on the visual last row
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    if (e.key === 'ArrowRight') {
      if (textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.value.length) {
        e.preventDefault()
        onNavigateRight?.()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      if (isCaretOnLastVisualRow(textarea)) {
        e.preventDefault()
        onNavigateRight?.(getCaretLeftOffset(textarea))
      }
    }
  }, [onNavigateRight])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const newCursorPos = e.target.selectionStart
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

    // If the user's caret sits in the kept-left portion (e.g. Enter on the
    // second-to-last line pushes the LAST line off, but the caret should
    // remain on the new empty line), keep focus on the left page. Same when
    // the overflow is just stripped whitespace (the change effectively
    // nooped on the right) — there's no reason to yank focus across.
    const cursorStaysOnLeft = overflowText.length === 0 || newCursorPos <= splitAt

    onTextChange?.(fitsText)
    if (onPageFull) {
      onPageFull(overflowText, cursorStaysOnLeft)
    }

    if (cursorStaysOnLeft) {
      // Wait for React to commit fitsText to the textarea, then restore the
      // caret — setting textarea.value via React often resets the selection.
      requestAnimationFrame(() => {
        const t = textareaRef.current
        if (!t) return
        t.focus()
        const pos = Math.min(newCursorPos, t.value.length)
        t.setSelectionRange(pos, pos)
      })
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
                  border: `1px solid ${colors.doodleBorder}`,
                  color: textColor,
                  background: colors.doodleBg,
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
        <div className="flex-1 min-h-0 flex flex-col relative">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium flex-shrink-0"
            style={{ color: mutedColor }}
          >
            Write your thoughts
          </div>

          {/* Pen-nib icon — only on entries the user can still style. The
              new-entry spread always qualifies; viewing branches gate this
              themselves (the v1 viewing branch below doesn't render this
              block). The lockedForEntry check is belt-and-suspenders for
              future cases where existing entries are also editable. */}
          {!lockedForEntry && (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="absolute right-0 top-0 w-6 h-6 flex items-center justify-center rounded-md transition-opacity"
                style={{
                  color: accentColor,
                  opacity: menuOpen ? 1 : 0.65,
                }}
                title="Pen settings"
                aria-label="Pen settings"
                aria-expanded={menuOpen}
              >
                <PenNibIcon />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <PenMenu
                    value={entryStyleDraft}
                    onChange={setEntryStyleDraft}
                    onClose={() => setMenuOpen(false)}
                    themeBodyText={colors.bodyText}
                    panelBg={colors.doodleBg}
                    panelBorder={colors.doodleBorder}
                    labelColor={mutedColor}
                  />
                )}
              </AnimatePresence>
            </>
          )}

          {/* Textarea + effect overlays share a relative sub-wrapper so the
              overlays' coordinate origin matches the textarea's border-box.
              This keeps particle / glow positions aligned with the caret. */}
          <div className="flex-1 min-h-0 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind today..."
              className="absolute inset-0 w-full h-full resize-none outline-none"
              style={{
                color: inkColor,
                fontFamily,
                fontSize: '20px',
                lineHeight: `${LINE_HEIGHT}px`,
                caretColor: inkColor,
                backgroundColor: 'transparent',
                backgroundImage: linePattern,
                backgroundAttachment: 'local',
                overflow: 'hidden',
              }}
            />
            <SparkleTrail
              textareaRef={textareaRef}
              inkColor={inkColor}
              enabled={activeStyle.effect === 'sparkle' && isNewEntry}
            />
            <SaveShimmer enabled={activeStyle.effect === 'sparkle' && isNewEntry} />
            <WetInkGlow
              textareaRef={textareaRef}
              inkColor={inkColor}
              enabled={activeStyle.effect === 'wet-ink' && isNewEntry}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  // Viewing existing entry — uses the persisted page-break marker when
  // present so the boundary matches what the user saw while typing.
  const [leftPlainText] = htmlToSplitPlainText(entry?.text || '')
  const plainText = leftPlainText

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Song section — match new-entry layout. Show "Listening to" embed if
          the entry has a song; otherwise show the "Add a Song" empty state
          with a disabled input so the layout stays structurally identical. */}
      <div className="mb-2 flex-shrink-0" style={{ minHeight: '68px' }}>
        {entry?.song ? (
          <>
            <div
              className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
              style={{ color: colors.sectionLabel }}
            >
              Listening to
            </div>
            <SongEmbed url={entry.song} compact audioOnly />
          </>
        ) : (
          <>
            <div
              className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
              style={{ color: colors.sectionLabel }}
            >
              Add a Song
            </div>
            <input
              type="text"
              disabled
              placeholder="Paste Spotify, YouTube, or SoundCloud link..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none opacity-50"
              style={{
                border: `1px solid ${colors.doodleBorder}`,
                color: textColor,
                background: colors.doodleBg,
              }}
            />
          </>
        )}
      </div>

      {/* Writing area — same labels as new entry; placeholder text only
          surfaces when the saved entry has no left-page content. */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium flex-shrink-0"
          style={{ color: colors.sectionLabel }}
        >
          Write your thoughts
        </div>
        <div
          className="flex-1 min-h-0 w-full whitespace-pre-wrap overflow-hidden"
          style={{
            color: plainText ? inkColor : mutedColor,
            fontFamily,
            fontSize: '20px',
            lineHeight: `${LINE_HEIGHT}px`,
            fontStyle: plainText ? 'normal' : 'italic',
            backgroundColor: 'transparent',
            backgroundImage: linePattern,
            backgroundAttachment: 'local',
          }}
        >
          {plainText || "What's on your mind today..."}
        </div>
      </div>
    </motion.div>
  )
}))

function PenNibIcon() {
  // 16px pen nib outline. Stroke uses currentColor so the icon picks up
  // the button's color (theme accent).
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.5 1.5L14.5 4.5L6 13H3V10L11.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9.5 3.5L12.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

LeftPage.displayName = 'LeftPage'

export default LeftPage
