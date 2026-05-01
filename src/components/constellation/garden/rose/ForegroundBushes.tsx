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
        [isLeft ? 'left' : 'right']: '-2%',
        width: '24vmin',
        height: '20vmin',
        transformOrigin: isLeft ? 'bottom left' : 'bottom right',
      }}
      animate={{ rotate: isLeft ? [-1, 0.8, -1] : [1, -0.8, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* Soft ground shadow */}
        <ellipse cx="100" cy="148" rx="92" ry="6" fill="rgba(78,106,63,0.2)" />

        {/* Single rounded bush silhouette */}
        <path
          d="M30,150 C20,120 28,90 50,80 C66,72 84,76 100,72 C118,68 138,76 152,90 C172,108 178,135 168,150 Z"
          fill="#5C7A4B"
          opacity="0.95"
        />

        {/* Highlight crown along the top */}
        <path
          d="M50,82 C68,74 88,76 104,72 C122,68 142,78 156,92"
          fill="none"
          stroke="#7E9E68"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Two tucked-in rose buds */}
        <g transform={`translate(${isLeft ? 70 : 130} 92)`}>
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.8" />
          <ellipse cx="-3" cy="6" rx="3" ry="1.8" fill="#6E8E58" transform="rotate(-30 -3 6)" />
          <ellipse cx="3" cy="6" rx="3" ry="1.8" fill="#6E8E58" transform="rotate(30 3 6)" />
          <ellipse cx="0" cy="-4" rx="5" ry="6.5" fill="#E27062" stroke="rgba(122,32,48,0.4)" strokeWidth="0.4" />
          <ellipse cx="-1.5" cy="-4" rx="3" ry="5.5" fill="#B12838" opacity="0.5" />
        </g>
        <g transform={`translate(${isLeft ? 110 : 90} 96) scale(0.8)`}>
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.8" />
          <ellipse cx="0" cy="-4" rx="5" ry="6.5" fill="#F4D26B" stroke="rgba(122,80,32,0.35)" strokeWidth="0.4" />
        </g>

        {/* Three tiny daisies dotted across the top */}
        <g>
          {[
            { x: isLeft ? 56 : 144, y: 80 },
            { x: isLeft ? 92 : 108, y: 76 },
            { x: isLeft ? 138 : 62, y: 86 },
          ].map((d, i) => (
            <g key={i} transform={`translate(${d.x} ${d.y})`}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse
                  key={a}
                  cx="0"
                  cy="-3"
                  rx="1.2"
                  ry="2.2"
                  fill="#FBF4ED"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle cx="0" cy="0" r="1" fill="#E8B040" />
            </g>
          ))}
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
