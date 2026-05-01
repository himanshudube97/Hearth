'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface MistBand {
  /** Left edge as % of viewport. */
  left: string
  /** Top edge as % of viewport. */
  top: string
  /** Width as % of viewport. */
  widthPct: number
  /** Height as % of viewport. */
  heightPct: number
  /** Horizontal drift in px. Negative drifts right→left. */
  drift: number
  /** Drift cycle duration in seconds. */
  duration: number
  /** Stagger delay in seconds. */
  delay: number
}

const MIST: MistBand[] = [
  { left: '-5%', top: '70%', widthPct: 55, heightPct: 18, drift: 50, duration: 80, delay: 0 },
  { left: '35%', top: '74%', widthPct: 45, heightPct: 14, drift: -40, duration: 95, delay: 6 },
  { left: '65%', top: '72%', widthPct: 50, heightPct: 16, drift: 60, duration: 75, delay: 12 },
]

export function HorizonMist() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {MIST.map((m, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: m.left,
            top: m.top,
            width: `${m.widthPct}%`,
            height: `${m.heightPct}%`,
            background:
              'radial-gradient(ellipse at center, rgba(220,225,230,0.4) 0%, rgba(200,210,220,0.18) 50%, transparent 80%)',
            filter: 'blur(12px)',
            mixBlendMode: 'screen',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, m.drift, 0],
                  opacity: [0.45, 0.75, 0.45],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  x: {
                    duration: m.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: m.delay,
                  },
                  opacity: {
                    duration: m.duration * 0.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: m.delay + 4,
                  },
                }
          }
        />
      ))}
    </div>
  )
}
