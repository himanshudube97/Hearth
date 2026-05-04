'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useThemeStore } from '@/store/theme'
import { StrokeData } from '@/store/journal'

interface Point {
  x: number
  y: number
  pressure?: number
}

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

// Check if a point is near a stroke
function isPointNearStroke(point: Point, strokePoints: number[][], threshold: number): boolean {
  for (const [sx, sy] of strokePoints) {
    const distance = Math.sqrt((point.x - sx) ** 2 + (point.y - sy) ** 2)
    if (distance < threshold) return true
  }
  return false
}

// Color palette options
const COLOR_PALETTE = [
  '#1a1a1a', // Black
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
]

interface DoodleCanvasProps {
  onSave: (strokes: StrokeData[]) => void
  onClose: () => void
  initialStrokes?: StrokeData[]
  /** When true, renders inline (fills parent) instead of as a fixed full-screen overlay */
  inline?: boolean
}

export default function DoodleCanvas({ onSave, onClose, initialStrokes, inline = false }: DoodleCanvasProps) {
  const { theme } = useThemeStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [strokes, setStrokes] = useState<StrokeData[]>(
    () => initialStrokes && initialStrokes.length > 0 ? [...initialStrokes] : []
  )
  const [activeBrush, setActiveBrush] = useState(1)
  const [isErasing, setIsErasing] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const brushes = [
    { name: 'Pencil', size: 3 },
    { name: 'Pen', size: 5 },
    { name: 'Marker', size: 12 },
  ]

  // Get current brush color (custom color or theme default)
  const getCurrentColor = () => {
    if (selectedColor) return selectedColor
    const defaultColors = [theme.text.secondary, theme.accent.warm, theme.accent.primary]
    return defaultColors[activeBrush]
  }

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
      // Erase on initial click too
      const eraserRadius = 20
      setStrokes(prev => prev.filter(stroke => !isPointNearStroke(point, stroke.points, eraserRadius)))
    } else {
      setCurrentPoints([point])
    }
  }, [getPointFromEvent, isErasing])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getPointFromEvent(e)

    if (isErasing) {
      // Erase strokes that the eraser touches
      const eraserRadius = 20
      setStrokes(prev => prev.filter(stroke => !isPointNearStroke(point, stroke.points, eraserRadius)))
    } else {
      setCurrentPoints(prev => [...prev, point])
    }
  }, [isDrawing, getPointFromEvent, isErasing])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (!isErasing && currentPoints.length > 0) {
      const brush = brushes[activeBrush]
      const newStroke: StrokeData = {
        points: currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
        color: getCurrentColor(),
        size: brush.size,
      }
      setStrokes(prev => [...prev, newStroke])
    }

    setCurrentPoints([])
  }, [isDrawing, currentPoints, activeBrush, isErasing, getCurrentColor])

  const clearCanvas = () => {
    setStrokes([])
    setCurrentPoints([])
  }

  const handleSave = () => {
    onSave(strokes)
  }

  const handleClose = () => {
    onClose()
  }

  const renderStroke = (strokeData: StrokeData, index: number) => {
    const outlinePoints = getStroke(strokeData.points, {
      size: strokeData.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
    const pathData = getSvgPathFromStroke(outlinePoints)

    return (
      <path
        key={index}
        d={pathData}
        fill={strokeData.color}
        opacity={0.9}
      />
    )
  }

  const renderCurrentStroke = () => {
    if (currentPoints.length === 0 || isErasing) return null

    const brush = brushes[activeBrush]
    const outlinePoints = getStroke(
      currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
      {
        size: brush.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      }
    )
    const pathData = getSvgPathFromStroke(outlinePoints)

    return <path d={pathData} fill={getCurrentColor()} opacity={0.9} />
  }

  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 8,
          overflow: 'hidden',
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-2 p-2 border-b" style={{ borderColor: theme.glass.border }}>
          {/* Brushes and Eraser */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {brushes.map((brush, index) => (
                <button
                  key={brush.name}
                  onClick={() => { setActiveBrush(index); setIsErasing(false); }}
                  className="px-2 py-1 rounded text-xs transition-all"
                  style={{
                    background: activeBrush === index && !isErasing ? getCurrentColor() + '30' : 'transparent',
                    border: `2px solid ${activeBrush === index && !isErasing ? getCurrentColor() : 'transparent'}`,
                    color: theme.text.primary,
                  }}
                >
                  {brush.name}
                </button>
              ))}
              <button
                onClick={() => setIsErasing(!isErasing)}
                className="px-2 py-1 rounded text-xs transition-all"
                style={{
                  background: isErasing ? theme.accent.primary + '30' : 'transparent',
                  border: `2px solid ${isErasing ? theme.accent.primary : 'transparent'}`,
                  color: theme.text.primary,
                }}
              >
                ⌫ Erase
              </button>
            </div>
            <button
              onClick={clearCanvas}
              className="px-2 py-1 rounded text-xs"
              style={{ color: theme.text.muted }}
            >
              Clear
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1 flex-wrap">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); setIsErasing(false); }}
                className="w-5 h-5 rounded-full transition-all hover:scale-110"
                style={{
                  background: color,
                  border: selectedColor === color
                    ? `3px solid ${theme.accent.primary}`
                    : `2px solid ${theme.glass.border}`,
                  boxShadow: selectedColor === color ? `0 0 0 2px ${theme.bg.primary}` : 'none',
                }}
                title={color}
              />
            ))}
            <button
              onClick={() => { setSelectedColor(null); setIsErasing(false); }}
              className="w-5 h-5 rounded-full transition-all hover:scale-110 flex items-center justify-center text-xs"
              style={{
                background: selectedColor === null ? getCurrentColor() : 'transparent',
                border: selectedColor === null
                  ? `3px solid ${theme.accent.primary}`
                  : `2px dashed ${theme.glass.border}`,
                color: theme.text.muted,
              }}
              title="Theme default"
            >
              {selectedColor === null ? '' : 'T'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative touch-none flex-1"
          style={{
            background: 'rgba(0, 0, 0, 0.08)',
            cursor: isErasing ? 'cell' : 'crosshair',
            minHeight: 0,
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-2 border-t" style={{ borderColor: theme.glass.border }}>
          <button
            onClick={handleClose}
            className="px-3 py-1 rounded text-xs"
            style={{ color: theme.text.muted }}
          >
            close
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{
              background: theme.accent.primary,
              color: theme.bg.primary,
            }}
          >
            save
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: `${theme.bg.primary}e6` }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 border-b" style={{ borderColor: theme.glass.border }}>
          {/* Brushes and Eraser */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {brushes.map((brush, index) => (
                <button
                  key={brush.name}
                  onClick={() => { setActiveBrush(index); setIsErasing(false); }}
                  className="px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: activeBrush === index && !isErasing ? getCurrentColor() + '30' : 'transparent',
                    border: `2px solid ${activeBrush === index && !isErasing ? getCurrentColor() : 'transparent'}`,
                    color: theme.text.primary,
                  }}
                >
                  {brush.name}
                </button>
              ))}
              <button
                onClick={() => setIsErasing(!isErasing)}
                className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                style={{
                  background: isErasing ? theme.accent.primary + '30' : 'transparent',
                  border: `2px solid ${isErasing ? theme.accent.primary : 'transparent'}`,
                  color: theme.text.primary,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20H7L3 16c-.5-.5-.5-1.5 0-2l10-10c.5-.5 1.5-.5 2 0l7 7c.5.5.5 1.5 0 2l-8 8" />
                  <path d="M18 13.5l-6.5-6.5" />
                </svg>
                Eraser
              </button>
            </div>
            <button
              onClick={clearCanvas}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ color: theme.text.muted }}
            >
              Clear
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: theme.text.muted }}>Colors:</span>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); setIsErasing(false); }}
                  className="w-6 h-6 rounded-full transition-all hover:scale-110"
                  style={{
                    background: color,
                    border: selectedColor === color
                      ? `3px solid ${theme.accent.primary}`
                      : `2px solid ${theme.glass.border}`,
                    boxShadow: selectedColor === color ? `0 0 0 2px ${theme.bg.primary}` : 'none',
                  }}
                  title={color}
                />
              ))}
              {/* Reset to theme default */}
              <button
                onClick={() => { setSelectedColor(null); setIsErasing(false); }}
                className="w-6 h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center text-xs"
                style={{
                  background: selectedColor === null ? getCurrentColor() : 'transparent',
                  border: selectedColor === null
                    ? `3px solid ${theme.accent.primary}`
                    : `2px dashed ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
                title="Theme default"
              >
                {selectedColor === null ? '' : 'T'}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative touch-none"
          style={{
            height: '400px',
            background: 'rgba(0, 0, 0, 0.2)',
            cursor: isErasing ? 'cell' : 'crosshair',
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end p-4 border-t" style={{ borderColor: theme.glass.border }}>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: theme.text.muted }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
              }}
            >
              Embed Doodle
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
