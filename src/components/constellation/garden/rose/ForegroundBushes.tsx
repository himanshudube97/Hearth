'use client'

import { motion } from 'framer-motion'

interface BushProps {
  side: 'left' | 'right'
}

function Bush({ side }: BushProps) {
  const isLeft = side === 'left'
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{
        [isLeft ? 'left' : 'right']: '-4%',
        width: '32vmin',
        height: '32vmin',
        transformOrigin: isLeft ? 'bottom left' : 'bottom right',
      }}
      animate={{ rotate: isLeft ? [-1.2, 1, -1.2] : [1.2, -1, 1.2] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* Back-most layer — softest, darkest green */}
        <ellipse cx={isLeft ? 60 : 140} cy="170" rx="80" ry="40" fill="#4E6A3F" opacity="0.55" />
        <ellipse cx={isLeft ? 110 : 90} cy="160" rx="70" ry="38" fill="#4E6A3F" opacity="0.5" />

        {/* Mid-leaf clumps */}
        <ellipse cx={isLeft ? 50 : 150} cy="150" rx="44" ry="30" fill="#5C7A4B" opacity="0.85" />
        <ellipse cx={isLeft ? 90 : 110} cy="135" rx="42" ry="28" fill="#5C7A4B" opacity="0.8" />
        <ellipse cx={isLeft ? 30 : 170} cy="160" rx="36" ry="24" fill="#5C7A4B" opacity="0.75" />

        {/* Foreground bright clumps */}
        <ellipse cx={isLeft ? 70 : 130} cy="125" rx="34" ry="22" fill="#6E8E58" opacity="0.95" />
        <ellipse cx={isLeft ? 105 : 95} cy="115" rx="28" ry="18" fill="#7E9E68" opacity="0.95" />
        <ellipse cx={isLeft ? 45 : 155} cy="135" rx="26" ry="18" fill="#6E8E58" opacity="0.9" />

        {/* Tiny rose bud highlight tucked into the bush */}
        <g transform={`translate(${isLeft ? 80 : 120} 110)`}>
          <ellipse cx="0" cy="0" rx="6" ry="8" fill="#E27062" stroke="rgba(122,32,48,0.4)" strokeWidth="0.4" />
          <ellipse cx="-2" cy="0" rx="3.5" ry="6.5" fill="#B12838" opacity="0.5" />
        </g>

        {/* A second hidden bud on the other side */}
        <g transform={`translate(${isLeft ? 40 : 160} 142)`}>
          <ellipse cx="0" cy="0" rx="5" ry="7" fill="#F4B6B0" stroke="rgba(122,32,48,0.4)" strokeWidth="0.3" />
        </g>

        {/* A few leaf-tip strokes for texture */}
        <g stroke="#3F5A33" strokeWidth="0.8" fill="none" opacity="0.6">
          <path d={isLeft ? 'M40,140 q8,-6 16,-2' : 'M160,140 q-8,-6 -16,-2'} />
          <path d={isLeft ? 'M70,120 q10,-8 20,-3' : 'M130,120 q-10,-8 -20,-3'} />
          <path d={isLeft ? 'M30,160 q12,-4 22,0' : 'M170,160 q-12,-4 -22,0'} />
        </g>
      </svg>
    </motion.div>
  )
}

export function ForegroundBushes() {
  return (
    <>
      <Bush side="left" />
      <Bush side="right" />
    </>
  )
}
