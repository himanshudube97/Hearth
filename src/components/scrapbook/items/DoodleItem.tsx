'use client'

import React from 'react'
import { getStroke } from 'perfect-freehand'
import { DoodleItemData, DoodleStroke } from '@/lib/scrapbook'

interface Props {
  item: DoodleItemData
  selected: boolean
  onRequestEdit: () => void
}

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

function bounds(strokes: DoodleStroke[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let hasPoints = false
  strokes.forEach((s) => {
    s.points.forEach(([x, y]) => {
      hasPoints = true
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    })
  })
  if (!hasPoints) return null
  const padding = 20
  return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`
}

export default function DoodleItem({ item, selected, onRequestEdit }: Props) {
  const viewBox = bounds(item.strokes)

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation()
        onRequestEdit()
      }}
      className="w-full h-full relative"
      style={{
        background: '#fefdf8',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: selected ? 'pointer' : 'inherit',
      }}
      title={selected ? 'Double-click to edit' : undefined}
    >
      {viewBox ? (
        <svg viewBox={viewBox} className="w-full h-full">
          {item.strokes.map((s, i) => {
            const outline = getStroke(s.points as [number, number, number?][], {
              size: s.size,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
            })
            return (
              <path key={i} d={getSvgPathFromStroke(outline)} fill={s.color} />
            )
          })}
        </svg>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{
            color: 'rgba(58, 52, 41, 0.4)',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 18,
            padding: 12,
          }}
        >
          double-click to draw
        </div>
      )}
    </div>
  )
}
