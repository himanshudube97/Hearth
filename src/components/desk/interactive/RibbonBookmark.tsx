// src/components/desk/interactive/RibbonBookmark.tsx
'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RibbonBookmarkProps {
  color: string
  onClick?: () => void
  children?: ReactNode
}

const RIBBON_WIDTH = 22
const RIBBON_HEIGHT = 90
const CLASP_HEIGHT = 26

export function RibbonBookmark({ color, onClick, children }: RibbonBookmarkProps) {
  return (
    <motion.div
      className="absolute -top-2 right-8 z-40"
      onClick={onClick}
      animate={{ rotateZ: [-0.6, 0.6, -0.6] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        transformOrigin: 'top center',
        cursor: onClick ? 'pointer' : 'default',
        width: `${RIBBON_WIDTH}px`,
      }}
      title={onClick ? 'Jump to last entry' : undefined}
    >
      {/* Flat satin ribbon — vertical sheen + faint horizontal weave on top of base color */}
      <div
        style={{
          width: `${RIBBON_WIDTH}px`,
          height: `${RIBBON_HEIGHT}px`,
          backgroundColor: color,
          backgroundImage: [
            `linear-gradient(90deg,
              rgba(0,0,0,0.28) 0%,
              rgba(0,0,0,0.06) 22%,
              rgba(255,255,255,0.14) 50%,
              rgba(0,0,0,0.06) 78%,
              rgba(0,0,0,0.28) 100%
            )`,
            `repeating-linear-gradient(0deg,
              transparent 0,
              transparent 2px,
              rgba(0,0,0,0.04) 2px,
              rgba(0,0,0,0.04) 3px
            )`,
          ].join(', '),
          boxShadow: '0 3px 5px rgba(0,0,0,0.18)',
        }}
      />

      {/* Brass swivel clasp */}
      <svg
        width={RIBBON_WIDTH}
        height={CLASP_HEIGHT}
        viewBox={`0 0 ${RIBBON_WIDTH} ${CLASP_HEIGHT}`}
        style={{ display: 'block', marginTop: '-2px' }}
      >
        <defs>
          <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B385" />
            <stop offset="40%" stopColor="#A8854E" />
            <stop offset="100%" stopColor="#5E4828" />
          </linearGradient>
          <linearGradient id="brassGradFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0BF8E" />
            <stop offset="50%" stopColor="#A8854E" />
            <stop offset="100%" stopColor="#6E5530" />
          </linearGradient>
        </defs>

        {/* Top D-ring — ribbon visually loops through this */}
        <ellipse
          cx={RIBBON_WIDTH / 2}
          cy="4.5"
          rx="6.4"
          ry="3.6"
          fill="none"
          stroke="url(#brassGrad)"
          strokeWidth="2"
        />
        {/* Cylindrical swivel body */}
        <rect
          x={RIBBON_WIDTH / 2 - 2.2}
          y="6.5"
          width="4.4"
          height="9"
          rx="1.1"
          fill="url(#brassGradFill)"
        />
        {/* Bottom ring — tag's grommet hooks through this */}
        <ellipse
          cx={RIBBON_WIDTH / 2}
          cy="20.5"
          rx="4.6"
          ry="3.2"
          fill="none"
          stroke="url(#brassGrad)"
          strokeWidth="1.7"
        />
      </svg>

      {/* Hangtag (or any other ornament) lives in this coord space */}
      {children}
    </motion.div>
  )
}
