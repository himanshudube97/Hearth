'use client'

import { getStroke } from 'perfect-freehand'
import { StrokeData } from '@/store/journal'
import { useThemeStore } from '@/store/theme'

interface DoodlePreviewProps {
  strokes: StrokeData[]
  size?: number
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

export default function DoodlePreview({ strokes, size = 100 }: DoodlePreviewProps) {
  const { theme } = useThemeStore()

  if (!strokes || strokes.length === 0) return null

  // Calculate bounds for viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach(stroke => {
    stroke.points.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
  })

  const padding = 20
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        width: size,
        height: size,
        background: 'rgba(0, 0, 0, 0.2)',
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <svg viewBox={viewBox} className="w-full h-full">
        {strokes.map((strokeData, index) => {
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
        })}
      </svg>
    </div>
  )
}
