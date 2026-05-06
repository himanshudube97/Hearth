// src/components/landing/DiaryPageFlip.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  spreadKey: string | number
  /** The currently visible right page */
  current: ReactNode
  /** The page that should appear after the flip (back face) */
  upcoming: ReactNode
  /** Direction of motion: forward = right page peels left over the spine */
  direction: 'forward' | 'backward'
  isFlipping: boolean
  onComplete: () => void
}

export default function DiaryPageFlip({
  spreadKey,
  current,
  upcoming,
  direction,
  isFlipping,
  onComplete,
}: Props) {
  return (
    <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
      {/* The settled right page */}
      <div className="absolute inset-0">{current}</div>

      <AnimatePresence>
        {isFlipping && (
          <motion.div
            key={`flip-${spreadKey}`}
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: direction === 'forward' ? 'left center' : 'right center',
              backfaceVisibility: 'hidden',
            }}
            initial={{ rotateY: direction === 'forward' ? 0 : -180 }}
            animate={{ rotateY: direction === 'forward' ? -180 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0.0, 0.2, 1] }}
            onAnimationComplete={onComplete}
          >
            {/* Front face — what we're flipping FROM */}
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
              {direction === 'forward' ? current : upcoming}
            </div>

            {/* Back face — what's revealed after the flip */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {direction === 'forward' ? upcoming : current}
            </div>

            {/* Subtle shadow that deepens at 90° */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.18), transparent 30%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.7, ease: 'easeInOut', times: [0, 0.5, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
