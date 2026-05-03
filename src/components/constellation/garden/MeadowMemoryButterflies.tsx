'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../ConstellationRenderer'
import { Plant } from './Plant'

interface ButterflyAnchor {
  /** Home X in vw — center of the loop region */
  x: number
  /** Home Y in vh — center of the loop region */
  y: number
  /** Loop width in vw */
  loopW: number
  /** Loop height in vh */
  loopH: number
  /** Butterfly sprite size in px */
  size: number
  /** OpenMoji butterfly SVG hue rotation in degrees */
  hueRotate: number
  /** Saturation multiplier passed to Plant */
  saturate: number
  /** Seconds per full wandering loop */
  loopDuration: number
  /** Wing flap period in seconds */
  flapDuration: number
}

/**
 * Five home anchors, spread across the upper-mid band where the clothesline
 * used to hang. Anchors are positional (color stays at the position even if
 * underlying memories change session-to-session). Same hue palette as the
 * removed AmbientDrift butterflies (default, warm, magenta, rosy, lime).
 */
const HOMES: ButterflyAnchor[] = [
  { x: 18, y: 28, loopW: 14, loopH: 9,  size: 50, hueRotate: 0,   saturate: 0.9,  loopDuration: 22, flapDuration: 0.35 },
  { x: 36, y: 38, loopW: 16, loopH: 10, size: 44, hueRotate: -55, saturate: 1.0,  loopDuration: 26, flapDuration: 0.40 },
  { x: 52, y: 26, loopW: 13, loopH: 8,  size: 40, hueRotate: 200, saturate: 1.05, loopDuration: 19, flapDuration: 0.32 },
  { x: 66, y: 44, loopW: 18, loopH: 11, size: 42, hueRotate: 280, saturate: 1.1,  loopDuration: 24, flapDuration: 0.42 },
  { x: 80, y: 32, loopW: 12, loopH: 9,  size: 38, hueRotate: 95,  saturate: 1.0,  loopDuration: 28, flapDuration: 0.30 },
]

interface MeadowMemoryButterfliesProps {
  memoryStars: MemoryStar[]
  onSelect: (star: MemoryStar) => void
  theme: Theme
  glowColor?: string
}

/**
 * Build a wandering oval-ish keyframe path around a home anchor.
 * Returns x/y arrays in vw/vh suitable for framer-motion `animate`.
 */
function buildLoopPath(anchor: ButterflyAnchor) {
  const { x, y, loopW, loopH } = anchor
  const halfW = loopW / 2
  const halfH = loopH / 2

  // 8-point lazy-oval. Closes back to start so repeat: Infinity is seamless.
  const xs = [
    x,
    x + halfW * 0.7,
    x + halfW,
    x + halfW * 0.6,
    x,
    x - halfW * 0.6,
    x - halfW,
    x - halfW * 0.7,
    x,
  ]
  const ys = [
    y,
    y - halfH * 0.5,
    y,
    y + halfH * 0.6,
    y + halfH,
    y + halfH * 0.5,
    y,
    y - halfH * 0.6,
    y,
  ]
  return { xs, ys }
}

interface MemoryButterflyProps {
  anchor: ButterflyAnchor
  star: MemoryStar
  haloColor: string
  onClick: () => void
}

function MemoryButterfly({ anchor, star, haloColor, onClick }: MemoryButterflyProps) {
  const { xs, ys } = buildLoopPath(anchor)
  const dateLabel = new Date(star.entry.createdAt).toDateString()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Read memory from ${dateLabel}`}
      className="absolute focus:outline-none"
      style={{
        top: 0,
        left: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        width: anchor.size,
        height: anchor.size,
      }}
      initial={{ x: `${anchor.x}vw`, y: `${anchor.y}vh`, opacity: 0 }}
      animate={{
        x: xs.map(v => `${v}vw`),
        y: ys.map(v => `${v}vh`),
        opacity: 1,
      }}
      transition={{
        x: { duration: anchor.loopDuration, repeat: Infinity, ease: 'easeInOut' },
        y: { duration: anchor.loopDuration, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 1.2, ease: 'easeOut' },
      }}
      whileHover={{ scale: 1.15 }}
      whileFocus={{ scale: 1.15 }}
    >
      {/* Mood-tint halo */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -anchor.size * 0.35,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${haloColor}40 0%, ${haloColor}00 70%)`,
          opacity: 0.55,
          pointerEvents: 'none',
          transition: 'opacity 200ms ease',
        }}
        className="memory-butterfly-halo"
      />
      {/* Wing-flap wrapper */}
      <motion.div
        animate={{ scaleX: [1, 0.55, 1, 0.55, 1] }}
        transition={{
          duration: anchor.flapDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: 'center', position: 'relative' }}
      >
        <Plant
          name="butterfly"
          width={anchor.size}
          saturate={anchor.saturate}
          hueRotate={anchor.hueRotate}
          opacity={0.95}
        />
      </motion.div>
    </motion.button>
  )
}

export function MeadowMemoryButterflies({
  memoryStars,
  onSelect,
  theme,
  glowColor,
}: MeadowMemoryButterfliesProps) {
  const haloColor = glowColor ?? theme.accent.warm
  // Bind the first N memoryStars (max 5) to the leftmost anchors so layout
  // stays stable when there are fewer memories than anchors.
  const visible = memoryStars.slice(0, HOMES.length)

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      {visible.map((star, i) => {
        const anchor = HOMES[i]
        return (
          <MemoryButterfly
            key={star.entry.id}
            anchor={anchor}
            star={star}
            haloColor={haloColor}
            onClick={() => onSelect(star)}
          />
        )
      })}
    </div>
  )
}
