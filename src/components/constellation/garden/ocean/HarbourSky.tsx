'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface CloudConfig {
  left: string
  top: string
  width: number
  drift: number
  duration: number
}

const CLOUDS: CloudConfig[] = [
  { left: '8%', top: '20%', width: 140, drift: 28, duration: 90 },
  { left: '30%', top: '14%', width: 100, drift: 22, duration: 70 },
  { left: '55%', top: '24%', width: 120, drift: 32, duration: 110 },
  { left: '75%', top: '18%', width: 80, drift: 18, duration: 80 },
]

export function HarbourSky() {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg,
          #4A5878 0%,
          #6B7890 18%,
          #9CA8B8 40%,
          #C4B0B8 60%,
          #D8B8AA 72%,
          #E0C8B0 78%,
          #5A6878 80%,
          #4A5868 90%,
          #2A3848 100%
        )`,
      }}
    >
      {/* Soft pale dawn sun — gentle pulse */}
      <motion.div
        className="absolute"
        style={{
          left: '58%',
          top: '70%',
          width: 60,
          height: 60,
          background:
            'radial-gradient(circle, #FFEAD0 0%, #F4D0B8 40%, rgba(220,180,160,0.4) 75%, transparent 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 50px rgba(220,200,180,0.4)',
          transform: 'translate(-50%, -50%)',
        }}
        animate={
          reduceMotion ? undefined : { opacity: [0.85, 1, 0.85], scale: [1, 1.04, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Drifting cloud streaks */}
      {CLOUDS.map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
            height: 4,
            background: 'rgba(200,210,220,0.5)',
            borderRadius: '50%',
            filter: 'blur(2px)',
          }}
          animate={
            reduceMotion ? undefined : { x: [0, cloud.drift, 0] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: cloud.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 4,
                }
          }
        />
      ))}
    </div>
  )
}
