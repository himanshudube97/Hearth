// src/components/desk/interactive/RibbonBookmark.tsx
'use client'

import { motion } from 'framer-motion'

interface RibbonBookmarkProps {
  color: string
  onClick?: () => void
}

export function RibbonBookmark({ color, onClick }: RibbonBookmarkProps) {
  return (
    <motion.div
      className="absolute -top-2 right-8 z-40 cursor-pointer"
      onClick={onClick}
      whileHover={{ y: 5 }}
      title="Jump to last entry"
    >
      <motion.svg
        viewBox="0 0 20 80"
        className="w-5 h-20"
        animate={{
          rotateZ: [-1, 1, -1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'top center' }}
      >
        <defs>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M2 0 L18 0 L18 70 L10 60 L2 70 Z"
          fill="url(#ribbonGrad)"
        />
        <path
          d="M2 0 L5 0 L5 68 L2 70 Z"
          fill="rgba(0,0,0,0.15)"
        />
      </motion.svg>
    </motion.div>
  )
}
