'use client'

import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import { useJournalStore, StrokeData } from '@/store/journal'
import SongEmbed from '@/components/SongEmbed'

const DOODLE_DRAFT_KEY = 'hearth_desk_doodle_draft'

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface LeftPageProps {
  entry: Entry | null
  isNewEntry: boolean
  spreadDate: Date
}

interface Point {
  x: number
  y: number
  pressure?: number
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

// Check if point is near a stroke for erasing
function isPointNearStroke(point: Point, strokePoints: number[][], threshold: number): boolean {
  for (const [sx, sy] of strokePoints) {
    const distance = Math.sqrt((point.x - sx) ** 2 + (point.y - sy) ** 2)
    if (distance < threshold) return true
  }
  return false
}

// Inline Doodle Canvas Component
const InlineDoodleCanvas = memo(function InlineDoodleCanvas({
  strokes,
  setStrokes,
  onStrokesChange,
  doodleColors,
  canvasBackground,
  canvasBorder,
  textColor,
  mutedColor,
}: {
  strokes: StrokeData[]
  setStrokes: React.Dispatch<React.SetStateAction<StrokeData[]>>
  onStrokesChange: (strokes: StrokeData[]) => void
  doodleColors: string[]
  canvasBackground: string
  canvasBorder: string
  textColor: string
  mutedColor: string
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [activeBrush, setActiveBrush] = useState(1)
  const [isErasing, setIsErasing] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(doodleColors[0])

  const brushes = [
    { name: 'Fine', size: 2 },
    { name: 'Medium', size: 4 },
    { name: 'Bold', size: 8 },
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
    const point = getPointFromEvent(e)

    if (isErasing) {
      const eraserRadius = 15
      const newStrokes = strokes.filter(stroke => !isPointNearStroke(point, stroke.points, eraserRadius))
      setStrokes(newStrokes)
      onStrokesChange(newStrokes)
    } else {
      setCurrentPoints([point])
    }
  }, [getPointFromEvent, isErasing, strokes, setStrokes, onStrokesChange])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getPointFromEvent(e)

    if (isErasing) {
      const eraserRadius = 15
      const newStrokes = strokes.filter(stroke => !isPointNearStroke(point, stroke.points, eraserRadius))
      setStrokes(newStrokes)
      onStrokesChange(newStrokes)
    } else {
      setCurrentPoints(prev => [...prev, point])
    }
  }, [isDrawing, getPointFromEvent, isErasing, strokes, setStrokes, onStrokesChange])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (!isErasing && currentPoints.length > 0) {
      const brush = brushes[activeBrush]
      const newStroke: StrokeData = {
        points: currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
        color: selectedColor,
        size: brush.size,
      }
      const newStrokes = [...strokes, newStroke]
      setStrokes(newStrokes)
      onStrokesChange(newStrokes)
    }

    setCurrentPoints([])
  }, [isDrawing, currentPoints, activeBrush, isErasing, selectedColor, strokes, setStrokes, onStrokesChange, brushes])

  const clearCanvas = () => {
    setStrokes([])
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
    if (currentPoints.length === 0 || isErasing) return null
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
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* Brushes */}
        {brushes.map((brush, index) => (
          <button
            key={brush.name}
            onClick={() => { setActiveBrush(index); setIsErasing(false) }}
            className="px-2 py-1 rounded text-[10px] transition-all"
            style={{
              background: activeBrush === index && !isErasing ? `${selectedColor}20` : 'rgba(0,0,0,0.03)',
              border: activeBrush === index && !isErasing ? `1px solid ${selectedColor}` : '1px solid rgba(0,0,0,0.08)',
              color: textColor,
            }}
          >
            {brush.name}
          </button>
        ))}
        <button
          onClick={() => setIsErasing(!isErasing)}
          className="px-2 py-1 rounded text-[10px] transition-all"
          style={{
            background: isErasing ? 'rgba(200,100,100,0.2)' : 'rgba(0,0,0,0.03)',
            border: isErasing ? '1px solid rgba(200,100,100,0.5)' : '1px solid rgba(0,0,0,0.08)',
            color: textColor,
          }}
        >
          Erase
        </button>
        <button
          onClick={clearCanvas}
          className="px-2 py-1 rounded text-[10px] ml-auto"
          style={{ color: mutedColor }}
        >
          Clear
        </button>
      </div>

      {/* Color palette */}
      <div className="flex items-center gap-1 mb-2">
        {doodleColors.map((color) => (
          <button
            key={color}
            onClick={() => { setSelectedColor(color); setIsErasing(false) }}
            className="w-5 h-5 rounded-full transition-all"
            style={{
              background: color,
              border: selectedColor === color ? '2px solid rgba(0,0,0,0.3)' : '1px solid rgba(0,0,0,0.1)',
              transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative touch-none rounded-lg overflow-hidden"
        style={{
          background: canvasBackground,
          border: `1px solid ${canvasBorder}`,
          cursor: isErasing ? 'cell' : 'crosshair',
          minHeight: '180px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg className="absolute inset-0 w-full h-full">
          {strokes.map((stroke, index) => renderStroke(stroke, index))}
          {renderCurrentStroke()}
        </svg>
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs" style={{ color: mutedColor, opacity: 0.5 }}>Draw here...</span>
          </div>
        )}
      </div>
    </div>
  )
})

// Doodle Preview Component for viewing existing doodles
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

  // Calculate bounds
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
      className="h-48 rounded-lg overflow-hidden"
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

const LeftPage = memo(function LeftPage({ entry, isNewEntry, spreadDate }: LeftPageProps) {
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentMood, setCurrentMood, currentSong, setCurrentSong, currentDoodleStrokes, setDoodleStrokes } = useJournalStore()
  const [songInput, setSongInput] = useState(entry?.song || currentSong || '')
  const [localStrokes, setLocalStrokes] = useState<StrokeData[]>([])

  const accentColor = theme.accent.warm
  const isGlass = currentDiaryTheme === 'glass'

  // Use theme colors for glass, diary theme colors otherwise
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor

  // Load doodle draft from localStorage on mount
  useEffect(() => {
    if (isNewEntry) {
      try {
        const draft = localStorage.getItem(DOODLE_DRAFT_KEY)
        if (draft) {
          const parsed = JSON.parse(draft) as StrokeData[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalStrokes(parsed)
            // Also update journal store so RightPage can access strokes on save
            setDoodleStrokes(parsed)
            console.log('[LeftPage] Loaded doodle draft:', parsed.length, 'strokes')
          }
        }
      } catch (e) {
        console.error('Failed to load doodle draft:', e)
      }
    }
  }, [isNewEntry, setDoodleStrokes])

  // Clear local strokes when journal store is reset (after save)
  useEffect(() => {
    if (isNewEntry && currentDoodleStrokes.length === 0 && localStrokes.length > 0) {
      console.log('[LeftPage] Clearing local strokes after save')
      setLocalStrokes([])
    }
  }, [isNewEntry, currentDoodleStrokes.length, localStrokes.length])

  // Save doodle strokes to localStorage and journal store
  const handleStrokesChange = useCallback((strokes: StrokeData[]) => {
    console.log('[LeftPage] Strokes changed:', strokes.length, 'strokes')
    try {
      localStorage.setItem(DOODLE_DRAFT_KEY, JSON.stringify(strokes))
    } catch (e) {
      console.error('Failed to save doodle draft:', e)
    }
    // Update journal store with all strokes at once
    setDoodleStrokes(strokes)
  }, [setDoodleStrokes])

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

  if (isNewEntry) {
    // New entry mode - show media input options
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="h-full flex flex-col"
      >
        {/* Mood Section - Compact */}
        <div className="mb-4">
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
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg relative"
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

        {/* Song Section */}
        <div className="mb-4">
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

        {/* Doodle Section - Inline Canvas */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
            style={{ color: mutedColor }}
          >
            Draw Something
          </div>
          <div className="flex-1 min-h-0">
            <InlineDoodleCanvas
              strokes={localStrokes}
              setStrokes={setLocalStrokes}
              onStrokesChange={handleStrokesChange}
              doodleColors={isGlass ? [theme.text.primary, theme.text.secondary, theme.accent.primary, theme.accent.warm, theme.text.muted] : diaryTheme.doodle.defaultColors}
              canvasBackground={isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground}
              canvasBorder={isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  // Viewing existing entry - show saved media
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="h-full flex flex-col"
    >
      {/* Mood display */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{theme.moodEmojis[entry?.mood ?? 2]}</span>
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

      {/* Song display with embed */}
      {entry?.song && (
        <div className="mb-4">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
            style={{ color: mutedColor }}
          >
            Listening to
          </div>
          <SongEmbed url={entry.song} compact audioOnly />
        </div>
      )}

      {/* Doodle display */}
      {entry?.doodles && entry.doodles.length > 0 && entry.doodles[0]?.strokes && (
        <div className="flex-1 min-h-0">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
            style={{ color: mutedColor }}
          >
            Doodle
          </div>
          <DoodlePreview
            strokes={entry.doodles[0].strokes}
            canvasBackground={isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground}
            canvasBorder={isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}
          />
        </div>
      )}

      {/* Empty state if no media */}
      {!entry?.song && (!entry?.doodles || entry.doodles.length === 0) && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" style={{ color: mutedColor }}>
            <div className="text-3xl mb-3 opacity-30">📝</div>
            <div className="text-xs italic">No media attached</div>
          </div>
        </div>
      )}

      {/* Decorative flourish */}
      <div className="mt-auto pt-3 flex justify-center">
        <motion.div
          className="text-xl"
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
