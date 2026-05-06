'use client'

import { motion } from 'framer-motion'
import type { Theme, ThemeName } from '@/lib/themes'

type Props = {
  themeName: ThemeName
  theme: Theme
  active: boolean
  rotation: number
  hasTape: boolean
  onClick: () => void
}

export default function DiaryThemePolaroid({ themeName, theme, active, rotation, hasTape, onClick }: Props) {
  const seed = themeName.charCodeAt(0)
  const dots = [
    { x: 18 + (seed % 8), y: 24 + (seed % 12) },
    { x: 60 + ((seed * 3) % 12), y: 60 + ((seed * 5) % 14) },
    { x: 78 - ((seed * 7) % 18), y: 30 + ((seed * 2) % 14) },
  ]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Try ${theme.name} theme`}
      aria-pressed={active}
      className="relative bg-white p-2 pb-6 cursor-pointer focus:outline-none"
      style={{
        boxShadow: active
          ? `0 0 0 2px ${theme.accent.primary}, 0 12px 28px rgba(0,0,0,0.18)`
          : '0 8px 20px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
        rotate: `${rotation}deg`,
      }}
      whileHover={{ y: -6, rotate: rotation - 2, scale: 1.04, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.97 }}
    >
      {hasTape && (
        <span
          className="absolute -top-2 left-3 w-10 h-3 -rotate-12 pointer-events-none"
          style={{ background: 'rgba(255, 235, 130, 0.55)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
          aria-hidden
        />
      )}
      <div
        className="relative w-[112px] h-[88px] overflow-hidden"
        style={{ background: theme.bg.gradient }}
      >
        {dots.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: 3,
              height: 3,
              background: theme.text.muted,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      <p className="font-serif italic text-xs mt-2 text-center" style={{ color: '#3a3128', opacity: 0.8 }}>
        {theme.name}
      </p>
    </motion.button>
  )
}
