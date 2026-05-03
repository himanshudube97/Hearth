'use client'

import { motion } from 'framer-motion'

export interface LetterDiamondProps {
  // Position as percentages of the parent (the cottage scene container).
  leftPct: number
  topPct: number
  tilt: number       // degrees, applied on top of the 45° lozenge rotation
  sealColor: string  // wax-seal color
  glow: boolean
  delay: number
  ariaLabel: string  // e.g. "Memory from Aug 14, 2025"
  onClick: () => void
}

const SIZE_PX = 36

export function LetterDiamond({
  leftPct,
  topPct,
  tilt,
  sealColor,
  glow,
  delay,
  ariaLabel,
  onClick,
}: LetterDiamondProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="absolute cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 rounded-sm"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: SIZE_PX,
        height: SIZE_PX,
        transform: `translate(-50%, -50%) rotate(${45 + tilt}deg)`,
        transformOrigin: 'center',
        background:
          'linear-gradient(135deg, #f0e5c8 0%, #e0d4b0 50%, #c8b898 100%)',
        border: '1px solid rgba(138,112,80,0.6)',
        boxShadow: glow
          ? '0 3px 8px rgba(0,0,0,0.7), 0 0 16px rgba(255,200,120,0.55), inset 0 1px 2px rgba(255,255,255,0.3)'
          : '0 3px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.25)',
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Envelope flap V — drawn with two stroked lines */}
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <line x1="0" y1="18" x2="18" y2="36" stroke="rgba(138,112,80,0.45)" strokeWidth="1" />
        <line x1="36" y1="18" x2="18" y2="36" stroke="rgba(138,112,80,0.45)" strokeWidth="1" />
        {/* Wax seal */}
        <circle cx="18" cy="18" r="4" fill={sealColor} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
      </svg>
    </motion.button>
  )
}
