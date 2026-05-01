'use client'

import { motion, useReducedMotion } from 'framer-motion'

export interface PaperBoatProps {
  /** Position in viewport % from left (0..100). */
  slotX: number
  /** Position in viewport % from bottom (0..100). */
  slotYFromBottom: number
  /** Rotation offset in degrees, from oceanHash. */
  tilt: number
  /** Size multiplier from oceanHash, in [0.85, 1.0]. */
  scale: number
  /** Phase offset in seconds for bobbing — different per slot so boats are out of sync. */
  phaseOffset: number
  /** If true, sail emits a colored glow. */
  glow: boolean
  /** Color used for the glow (theme.moods[mood]). Ignored when glow is false. */
  glowColor: string
  /** Stagger-in delay in seconds. */
  delay: number
  /** Click handler. */
  onClick: () => void
  /** Aria label for the button. */
  ariaLabel: string
}

const BASE_W = 48
const BASE_H = 38

export function PaperBoat({
  slotX,
  slotYFromBottom,
  tilt,
  scale,
  phaseOffset,
  glow,
  glowColor,
  delay,
  onClick,
  ariaLabel,
}: PaperBoatProps) {
  const reduceMotion = useReducedMotion()

  // Gentle vertical bob — no rotation drift. Boats sit at their static tilt.
  const animate = reduceMotion
    ? undefined
    : {
        y: [0, -2, 0, 2, 0],
      }

  const transition = reduceMotion
    ? undefined
    : {
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: phaseOffset,
      }

  const sailFilter = glow
    ? `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 14px ${glowColor})`
    : 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.25))'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute cursor-pointer focus:outline-none"
      style={{
        left: `${slotX}%`,
        bottom: `${slotYFromBottom}%`,
        width: BASE_W * scale,
        height: BASE_H * scale,
        background: 'transparent',
        border: 'none',
        padding: 0,
        transform: 'translate(-50%, 0)',
      }}
      initial={{ opacity: 0, y: 6, rotate: tilt }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: tilt,
        ...(animate ?? {}),
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
        ...(transition ?? {}),
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 1.2, y: -6 }}
    >
      {/* Reflection ripple under the boat */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -4 * scale,
          width: 54 * scale,
          height: 6 * scale,
          marginLeft: -27 * scale,
          border: '1px solid rgba(220,200,180,0.4)',
          borderRadius: '50%',
        }}
      />

      <svg
        viewBox="-24 -28 48 38"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        {/* Mast — thin pole rising from the deck */}
        <line
          x1="0"
          y1="-3"
          x2="0"
          y2="-25"
          stroke="#A89878"
          strokeWidth="0.6"
          strokeLinecap="round"
        />

        {/* Tiny pennant flag at top of mast */}
        <path
          d="M 0 -25 L 5 -23.5 L 0 -22 Z"
          fill="#C28860"
          opacity="0.85"
        />

        {/* Sail — triangle to the right of the mast */}
        <path
          d="M 0 -25 L 0 -3 L 13 -5 Z"
          fill="#FFFFFF"
          stroke="#D8C8A4"
          strokeWidth="0.4"
          strokeLinejoin="round"
          style={{ filter: sailFilter }}
        />

        {/* Sail subtle horizontal fold (paper crease) */}
        <line
          x1="0"
          y1="-15"
          x2="7.2"
          y2="-15.6"
          stroke="#D8C8A4"
          strokeWidth="0.3"
          opacity="0.6"
        />

        {/* Hull — origami paper boat: trapezoid base with peaked top corners and V-notch */}
        <path
          d="M -20 9
             L 20 9
             L 16 -1
             L 9 -7
             L 3 -1
             L 0 1
             L -3 -1
             L -9 -7
             L -16 -1 Z"
          fill="#F8F0DC"
          stroke="#B8A878"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />

        {/* Hull bottom shadow band — gives a rim/depth feel */}
        <path
          d="M -20 9 L 20 9 L 17 4 L -17 4 Z"
          fill="#D8C8A4"
          opacity="0.55"
        />

        {/* Center vertical fold line (down the keel) */}
        <line
          x1="0"
          y1="1"
          x2="0"
          y2="9"
          stroke="#A89878"
          strokeWidth="0.3"
          opacity="0.6"
        />

        {/* Side fold lines — visible paper edges where the hull folds upward */}
        <line
          x1="-9"
          y1="-7"
          x2="-16"
          y2="-1"
          stroke="#C8B894"
          strokeWidth="0.35"
          opacity="0.7"
        />
        <line
          x1="9"
          y1="-7"
          x2="16"
          y2="-1"
          stroke="#C8B894"
          strokeWidth="0.35"
          opacity="0.7"
        />
      </svg>
    </motion.button>
  )
}
