'use client'

import React, { useRef, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import { DoodleItemData, DoodleStroke } from '@/lib/scrapbook'

interface Props {
  item: DoodleItemData
  isEditing: boolean
  selected: boolean
  onChange: (next: DoodleItemData) => void
}

const VIEW_W = 800
const VIEW_H = 600

const PALETTE = [
  '#1a1a1a',
  '#a3413a',
  '#e88a3a',
  '#5a8a48',
  '#3a5a8a',
  '#7a3a8a',
]

const SIZES: Array<{ label: string; px: number }> = [
  { label: 'fine', px: 3 },
  { label: 'med', px: 7 },
  { label: 'thick', px: 14 },
]

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[],
  )
  d.push('Z')
  return d.join(' ')
}

export default function DoodleItem({
  item,
  isEditing,
  selected,
  onChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drawingRef = useRef<DoodleStroke | null>(null)
  const [color, setColor] = useState(PALETTE[0])
  const [size, setSize] = useState(7)
  // tick to force a re-render while drawing — strokes-in-progress live
  // in a ref (avoid setState per pointer-move), but the SVG needs to repaint.
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  function pointFromEvent(e: React.PointerEvent): [number, number, number] {
    const svg = svgRef.current
    if (!svg) return [0, 0, 0.5]
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VIEW_W
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_H
    const pressure = (e as unknown as { pressure?: number }).pressure
    return [x, y, pressure || 0.5]
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!isEditing) return
    e.stopPropagation()
    e.preventDefault()
    drawingRef.current = {
      points: [pointFromEvent(e)],
      color,
      size,
    }
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {}
    rerender()
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!isEditing || !drawingRef.current) return
    e.stopPropagation()
    drawingRef.current.points.push(pointFromEvent(e))
    rerender()
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!isEditing || !drawingRef.current) return
    e.stopPropagation()
    try {
      ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
    } catch {}
    onChange({
      ...item,
      strokes: [...item.strokes, drawingRef.current],
    })
    drawingRef.current = null
    rerender()
  }

  function undo() {
    if (item.strokes.length === 0) return
    onChange({ ...item, strokes: item.strokes.slice(0, -1) })
  }

  function clear() {
    if (item.strokes.length === 0) return
    onChange({ ...item, strokes: [] })
  }

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: '#fefdf8',
        border: isEditing
          ? '1.5px solid rgba(58, 52, 41, 0.5)'
          : '1px solid rgba(58, 52, 41, 0.18)',
        borderRadius: 6,
        overflow: 'visible',
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 6,
          touchAction: isEditing ? 'none' : 'auto',
          cursor: isEditing ? 'crosshair' : 'inherit',
          background: '#fefdf8',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {item.strokes.map((s, i) => {
          const outline = getStroke(s.points as number[][], {
            size: s.size,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          })
          return <path key={i} d={getSvgPathFromStroke(outline)} fill={s.color} />
        })}
        {drawingRef.current && (
          <path
            d={getSvgPathFromStroke(
              getStroke(
                drawingRef.current.points as number[][],
                {
                  size: drawingRef.current.size,
                  thinning: 0.5,
                  smoothing: 0.5,
                  streamline: 0.5,
                },
              ),
            )}
            fill={drawingRef.current.color}
          />
        )}
      </svg>

      {/* Empty hint */}
      {item.strokes.length === 0 && !drawingRef.current && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            color: 'rgba(58, 52, 41, 0.42)',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 18,
            padding: 12,
            textAlign: 'center',
          }}
        >
          {isEditing ? 'draw here ✎' : selected ? 'tap to draw' : ''}
        </div>
      )}

      {/* Floating toolbar — only when in edit mode */}
      {isEditing && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 10,
            background: '#fefaf0',
            border: '1px solid rgba(58, 52, 41, 0.18)',
            boxShadow: '0 6px 18px rgba(20, 14, 4, 0.25)',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title="color"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: c,
                border:
                  c === color
                    ? '2px solid #3a3429'
                    : '1px solid rgba(0,0,0,0.18)',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}

          <Divider />

          {SIZES.map((s) => (
            <button
              key={s.px}
              onClick={() => setSize(s.px)}
              title={s.label}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: size === s.px ? '#3a3429' : 'transparent',
                border: '1px solid rgba(58, 52, 41, 0.22)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: Math.min(s.px, 12),
                  height: Math.min(s.px, 12),
                  borderRadius: '50%',
                  background: size === s.px ? '#f4ecd8' : '#3a3429',
                }}
              />
            </button>
          ))}

          <Divider />

          <ToolbarMicroBtn
            label="↶"
            disabled={item.strokes.length === 0}
            onClick={undo}
            title="undo"
          />
          <ToolbarMicroBtn
            label="✕"
            disabled={item.strokes.length === 0}
            onClick={clear}
            title="clear all"
          />
        </div>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 18,
        background: 'rgba(58, 52, 41, 0.18)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  )
}

function ToolbarMicroBtn({
  label,
  onClick,
  disabled,
  title,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  title: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26,
        height: 22,
        borderRadius: 6,
        background: 'transparent',
        border: '1px solid rgba(58, 52, 41, 0.22)',
        color: disabled ? 'rgba(58, 52, 41, 0.3)' : '#3a3429',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontFamily: 'var(--font-caveat), cursive',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}
