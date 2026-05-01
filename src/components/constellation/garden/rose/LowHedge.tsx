'use client'

import { motion } from 'framer-motion'

interface Clump {
  cx: number
  cy: number
  rx: number
  ry: number
  hue: 'dark' | 'mid' | 'light'
  /** Petal fill for the daisy sitting on top of this clump. */
  petal: string
  delay: number
}

// Soft daisy petal palette — each clump gets a different shade so the row
// reads as a mixed-flower hedge rather than a row of identical white daisies.
const PETAL_PALETTE = [
  '#FBF4ED', // cream / off-white
  '#F4D26B', // soft yellow
  '#F4B6B0', // blush pink
  '#D4BCE0', // pale lavender
  '#F4C09B', // peach
  '#C8E0BC', // pale green-mint
] as const

// Two rows of clumps flanking the curving path. Coordinates are SVG units (viewBox 100x100).
const LEFT_CLUMPS: Clump[] = [
  { cx: 38, cy: 60, rx: 2.8, ry: 1.6, hue: 'mid', petal: PETAL_PALETTE[0], delay: 0.0 },
  { cx: 34, cy: 64, rx: 3.6, ry: 2.0, hue: 'mid', petal: PETAL_PALETTE[1], delay: 0.4 },
  { cx: 30, cy: 68, rx: 4.4, ry: 2.4, hue: 'light', petal: PETAL_PALETTE[2], delay: 0.8 },
  { cx: 24, cy: 73, rx: 5.6, ry: 3.0, hue: 'mid', petal: PETAL_PALETTE[3], delay: 1.2 },
  { cx: 16, cy: 79, rx: 7.2, ry: 3.8, hue: 'light', petal: PETAL_PALETTE[4], delay: 1.6 },
  { cx: 6, cy: 88, rx: 9.0, ry: 4.6, hue: 'dark', petal: PETAL_PALETTE[5], delay: 2.0 },
]

// Mirror x and rotate the petal-color order so the two sides don't twin.
const RIGHT_CLUMPS: Clump[] = LEFT_CLUMPS.map((c, i) => ({
  ...c,
  cx: 100 - c.cx,
  petal: PETAL_PALETTE[(i + 3) % PETAL_PALETTE.length],
  delay: c.delay + 0.3,
}))

const COLORS = {
  dark: '#4E6A3F',
  mid: '#5C7A4B',
  light: '#6E8E58',
}

function Daisy({ cx, cy, ry, color }: { cx: number; cy: number; ry: number; color: string }) {
  // Sits just above the clump's top edge.
  const top = cy - ry * 0.85
  // Smaller petals than before — was ry * 0.18 / 0.4, now ry * 0.12 / 0.26.
  const petalRx = ry * 0.12
  const petalRy = ry * 0.26
  const centerR = ry * 0.13
  return (
    <g transform={`translate(${cx} ${top})`}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-petalRy * 0.95}
          rx={petalRx}
          ry={petalRy}
          fill={color}
          stroke="rgba(120,80,80,0.25)"
          strokeWidth={ry * 0.025}
          transform={`rotate(${a})`}
        />
      ))}
      <circle cx="0" cy="0" r={centerR} fill="#E8B040" />
    </g>
  )
}

export function LowHedge() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[...LEFT_CLUMPS, ...RIGHT_CLUMPS].map((c, i) => (
          <motion.g
            key={i}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{
              duration: 5 + (i % 3),
              delay: c.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: `${c.cx}% ${c.cy}%`, transformBox: 'fill-box' }}
          >
            {/* Soft shadow under each clump */}
            <ellipse cx={c.cx} cy={c.cy + c.ry * 0.7} rx={c.rx} ry={c.ry * 0.4} fill="rgba(78,106,63,0.25)" />
            {/* Main leaf body */}
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={COLORS[c.hue]} opacity="0.9" />
            {/* Highlight crown */}
            <ellipse
              cx={c.cx}
              cy={c.cy - c.ry * 0.4}
              rx={c.rx * 0.7}
              ry={c.ry * 0.5}
              fill="#7E9E68"
              opacity="0.55"
            />
            {/* Per-clump small daisy with its own petal color */}
            <Daisy cx={c.cx} cy={c.cy} ry={c.ry} color={c.petal} />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
