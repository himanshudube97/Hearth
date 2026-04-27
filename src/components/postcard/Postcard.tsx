'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface PostcardProps {
  front: React.ReactNode
  back: React.ReactNode
  isFlipped: boolean
  onFlip: () => void
}

export default function Postcard({ front, back, isFlipped, onFlip }: PostcardProps) {
  const { theme } = useThemeStore()

  return (
    <div className="relative w-full max-w-full sm:max-w-250 mx-auto" style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-full aspect-2/3 sm:aspect-5/3"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ translateY: -2 }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            pointerEvents: isFlipped ? 'none' : 'auto',
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {front}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            pointerEvents: isFlipped ? 'auto' : 'none',
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {back}
        </div>
      </motion.div>

      {/* Flip button */}
      <motion.button
        onClick={onFlip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-sm font-medium shadow-lg"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          color: theme.text.primary,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        {isFlipped ? '← Write' : 'Details →'}
      </motion.button>
    </div>
  )
}
