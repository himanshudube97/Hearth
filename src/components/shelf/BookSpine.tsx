// src/components/shelf/BookSpine.tsx
'use client'

import { motion } from 'framer-motion'
import { spineColor, monthLabel, toRoman } from './shelfPalette'

export interface BookSpineProps {
  year: number
  monthIndex: number // 0..11
  entryCount: number
  onClick: () => void
  // When true the page is in 'pulled' state and this slot must hide
  // (the layoutId is currently animating on the PulledOutBook).
  hidden?: boolean
}

// Dimensions tuned to fit 12 spines on a standard shelf. Mobile orientation
// is handled by the parent (Shelf.tsx) via Tailwind classes — this component
// stays orientation-agnostic by using a fixed shape.
const SPINE_WIDTH = 56
const SPINE_HEIGHT = 280

export default function BookSpine({
  year,
  monthIndex,
  entryCount,
  onClick,
  hidden = false,
}: BookSpineProps) {
  const color = spineColor(monthIndex)
  const label = monthLabel(monthIndex)
  const yearRoman = toRoman(year)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label} ${year}, ${entryCount} entries`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden ? 'true' : undefined}
      layoutId={`book-${year}-${monthIndex}`}
      whileHover={{ y: -6 }}
      whileTap={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      style={{
        width: `${SPINE_WIDTH}px`,
        height: `${SPINE_HEIGHT}px`,
        background: `linear-gradient(180deg, ${color} 0%, ${color} 92%, rgba(0,0,0,0.2) 100%)`,
        borderRadius: '3px 3px 2px 2px',
        boxShadow:
          'inset 1px 0 0 rgba(255,255,255,0.08), inset -2px 0 0 rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.18)',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      className="relative flex flex-col items-center justify-between py-4 cursor-pointer"
    >
      {/* Decorative top band */}
      <div
        style={{
          width: '70%',
          height: '8px',
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 4px)',
          borderRadius: '1px',
        }}
      />

      {/* Vertical paper label with month name */}
      <div
        className="flex-1 mx-1 my-2 flex items-center justify-center px-1 py-3"
        style={{
          background: 'rgba(248, 244, 232, 0.95)',
          color: '#2a241a',
          borderRadius: '2px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'Georgia, Palatino, serif',
          fontSize: '14px',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>

      {/* Etched entry count + year roman numerals at the base */}
      <div
        className="text-[9px] tracking-[0.2em]"
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Georgia, Palatino, serif',
        }}
      >
        · {entryCount} ·
      </div>
      <div
        className="text-[8px] tracking-[0.15em]"
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Georgia, Palatino, serif',
        }}
      >
        {yearRoman}
      </div>
    </motion.button>
  )
}
