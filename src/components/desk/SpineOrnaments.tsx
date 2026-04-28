'use client'

import { GlassDiaryColors } from '@/lib/glassDiaryColors'

interface SpineOrnamentsProps {
  colors: GlassDiaryColors
}

const SPINE_WIDTH = 24
const RING_HEIGHT = 7
const RING_TOP_PCTS = [12, 30, 50, 70, 88]

export default function SpineOrnaments({ colors }: SpineOrnamentsProps) {
  return (
    <div
      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ width: `${SPINE_WIDTH}px` }}
    >
      {/* Kraft band — slim, full height of the spread */}
      <div
        className="absolute inset-0"
        style={{
          background: colors.spineGradient,
          boxShadow: [
            'inset 2px 0 4px rgba(0,0,0,0.18)',
            'inset -2px 0 4px rgba(0,0,0,0.18)',
            '-2px 0 6px rgba(0,0,0,0.22)',
            '2px 0 6px rgba(0,0,0,0.22)',
          ].join(', '),
        }}
      />
      {/* Faint kraft fiber lines */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 1px,
            rgba(0,0,0,0.06) 1px,
            rgba(0,0,0,0.06) 2px
          )`,
        }}
      />

      {/* Spiral binding rings — capsule shapes, width matches spine */}
      {RING_TOP_PCTS.map((topPct, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${topPct}%`,
            left: 0,
            width: `${SPINE_WIDTH}px`,
            height: `${RING_HEIGHT}px`,
            transform: 'translateY(-50%)',
            borderRadius: '999px',
            background: `linear-gradient(180deg, ${colors.date} 0%, ${colors.sectionLabel} 45%, ${colors.cover} 100%)`,
            boxShadow: [
              '0 1px 2px rgba(0,0,0,0.45)',
              'inset 0 -1px 1px rgba(0,0,0,0.32)',
              'inset 0 1px 1px rgba(255,255,255,0.22)',
            ].join(', '),
          }}
        />
      ))}
    </div>
  )
}
