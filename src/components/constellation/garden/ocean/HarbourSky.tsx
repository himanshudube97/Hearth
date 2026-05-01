'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface CloudConfig {
  left: string
  top: string
  size: number
  drift: number
  duration: number
  delay: number
}

const CLOUDS: CloudConfig[] = [
  { left: '6%', top: '18%', size: 1.0, drift: 32, duration: 95, delay: 0 },
  { left: '28%', top: '11%', size: 0.8, drift: 24, duration: 75, delay: 8 },
  { left: '54%', top: '23%', size: 1.2, drift: 38, duration: 115, delay: 4 },
  { left: '75%', top: '15%', size: 0.75, drift: 20, duration: 85, delay: 18 },
  { left: '42%', top: '28%', size: 0.9, drift: 28, duration: 100, delay: 22 },
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
          reduceMotion
            ? undefined
            : { opacity: [0.85, 1, 0.85], scale: [1, 1.04, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Drifting cloud puffs */}
      {CLOUDS.map((cloud, i) => (
        <CloudPuff key={i} config={cloud} reduceMotion={reduceMotion ?? false} />
      ))}
    </div>
  )
}

function CloudPuff({
  config,
  reduceMotion,
}: {
  config: CloudConfig
  reduceMotion: boolean
}) {
  const { left, top, size, drift, duration, delay } = config
  const w = 110 * size
  const h = 16 * size

  return (
    <motion.div
      className="absolute"
      style={{ left, top, width: w, height: h }}
      animate={
        reduceMotion
          ? undefined
          : {
              x: [0, drift, 0],
              opacity: [0.55, 0.9, 0.55],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              x: {
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
              },
              opacity: {
                duration: duration * 0.55,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay + 3,
              },
            }
      }
    >
      {/* Three layered blurred ovals form a soft cloud silhouette */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 5 * size,
          width: 75 * size,
          height: 7 * size,
          background: 'rgba(220,225,230,0.65)',
          borderRadius: '50%',
          filter: `blur(${4 * size}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 22 * size,
          top: 0,
          width: 55 * size,
          height: 10 * size,
          background: 'rgba(220,225,230,0.6)',
          borderRadius: '50%',
          filter: `blur(${5 * size}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 42 * size,
          top: 6 * size,
          width: 68 * size,
          height: 7 * size,
          background: 'rgba(220,225,230,0.55)',
          borderRadius: '50%',
          filter: `blur(${4 * size}px)`,
        }}
      />
    </motion.div>
  )
}
