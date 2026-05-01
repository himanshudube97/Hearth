'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Decorative — never clickable. Sits inside the fireplace opening,
// over the flame. Six small sparks rise from the base in a loose stagger.
const SPARK_COUNT = 6

export function AmbientSparks() {
  const reduceMotion = useReducedMotion()
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        id: i,
        x: 30 + ((i * 47) % 40), // 30..70%, spread horizontally
        size: 3 + (i % 3),       // 3..5 px
        duration: 4 + (i % 3),   // 4..6s
        delay: (i * 0.7) % 4,    // staggered start
      })),
    [],
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            bottom: 0,
            width: s.size,
            height: s.size,
            background:
              'radial-gradient(circle, #fff8c8 0%, #ffd070 50%, transparent 100%)',
            boxShadow: '0 0 6px #ffd070',
          }}
          animate={
            reduceMotion
              ? { opacity: 0.6 }
              : {
                  y: [0, -160, -200],
                  opacity: [0, 0.9, 0],
                  x: [0, (s.id % 2 === 0 ? 8 : -8), 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }
          }
        />
      ))}
    </div>
  )
}
