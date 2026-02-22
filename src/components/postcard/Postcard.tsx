'use client'

import { motion } from 'framer-motion'

interface PostcardProps {
  front: React.ReactNode
  back: React.ReactNode
  isFlipped: boolean
  onFlip: () => void
}

export default function Postcard({ front, back, isFlipped, onFlip }: PostcardProps) {
  return (
    <div className="relative w-full max-w-full sm:max-w-250 mx-auto" style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-full aspect-2/3 sm:aspect-5/3"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: '0 8px 32px rgba(100,80,50,0.2), 0 2px 8px rgba(0,0,0,0.1)',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ translateY: -2 }}
      >
        {/* Front face — pointer-events disabled when flipped */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            pointerEvents: isFlipped ? 'none' : 'auto',
            boxShadow: 'inset 0 0 60px rgba(139,105,20,0.03)',
          }}
        >
          {front}
        </div>

        {/* Back face — pointer-events disabled when not flipped */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            pointerEvents: isFlipped ? 'auto' : 'none',
            boxShadow: 'inset 0 0 60px rgba(139,105,20,0.03)',
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
          background: '#f5f0e6',
          color: '#8B6914',
          border: '1px solid #d4c5a0',
        }}
      >
        {isFlipped ? '\u2190 Write' : 'Details \u2192'}
      </motion.button>
    </div>
  )
}
