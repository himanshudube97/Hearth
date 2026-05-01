'use client'

import { motion, useReducedMotion } from 'framer-motion'

const SILHOUETTE = '#1A1620'

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

      {/* Lighthouse on the cliff */}
      <div
        className="absolute"
        style={{
          left: '22%',
          top: '52%',
          width: 8,
          height: 24,
        }}
      >
        {/* Tower body — tapered triangle */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 8,
            height: 18,
            background: SILHOUETTE,
            clipPath: 'polygon(20% 100%, 80% 100%, 100% 0, 0 0)',
          }}
        />
        {/* Lamp housing */}
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 0,
            width: 6,
            height: 6,
            background: SILHOUETTE,
          }}
        />
        {/* Lit lamp — pulses 0.7 → 1.0 over 3s; static when reduced-motion is set */}
        <motion.div
          style={{
            position: 'absolute',
            left: 2,
            top: 4,
            width: 4,
            height: 4,
            background: '#FFD890',
            borderRadius: '50%',
            boxShadow: '0 0 8px #FFAA50, 0 0 16px #FF8030',
          }}
          animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>

      {/* Far-distant sailboat 1 (full size) at 42% x */}
      <FarBoat left="42%" top="73%" scale={1} />
      {/* Far-distant sailboat 2 (smaller) at 78% x */}
      <FarBoat left="78%" top="74%" scale={0.8} />
    </div>
  )
}

function FarBoat({
  left,
  top,
  scale,
}: {
  left: string
  top: string
  scale: number
}) {
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        width: 12,
        height: 14,
        transform: `scale(${scale})`,
      }}
    >
      {/* Tiny hull */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 12,
          height: 3,
          background: SILHOUETTE,
          clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
        }}
      />
      {/* Tiny triangular sail */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          bottom: 3,
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `9px solid ${SILHOUETTE}`,
        }}
      />
    </div>
  )
}
