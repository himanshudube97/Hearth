'use client'

import React, { memo, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import { useJournalStore, StrokeData } from '@/store/journal'
import { getRandomPrompt } from '@/lib/themes'
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToPlainText, splitTextForSpread } from '@/lib/text-utils'
import PhotoBlock from './PhotoBlock'
import CompactDoodleCanvas from './CompactDoodleCanvas'

const LINE_HEIGHT = 32
const DOODLE_DRAFT_KEY = 'hearth_desk_doodle_draft'

// SVG path from stroke points
function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  photos?: Photo[]
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface RightPageProps {
  entry: Entry | null
  isNewEntry: boolean
  photos?: Photo[]
  onPhotoAdd?: (position: 1 | 2, dataUrl: string) => void
  onSaveComplete?: () => void
  leftPageText?: string
  text?: string
  onTextChange?: (text: string) => void
  focusTrigger?: number
  onNavigateLeft?: () => void
}

// Doodle Preview for existing entries
const DoodlePreview = memo(function DoodlePreview({
  strokes,
  canvasBackground,
  canvasBorder,
}: {
  strokes: StrokeData[]
  canvasBackground: string
  canvasBorder: string
}) {
  if (!strokes || strokes.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach(stroke => {
    stroke.points.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
  })

  const padding = 10
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2

  return (
    <div
      className="h-24 rounded-lg overflow-hidden"
      style={{
        background: canvasBackground,
        border: `1px solid ${canvasBorder}`,
      }}
    >
      <svg
        viewBox={`${minX - padding} ${minY - padding} ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {strokes.map((stroke, index) => {
          const outlinePoints = getStroke(stroke.points, {
            size: stroke.size,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          })
          const pathData = getSvgPathFromStroke(outlinePoints)
          return <path key={index} d={pathData} fill={stroke.color} opacity={0.9} />
        })}
      </svg>
    </div>
  )
})

const RightPage = memo(function RightPage({
  entry,
  isNewEntry,
  photos = [],
  onPhotoAdd,
  onSaveComplete,
  leftPageText = '',
  text: externalText,
  onTextChange,
  focusTrigger = 0,
  onNavigateLeft,
}: RightPageProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)
  const { currentMood, currentSong, currentDoodleStrokes, setDoodleStrokes, resetCurrentEntry } = useJournalStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)

  const text = externalText ?? ''
  const noopSetText = useCallback(() => {}, [])
  const setText = onTextChange ?? noopSetText

  const accentColor = theme.accent.warm
  const textColor = colors.bodyText
  const mutedColor = theme.text.muted
  const linePattern = `repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent ${LINE_HEIGHT - 1}px,
    ${colors.ruledLine} ${LINE_HEIGHT - 1}px,
    ${colors.ruledLine} ${LINE_HEIGHT}px
  )`

  useEffect(() => {
    setPrompt(getRandomPrompt())
  }, [])

  // Focus textarea when text overflows from left page
  useEffect(() => {
    if (focusTrigger > 0 && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      const len = textarea.value.length
      textarea.setSelectionRange(len, len)
    }
  }, [focusTrigger])

  // Arrow key navigation: only ArrowLeft at position 0 → left page
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowLeft') {
      const textarea = e.currentTarget
      if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
        e.preventDefault()
        onNavigateLeft?.()
      }
    }
  }, [onNavigateLeft])

  // Load doodle draft from localStorage
  useEffect(() => {
    if (isNewEntry) {
      try {
        const draft = localStorage.getItem(DOODLE_DRAFT_KEY)
        if (draft) {
          const parsed = JSON.parse(draft) as StrokeData[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDoodleStrokes(parsed)
          }
        }
      } catch (e) {
        console.error('Failed to load doodle draft:', e)
      }
    }
  }, [isNewEntry, setDoodleStrokes])

  const handleStrokesChange = useCallback((strokes: StrokeData[]) => {
    try {
      localStorage.setItem(DOODLE_DRAFT_KEY, JSON.stringify(strokes))
    } catch (e) {
      console.error('Failed to save doodle draft:', e)
    }
    setDoodleStrokes(strokes)
  }, [setDoodleStrokes])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    onPhotoAdd?.(position, dataUrl)
  }, [onPhotoAdd])

  const refreshPrompt = useCallback(() => {
    setPrompt(getRandomPrompt())
  }, [])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value

    // Enforce character limit (combined with left page)
    const totalChars = (leftPageText?.length || 0) + newText.length
    if (totalChars > JOURNAL.MAX_CHARS && newText.length > text.length) {
      return
    }

    // Use DOM measurement to check right page capacity
    const textarea = textareaRef.current
    if (textarea && newText.length > text.length) {
      const prevValue = textarea.value
      textarea.value = newText
      const overflows = textarea.scrollHeight > textarea.clientHeight + 1
      textarea.value = prevValue
      if (overflows) return // right page is full — no third page
    }

    setText(newText)
  }, [text, leftPageText, setText])

  const hasAnyText = text.trim().length > 0 || leftPageText.trim().length > 0

  const handleSave = useCallback(async () => {
    if (!text.trim() && !leftPageText.trim()) return

    setSaving(true)
    try {
      const doodlesToSave = currentDoodleStrokes.length > 0
        ? [{ strokes: currentDoodleStrokes }]
        : []

      // Combine left and right page text — NO page-break marker
      const leftHtml = leftPageText.trim() ? `<p>${leftPageText.replace(/\n/g, '</p><p>')}</p>` : ''
      const rightHtml = text.trim() ? `<p>${text.replace(/\n/g, '</p><p>')}</p>` : ''
      const combinedText = leftHtml && rightHtml
        ? `${leftHtml}${rightHtml}`
        : leftHtml || rightHtml

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: combinedText,
          mood: currentMood,
          song: currentSong || null,
          doodles: doodlesToSave,
          photos: photos.map(p => ({
            url: p.url,
            position: p.position,
            rotation: p.rotation,
            spread: 1,
          })),
        }),
      })

      if (res.ok) {
        setText('')
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        try {
          localStorage.removeItem(DOODLE_DRAFT_KEY)
        } catch (e) {
          console.error('Failed to clear doodle draft:', e)
        }

        onSaveComplete?.()
      } else {
        const statusCode = res.status
        let data: Record<string, unknown> = {}
        try {
          data = await res.json()
        } catch {
          // Response wasn't JSON
        }
        console.error(`Save failed [${statusCode}]:`, data)
        if (statusCode === 401) {
          alert('Session expired. Please refresh the page and log in again.')
        } else {
          alert(`Failed to save (${statusCode}): ${data.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      alert(`Failed to save entry: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setSaving(false)
    }
  }, [text, leftPageText, currentMood, currentSong, currentDoodleStrokes, photos, resetCurrentEntry, onSaveComplete, setText])

  if (isNewEntry) {
    const captionDate = entry?.createdAt ? new Date(entry.createdAt) : new Date()
    const dateCaption = captionDate
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      .toLowerCase()
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="h-full flex flex-col overflow-hidden"
      >
        {/* Photo Block */}
        <div className="mb-3 flex-shrink-0">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
            style={{ color: mutedColor }}
          >
            Add Photos
          </div>
          <PhotoBlock
            photos={photos}
            onPhotoAdd={handlePhotoAdd}
            dateCaption={dateCaption}
          />
        </div>

        {/* Writing Area with Prompt */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-start gap-2 mb-1 flex-shrink-0">
            <div
              className="text-xs italic flex-1 leading-relaxed"
              style={{ color: mutedColor }}
            >
              {prompt}
            </div>
            <button
              onClick={refreshPrompt}
              className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: accentColor }}
              title="New prompt"
            >
              ↻
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Begin writing..."
            className="flex-1 min-h-0 w-full resize-none outline-none"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              fontSize: '20px',
              lineHeight: `${LINE_HEIGHT}px`,
              caretColor: accentColor,
              backgroundColor: 'transparent',
              backgroundImage: linePattern,
              backgroundAttachment: 'local',
              overflow: 'hidden',
            }}
          />
        </div>

        {/* Doodle Area */}
        <div className="mt-2 flex-shrink-0" style={{ height: '140px' }}>
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium"
            style={{ color: mutedColor }}
          >
            Draw
          </div>
          <div style={{ height: '120px' }}>
            <CompactDoodleCanvas
              strokes={currentDoodleStrokes}
              onStrokesChange={handleStrokesChange}
              doodleColors={[theme.text.primary, theme.accent.primary, theme.accent.warm, theme.text.muted]}
              canvasBackground={colors.doodleBg}
              canvasBorder={colors.doodleBorder}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-2 flex justify-between items-center flex-shrink-0">
          <div className="text-xs" style={{ color: mutedColor }}>
            {(text.length + leftPageText.length) > 0 && `${text.length + leftPageText.length} chars`}
          </div>

          <AnimatePresence mode="wait">
            {hasAnyText ? (
              <motion.button
                key="save"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-full text-sm font-medium"
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
      </motion.div>
    )
  }

  // Viewing existing entry - dynamic split at render time
  const fullText = entry?.text || ''
  const fullPlainText = htmlToPlainText(fullText)
  const [, rightPlainText] = splitTextForSpread(fullPlainText)
  const plainText = rightPlainText

  const entryPhotos = entry?.photos || []
  const entryDoodle = entry?.doodles?.[0]

  const captionDate = entry?.createdAt ? new Date(entry.createdAt) : new Date()
  const dateCaption = captionDate
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toLowerCase()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Photos — same UI as new entry template */}
      <div className="mb-3 flex-shrink-0">
        <div
          className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
          style={{ color: mutedColor }}
        >
          {entryPhotos.length > 0 ? 'Photos' : 'Add Photos'}
        </div>
        <PhotoBlock
          photos={entryPhotos}
          disabled
          dateCaption={dateCaption}
        />
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
          backgroundImage: linePattern,
          backgroundAttachment: 'local',
        }}
      >
        {plainText || (
          <span style={{ color: mutedColor, fontStyle: 'italic' }}>
            No text content
          </span>
        )}
      </div>

      {/* Doodle — same UI as new entry template */}
      <div className="mt-2 flex-shrink-0" style={{ height: '140px' }}>
        <div
          className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium"
          style={{ color: mutedColor }}
        >
          {entryDoodle?.strokes && entryDoodle.strokes.length > 0 ? 'Doodle' : 'Draw'}
        </div>
        <div style={{ height: '120px' }}>
          {entryDoodle?.strokes && entryDoodle.strokes.length > 0 ? (
            <DoodlePreview
              strokes={entryDoodle.strokes}
              canvasBackground={colors.doodleBg}
              canvasBorder={colors.doodleBorder}
            />
          ) : (
            <div
              className="h-full relative rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                background: colors.doodleBg,
                border: `1px solid ${colors.doodleBorder}`,
              }}
            >
              <span className="text-[10px]" style={{ color: mutedColor, opacity: 0.5 }}>Draw here</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t flex-shrink-0" style={{ borderColor: `${mutedColor}20` }}>
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
