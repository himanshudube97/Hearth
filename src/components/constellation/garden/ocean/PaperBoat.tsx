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

const HULL_GRADIENT = 'linear-gradient(180deg, #F8F0DC 60%, #D8C8A4 100%)'
const SAIL_COLOR = '#F8F0DC'

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

  // Idle bob: ±2px Y over 3.5s, ±1° rotation drift around the base tilt
  const animate = reduceMotion
    ? undefined
    : {
        y: [0, -2, 0, 2, 0],
        rotate: [tilt - 1, tilt + 1, tilt - 1],
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
    ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`
    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute cursor-pointer focus:outline-none"
      style={{
        left: `${slotX}%`,
        bottom: `${slotYFromBottom}%`,
        width: 36 * scale,
        height: 22 * scale,
        background: 'transparent',
        border: 'none',
        padding: 0,
        transform: 'translate(-50%, 0)',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
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
          left: -4 * scale,
          bottom: -4 * scale,
          width: 44 * scale,
          height: 6 * scale,
          border: '1px solid rgba(255,200,140,0.4)',
          borderRadius: '50%',
        }}
      />

      {/* Hull — trapezoid */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 36 * scale,
          height: 10 * scale,
          background: HULL_GRADIENT,
          clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      />

      {/* Sail — triangle */}
      <div
        style={{
          position: 'absolute',
          left: 14 * scale,
          bottom: 9 * scale,
          width: 0,
          height: 0,
          borderLeft: `${10 * scale}px solid transparent`,
          borderRight: `${10 * scale}px solid transparent`,
          borderBottom: `${16 * scale}px solid ${SAIL_COLOR}`,
          filter: sailFilter,
        }}
      />
    </motion.button>
  )
}
