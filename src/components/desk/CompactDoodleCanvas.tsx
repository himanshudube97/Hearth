'use client'

import React, { memo, useState, useCallback, useRef } from 'react'
import { getStroke } from 'perfect-freehand'
import { StrokeData } from '@/store/journal'

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

interface CompactDoodleCanvasProps {
  strokes: StrokeData[]
  onStrokesChange: (strokes: StrokeData[]) => void
  doodleColors: string[]
  canvasBackground: string
  canvasBorder: string
  textColor: string
  mutedColor: string
}

const CompactDoodleCanvas = memo(function CompactDoodleCanvas({
  strokes,
  onStrokesChange,
  doodleColors,
  canvasBackground,
  canvasBorder,
  textColor,
  mutedColor,
}: CompactDoodleCanvasProps) {
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

export default CompactDoodleCanvas
