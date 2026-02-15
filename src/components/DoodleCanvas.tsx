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

interface DoodleCanvasProps {
  onSave: (strokes: StrokeData[]) => void
  onClose: () => void
}

export default function DoodleCanvas({ onSave, onClose }: DoodleCanvasProps) {
  const { theme } = useThemeStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [strokes, setStrokes] = useState<StrokeData[]>([])
  const [activeBrush, setActiveBrush] = useState(1)
  const [isErasing, setIsErasing] = useState(false)

  const brushes = [
    { name: 'Pencil', color: theme.text.secondary, size: 3 },
    { name: 'Pen', color: theme.accent.warm, size: 5 },
    { name: 'Marker', color: theme.accent.primary, size: 12 },
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
    setCurrentPoints([point])
  }, [getPointFromEvent])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getPointFromEvent(e)
    setCurrentPoints(prev => [...prev, point])
  }, [isDrawing, getPointFromEvent])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPoints.length === 0) return
    setIsDrawing(false)

    if (!isErasing) {
      const brush = brushes[activeBrush]
      const newStroke: StrokeData = {
        points: currentPoints.map(p => [p.x, p.y, p.pressure || 0.5]),
        color: brush.color,
        size: brush.size,
      }
      setStrokes(prev => [...prev, newStroke])
    }

    setCurrentPoints([])
  }, [isDrawing, currentPoints, activeBrush, isErasing, brushes])

  const clearCanvas = () => {
    setStrokes([])
    setCurrentPoints([])
  }

  const handleSave = () => {
    onSave(strokes)
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

    return <path d={pathData} fill={brush.color} opacity={0.9} />
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
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.glass.border }}>
          <div className="flex gap-2">
            {brushes.map((brush, index) => (
              <button
                key={brush.name}
                onClick={() => { setActiveBrush(index); setIsErasing(false); }}
                className="px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: activeBrush === index && !isErasing ? brush.color + '30' : 'transparent',
                  border: `2px solid ${activeBrush === index && !isErasing ? brush.color : 'transparent'}`,
                  color: theme.text.primary,
                }}
              >
                {brush.name}
              </button>
            ))}
            <button
              onClick={() => setIsErasing(!isErasing)}
              className="px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                background: isErasing ? theme.accent.primary + '30' : 'transparent',
                border: `2px solid ${isErasing ? theme.accent.primary : 'transparent'}`,
                color: theme.text.primary,
              }}
            >
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

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative cursor-crosshair touch-none"
          style={{ height: '400px', background: 'rgba(0, 0, 0, 0.2)' }}
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
        <div className="flex justify-end gap-3 p-4 border-t" style={{ borderColor: theme.glass.border }}>
          <button
            onClick={onClose}
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
    </motion.div>
  )
}
