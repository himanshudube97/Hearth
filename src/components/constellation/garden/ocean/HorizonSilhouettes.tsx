'use client'

import { motion, useReducedMotion } from 'framer-motion'

const SILHOUETTE = '#2A3038'

export function HorizonSilhouettes() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Cliff (left ~30% of frame, from y=60% down to horizon ~78%) */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '60%',
          width: '30%',
          height: '18%',
          background: `linear-gradient(180deg, ${SILHOUETTE} 0%, #1A1620 100%)`,
          clipPath:
            'polygon(0 100%, 0 50%, 18% 30%, 35% 38%, 60% 25%, 78% 20%, 100% 30%, 100% 100%)',
        }}
      />

      {/* Real lighthouse — anchored on the cliff peak (~23% x, ~64% y) */}
      <div
        className="absolute"
        style={{
          left: '22%',
          bottom: '36%',
          width: 32,
          height: 100,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Rotating beam emanating from the lamp.
            Pivots around the lamp position (16, 20 in this container). */}
        <motion.div
          style={{
            position: 'absolute',
            left: 16,
            top: 20,
            width: 320,
            height: 70,
            transformOrigin: '0 50%',
            background:
              'linear-gradient(90deg, rgba(255,234,208,0.55) 0%, rgba(255,220,180,0.22) 55%, transparent 100%)',
            clipPath: 'polygon(0 45%, 100% 0%, 100% 100%, 0 55%)',
            mixBlendMode: 'screen',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: [0, 360],
                  opacity: [0.55, 0.55, 0, 0, 0.55],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  rotate: {
                    duration: 22,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: {
                    duration: 22,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, 0.5, 0.55, 0.95, 1],
                  },
                }
          }
        />

        {/* Lamp glow halo (sits behind the SVG, pulses) */}
        <motion.div
          style={{
            position: 'absolute',
            left: -4,
            top: 6,
            width: 40,
            height: 26,
            background:
              'radial-gradient(ellipse at center, rgba(255,234,208,0.75) 0%, rgba(244,208,184,0.35) 45%, transparent 80%)',
            borderRadius: '50%',
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }}
          animate={reduceMotion ? undefined : { opacity: [0.55, 0.95, 0.55] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        <svg
          viewBox="0 -4 32 104"
          width="32"
          height="104"
          style={{ overflow: 'visible', position: 'absolute', top: -4, left: 0 }}
        >
          {/* Foundation — slightly wider trapezoid at the base */}
          <path d="M 1 100 L 31 100 L 28 94 L 4 94 Z" fill={SILHOUETTE} />

          {/* Tapered tower body */}
          <path d="M 5 94 L 27 94 L 23 32 L 9 32 Z" fill={SILHOUETTE} />

          {/* Subtle horizontal stripes (suggest the white bands on a real lighthouse) */}
          <rect
            x="9.5"
            y="48"
            width="13"
            height="5"
            fill="rgba(255,255,255,0.22)"
          />
          <rect
            x="9.5"
            y="64"
            width="13"
            height="5"
            fill="rgba(255,255,255,0.22)"
          />
          <rect
            x="9.5"
            y="80"
            width="13"
            height="4"
            fill="rgba(255,255,255,0.22)"
          />

          {/* Gallery / walkway platform around the lamp room */}
          <rect x="2" y="28" width="28" height="4" fill={SILHOUETTE} />

          {/* Gallery railings */}
          <line
            x1="5"
            y1="24"
            x2="5"
            y2="28"
            stroke={SILHOUETTE}
            strokeWidth="0.7"
          />
          <line
            x1="11"
            y1="24"
            x2="11"
            y2="28"
            stroke={SILHOUETTE}
            strokeWidth="0.7"
          />
          <line
            x1="21"
            y1="24"
            x2="21"
            y2="28"
            stroke={SILHOUETTE}
            strokeWidth="0.7"
          />
          <line
            x1="27"
            y1="24"
            x2="27"
            y2="28"
            stroke={SILHOUETTE}
            strokeWidth="0.7"
          />
          <line
            x1="5"
            y1="24"
            x2="27"
            y2="24"
            stroke={SILHOUETTE}
            strokeWidth="0.5"
          />

          {/* Lamp room body */}
          <rect x="8" y="13" width="16" height="15" fill={SILHOUETTE} />

          {/* Lit lamp window — the cream glow shows through */}
          <rect x="10" y="15" width="12" height="10" fill="#FFEAD0" />

          {/* Window mullions (frame the glass into panes) */}
          <line
            x1="16"
            y1="15"
            x2="16"
            y2="25"
            stroke={SILHOUETTE}
            strokeWidth="0.5"
          />
          <line
            x1="10"
            y1="20"
            x2="22"
            y2="20"
            stroke={SILHOUETTE}
            strokeWidth="0.5"
          />

          {/* Conical roof */}
          <path d="M 6 13 L 26 13 L 16 1 Z" fill={SILHOUETTE} />

          {/* Spire / finial above the roof */}
          <line
            x1="16"
            y1="1"
            x2="16"
            y2="-3"
            stroke={SILHOUETTE}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="-2" r="1.2" fill={SILHOUETTE} />
        </svg>
      </div>
    </div>
  )
}
