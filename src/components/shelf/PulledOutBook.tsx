// src/components/shelf/PulledOutBook.tsx
'use client'

import { motion } from 'framer-motion'
import { spineColor, monthLabel, toRoman } from './shelfPalette'

interface PulledOutBookProps {
  year: number
  monthIndex: number
  entryCount: number
  lastDayOfMonth: number // 28..31
  onOpen: () => void
  onClose: () => void // ← shelf
}

const COVER_WIDTH = 280
const COVER_HEIGHT = 380

export default function PulledOutBook({
  year,
  monthIndex,
  entryCount,
  lastDayOfMonth,
  onOpen,
  onClose,
}: PulledOutBookProps) {
  const color = spineColor(monthIndex)
  const label = monthLabel(monthIndex)
  const yearRoman = toRoman(year)
  const monthRoman = toRoman(monthIndex + 1).toLowerCase()
  const monthNum = String(monthIndex + 1).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(10,8,6,0.55)', backdropFilter: 'blur(4px)' }}
    >
      {/* Back to shelf */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 text-sm tracking-wide opacity-80 hover:opacity-100"
        style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
      >
        ← shelf
      </button>

      <div className="flex flex-col items-center gap-6">
        <motion.button
          type="button"
          onClick={onOpen}
          layoutId={`book-${year}-${monthIndex}`}
          aria-label={`Open ${label} ${year}`}
          whileHover={{ rotate: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          style={{
            width: `${COVER_WIDTH}px`,
            height: `${COVER_HEIGHT}px`,
            background: `linear-gradient(135deg, ${color} 0%, ${color} 60%, rgba(0,0,0,0.25) 100%)`,
            borderRadius: '4px 6px 6px 4px',
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.5), inset -8px 0 16px rgba(0,0,0,0.2), inset 2px 0 0 rgba(255,255,255,0.08)',
            transform: 'rotate(-8deg)',
          }}
          className="relative flex flex-col items-center justify-center cursor-pointer"
        >
          {/* Red ribbon bookmark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '32px',
              width: '14px',
              height: '60px',
              background: '#a02828',
              borderRadius: '0 0 2px 2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />

          {/* Decorative double frame on the cover */}
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              top: '24px',
              right: '24px',
              bottom: '24px',
              left: '24px',
              border: '1px solid rgba(245,240,225,0.4)',
              borderRadius: '2px',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              top: '30px',
              right: '30px',
              bottom: '30px',
              left: '30px',
              border: '1px solid rgba(245,240,225,0.2)',
              borderRadius: '2px',
            }}
          />

          {/* Title */}
          <div className="flex flex-col items-center gap-3 z-10">
            <span
              style={{
                color: 'rgba(245,240,225,0.95)',
                fontFamily: 'Georgia, Palatino, serif',
                fontStyle: 'italic',
                fontSize: '52px',
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            <span
              className="tracking-[0.4em]"
              style={{
                color: 'rgba(245,240,225,0.7)',
                fontFamily: 'Georgia, Palatino, serif',
                fontSize: '12px',
              }}
            >
              {yearRoman}
            </span>
          </div>

          {/* Volume marker at the base */}
          <div
            className="absolute bottom-10 tracking-[0.3em]"
            style={{
              color: 'rgba(245,240,225,0.55)',
              fontFamily: 'Georgia, Palatino, serif',
              fontSize: '10px',
              fontStyle: 'italic',
            }}
          >
            vol. {monthRoman}
          </div>
        </motion.button>

        {/* "tap to open" caption + per-month stats */}
        <div className="text-center">
          <p
            className="text-sm italic mb-1"
            style={{ color: 'rgba(245,240,225,0.85)', fontFamily: 'Georgia, serif' }}
          >
            tap to open
          </p>
          <p
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: 'rgba(245,240,225,0.55)' }}
          >
            {entryCount} entries · {monthNum}/01 → {monthNum}/{lastDayOfMonth}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
