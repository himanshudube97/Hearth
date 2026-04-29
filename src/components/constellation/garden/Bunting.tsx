'use client'

import { motion, useTransform } from 'framer-motion'
import type { GardenParallax } from './useGardenParallax'

interface Props {
  parallax: GardenParallax
}

// Festival-bunting flag colors — warm, saturated, vintage palette
const FLAGS = [
  '#E14E4E', // red
  '#E89A3C', // orange
  '#F1C84B', // yellow
  '#7BB069', // green
  '#3FA09B', // teal
  '#4A6FB0', // blue
  '#8A5BB0', // purple
  '#C8557E', // pink
  '#E14E4E',
  '#E89A3C',
  '#F1C84B',
  '#7BB069',
  '#3FA09B',
  '#4A6FB0',
  '#8A5BB0',
  '#C8557E',
  '#E14E4E',
]

/**
 * A sagging rope of colorful triangle flags strung between the left and
 * right foreground lamps. The whole strand sways gently and the flags
 * flutter individually.
 */
export function Bunting({ parallax }: Props) {
  // Bunting counter-parallaxes with the foreground lamps so it stays
  // visually attached to them.
  const tx = useTransform(parallax.x, v => v * 8)
  const ty = useTransform(parallax.y, v => v * 3)

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        // Anchored between the two lamp heads (~11% to ~89% across).
        // Positioned vertically so the rope ENDS hit each lamp's head.
        left: '12%',
        right: '12%',
        top: '54%',
        height: 90,
        x: tx,
        y: ty,
        zIndex: 25,
      }}
      animate={{ y: [0, 1.5, 0, -1, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* The rope itself — a sagging quadratic curve.
          ViewBox is normalized so positions can be expressed as percentages. */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 90"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 0,4 Q 50,42 100,4"
          fill="none"
          stroke="#3a2a18"
          strokeWidth="0.55"
          strokeLinecap="round"
          opacity="0.85"
          animate={{
            d: [
              'M 0,4 Q 50,42 100,4',
              'M 0,4 Q 50,46 100,4',
              'M 0,4 Q 50,40 100,4',
              'M 0,4 Q 50,44 100,4',
              'M 0,4 Q 50,42 100,4',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Triangle flags overlaid as absolutely-positioned divs.
          For each flag we compute its (left%, ropeY) on the rope curve and
          hang it from there. The y formula matches the SVG quadratic above. */}
      {FLAGS.map((color, i) => {
        const t = (i + 0.5) / FLAGS.length
        const leftPct = t * 100
        // Quadratic Bezier y from "M 0,4 Q 50,42 100,4":
        //   y(t) = 4(1-t)^2 + 84(1-t)t + 4t^2  =  4 + 76·t·(1-t)
        // (Path Y is on the rope; the flag hangs ~24px below.)
        const ropeY = 4 + 76 * t * (1 - t)
        // The svg viewBox 0..90 maps to container height 90px, so ropeY in
        // viewBox coords ≈ ropeY in px (since preserveAspectRatio=none and
        // height is exactly 90).
        const flagTop = ropeY - 1 // tiny overlap so flag visually attaches
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${leftPct}%`,
              top: flagTop,
              width: 16,
              height: 24,
              marginLeft: -8,
              background: color,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              transformOrigin: 'top center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
            animate={{
              rotate: [-3, 3, -2, 4, -3],
              scaleY: [1, 1.04, 0.98, 1.03, 1],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i * 0.18) % 4,
            }}
          />
        )
      })}
    </motion.div>
  )
}
