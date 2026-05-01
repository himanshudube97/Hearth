'use client'

import { motion } from 'framer-motion'

type Accent = 'daisy' | 'grass' | 'bud'

interface Clump {
  cx: number
  cy: number
  rx: number
  ry: number
  hue: 'dark' | 'mid' | 'light'
  accent: Accent
  delay: number
}

// Two rows of clumps flanking the curving path. Coordinates are SVG units (viewBox 100x100).
// Accents alternate so each clump has its own small flower or grass tuft.
const LEFT_CLUMPS: Clump[] = [
  { cx: 38, cy: 60, rx: 2.8, ry: 1.6, hue: 'mid', accent: 'daisy', delay: 0.0 },
  { cx: 34, cy: 64, rx: 3.6, ry: 2.0, hue: 'mid', accent: 'grass', delay: 0.4 },
  { cx: 30, cy: 68, rx: 4.4, ry: 2.4, hue: 'light', accent: 'bud', delay: 0.8 },
  { cx: 24, cy: 73, rx: 5.6, ry: 3.0, hue: 'mid', accent: 'daisy', delay: 1.2 },
  { cx: 16, cy: 79, rx: 7.2, ry: 3.8, hue: 'light', accent: 'grass', delay: 1.6 },
  { cx: 6, cy: 88, rx: 9.0, ry: 4.6, hue: 'dark', accent: 'daisy', delay: 2.0 },
]

const RIGHT_CLUMPS: Clump[] = LEFT_CLUMPS.map((c, i) => {
  // Mirror x and offset both delay and accent so the two sides don't twin.
  const mirrorAccent: Accent[] = ['grass', 'daisy', 'grass', 'bud', 'daisy', 'grass']
  return { ...c, cx: 100 - c.cx, accent: mirrorAccent[i], delay: c.delay + 0.3 }
})

const COLORS = {
  dark: '#4E6A3F',
  mid: '#5C7A4B',
  light: '#6E8E58',
}

function AccentSVG({ type, cx, cy, ry }: { type: Accent; cx: number; cy: number; ry: number }) {
  const top = cy - ry * 0.7

  if (type === 'daisy') {
    return (
      <g transform={`translate(${cx} ${top})`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy={-ry * 0.55}
            rx={ry * 0.18}
            ry={ry * 0.4}
            fill="#FBF4ED"
            transform={`rotate(${a})`}
          />
        ))}
        <circle cx="0" cy="0" r={ry * 0.18} fill="#E8B040" />
      </g>
    )
  }

  if (type === 'grass') {
    return (
      <g
        transform={`translate(${cx} ${cy - ry})`}
        stroke="#5C7A4B"
        strokeWidth={ry * 0.08}
        strokeLinecap="round"
        fill="none"
      >
        <path d={`M${-ry * 0.4},0 Q${-ry * 0.5},${-ry * 0.8} ${-ry * 0.3},${-ry * 1.4}`} />
        <path d={`M0,0 Q${ry * 0.05},${-ry * 1.0} ${-ry * 0.05},${-ry * 1.7}`} />
        <path d={`M${ry * 0.4},0 Q${ry * 0.5},${-ry * 0.8} ${ry * 0.3},${-ry * 1.4}`} />
      </g>
    )
  }

  // bud
  return (
    <g transform={`translate(${cx} ${cy - ry * 0.6})`}>
      <line
        x1="0"
        y1={ry * 0.2}
        x2="0"
        y2={-ry * 0.4}
        stroke="#5C7A4B"
        strokeWidth={ry * 0.08}
      />
      <ellipse
        cx="0"
        cy={-ry * 0.7}
        rx={ry * 0.4}
        ry={ry * 0.55}
        fill="#E27062"
        stroke="rgba(122,32,48,0.4)"
        strokeWidth={ry * 0.04}
      />
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
            {/* Per-clump accent — daisy / grass tuft / rose bud */}
            <AccentSVG type={c.accent} cx={c.cx} cy={c.cy} ry={c.ry} />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
