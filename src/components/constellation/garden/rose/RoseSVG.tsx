'use client'

import { motion } from 'framer-motion'

interface RoseSVGProps {
  /** Petal color (one of ROSE_PALETTE values). */
  color: string
  /** Glow halo color (typically theme.moods[mood]). */
  glow: string
  /** Size multiplier. 1.0 = base ~64px. */
  size?: number
  /** If true, this rose breathes/sways idly. Default true. */
  animate?: boolean
}

const OUTLINE = 'rgba(122,32,48,0.4)'

export function RoseSVG({ color, glow, size = 1, animate = true }: RoseSVGProps) {
  const px = 64 * size
  return (
    <div
      className="relative"
      style={{ width: px, height: px }}
    >
      {/* Mood glow halo behind the rose */}
      <div
        className="absolute"
        style={{
          inset: '-30%',
          background: `radial-gradient(circle, ${glow} 0%, ${glow}55 30%, transparent 70%)`,
          opacity: 0.5,
          filter: 'blur(6px)',
        }}
      />

      <motion.svg
        viewBox="-50 -50 100 100"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
        animate={
          animate
            ? { rotate: [-1.5, 1.5, -1.5], scale: [1, 1.1, 1] }
            : undefined
        }
        transition={
          animate
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        {/* Stem */}
        <path
          d="M0,30 C-3,40 4,50 0,60"
          stroke="#5C7A4B"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Leaves */}
        <ellipse cx="-10" cy="42" rx="7" ry="3.2" fill="#6E8E58" transform="rotate(-30 -10 42)" />
        <ellipse cx="10" cy="48" rx="7" ry="3.2" fill="#6E8E58" transform="rotate(30 10 48)" />

        {/* Outer petals (back layer) */}
        <g stroke={OUTLINE} strokeWidth="0.6">
          <ellipse cx="-14" cy="-4" rx="14" ry="20" fill={color} transform="rotate(-25 -14 -4)" opacity="0.92" />
          <ellipse cx="14" cy="-4" rx="14" ry="20" fill={color} transform="rotate(25 14 -4)" opacity="0.92" />
          <ellipse cx="0" cy="-18" rx="14" ry="18" fill={color} opacity="0.95" />
          <ellipse cx="-8" cy="10" rx="14" ry="16" fill={color} transform="rotate(-15 -8 10)" opacity="0.9" />
          <ellipse cx="8" cy="10" rx="14" ry="16" fill={color} transform="rotate(15 8 10)" opacity="0.9" />
        </g>

        {/* Mid petals */}
        <g stroke={OUTLINE} strokeWidth="0.5">
          <ellipse cx="-6" cy="-6" rx="10" ry="13" fill={color} transform="rotate(-20 -6 -6)" />
          <ellipse cx="6" cy="-6" rx="10" ry="13" fill={color} transform="rotate(20 6 -6)" />
          <ellipse cx="0" cy="-12" rx="10" ry="12" fill={color} />
        </g>

        {/* Inner petals (bud) */}
        <g stroke={OUTLINE} strokeWidth="0.5">
          <ellipse cx="-3" cy="-4" rx="6" ry="9" fill={color} transform="rotate(-15 -3 -4)" />
          <ellipse cx="3" cy="-4" rx="6" ry="9" fill={color} transform="rotate(15 3 -4)" />
          <ellipse cx="0" cy="-8" rx="6" ry="8" fill={color} />
        </g>

        {/* Bright highlight on inner bud */}
        <ellipse cx="0" cy="-8" rx="3" ry="5" fill="#ffffff" opacity="0.35" />

        {/* Dark center crease */}
        <path
          d="M-3,-4 C-1,-2 1,-2 3,-4"
          stroke={OUTLINE}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  )
}
