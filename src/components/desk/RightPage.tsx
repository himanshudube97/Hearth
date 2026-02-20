'use client'

import React, { memo, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes, DiaryTheme } from '@/lib/diaryThemes'
import { useJournalStore, StrokeData } from '@/store/journal'
import { getRandomPrompt } from '@/lib/themes'
import PhotoBlock from './PhotoBlock'

const LINE_HEIGHT = 32
const DOODLE_DRAFT_KEY = 'hearth_desk_doodle_draft'

// Helper to get line pattern
function getLinePattern(diaryTheme: DiaryTheme): string {
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

interface Point {
  x: number
  y: number
  pressure?: number
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
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  leftPageText?: string
  consumeOverflow?: () => string
}

// Compact Doodle Canvas
const CompactDoodleCanvas = memo(function CompactDoodleCanvas({
  strokes,
  onStrokesChange,
  doodleColors,
  canvasBackground,
  canvasBorder,
  textColor,
  mutedColor,
}: {
  strokes: StrokeData[]
  onStrokesChange: (strokes: StrokeData[]) => void
  doodleColors: string[]
  canvasBackground: string
  canvasBorder: string
  textColor: string
  mutedColor: string
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [localStrokes, setLocalStrokes] = useState<StrokeData[]>(strokes)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [activeBrush, setActiveBrush] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>(doodleColors[0])

  const brushes = [
    { name: 'S', size: 2 },
    { name: 'M', size: 4 },
    { name: 'L', size: 8 },
  ]

  const getPointFromEvent = useCallback((e: React.PointerEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    setCurrentPoints([getPointFromEvent(e)])
  }, [getPointFromEvent])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    setCurrentPoints(prev => [...prev, getPointFromEvent(e)])
  }, [isDrawing, getPointFromEvent])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentPoints.length > 0) {
      const brush = brushes[activeBrush]
      const newStroke: StrokeData = {
        points: currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
        color: selectedColor,
        size: brush.size,
      }
      const newStrokes = [...localStrokes, newStroke]
      setLocalStrokes(newStrokes)
      onStrokesChange(newStrokes)
    }

    setCurrentPoints([])
  }, [isDrawing, currentPoints, activeBrush, selectedColor, localStrokes, onStrokesChange, brushes])

  const clearCanvas = () => {
    setLocalStrokes([])
    setCurrentPoints([])
    onStrokesChange([])
  }

  const renderStroke = (strokeData: StrokeData, index: number) => {
    const outlinePoints = getStroke(strokeData.points, {
      size: strokeData.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
    const pathData = getSvgPathFromStroke(outlinePoints)
    return <path key={index} d={pathData} fill={strokeData.color} opacity={0.9} />
  }

  const renderCurrentStroke = () => {
    if (currentPoints.length === 0) return null
    const brush = brushes[activeBrush]
    const outlinePoints = getStroke(
      currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
      { size: brush.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }
    )
    const pathData = getSvgPathFromStroke(outlinePoints)
    return <path d={pathData} fill={selectedColor} opacity={0.9} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact Toolbar */}
      <div className="flex items-center gap-1 mb-1">
        {brushes.map((brush, index) => (
          <button
            key={brush.name}
            onClick={() => setActiveBrush(index)}
            className="w-6 h-6 rounded text-[10px] transition-all"
            style={{
              background: activeBrush === index ? `${selectedColor}20` : 'rgba(0,0,0,0.03)',
              border: activeBrush === index ? `1px solid ${selectedColor}` : '1px solid rgba(0,0,0,0.08)',
              color: textColor,
            }}
          >
            {brush.name}
          </button>
        ))}
        <div className="flex-1" />
        {doodleColors.slice(0, 4).map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className="w-4 h-4 rounded-full transition-all"
            style={{
              background: color,
              border: selectedColor === color ? '2px solid rgba(0,0,0,0.3)' : '1px solid rgba(0,0,0,0.1)',
              transform: selectedColor === color ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
        <button
          onClick={clearCanvas}
          className="text-[10px] ml-1"
          style={{ color: mutedColor }}
        >
          ×
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative touch-none rounded-lg overflow-hidden"
        style={{
          background: canvasBackground,
          border: `1px solid ${canvasBorder}`,
          cursor: 'crosshair',
          minHeight: '100px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg className="absolute inset-0 w-full h-full">
          {localStrokes.map((stroke, index) => renderStroke(stroke, index))}
          {renderCurrentStroke()}
        </svg>
        {localStrokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px]" style={{ color: mutedColor, opacity: 0.5 }}>Draw here</span>
          </div>
        )}
      </div>
    </div>
  )
})

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
  textareaRef,
  leftPageText = '',
  consumeOverflow,
}: RightPageProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentMood, currentSong, currentDoodleStrokes, setDoodleStrokes, resetCurrentEntry } = useJournalStore()
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [isPageFull, setIsPageFull] = useState(false)
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)

  const accentColor = theme.accent.warm
  const isGlass = currentDiaryTheme === 'glass'
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const linePattern = getLinePattern(diaryTheme)

  // Use external ref if provided, otherwise internal
  const actualTextareaRef = textareaRef || internalTextareaRef

  useEffect(() => {
    setPrompt(getRandomPrompt())
  }, [])

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

  // Overflow detection for right page textarea - same pattern as left page
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const textarea = actualTextareaRef.current

    // When adding text, check overflow BEFORE accepting
    if (newText.length > text.length && textarea) {
      if (textarea.scrollHeight > textarea.clientHeight + 2) {
        setIsPageFull(true)
        return // Reject - page is full
      }
    }

    // When deleting, allow and check if page is no longer full
    if (newText.length < text.length && isPageFull) {
      setIsPageFull(false)
    }

    setText(newText)
  }, [text, isPageFull, actualTextareaRef])

  // When focused from auto-switch, consume any overflow characters from the left page
  const handleTextareaFocus = useCallback(() => {
    const overflow = consumeOverflow?.()
    if (overflow) {
      setText(prev => prev + overflow)
    }
  }, [consumeOverflow])

  const hasAnyText = text.trim().length > 0 || leftPageText.trim().length > 0

  const handleSave = useCallback(async () => {
    if (!text.trim() && !leftPageText.trim()) return

    setSaving(true)
    try {
      const doodlesToSave = currentDoodleStrokes.length > 0
        ? [{ strokes: currentDoodleStrokes }]
        : []

      // Combine left and right page text with page-break marker
      const leftHtml = leftPageText.trim() ? `<p>${leftPageText.replace(/\n/g, '</p><p>')}</p>` : ''
      const rightHtml = text.trim() ? `<p>${text.replace(/\n/g, '</p><p>')}</p>` : ''
      const combinedText = leftHtml && rightHtml
        ? `${leftHtml}<!--page-break-->${rightHtml}`
        : leftHtml || rightHtml

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: combinedText,
          mood: currentMood,
          song: currentSong || null,
          doodles: doodlesToSave,
          photos,
        }),
      })

      if (res.ok) {
        setText('')
        setIsPageFull(false)
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        try {
          localStorage.removeItem(DOODLE_DRAFT_KEY)
        } catch (e) {
          console.error('Failed to clear doodle draft:', e)
        }

        onSaveComplete?.()
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
  }, [text, leftPageText, currentMood, currentSong, currentDoodleStrokes, photos, resetCurrentEntry, onSaveComplete])

  if (isNewEntry) {
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
            ref={actualTextareaRef}
            value={text}
            onChange={handleTextChange}
            onFocus={handleTextareaFocus}
            placeholder="Begin writing..."
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
              doodleColors={isGlass ? [theme.text.primary, theme.accent.primary, theme.accent.warm, theme.text.muted] : diaryTheme.doodle.defaultColors}
              canvasBackground={isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground}
              canvasBorder={isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}
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

  // Viewing existing entry - show only right page text (after page-break marker)
  const fullText = entry?.text || ''
  const pageBreakMarker = '<!--page-break-->'
  const pageBreakIdx = fullText.indexOf(pageBreakMarker)
  const rightRawText = pageBreakIdx >= 0
    ? fullText.substring(pageBreakIdx + pageBreakMarker.length)
    : '' // No marker = old entry, right page has no separate text

  const plainText = rightRawText
    ? rightRawText
        .replace(/<\/p><p>/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
    : ''

  const entryPhotos = entry?.photos || []
  const entryDoodle = entry?.doodles?.[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Photos */}
      {entryPhotos.length > 0 && (
        <div className="mb-3 flex-shrink-0">
          <PhotoBlock
            photos={entryPhotos}
            disabled
          />
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

      {/* Doodle preview */}
      {entryDoodle?.strokes && entryDoodle.strokes.length > 0 && (
        <div className="mt-2 flex-shrink-0">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium"
            style={{ color: mutedColor }}
          >
            Doodle
          </div>
          <DoodlePreview
            strokes={entryDoodle.strokes}
            canvasBackground={isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground}
            canvasBorder={isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}
          />
        </div>
      )}

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
