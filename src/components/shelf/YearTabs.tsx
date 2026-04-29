// src/components/shelf/YearTabs.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface YearTabsProps {
  years: number[] // ascending, e.g. [2024, 2025, 2026]
  selectedYear: number
  onSelect: (year: number) => void
}

export default function YearTabs({ years, selectedYear, onSelect }: YearTabsProps) {
  const { theme } = useThemeStore()

  if (years.length <= 1) {
    // No tabs to show when the user has only one year of data.
    return null
  }

  return (
    <div
      role="tablist"
      aria-label="Year"
      className="flex justify-center gap-1 mb-8"
    >
      {years.map((year) => {
        const isActive = year === selectedYear
        return (
          <motion.button
            key={year}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(year)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-4 py-1.5 rounded-full text-sm relative"
            style={{
              color: isActive ? theme.text.primary : theme.text.muted,
              fontFamily: 'Georgia, Palatino, serif',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="shelf-year-active"
                className="absolute inset-0 rounded-full"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              />
            )}
            <span className="relative z-10">{year}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
