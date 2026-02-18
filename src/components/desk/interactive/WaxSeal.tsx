// src/components/desk/interactive/WaxSeal.tsx
'use client'

import { motion } from 'framer-motion'

interface WaxSealProps {
  design: 'crest' | 'rose' | 'moon'
  color?: string
  animate?: boolean
}

export function WaxSeal({ design, color = 'hsl(0, 50%, 35%)', animate = false }: WaxSealProps) {
  const sealDesigns = {
    crest: 'H',
    rose: '✿',
    moon: '☽',
  }

  return (
    <motion.div
      className="relative w-12 h-12"
      initial={animate ? { scale: 1.5, y: -20 } : false}
      animate={animate ? { scale: 1, y: 0 } : false}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <svg viewBox="0 0 50 50" className="w-full h-full">
        <defs>
          <radialGradient id="waxGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </radialGradient>
        </defs>
        {/* Irregular wax blob */}
        <path
          d="M25 5 Q40 8 45 20 Q48 35 40 42 Q30 50 20 45 Q8 40 5 28 Q3 15 15 8 Q20 3 25 5"
          fill="url(#waxGrad)"
        />
        {/* Inner stamp circle */}
        <circle cx="25" cy="25" r="12" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <text
          x="25"
          y="30"
          textAnchor="middle"
          fontSize="14"
          fill="rgba(0,0,0,0.3)"
          fontFamily="serif"
        >
          {sealDesigns[design]}
        </text>
      </svg>
    </motion.div>
  )
}
