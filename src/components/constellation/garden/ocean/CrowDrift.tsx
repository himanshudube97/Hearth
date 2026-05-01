'use client'

import { motion, useReducedMotion } from 'framer-motion'

const CROW_COLOR = '#2A3038'

interface CrowConfig {
  id: number
  /** Vertical position as % from top of viewport. */
  startY: number
  /** Seconds for one full traverse across the screen. */
  duration: number
  /** Initial delay before the first traverse begins. */
  delay: number
  /** Size multiplier (1 = ~22px wide). */
  size: number
  /** Direction of travel. */
  direction: 'lr' | 'rl'
}

const CROWS: CrowConfig[] = [
  { id: 0, startY: 22, duration: 55, delay: 0, size: 1.0, direction: 'lr' },
  { id: 1, startY: 30, duration: 70, delay: 22, size: 0.75, direction: 'lr' },
  { id: 2, startY: 16, duration: 60, delay: 40, size: 0.9, direction: 'rl' },
]

function CrowGlyph({ size }: { size: number }) {
  const w = 22 * size
  const h = 8 * size
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 22 8"
      style={{ overflow: 'visible' }}
    >
      <path
        d="M 0 6 Q 2.5 0 5.5 4 Q 8 1 11 4 Q 14 1 16.5 4 Q 19.5 0 22 6"
        stroke={CROW_COLOR}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function CrowDrift() {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {CROWS.map((c) => (
          <div
            key={c.id}
            className="absolute"
            style={{
              top: `${c.startY}%`,
              left: c.direction === 'lr' ? '35%' : '65%',
              transform: 'translateX(-50%)',
            }}
          >
            <CrowGlyph size={c.size} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {CROWS.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{ top: `${c.startY}%`, left: 0 }}
          initial={{ x: c.direction === 'lr' ? '-8vw' : '108vw' }}
          animate={{ x: c.direction === 'lr' ? '108vw' : '-8vw' }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            repeatDelay: 6,
            ease: 'linear',
          }}
        >
          {/* Inner motion adds a tiny vertical wing-flap bob */}
          <motion.div
            animate={{ y: [-1.5, 1.5, -1.5] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <CrowGlyph size={c.size} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
