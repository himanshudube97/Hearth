// src/components/desk/decorations/Watermarks.tsx
'use client'

import { motion } from 'framer-motion'

interface WatermarksProps {
  style: 'rose' | 'inkSplatter' | 'runes' | 'none'
  color: string
}

export function Watermarks({ style, color }: WatermarksProps) {
  if (style === 'none') return null

  const watermarks = {
    rose: (
      <svg viewBox="0 0 100 100" className="w-32 h-32 opacity-[0.06]">
        <circle cx="50" cy="50" r="8" fill={color} />
        <ellipse cx="50" cy="35" rx="12" ry="18" fill={color} />
        <ellipse cx="35" cy="50" rx="18" ry="12" fill={color} />
        <ellipse cx="65" cy="50" rx="18" ry="12" fill={color} />
        <ellipse cx="50" cy="65" rx="12" ry="18" fill={color} />
        <ellipse cx="38" cy="38" rx="10" ry="14" fill={color} transform="rotate(-45 38 38)" />
        <ellipse cx="62" cy="38" rx="10" ry="14" fill={color} transform="rotate(45 62 38)" />
      </svg>
    ),
    inkSplatter: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-[0.04]">
        <circle cx="50" cy="50" r="15" fill={color} />
        <circle cx="35" cy="45" r="8" fill={color} />
        <circle cx="65" cy="55" r="10" fill={color} />
        <circle cx="45" cy="65" r="6" fill={color} />
        <circle cx="60" cy="35" r="5" fill={color} />
        <ellipse cx="30" cy="60" rx="4" ry="6" fill={color} />
        <ellipse cx="70" cy="40" rx="3" ry="5" fill={color} />
      </svg>
    ),
    runes: (
      <motion.svg
        viewBox="0 0 100 100"
        className="w-28 h-28 opacity-[0.08]"
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <text x="50" y="30" textAnchor="middle" fontSize="16" fill={color}>&#5765;</text>
        <text x="30" y="55" textAnchor="middle" fontSize="14" fill={color}>&#5809;</text>
        <text x="70" y="55" textAnchor="middle" fontSize="14" fill={color}>&#5794;</text>
        <text x="50" y="80" textAnchor="middle" fontSize="16" fill={color}>&#5791;</text>
        <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </motion.svg>
    ),
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {watermarks[style]}
    </div>
  )
}
