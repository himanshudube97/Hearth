'use client'

import { useMemo } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { useGardenParallax, type GardenParallax } from '../useGardenParallax'

export interface SunsetSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

/* ────────── parallax helpers ────────── */

function useShift(mv: MotionValue<number>, depth: number) {
  return useTransform(mv, (v) => v * depth)
}

function ParallaxBox({
  parallax,
  depthX,
  depthY,
  className,
  style,
  children,
}: {
  parallax: GardenParallax
  depthX: number
  depthY: number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const x = useShift(parallax.x, depthX)
  const y = useShift(parallax.y, depthY)
  return (
    <motion.div className={className} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  )
}

/* ────────── deterministic pseudo-random (avoids re-render flicker) ────────── */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ────────── sun + sky glow ────────── */

function SunsetSky({ parallax }: { parallax: GardenParallax }) {
  return (
    <ParallaxBox
      parallax={parallax}
      depthX={-2}
      depthY={-1}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Wide outer bloom — sky-wide warm cast (smaller for distant feel) */}
      <motion.div
        className="absolute"
        style={{
          top: '64%',
          left: '60%',
          width: '1100px',
          height: '1100px',
          marginLeft: '-550px',
          marginTop: '-550px',
          background:
            'radial-gradient(circle, rgba(255, 220, 168, 0.28) 0%, rgba(255, 168, 110, 0.14) 22%, rgba(232, 110, 80, 0.07) 45%, transparent 72%)',
          filter: 'blur(28px)',
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* God-ray streaks — slow rotation, very subtle */}
      <motion.div
        className="absolute"
        style={{
          top: '66%',
          left: '60%',
          width: '1300px',
          height: '1300px',
          marginLeft: '-650px',
          marginTop: '-650px',
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(255,224,176,0.05) 4deg, transparent 12deg, rgba(255,224,176,0.04) 28deg, transparent 40deg, rgba(255,224,176,0.06) 70deg, transparent 90deg, rgba(255,224,176,0.04) 130deg, transparent 150deg, rgba(255,224,176,0.04) 200deg, transparent 230deg, rgba(255,224,176,0.05) 290deg, transparent 320deg)',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 360, repeat: Infinity, ease: 'linear' }}
      />

      {/* Sun disc — small + low, sitting on the far horizon */}
      <motion.div
        className="absolute"
        style={{
          top: '66%',
          left: '60%',
          width: '130px',
          height: '130px',
          marginLeft: '-65px',
          marginTop: '-65px',
          background:
            'radial-gradient(circle, rgba(255, 248, 224, 1) 0%, rgba(255, 226, 170, 0.96) 24%, rgba(255, 188, 132, 0.78) 50%, rgba(248, 140, 96, 0.4) 72%, transparent 88%)',
          borderRadius: '50%',
          filter: 'blur(0.5px)',
        }}
        animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.02, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </ParallaxBox>
  )
}

/* ────────── wispy horizontal cloud streaks ────────── */

function CloudStreak({
  top,
  width,
  yOffset,
  delay,
  duration,
  opacity,
  parallax,
}: {
  top: string
  width: string
  yOffset: number
  delay: number
  duration: number
  opacity: number
  parallax: GardenParallax
}) {
  return (
    <ParallaxBox
      parallax={parallax}
      depthX={-6}
      depthY={-1.5}
      className="absolute pointer-events-none"
      style={{ top, left: '-10%', right: '-10%', width, height: '14px' }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent 0%, rgba(255, 232, 200, ${opacity * 0.4}) 15%, rgba(255, 220, 188, ${opacity}) 50%, rgba(255, 232, 200, ${opacity * 0.4}) 85%, transparent 100%)`,
          borderRadius: '50%',
          filter: 'blur(3px)',
        }}
        initial={{ x: 0, y: yOffset }}
        animate={{ x: ['0%', '4%', '0%'] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </ParallaxBox>
  )
}

/* ────────── distant ridges with atmospheric perspective ────────── */

/**
 * A ridgeline whose top edge softly fades into the sky via a vertical
 * gradient — the classic "atmospheric perspective" cue that sells distance.
 */
function Ridge({
  parallax,
  bottomPct,
  heightPct,
  depthX,
  depthY,
  topColor,
  bottomColor,
  topOpacity,
  bottomOpacity,
  pathD,
  gradId,
}: {
  parallax: GardenParallax
  bottomPct: number
  heightPct: number
  depthX: number
  depthY: number
  topColor: string
  bottomColor: string
  topOpacity: number
  bottomOpacity: number
  pathD: string
  gradId: string
}) {
  return (
    <ParallaxBox
      parallax={parallax}
      depthX={depthX}
      depthY={depthY}
      className="absolute left-0 right-0 pointer-events-none"
      style={{ bottom: `${bottomPct}%`, height: `${heightPct}%` }}
    >
      <svg
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={topColor} stopOpacity={topOpacity} />
            <stop offset="65%" stopColor={bottomColor} stopOpacity={bottomOpacity * 0.85} />
            <stop offset="100%" stopColor={bottomColor} stopOpacity={bottomOpacity} />
          </linearGradient>
        </defs>
        <path d={pathD} fill={`url(#${gradId})`} />
      </svg>
    </ParallaxBox>
  )
}

/* ────────── horizon haze band ────────── */

function HazeBand({
  bottomPct,
  heightPct,
  parallax,
}: {
  bottomPct: number
  heightPct: number
  parallax: GardenParallax
}) {
  return (
    <ParallaxBox
      parallax={parallax}
      depthX={-2}
      depthY={-0.5}
      className="absolute left-0 right-0 pointer-events-none"
      style={{ bottom: `${bottomPct}%`, height: `${heightPct}%` }}
    >
      <div
        className="w-full h-full"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255, 184, 132, 0.18) 50%, rgba(232, 130, 100, 0.10) 100%)',
          filter: 'blur(8px)',
        }}
      />
    </ParallaxBox>
  )
}

/* ────────── procedurally-generated forest silhouette ────────── */

interface Tree {
  /** X center (0-200 units) */
  x: number
  /** Tree shape kind */
  kind: 'oak' | 'pine' | 'tall-pine' | 'bush' | 'willow'
  /** Tree height (units) */
  h: number
  /** Tree half-width (units) */
  w: number
}

function generateForest(): Tree[] {
  const rand = mulberry32(2026_05_08)
  const trees: Tree[] = []
  let x = -2
  while (x < 202) {
    const r = rand()
    let kind: Tree['kind']
    let h: number
    let w: number
    if (r < 0.08) {
      kind = 'tall-pine'
      h = 14 + rand() * 6
      w = 1.0 + rand() * 0.5
    } else if (r < 0.30) {
      kind = 'pine'
      h = 7 + rand() * 4
      w = 1.2 + rand() * 0.6
    } else if (r < 0.65) {
      kind = 'oak'
      h = 5 + rand() * 4
      w = 1.6 + rand() * 1.2
    } else if (r < 0.85) {
      kind = 'bush'
      h = 1.8 + rand() * 1.5
      w = 1.4 + rand() * 1.0
    } else {
      kind = 'willow'
      h = 6 + rand() * 3
      w = 2.0 + rand() * 1.0
    }
    trees.push({ x, kind, h, w })
    x += w * 1.3 + rand() * 0.6
  }
  return trees
}

/**
 * Builds one continuous SVG path describing the upper canopy line of the
 * forest. Tall pines are layered separately (see TallPines) so they read
 * as silhouetted spires above the rolling oak/bush canopy.
 */
function buildCanopyPath(trees: Tree[], baseY: number, totalH: number): string {
  const W = 200
  let d = `M0,${totalH} L0,${baseY}`
  for (const t of trees) {
    const left = t.x - t.w
    const right = t.x + t.w
    if (left > 0) {
      // close gap by walking along the base before drawing this tree
      d += ` L${left},${baseY}`
    }
    switch (t.kind) {
      case 'oak': {
        // Round canopy via two quadratic curves
        d += ` Q${t.x - t.w * 0.5},${baseY - t.h} ${t.x},${baseY - t.h * 1.05}`
        d += ` Q${t.x + t.w * 0.5},${baseY - t.h} ${right},${baseY}`
        break
      }
      case 'pine': {
        // Asymmetric jagged pine — flat-ish triangle with offset peak
        d += ` L${t.x - t.w * 0.6},${baseY - t.h * 0.55}`
        d += ` L${t.x - t.w * 0.2},${baseY - t.h * 0.8}`
        d += ` L${t.x + t.w * 0.1},${baseY - t.h * 0.95}`
        d += ` L${t.x + t.w * 0.4},${baseY - t.h * 0.7}`
        d += ` L${t.x + t.w * 0.7},${baseY - t.h * 0.5}`
        d += ` L${right},${baseY}`
        break
      }
      case 'tall-pine': {
        // Drawn separately for sharp spire — flatten canopy here
        d += ` L${t.x - t.w * 0.5},${baseY - 0.4} L${right},${baseY}`
        break
      }
      case 'bush': {
        // Low rounded bush
        d += ` Q${t.x - t.w * 0.4},${baseY - t.h} ${t.x},${baseY - t.h * 0.95}`
        d += ` Q${t.x + t.w * 0.4},${baseY - t.h} ${right},${baseY}`
        break
      }
      case 'willow': {
        // Drooping wide canopy
        d += ` Q${t.x - t.w * 0.6},${baseY - t.h * 0.85} ${t.x - t.w * 0.2},${baseY - t.h * 0.6}`
        d += ` L${t.x},${baseY - t.h * 0.95}`
        d += ` Q${t.x + t.w * 0.6},${baseY - t.h * 0.85} ${right},${baseY}`
        break
      }
    }
  }
  d += ` L${W},${baseY} L${W},${totalH} Z`
  return d
}

function buildTallPinePolygons(trees: Tree[], baseY: number): { points: string }[] {
  return trees
    .filter((t) => t.kind === 'tall-pine')
    .map((t) => {
      // Layered triangle silhouette — three tiers narrowing toward apex
      const apex = baseY - t.h
      const t1 = baseY - t.h * 0.32 // bottom tier
      const t2 = baseY - t.h * 0.55
      const t3 = baseY - t.h * 0.78
      const wB = t.w * 0.95
      const wM = t.w * 0.7
      const wU = t.w * 0.45
      const ptsArr = [
        `${t.x - wB * 0.4},${baseY}`,
        `${t.x - wB},${t1}`,
        `${t.x - wM * 0.55},${t1 - 0.3}`,
        `${t.x - wM},${t2}`,
        `${t.x - wU * 0.55},${t2 - 0.25}`,
        `${t.x - wU},${t3}`,
        `${t.x},${apex}`,
        `${t.x + wU},${t3}`,
        `${t.x + wU * 0.55},${t2 - 0.25}`,
        `${t.x + wM},${t2}`,
        `${t.x + wM * 0.55},${t1 - 0.3}`,
        `${t.x + wB},${t1}`,
        `${t.x + wB * 0.4},${baseY}`,
      ]
      return { points: ptsArr.join(' ') }
    })
}

/** Tufts of grass at the very base of the forest */
function buildGrassPath(): string {
  const rand = mulberry32(91173)
  const baseY = 50
  let d = `M0,50 L0,49`
  for (let i = 0; i < 90; i++) {
    const x = i * 2.3 + rand() * 1.2
    const tipH = 0.6 + rand() * 1.4
    d += ` L${x.toFixed(2)},${(baseY - 0.6).toFixed(2)}`
    d += ` L${(x + 0.3).toFixed(2)},${(baseY - tipH).toFixed(2)}`
    d += ` L${(x + 0.6).toFixed(2)},${(baseY - 0.5).toFixed(2)}`
  }
  d += ` L200,49 L200,50 Z`
  return d
}

function ForegroundForest() {
  const { canopyD, pines, grassD } = useMemo(() => {
    const trees = generateForest()
    return {
      canopyD: buildCanopyPath(trees, 38, 50),
      pines: buildTallPinePolygons(trees, 38),
      grassD: buildGrassPath(),
    }
  }, [])

  return (
    <div
      className="absolute left-0 right-0 bottom-0 pointer-events-none"
      style={{ height: '22%' }}
    >
      <svg
        viewBox="0 0 200 50"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="forest-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3A1428" stopOpacity="0.92" />
            <stop offset="35%" stopColor="#1F0A1A" stopOpacity="1" />
            <stop offset="100%" stopColor="#0A040E" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A0820" stopOpacity="1" />
            <stop offset="100%" stopColor="#060208" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Rolling oak/bush canopy */}
        <path d={canopyD} fill="url(#forest-grad)" />
        {/* Tall pines as separate layered spires */}
        {pines.map((p, i) => (
          <polygon key={i} points={p.points} fill="url(#pine-grad)" />
        ))}
        {/* Grass tufts at the base */}
        <path d={grassD} fill="#04020A" />
      </svg>
    </div>
  )
}

/* ────────── hot air balloons (memory anchors) ────────── */

interface BalloonAnchor {
  /** Home X in vw */
  x: number
  /** Home Y in vh — kept in upper sky band (8-40) */
  y: number
  /** Balloon size in px */
  size: number
  /** Hue for envelope panels — main color */
  envelope: string
  /** Accent stripe color */
  stripe: string
  /** Bob amplitude in vh */
  bob: number
  /** Bob period in seconds */
  bobDuration: number
  /** Sway period in seconds */
  swayDuration: number
  /** Parallax depth — bigger balloons drift more */
  depth: number
}

const BALLOON_HOMES: BalloonAnchor[] = [
  { x: 12, y: 20, size: 70, envelope: '#E8554B', stripe: '#FFE0A0', bob: 1.0, bobDuration: 7,   swayDuration: 11, depth: 6  },
  { x: 26, y: 30, size: 56, envelope: '#F08A4B', stripe: '#FFD088', bob: 0.8, bobDuration: 8,   swayDuration: 13, depth: 8  },
  { x: 40, y: 18, size: 48, envelope: '#C8472D', stripe: '#FFB070', bob: 1.2, bobDuration: 6.5, swayDuration: 10, depth: 5  },
  { x: 50, y: 34, size: 60, envelope: '#9B3650', stripe: '#FFCFA0', bob: 0.9, bobDuration: 7.5, swayDuration: 12, depth: 7  },
  { x: 72, y: 22, size: 52, envelope: '#E8945A', stripe: '#FFEABF', bob: 1.0, bobDuration: 9,   swayDuration: 14, depth: 5  },
  { x: 84, y: 36, size: 46, envelope: '#B85838', stripe: '#FFD4A0', bob: 0.7, bobDuration: 8.5, swayDuration: 12, depth: 7  },
  { x: 18, y: 44, size: 42, envelope: '#D86848', stripe: '#FFE0B8', bob: 0.9, bobDuration: 7,   swayDuration: 11, depth: 9  },
]

function BalloonSvg({
  size,
  envelope,
  stripe,
  haloColor,
}: {
  size: number
  envelope: string
  stripe: string
  haloColor: string
}) {
  const id = envelope.replace('#', '')
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      style={{ filter: `drop-shadow(0 6px 12px rgba(40, 18, 28, 0.35))` }}
    >
      <defs>
        <radialGradient id={`env-${id}`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="32%" stopColor={envelope} stopOpacity="1" />
          <stop offset="100%" stopColor={envelope} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {/* Soft halo */}
      <circle cx="50" cy="46" r="46" fill={haloColor} opacity="0.18" />
      {/* Envelope */}
      <path
        d="M50,4 C76,4 92,28 92,52 C92,72 80,86 60,92 L58,98 L42,98 L40,92 C20,86 8,72 8,52 C8,28 24,4 50,4 Z"
        fill={`url(#env-${id})`}
      />
      {/* Vertical paneling stripes */}
      <path d="M50,4 C50,4 50,98 50,98" stroke={stripe} strokeWidth="1.2" opacity="0.55" fill="none" />
      <path d="M30,8 C22,30 22,72 38,94" stroke={stripe} strokeWidth="0.8" opacity="0.4" fill="none" />
      <path d="M70,8 C78,30 78,72 62,94" stroke={stripe} strokeWidth="0.8" opacity="0.4" fill="none" />
      {/* Cords */}
      <line x1="38" y1="98" x2="40" y2="118" stroke="#3A1E18" strokeWidth="0.8" />
      <line x1="50" y1="100" x2="50" y2="118" stroke="#3A1E18" strokeWidth="0.8" />
      <line x1="62" y1="98" x2="60" y2="118" stroke="#3A1E18" strokeWidth="0.8" />
      {/* Basket */}
      <rect x="38" y="118" width="24" height="14" rx="2" fill="#6B3A20" stroke="#3A1E10" strokeWidth="0.5" />
      <line x1="38" y1="124" x2="62" y2="124" stroke="#3A1E10" strokeWidth="0.4" opacity="0.6" />
      <line x1="44" y1="118" x2="44" y2="132" stroke="#3A1E10" strokeWidth="0.4" opacity="0.5" />
      <line x1="50" y1="118" x2="50" y2="132" stroke="#3A1E10" strokeWidth="0.4" opacity="0.5" />
      <line x1="56" y1="118" x2="56" y2="132" stroke="#3A1E10" strokeWidth="0.4" opacity="0.5" />
    </svg>
  )
}

interface MemoryBalloonProps {
  anchor: BalloonAnchor
  star: MemoryStar
  haloColor: string
  parallax: GardenParallax
  onClick: () => void
}

function MemoryBalloon({
  anchor,
  star,
  haloColor,
  parallax,
  onClick,
}: MemoryBalloonProps) {
  const dateLabel = new Date(star.entry.createdAt).toDateString()
  const px = useShift(parallax.x, -anchor.depth)
  const py = useShift(parallax.y, -anchor.depth * 0.4)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Read memory from ${dateLabel}`}
      className="absolute focus:outline-none"
      style={{
        top: `${anchor.y}vh`,
        left: `${anchor.x}vw`,
        width: anchor.size,
        height: anchor.size * 1.4,
        marginLeft: -anchor.size / 2,
        marginTop: -anchor.size * 0.7,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        x: px,
        y: py,
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: anchor.depth * 0.1 }}
      whileHover={{ scale: 1.08 }}
      whileFocus={{ scale: 1.08 }}
    >
      <motion.div
        animate={{
          y: [0, -anchor.bob * 8, 0, anchor.bob * 4, 0],
          rotate: [-1.2, 0.8, -0.6, 1.0, -1.2],
        }}
        transition={{
          y: { duration: anchor.bobDuration, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: anchor.swayDuration, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ transformOrigin: '50% 85%' }}
      >
        <BalloonSvg
          size={anchor.size}
          envelope={anchor.envelope}
          stripe={anchor.stripe}
          haloColor={haloColor}
        />
      </motion.div>
    </motion.button>
  )
}

function MemoryBalloons({
  memoryStars,
  onSelect,
  haloColor,
  parallax,
}: {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  haloColor: string
  parallax: GardenParallax
}) {
  const visible = memoryStars.slice(0, BALLOON_HOMES.length)
  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {visible.map((star, i) => {
        const anchor = BALLOON_HOMES[i]
        return (
          <MemoryBalloon
            key={star.entry.id}
            anchor={anchor}
            star={star}
            haloColor={haloColor}
            parallax={parallax}
            onClick={() => onSelect(star)}
          />
        )
      })}
    </div>
  )
}

/* ────────── distant silhouette birds ────────── */

function FlyingBird({ delay, yPosition, parallax }: { delay: number; yPosition: number; parallax: GardenParallax }) {
  const dx = useShift(parallax.x, -3)
  const dy = useShift(parallax.y, -1)
  return (
    <motion.svg
      className="absolute pointer-events-none"
      style={{ left: '-5%', top: `${yPosition}%`, width: '24px', height: '12px', x: dx, y: dy }}
      viewBox="0 0 24 12"
      initial={{ x: 0, opacity: 0 }}
      animate={{
        x: ['0vw', '110vw'],
        opacity: [0, 0.55, 0.55, 0],
        y: [0, -10, 5, -8, 0],
      }}
      transition={{ duration: 32, delay, repeat: Infinity, ease: 'linear' }}
    >
      <motion.path
        d="M0,6 Q6,0 12,6 Q18,0 24,6"
        fill="none"
        stroke="rgba(60, 30, 38, 0.6)"
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{
          d: [
            'M0,6 Q6,0 12,6 Q18,0 24,6',
            'M0,6 Q6,4 12,6 Q18,4 24,6',
            'M0,6 Q6,0 12,6 Q18,0 24,6',
          ],
        }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}

/* ────────── scene ────────── */

export function SunsetScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: SunsetSceneProps) {
  const parallax = useGardenParallax()

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <motion.div
            className="text-2xl mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: theme.text.muted }}
          >
            ☀
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            chasing the last light...
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-60">🌅</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            the sky is empty — write something to send your first balloon up
          </p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ background: theme.bg.gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Sky elements (sun, bloom, god rays) */}
      <SunsetSky parallax={parallax} />

      {/* Wispy horizontal cloud streaks */}
      <CloudStreak top="18%" width="60%" yOffset={0}  delay={0}  duration={32} opacity={0.50} parallax={parallax} />
      <CloudStreak top="26%" width="55%" yOffset={0}  delay={6}  duration={38} opacity={0.40} parallax={parallax} />
      <CloudStreak top="34%" width="48%" yOffset={0}  delay={12} duration={42} opacity={0.35} parallax={parallax} />
      <CloudStreak top="11%" width="40%" yOffset={0}  delay={3}  duration={36} opacity={0.45} parallax={parallax} />
      <CloudStreak top="44%" width="70%" yOffset={0}  delay={9}  duration={44} opacity={0.30} parallax={parallax} />

      {/* Distant birds in flight */}
      <FlyingBird delay={5}  yPosition={20} parallax={parallax} />
      <FlyingBird delay={18} yPosition={26} parallax={parallax} />
      <FlyingBird delay={36} yPosition={16} parallax={parallax} />

      {/* Memory balloons — float in the open sky band */}
      <MemoryBalloons
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        haloColor={theme.accent.warm}
        parallax={parallax}
      />

      {/* Most-distant ridge — barely there, sun rises above its crest */}
      <Ridge
        parallax={parallax}
        bottomPct={32}
        heightPct={14}
        depthX={-3}
        depthY={-1}
        topColor="#F4B888"
        bottomColor="#C8745E"
        topOpacity={0.0}
        bottomOpacity={0.32}
        gradId="far-ridge-1"
        pathD="M0,30 L0,22 Q15,18 30,21 Q45,24 60,19 Q75,15 90,20 Q96,22 100,21 L100,30 Z"
      />

      {/* Far ridge — sun sits behind it */}
      <Ridge
        parallax={parallax}
        bottomPct={26}
        heightPct={14}
        depthX={-6}
        depthY={-2}
        topColor="#E89674"
        bottomColor="#A85258"
        topOpacity={0.05}
        bottomOpacity={0.55}
        gradId="far-ridge-2"
        pathD="M0,30 L0,20 Q12,14 24,18 Q36,22 48,15 Q60,9 72,16 Q84,21 100,17 L100,30 Z"
      />

      {/* Atmospheric haze band between far and mid */}
      <HazeBand parallax={parallax} bottomPct={22} heightPct={6} />

      {/* Mid ridge */}
      <Ridge
        parallax={parallax}
        bottomPct={20}
        heightPct={14}
        depthX={-12}
        depthY={-3}
        topColor="#A04858"
        bottomColor="#5A2A40"
        topOpacity={0.18}
        bottomOpacity={0.85}
        gradId="mid-ridge"
        pathD="M0,30 L0,18 Q9,12 18,15 Q26,18 36,12 Q48,6 60,14 Q72,20 84,13 Q92,9 100,15 L100,30 Z"
      />

      {/* Atmospheric haze band between mid and near */}
      <HazeBand parallax={parallax} bottomPct={18} heightPct={5} />

      {/* Foreground forest silhouette — locked in place, no parallax */}
      <ForegroundForest />

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <div className="flex items-center justify-center gap-3 md:gap-5 px-4">
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 12px ${theme.accent.warm})`,
              fontSize: 'clamp(1rem, 2.4vw, 1.5rem)',
              display: 'inline-block',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1], rotate: [0, 12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦
          </motion.span>
          <p
            style={{
              color: theme.text.primary,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              letterSpacing: '0.015em',
              fontSize: 'clamp(1.125rem, 3vw, 1.875rem)',
              textShadow: `0 2px 14px ${theme.accent.warm}40`,
              lineHeight: 1.2,
            }}
          >
            press a balloon to reveal its memory
          </p>
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 12px ${theme.accent.warm})`,
              fontSize: 'clamp(1rem, 2.4vw, 1.5rem)',
              display: 'inline-block',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1], rotate: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            ✦
          </motion.span>
        </div>
        <p
          className="text-sm mt-3"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your sky · {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'balloon aloft' : 'balloons aloft'}
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
      />
    </motion.div>
  )
}
