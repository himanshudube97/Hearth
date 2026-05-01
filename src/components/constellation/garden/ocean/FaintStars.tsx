'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface StarConfig {
  left: string
  top: string
  size: number
  duration: number
  delay: number
}

// Scattered across the upper ~25% of the sky only — last vestiges
// of the night fading out as dawn brightens the lower sky.
const STARS: StarConfig[] = [
  { left: '8%', top: '4%', size: 1.4, duration: 5, delay: 0 },
  { left: '18%', top: '11%', size: 1.0, duration: 4.4, delay: 1.5 },
  { left: '28%', top: '6%', size: 1.2, duration: 5.6, delay: 0.8 },
  { left: '40%', top: '14%', size: 0.8, duration: 6.2, delay: 2.2 },
  { left: '50%', top: '8%', size: 1.3, duration: 4.8, delay: 0.4 },
  { left: '62%', top: '5%', size: 1.0, duration: 5.2, delay: 1.8 },
  { left: '72%', top: '12%', size: 1.1, duration: 4.6, delay: 1.2 },
  { left: '83%', top: '7%', size: 0.9, duration: 6.4, delay: 3 },
  { left: '92%', top: '15%', size: 1.0, duration: 5.0, delay: 2.5 },
  { left: '36%', top: '20%', size: 0.7, duration: 6.8, delay: 0.6 },
  { left: '78%', top: '22%', size: 0.7, duration: 7, delay: 3.4 },
]

export function FaintStars() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {STARS.map((star, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: star.left,
            top: star.top,
            width: star.size * 2,
            height: star.size * 2,
            background: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: `0 0 ${star.size * 2.5}px rgba(255,255,255,0.55)`,
          }}
          animate={
            reduceMotion
              ? { opacity: 0.35 }
              : { opacity: [0.15, 0.55, 0.15] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: star.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: star.delay,
                }
          }
        />
      ))}
    </div>
  )
}
