// src/components/shelf/EmptyMonthSpine.tsx
'use client'

import { monthLabel, spineColor } from './shelfPalette'

interface EmptyMonthSpineProps {
  monthIndex: number
}

const SPINE_WIDTH = 56
const SPINE_HEIGHT = 280

// Faded ghost-book that matches a real spine's silhouette so an empty year
// still reads as a "full shelf with months waiting to be filled" rather than
// an empty cabinet with grey blocks.
export default function EmptyMonthSpine({ monthIndex }: EmptyMonthSpineProps) {
  const color = spineColor(monthIndex)
  const label = monthLabel(monthIndex)

  return (
    <div
      aria-hidden="true"
      title={`no entries in ${label}`}
      style={{
        width: `${SPINE_WIDTH}px`,
        height: `${SPINE_HEIGHT}px`,
        background: `linear-gradient(180deg, ${color} 0%, ${color} 92%, rgba(0,0,0,0.2) 100%)`,
        borderRadius: '3px 3px 2px 2px',
        boxShadow:
          'inset 1px 0 0 rgba(255,255,255,0.06), inset -2px 0 0 rgba(0,0,0,0.18), 0 3px 6px rgba(0,0,0,0.18)',
        opacity: 0.32,
      }}
      className="relative flex flex-col items-center justify-between py-4"
    >
      <div
        style={{
          width: '70%',
          height: '8px',
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 4px)',
          borderRadius: '1px',
        }}
      />
      <div
        className="flex-1 mx-1 my-2 flex items-center justify-center px-1 py-3"
        style={{
          background: 'rgba(248, 244, 232, 0.8)',
          color: '#2a241a',
          borderRadius: '2px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'Georgia, Palatino, serif',
          fontSize: '14px',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      <div style={{ height: 18 }} />
    </div>
  )
}
