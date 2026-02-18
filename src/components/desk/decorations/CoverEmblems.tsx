// src/components/desk/decorations/CoverEmblems.tsx
'use client'

import { motion } from 'framer-motion'

interface CoverEmblemsProps {
  style: 'crest' | 'moon' | 'rose' | 'flower' | 'constellation' | 'none'
  color: string
  glowing?: boolean
}

export function CoverEmblems({ style, color, glowing = false }: CoverEmblemsProps) {
  if (style === 'none') return null

  const Wrapper = glowing ? motion.div : 'div'
  const wrapperProps = glowing ? {
    animate: { filter: ['drop-shadow(0 0 8px ' + color + ')', 'drop-shadow(0 0 15px ' + color + ')', 'drop-shadow(0 0 8px ' + color + ')'] },
    transition: { duration: 2, repeat: Infinity }
  } : {}

  const emblems = {
    crest: (
      <svg viewBox="0 0 60 70" className="w-16 h-20">
        <path
          d="M30 5 L55 20 L55 45 Q55 60 30 65 Q5 60 5 45 L5 20 Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M30 15 L45 25 L45 42 Q45 52 30 55 Q15 52 15 42 L15 25 Z"
          fill={color}
          opacity="0.2"
        />
        <text x="30" y="42" textAnchor="middle" fontSize="18" fill={color}>H</text>
      </svg>
    ),
    moon: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="2" />
        <path
          d="M25 15 Q40 25 40 40 Q25 35 25 15"
          fill={color}
          opacity="0.3"
        />
        <circle cx="38" cy="20" r="2" fill={color} opacity="0.6" />
        <circle cx="42" cy="35" r="1.5" fill={color} opacity="0.5" />
      </svg>
    ),
    rose: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="6" fill={color} />
        <ellipse cx="30" cy="18" rx="8" ry="12" fill={color} opacity="0.7" />
        <ellipse cx="18" cy="30" rx="12" ry="8" fill={color} opacity="0.7" />
        <ellipse cx="42" cy="30" rx="12" ry="8" fill={color} opacity="0.7" />
        <ellipse cx="30" cy="42" rx="8" ry="12" fill={color} opacity="0.7" />
        <path d="M30 55 L30 65" stroke={color} strokeWidth="2" />
        <path d="M25 60 Q30 55 35 60" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    flower: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="30" cy="30" r="5" fill={color} />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse
            key={i}
            cx="30"
            cy="15"
            rx="6"
            ry="10"
            fill={color}
            opacity="0.6"
            transform={`rotate(${angle} 30 30)`}
          />
        ))}
      </svg>
    ),
    constellation: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="15" cy="20" r="2" fill={color} />
        <circle cx="45" cy="15" r="2.5" fill={color} />
        <circle cx="30" cy="35" r="2" fill={color} />
        <circle cx="50" cy="45" r="1.5" fill={color} />
        <circle cx="20" cy="50" r="2" fill={color} />
        <line x1="15" y1="20" x2="45" y2="15" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="45" y1="15" x2="30" y2="35" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="35" x2="50" y2="45" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="35" x2="20" y2="50" stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1="15" y1="20" x2="20" y2="50" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </svg>
    ),
  }

  return (
    <Wrapper className="absolute inset-0 flex items-center justify-center pointer-events-none" {...wrapperProps}>
      {emblems[style]}
    </Wrapper>
  )
}
