'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import { Plant, type PlantName } from './Plant'

interface DriftPetal {
  id: number
  startX: number
  endX: number
  duration: number
  delay: number
  size: number
  rotateFrom: number
  rotateTo: number
  hue: 'primary' | 'warm' | 'highlight'
}

const PETALS: DriftPetal[] = [
  { id: 0, startX: -10, endX: 110, duration: 32, delay: 0,  size: 12, rotateFrom: -20, rotateTo: 340, hue: 'warm' },
  { id: 1, startX: -15, endX: 115, duration: 38, delay: 9,  size: 10, rotateFrom: 30,  rotateTo: -260, hue: 'highlight' },
  { id: 2, startX: 110, endX: -10, duration: 34, delay: 4,  size: 11, rotateFrom: 0,   rotateTo: 280, hue: 'warm' },
  { id: 3, startX: -8,  endX: 108, duration: 28, delay: 18, size:  9, rotateFrom: -45, rotateTo: 200, hue: 'primary' },
]

interface CreatureConfig {
  id: number
  name: PlantName
  size: number
  startX: number
  startY: number
  /** Path waypoints relative to start, in vw / vh */
  path: { x: number; y: number }[]
  duration: number
  delay: number
  flapDuration?: number
  /** Hue rotation to vary butterfly colors */
  hueRotate?: number
  saturate?: number
}

const CREATURES: CreatureConfig[] = [
  // Default-color butterfly (blue/yellow OpenMoji)
  {
    id: 0,
    name: 'butterfly',
    size: 38,
    startX: -8,
    startY: 50,
    path: [
      { x: 0,   y: 0 },
      { x: 25,  y: -10 },
      { x: 50,  y: 5 },
      { x: 75,  y: -14 },
      { x: 100, y: -2 },
      { x: 125, y: -20 },
    ],
    duration: 38,
    delay: 2,
    flapDuration: 0.35,
  },
  // Warm orange/pink butterfly
  {
    id: 1,
    name: 'butterfly',
    size: 32,
    startX: 110,
    startY: 38,
    path: [
      { x: 0,    y: 0 },
      { x: -22,  y: 10 },
      { x: -48,  y: -5 },
      { x: -76,  y: 14 },
      { x: -104, y: 2 },
      { x: -130, y: 18 },
    ],
    duration: 44,
    delay: 8,
    flapDuration: 0.4,
    hueRotate: -55,
    saturate: 1.0,
  },
  // Magenta / purple butterfly
  {
    id: 2,
    name: 'butterfly',
    size: 28,
    startX: -8,
    startY: 32,
    path: [
      { x: 0,   y: 0 },
      { x: 22,  y: 12 },
      { x: 48,  y: -6 },
      { x: 76,  y: 14 },
      { x: 104, y: 4 },
      { x: 130, y: 20 },
    ],
    duration: 50,
    delay: 16,
    flapDuration: 0.32,
    hueRotate: 200,
    saturate: 1.05,
  },
  // Rosy pink butterfly
  {
    id: 3,
    name: 'butterfly',
    size: 30,
    startX: 110,
    startY: 60,
    path: [
      { x: 0,    y: 0 },
      { x: -26,  y: -12 },
      { x: -54,  y: 6 },
      { x: -82,  y: -10 },
      { x: -110, y: 4 },
      { x: -135, y: -14 },
    ],
    duration: 42,
    delay: 24,
    flapDuration: 0.42,
    hueRotate: 280,
    saturate: 1.1,
  },
  // Green/lime butterfly higher up
  {
    id: 4,
    name: 'butterfly',
    size: 26,
    startX: -8,
    startY: 18,
    path: [
      { x: 0,   y: 0 },
      { x: 30,  y: 8 },
      { x: 60,  y: -4 },
      { x: 90,  y: 10 },
      { x: 120, y: -2 },
      { x: 140, y: 6 },
    ],
    duration: 56,
    delay: 32,
    flapDuration: 0.3,
    hueRotate: 95,
    saturate: 1.0,
  },
  // Bee
  {
    id: 5,
    name: 'bee',
    size: 28,
    startX: 25,
    startY: 80,
    path: [
      { x: 0,  y: 0 },
      { x: 15, y: -8 },
      { x: 30, y: 4 },
      { x: 45, y: -10 },
      { x: 60, y: -2 },
      { x: 75, y: -12 },
    ],
    duration: 30,
    delay: 6,
    flapDuration: 0.18,
  },
  // Bird flying high in the sky
  {
    id: 6,
    name: 'bird',
    size: 38,
    startX: -10,
    startY: 12,
    path: [
      { x: 0,   y: 0 },
      { x: 30,  y: -4 },
      { x: 60,  y: 6 },
      { x: 90,  y: -2 },
      { x: 120, y: 4 },
    ],
    duration: 52,
    delay: 22,
    flapDuration: 0.5,
  },
]

export function AmbientDrift({ theme }: { theme: Theme }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Soft drifting petals */}
      {PETALS.map(p => {
        const color =
          p.hue === 'warm' ? theme.accent.warm :
          p.hue === 'highlight' ? theme.accent.highlight :
          theme.accent.primary

        return (
          <motion.div
            key={`petal-${p.id}`}
            className="absolute"
            style={{ top: 0, left: 0, width: p.size, height: p.size * 1.4 }}
            initial={{ x: `${p.startX}vw`, y: '-10vh', rotate: p.rotateFrom, opacity: 0 }}
            animate={{
              x: [`${p.startX}vw`, `${(p.startX + p.endX) / 2}vw`, `${p.endX}vw`],
              y: ['-10vh', '50vh', '105vh'],
              rotate: [p.rotateFrom, (p.rotateFrom + p.rotateTo) / 2, p.rotateTo],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
              times: [0, 0.5, 1],
            }}
          >
            <svg width={p.size} height={p.size * 1.4} viewBox="0 0 10 14">
              <path d="M5,1 C2,3 1,7 5,13 C9,7 8,3 5,1 Z" fill={color} opacity="0.6" />
            </svg>
          </motion.div>
        )
      })}

      {/* Creatures — 5 colorful butterflies, 1 bee, 1 bird */}
      {CREATURES.map(c => (
        <motion.div
          key={`creature-${c.id}`}
          className="absolute"
          style={{ top: 0, left: 0 }}
          initial={{
            x: `${c.startX}vw`,
            y: `${c.startY}vh`,
            opacity: 0,
          }}
          animate={{
            x: c.path.map(p => `${c.startX + p.x}vw`),
            y: c.path.map(p => `${c.startY + p.y}vh`),
            opacity: [0, 0.95, 0.95, 0.95, 0.95, 0],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.15, 0.4, 0.65, 0.85, 1],
          }}
        >
          <motion.div
            animate={{ scaleX: [1, 0.55, 1, 0.55, 1] }}
            transition={{ duration: c.flapDuration ?? 0.35, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: 'center' }}
          >
            <Plant
              name={c.name}
              width={c.size}
              saturate={c.saturate ?? 0.9}
              hueRotate={c.hueRotate ?? 0}
              opacity={0.95}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
