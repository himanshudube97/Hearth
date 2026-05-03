'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../ConstellationRenderer'

interface LetterClotheslineProps {
  memoryStars: MemoryStar[]
  onSelect: (star: MemoryStar) => void
  theme: Theme
  getEntryColor: () => string
}

/* Clothesline geometry, in % of viewport */
const LEFT_POST_X = 14
const RIGHT_POST_X = 70
const POST_TOP = 26
const POST_BOTTOM = 56
const WIRE_TOP_Y = 28           // where the wire mounts to the post
const SAG = 4                   // % sag of the wire midpoint vs ends
const ENVELOPE_DROP_Y = 3.2     // % below the wire where envelope hangs
const PIN_DROP_Y = 0.6          // % below the wire where the clothespin sits

function wireY(t: number) {
  // Parabolic catenary approximation; t in [0,1]
  return WIRE_TOP_Y + 4 * SAG * t * (1 - t)
}

interface HangingEnvelopeProps {
  star: MemoryStar
  swayDelay: number
  swayAmount: number
  color: string
  theme: Theme
  onClick: () => void
}

function HangingEnvelope({
  star,
  swayDelay,
  swayAmount,
  color,
  theme,
  onClick,
}: HangingEnvelopeProps) {
  const ink = theme.text.secondary
  const paper = '#FAF6EC'
  const wash = `${color}1f` // ~12% mood-color tint

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Read memory from ${new Date(star.entry.createdAt).toDateString()}`}
      className="cursor-pointer focus:outline-none block"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        transformOrigin: 'top center',
      }}
      animate={{ rotate: [-swayAmount, swayAmount, -swayAmount] }}
      transition={{
        duration: 5 + swayDelay * 0.4,
        delay: swayDelay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: 1.1,
        y: -3,
        transition: { duration: 0.18 },
      }}
    >
      <svg
        viewBox="0 0 60 60"
        width="68"
        height="68"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* String dropping from wire to clothespin */}
        <line x1="30" y1="-4" x2="30" y2="6" stroke={ink} strokeWidth="0.7" opacity="0.6" />

        {/* Clothespin */}
        <g>
          <rect x="24" y="3" width="12" height="7" rx="1.4" fill={theme.accent.warm} opacity="0.95" />
          <rect x="24" y="3" width="12" height="2.8" rx="1.4" fill="#000" opacity="0.18" />
          <line x1="30" y1="3" x2="30" y2="10" stroke={ink} strokeWidth="0.5" opacity="0.55" />
        </g>

        {/* Envelope body */}
        <g>
          {/* Drop shadow */}
          <rect x="6.5" y="13.5" width="47" height="34" rx="1.5" fill="#000" opacity="0.12" />
          {/* Paper */}
          <rect x="6" y="13" width="47" height="34" rx="1.5" fill={paper} stroke={ink} strokeWidth="0.8" />
          {/* Mood-color wash */}
          <rect x="6" y="13" width="47" height="34" rx="1.5" fill={wash} />
          {/* Flap fold V */}
          <path d="M6,13 L29.5,32 L53,13" stroke={ink} strokeWidth="0.8" fill="none" />
          {/* Lower side folds */}
          <path
            d="M6,47 L21,30 M53,47 L38,30"
            stroke={ink}
            strokeWidth="0.5"
            fill="none"
            opacity="0.55"
          />
          {/* Wax seal */}
          <circle cx="29.5" cy="34" r="3.2" fill={color} opacity="0.92" />
          <circle cx="29.5" cy="34" r="3.2" fill="#FFFFFF" opacity="0.18" />
          <circle cx="28.5" cy="33" r="1" fill="#FFFFFF" opacity="0.55" />
        </g>
      </svg>
    </motion.button>
  )
}

export function LetterClothesline({
  memoryStars,
  onSelect,
  theme,
  getEntryColor,
}: LetterClotheslineProps) {
  if (memoryStars.length === 0) return null

  const ink = theme.text.secondary
  const wood = theme.text.muted
  const woodDark = theme.text.secondary

  // Distribute envelopes evenly along the wire (excluding endpoints)
  const N = memoryStars.length
  const positions = memoryStars.map((star, i) => {
    const t = (i + 1) / (N + 1)
    const wx = LEFT_POST_X + (RIGHT_POST_X - LEFT_POST_X) * t
    const wy = wireY(t)
    return {
      star,
      x: wx,
      // top of envelope sits a bit below the wire
      y: wy + PIN_DROP_Y,
      // Pull each one's sway phase apart so they don't move in sync
      swayDelay: (i * 0.7) % 4,
      // Subtle sway range, varies a touch per envelope
      swayAmount: 1.2 + ((i * 0.5) % 1.5),
      entryColor: getEntryColor(),
    }
  })

  // Build wire path in absolute viewport % coords inside an SVG that spans the viewport
  const wirePath = `M${LEFT_POST_X},${WIRE_TOP_Y} Q${(LEFT_POST_X + RIGHT_POST_X) / 2},${WIRE_TOP_Y + SAG * 2} ${RIGHT_POST_X},${WIRE_TOP_Y}`

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Posts + wire (decorative SVG layer) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Wire */}
        <motion.path
          d={wirePath}
          stroke={ink}
          strokeWidth="0.18"
          fill="none"
          opacity="0.85"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Left post */}
      <motion.div
        className="absolute"
        style={{
          left: `${LEFT_POST_X}%`,
          top: `${POST_TOP}%`,
          height: `${POST_BOTTOM - POST_TOP}%`,
          width: 6,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, ${woodDark}cc 0%, ${wood}f0 35%, ${woodDark}e0 100%)`,
          borderRadius: 1,
          boxShadow: `inset 1px 0 0 ${woodDark}55, inset -1px 0 0 ${woodDark}55`,
          transformOrigin: 'bottom',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.92 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Right post */}
      <motion.div
        className="absolute"
        style={{
          left: `${RIGHT_POST_X}%`,
          top: `${POST_TOP}%`,
          height: `${POST_BOTTOM - POST_TOP}%`,
          width: 6,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, ${woodDark}cc 0%, ${wood}f0 35%, ${woodDark}e0 100%)`,
          borderRadius: 1,
          boxShadow: `inset 1px 0 0 ${woodDark}55, inset -1px 0 0 ${woodDark}55`,
          transformOrigin: 'bottom',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.92 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Hanging envelopes — each wrapper is absolutely positioned at its
          point on the wire; the envelope itself is centered horizontally. */}
      <div className="absolute inset-0 pointer-events-auto">
        {positions.map(({ star, x, y, swayDelay, swayAmount, entryColor }, i) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y + ENVELOPE_DROP_Y}%`,
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <HangingEnvelope
              star={star}
              swayDelay={swayDelay}
              swayAmount={swayAmount}
              color={entryColor}
              theme={theme}
              onClick={() => onSelect(star)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
