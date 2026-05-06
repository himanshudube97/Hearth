'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { CoverSpread } from './spreads'

type Props = {
  spread: CoverSpread
  /** When true, render the cover OPEN (rotated away). When false, the cover is closed and visible. */
  open: boolean
  onComplete?: () => void
}

export default function DiaryCover({ spread, open, onComplete }: Props) {
  const { theme } = useThemeStore()
  const coverStock = `color-mix(in oklab, ${theme.accent.primary}, #2a2218 55%)`
  const foil = theme.accent.warm

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: coverStock,
        borderRadius: '4px',
        boxShadow:
          '0 24px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.4)',
        transformOrigin: 'right center',
        transformStyle: 'preserve-3d',
        zIndex: 10,
      }}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: open ? -170 : 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
      onAnimationComplete={() => onComplete?.()}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ backfaceVisibility: 'hidden', color: '#f4ede1' }}
      >
        <h2
          className="font-serif italic tracking-[0.4em] text-5xl md:text-6xl"
          style={{
            color: 'transparent',
            WebkitTextStroke: `1px ${foil}`,
            textShadow: `0 0 24px ${foil}40`,
          }}
        >
          {spread.title}
        </h2>
        <p className="font-serif italic mt-6 opacity-70 max-w-[24ch]">
          {spread.subtitle}
        </p>

        <div
          className="absolute pointer-events-none"
          style={{
            inset: '14px',
            borderRadius: '3px',
            border: `1px solid ${foil}30`,
            boxShadow: `inset 0 0 24px ${foil}10`,
          }}
        />
      </div>
    </motion.div>
  )
}
