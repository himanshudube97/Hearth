'use client'

import { motion } from 'framer-motion'
import { ROSE_PALETTE } from './roseHash'

interface Petal {
  id: number
  startX: number
  drift: number
  duration: number
  delay: number
  size: number
  color: string
  rotateFrom: number
  rotateTo: number
}

// Deterministic petals so SSR + client render match.
const PETALS: Petal[] = Array.from({ length: 12 }, (_, i) => {
  const seed = i * 7
  return {
    id: i,
    startX: (seed * 13) % 100,
    drift: ((seed * 17) % 30) - 15,
    duration: 18 + ((seed * 5) % 14),
    delay: (i * 1.4) % 16,
    size: 8 + ((seed * 3) % 8),
    color: ROSE_PALETTE[i % ROSE_PALETTE.length],
    rotateFrom: -45 + ((seed * 11) % 90),
    rotateTo: 220 + ((seed * 7) % 180),
  }
})

export function PetalDrift() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PETALS.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.startX}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
          }}
          initial={{ y: 0, x: 0, rotate: p.rotateFrom, opacity: 0 }}
          animate={{
            y: '110vh',
            x: `${p.drift}vw`,
            rotate: p.rotateTo,
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.85, 1],
          }}
        >
          {/* Petal shape: small soft ellipse */}
          <svg viewBox="-10 -10 20 20" width="100%" height="100%">
            <ellipse
              cx="0"
              cy="0"
              rx="9"
              ry="5"
              fill={p.color}
              stroke="rgba(122,32,48,0.3)"
              strokeWidth="0.3"
            />
            <ellipse cx="-2" cy="-1" rx="3" ry="1.5" fill="#ffffff" opacity="0.45" />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
