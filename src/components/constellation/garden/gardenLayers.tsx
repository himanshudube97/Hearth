'use client'

import { motion, useTransform } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { GardenParallax } from './useGardenParallax'
import { Plant, type PlantName } from './Plant'

interface LayerProps {
  parallax: GardenParallax
  theme: Theme
}

// Helper to convert hex + numeric alpha [0..1] into "#rrggbbAA" form.
function withAlpha(hex: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha))
  const aa = Math.round(a * 255).toString(16).padStart(2, '0')
  const base = hex.length === 9 ? hex.slice(0, 7) : hex
  return `${base}${aa}`
}

/* ------------------------------------------------------------------ */
/* Sky: warm sun glow + counter-glow + a couple of wispy clouds       */
/* ------------------------------------------------------------------ */

export function SkyBand({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -3)
  const ty = useTransform(parallax.y, v => v * -2)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      <div
        className="absolute"
        style={{
          left: '-15%',
          top: '-25%',
          width: '85%',
          height: '70%',
          background: `radial-gradient(ellipse at center,
            ${withAlpha(theme.accent.highlight, 0.32)} 0%,
            ${withAlpha(theme.accent.warm, 0.16)} 35%,
            transparent 70%)`,
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '-5%',
          top: '40%',
          width: '110%',
          height: '20%',
          background: `linear-gradient(180deg,
            ${withAlpha(theme.accent.warm, 0.12)} 0%,
            transparent 100%)`,
          filter: 'blur(28px)',
        }}
      />
      <div
        className="absolute"
        style={{
          right: '-10%',
          bottom: '20%',
          width: '60%',
          height: '50%',
          background: `radial-gradient(ellipse at center,
            ${withAlpha(theme.accent.secondary, 0.10)} 0%,
            transparent 65%)`,
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        className="absolute"
        style={{
          left: '20%',
          top: '12%',
          width: '32%',
          height: '8%',
          background: `radial-gradient(ellipse at center, ${withAlpha('#ffffff', 0.55)} 0%, transparent 70%)`,
          filter: 'blur(22px)',
        }}
        animate={{ x: [0, 20, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          right: '8%',
          top: '22%',
          width: '24%',
          height: '7%',
          background: `radial-gradient(ellipse at center, ${withAlpha('#ffffff', 0.45)} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{ x: [0, -16, 0], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Watercolor mountains — 4 layers with progressive blur for haze     */
/* ------------------------------------------------------------------ */

export function Hills({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -6)
  const ty = useTransform(parallax.y, v => v * -3)

  return (
    <motion.svg
      className="absolute pointer-events-none"
      style={{
        left: '-5%',
        top: '36%',
        width: '110%',
        height: '46%',
        x: tx,
        y: ty,
      }}
      viewBox="0 0 1000 460"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="haze-far" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Layer 1 — furthest haze ridge, slightly blurred */}
      <path
        d="M0,140 Q160,90 320,120 T640,110 T960,135 T1100,120 L1100,460 L0,460 Z"
        fill={theme.accent.secondary}
        opacity="0.18"
        filter="url(#haze-far)"
      />

      {/* Layer 2 — second ridge */}
      <path
        d="M-30,200 Q140,140 300,175 Q480,215 660,170 Q820,135 1020,180 L1080,460 L-30,460 Z"
        fill={theme.accent.primary}
        opacity="0.20"
      />

      {/* Layer 3 — third ridge */}
      <path
        d="M-30,250 Q150,190 320,225 Q500,270 680,220 Q840,180 1050,225 L1080,460 L-30,460 Z"
        fill={theme.accent.primary}
        opacity="0.26"
      />

      {/* Layer 4 — fourth ridge with treeline dots */}
      <path
        d="M-30,300 Q140,245 320,280 Q500,325 680,275 Q840,235 1050,280 L1080,460 L-30,460 Z"
        fill={theme.accent.primary}
        opacity="0.34"
      />
      <g opacity="0.42">
        {Array.from({ length: 60 }, (_, i) => {
          const x = (i * 17 + 5) % 1000
          // Approximate curve y at x for layer 4
          const ridgeY = 300 - 50 * Math.sin((x + 200) / 240) - 8 * ((i * 7) % 5)
          const h = 5 + ((i * 3) % 5)
          const w = 2.5 + ((i * 2) % 2)
          return (
            <ellipse key={i} cx={x} cy={ridgeY - h} rx={w} ry={h} fill={theme.accent.primary} />
          )
        })}
      </g>

      {/* Layer 5 — closest foothill (most opaque) */}
      <path
        d="M-30,360 Q160,305 340,340 Q520,385 720,335 Q880,295 1050,340 L1080,460 L-30,460 Z"
        fill={theme.accent.primary}
        opacity="0.42"
      />
    </motion.svg>
  )
}

/* ------------------------------------------------------------------ */
/* Distant trees along the third ridge — small SVG tree silhouettes   */
/* ------------------------------------------------------------------ */

const DISTANT_TREES: Array<{ x: number; y: number; size: number; name: PlantName }> = [
  { x: 4,  y: 60.5, size: 22, name: 'tree-deciduous' },
  { x: 11, y: 60,   size: 26, name: 'tree-evergreen' },
  { x: 18, y: 61,   size: 20, name: 'tree-deciduous' },
  { x: 25, y: 60.5, size: 24, name: 'tree-evergreen' },
  { x: 32, y: 61.5, size: 22, name: 'tree-deciduous' },
  { x: 39, y: 60,   size: 28, name: 'tree-evergreen' },
  { x: 46, y: 60.5, size: 20, name: 'tree-deciduous' },
  { x: 53, y: 61.5, size: 24, name: 'tree-deciduous' },
  { x: 60, y: 60,   size: 26, name: 'tree-evergreen' },
  { x: 67, y: 61,   size: 22, name: 'tree-deciduous' },
  { x: 74, y: 60.5, size: 28, name: 'tree-evergreen' },
  { x: 81, y: 61.5, size: 22, name: 'tree-deciduous' },
  { x: 88, y: 60,   size: 24, name: 'tree-evergreen' },
  { x: 95, y: 60.5, size: 22, name: 'tree-deciduous' },
]

export function DistantTrees({ parallax }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -7)
  const ty = useTransform(parallax.y, v => v * -3)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {DISTANT_TREES.map((t, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Plant
            name={t.name}
            width={t.size}
            opacity={0.55}
            saturate={0.45}
            blur={0.6}
          />
        </div>
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Mid-grove — larger trees & shrubs in the middle distance           */
/* ------------------------------------------------------------------ */

const MID_GROVE: Array<{
  x: number
  y: number
  size: number
  name: PlantName
  opacity?: number
  saturate?: number
}> = [
  { x: 4,  y: 71, size: 76,  name: 'tree-evergreen' },
  { x: 11, y: 70, size: 92,  name: 'tree-deciduous' },
  { x: 19, y: 72, size: 70,  name: 'tree-evergreen' },
  { x: 26, y: 70, size: 84,  name: 'tree-deciduous' },
  { x: 33, y: 72, size: 64,  name: 'herb', saturate: 0.55 },
  { x: 39, y: 71, size: 80,  name: 'tree-deciduous' },
  { x: 47, y: 70, size: 96,  name: 'tree-deciduous' },
  { x: 55, y: 72, size: 70,  name: 'tree-evergreen' },
  { x: 62, y: 71, size: 86,  name: 'tree-deciduous' },
  { x: 68, y: 72, size: 60,  name: 'herb', saturate: 0.55 },
  { x: 74, y: 70, size: 78,  name: 'tree-evergreen' },
  { x: 60, y: 73, size: 50,  name: 'rock', saturate: 0.55, opacity: 0.6 },
  { x: 28, y: 73, size: 44,  name: 'rock', saturate: 0.55, opacity: 0.55 },
]

export function MidGrove({ parallax }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -11)
  const ty = useTransform(parallax.y, v => v * -5)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {MID_GROVE.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Plant
            name={p.name}
            width={p.size}
            opacity={p.opacity ?? 0.78}
            saturate={p.saturate ?? 0.6}
          />
        </div>
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Cottage — house + porch decorations on the right side              */
/* ------------------------------------------------------------------ */

export function Cottage({ parallax }: LayerProps) {
  // Slightly less parallax than the foreground frame — cottage is mid-near,
  // not the closest layer.
  const tx = useTransform(parallax.x, v => v * 9)
  const ty = useTransform(parallax.y, v => v * 4)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {/* House on the right */}
      <div className="absolute" style={{ right: '0.5%', bottom: '14%' }}>
        <Plant name="house" width={220} opacity={0.95} saturate={0.7} />
      </div>

      {/* Potted plant on the porch */}
      <div className="absolute" style={{ right: '4%', bottom: '13%' }}>
        <Plant name="potted-plant" width={52} opacity={0.92} saturate={0.75} />
      </div>

      {/* Small rock in front of porch */}
      <div className="absolute" style={{ right: '12%', bottom: '11%' }}>
        <Plant name="rock" width={34} opacity={0.7} saturate={0.55} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Wildflower meadow — scattered colored flower SVGs                  */
/* ------------------------------------------------------------------ */

const WILDFLOWERS: Array<{ x: number; y: number; size: number; name: PlantName; rotate?: number; saturate?: number }> = [
  { x: 4,  y: 88, size: 38, name: 'tulip',     rotate: -6,  saturate: 0.85 },
  { x: 9,  y: 91, size: 30, name: 'blossom',   rotate: 4,   saturate: 0.85 },
  { x: 14, y: 89, size: 36, name: 'sunflower', rotate: -3,  saturate: 0.92 },
  { x: 19, y: 91, size: 28, name: 'blossom',   rotate: 7,   saturate: 0.85 },
  { x: 23, y: 88, size: 34, name: 'tulip',     rotate: 2,   saturate: 0.88 },
  { x: 27, y: 90, size: 30, name: 'hibiscus',  rotate: -5,  saturate: 0.9 },
  { x: 32, y: 89, size: 36, name: 'sunflower', rotate: 5,   saturate: 0.9 },
  { x: 37, y: 92, size: 28, name: 'blossom',   rotate: -8,  saturate: 0.85 },
  { x: 41, y: 88, size: 34, name: 'rose',      rotate: 3,   saturate: 0.88 },
  { x: 46, y: 90, size: 30, name: 'tulip',     rotate: 6,   saturate: 0.88 },
  { x: 50, y: 89, size: 36, name: 'sunflower', rotate: -4,  saturate: 0.92 },
  { x: 55, y: 91, size: 28, name: 'blossom',   rotate: 4,   saturate: 0.85 },
  { x: 60, y: 88, size: 34, name: 'hibiscus',  rotate: -3,  saturate: 0.9 },
  { x: 65, y: 90, size: 30, name: 'rose',      rotate: 5,   saturate: 0.88 },
  { x: 70, y: 89, size: 36, name: 'sunflower', rotate: -2,  saturate: 0.92 },
  { x: 75, y: 91, size: 28, name: 'tulip',     rotate: 4,   saturate: 0.88 },
  { x: 80, y: 88, size: 34, name: 'blossom',   rotate: -3,  saturate: 0.85 },
  { x: 85, y: 90, size: 30, name: 'hibiscus',  rotate: 5,   saturate: 0.9 },
  { x: 90, y: 89, size: 36, name: 'sunflower', rotate: -4,  saturate: 0.92 },
  { x: 95, y: 91, size: 30, name: 'rose',      rotate: 4,   saturate: 0.88 },
  // A second sparser row higher up in the meadow for depth
  { x: 12, y: 84, size: 24, name: 'blossom',   rotate: 6,   saturate: 0.8 },
  { x: 30, y: 83, size: 26, name: 'tulip',     rotate: -4,  saturate: 0.82 },
  { x: 48, y: 84, size: 24, name: 'blossom',   rotate: 3,   saturate: 0.8 },
  { x: 67, y: 83, size: 26, name: 'sunflower', rotate: 5,   saturate: 0.85 },
  { x: 82, y: 84, size: 24, name: 'hibiscus',  rotate: -6,  saturate: 0.85 },
]

export function Wildflowers({ parallax }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * 8)
  const ty = useTransform(parallax.y, v => v * 4)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {WILDFLOWERS.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            transform: 'translate(-50%, -90%)',
          }}
        >
          <Plant
            name={f.name}
            width={f.size}
            rotate={f.rotate}
            opacity={0.95}
            saturate={f.saturate ?? 0.85}
          />
        </div>
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Foreground frame — large plants in bottom-left & bottom-right      */
/* ------------------------------------------------------------------ */

export function ForegroundFrame({ parallax }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * 16)
  const ty = useTransform(parallax.y, v => v * 8)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {/* Bottom-left cluster */}
      <div className="absolute" style={{ left: '0%', bottom: '6%' }}>
        <div className="relative" style={{ width: 280, height: 220 }}>
          <div className="absolute" style={{ left: -10, bottom: 0 }}>
            <Plant name="herb" width={170} opacity={0.95} saturate={0.7} />
          </div>
          <div className="absolute" style={{ left: 110, bottom: 8 }}>
            <Plant name="clover" width={120} rotate={-8} opacity={0.92} saturate={0.7} />
          </div>
          <div className="absolute" style={{ left: 60, bottom: 90 }}>
            <Plant name="leaf-fluttering" width={80} rotate={-15} opacity={0.85} saturate={0.65} />
          </div>
          <div className="absolute" style={{ left: 175, bottom: 60 }}>
            <Plant name="seedling" width={75} rotate={6} opacity={0.88} saturate={0.7} />
          </div>
        </div>
      </div>

      {/* Center-right floral cluster */}
      <div className="absolute" style={{ right: '34%', bottom: '6%' }}>
        <div className="relative" style={{ width: 260, height: 220 }}>
          <div className="absolute" style={{ right: 0, bottom: 0 }}>
            <Plant name="bouquet" width={150} opacity={0.95} saturate={0.78} />
          </div>
          <div className="absolute" style={{ right: 110, bottom: 20 }}>
            <Plant name="rose" width={80} rotate={-10} opacity={0.92} saturate={0.78} />
          </div>
          <div className="absolute" style={{ right: 135, bottom: 80 }}>
            <Plant name="tulip" width={70} rotate={8} opacity={0.92} saturate={0.78} />
          </div>
          <div className="absolute" style={{ right: 175, bottom: 0 }}>
            <Plant name="hibiscus" width={62} rotate={-4} opacity={0.9} saturate={0.78} />
          </div>
        </div>
      </div>

      {/* Tiny details */}
      <div className="absolute" style={{ left: '36%', bottom: '7%' }}>
        <Plant name="mushroom" width={40} opacity={0.88} saturate={0.7} />
      </div>
      <div className="absolute" style={{ left: '54%', bottom: '9%' }}>
        <Plant name="ladybug" width={26} rotate={-15} opacity={0.95} saturate={0.85} />
      </div>
      <div className="absolute" style={{ left: '24%', bottom: '6.5%' }}>
        <Plant name="snail" width={32} opacity={0.85} saturate={0.7} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Ground band — grass tufts                                          */
/* ------------------------------------------------------------------ */

export function GroundBand({ theme }: { theme: Theme }) {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '18%' }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${withAlpha(theme.accent.secondary, 0.0)} 0%,
            ${withAlpha(theme.accent.secondary, 0.10)} 30%,
            ${withAlpha(theme.accent.primary, 0.18)} 100%)`,
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 w-full"
        style={{ height: '38%' }}
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
      >
        <g fill={theme.accent.primary} opacity="0.18">
          {Array.from({ length: 140 }, (_, i) => {
            const x = (i * 7.2 + 3) % 1000
            const h = 14 + ((i * 11) % 18)
            const lean = ((i * 5) % 8) - 4
            return (
              <path
                key={`b-${i}`}
                d={`M${x},80 Q${x + lean / 2},${80 - h / 2} ${x + lean},${80 - h} Q${x + lean - 0.6},${80 - h / 2} ${x - 0.6},80 Z`}
              />
            )
          })}
        </g>
        <g fill={theme.accent.primary} opacity="0.32">
          {Array.from({ length: 90 }, (_, i) => {
            const x = (i * 11.3 + 5) % 1000
            const h = 22 + ((i * 13) % 30)
            const lean = ((i * 7) % 12) - 6
            return (
              <path
                key={`f-${i}`}
                d={`M${x},80 Q${x + lean / 2},${80 - h / 2} ${x + lean},${80 - h} Q${x + lean - 1},${80 - h / 2} ${x - 1},80 Z`}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// Back-compat exports for callers — old layers replaced.
export function HorizonTreeLine() { return null }
export function MidFoliage() { return null }
