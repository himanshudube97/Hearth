'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface RippleConfig {
  left: string
  top: string
  delay: number
}

const RIPPLES: RippleConfig[] = [
  { left: '38%', top: '86%', delay: 0 },
  { left: '62%', top: '90%', delay: 5 },
  { left: '80%', top: '84%', delay: 10 },
  { left: '20%', top: '88%', delay: 15 },
]

export function WaterAndReflections() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sun reflection ellipse directly under the sun — gentle shimmer */}
      <motion.div
        className="absolute"
        style={{
          left: '56%',
          top: '79%',
          width: 80,
          height: '14%',
          background:
            'linear-gradient(180deg, rgba(244,208,184,0.5) 0%, rgba(228,192,168,0.25) 50%, transparent 100%)',
          filter: 'blur(3px)',
          borderRadius: '50%',
          mixBlendMode: 'lighten',
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.7, 1, 0.7],
                scaleY: [1, 1.08, 1],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Water streaks — tiny suggested wave lines */}
      <div
        className="absolute"
        style={{
          left: '10%',
          right: '10%',
          top: '84%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '5%',
          right: '15%',
          top: '88%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '20%',
          right: '5%',
          top: '92%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '8%',
          right: '20%',
          top: '96%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
        }}
      />

      {/* Expanding ripples — suggest fish surfacing or a breeze on the water */}
      {!reduceMotion &&
        RIPPLES.map((r, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: r.left,
              top: r.top,
              width: 6,
              height: 2,
              border: '1px solid rgba(220,220,220,0.6)',
              borderRadius: '50%',
              transformOrigin: 'center',
            }}
            animate={{
              scale: [1, 18, 22],
              opacity: [0.7, 0.3, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatDelay: 14,
              delay: r.delay,
              ease: 'easeOut',
            }}
          />
        ))}
    </div>
  )
}
