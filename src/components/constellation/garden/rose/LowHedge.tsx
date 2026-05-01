'use client'

import { motion } from 'framer-motion'

interface Clump {
  cx: number
  cy: number
  rx: number
  ry: number
  hue: 'dark' | 'mid' | 'light'
  delay: number
}

// Two rows of clumps flanking the curving path. Coordinates are SVG units (viewBox 100x100).
const LEFT_CLUMPS: Clump[] = [
  { cx: 38, cy: 60, rx: 2.8, ry: 1.6, hue: 'mid', delay: 0.0 },
  { cx: 34, cy: 64, rx: 3.6, ry: 2.0, hue: 'mid', delay: 0.4 },
  { cx: 30, cy: 68, rx: 4.4, ry: 2.4, hue: 'light', delay: 0.8 },
  { cx: 24, cy: 73, rx: 5.6, ry: 3.0, hue: 'mid', delay: 1.2 },
  { cx: 16, cy: 79, rx: 7.2, ry: 3.8, hue: 'light', delay: 1.6 },
  { cx: 6, cy: 88, rx: 9.0, ry: 4.6, hue: 'dark', delay: 2.0 },
]

const RIGHT_CLUMPS: Clump[] = LEFT_CLUMPS.map(c => ({ ...c, cx: 100 - c.cx, delay: c.delay + 0.3 }))

const COLORS = {
  dark: '#4E6A3F',
  mid: '#5C7A4B',
  light: '#6E8E58',
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
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
