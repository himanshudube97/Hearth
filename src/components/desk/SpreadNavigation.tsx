'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface SpreadNavigationProps {
  currentSpread: number
  totalSpreads: number
  maxSpreads?: number
  onSpreadChange: (spread: number) => void
  onAddSpread?: () => void
  className?: string
}

const SpreadNavigation = memo(function SpreadNavigation({
  currentSpread,
  totalSpreads,
  maxSpreads = 3,
  onSpreadChange,
  onAddSpread,
  className = '',
}: SpreadNavigationProps) {
  const { theme } = useThemeStore()

  const accentColor = theme.accent.warm
  const mutedColor = theme.text.muted

  const canAddMore = totalSpreads < maxSpreads && onAddSpread

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Spread dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSpreads }, (_, i) => i + 1).map((spreadNum) => (
          <motion.button
            key={spreadNum}
            onClick={() => onSpreadChange(spreadNum)}
            className="relative flex items-center justify-center"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: currentSpread === spreadNum ? accentColor : mutedColor,
                opacity: currentSpread === spreadNum ? 1 : 0.4,
              }}
              animate={{
                scale: currentSpread === spreadNum ? 1.2 : 1,
              }}
            />
            {/* Active indicator ring */}
            {currentSpread === spreadNum && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${accentColor}`,
                  transform: 'scale(1.8)',
                  opacity: 0.3,
                }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0.3 }}
              />
            )}
          </motion.button>
        ))}

        {/* Add spread button */}
        {canAddMore && (
          <motion.button
            onClick={onAddSpread}
            className="flex items-center justify-center w-6 h-6 rounded-full transition-all"
            style={{
              border: `1px dashed ${mutedColor}`,
              color: mutedColor,
            }}
            whileHover={{
              scale: 1.1,
              borderColor: accentColor,
              color: accentColor,
            }}
            whileTap={{ scale: 0.9 }}
            title="Add pages"
          >
            <span className="text-xs font-medium">+</span>
          </motion.button>
        )}
      </div>

      {/* Page label */}
      <div
        className="text-[10px] uppercase tracking-wider"
        style={{ color: mutedColor }}
      >
        Pages {(currentSpread - 1) * 2 + 1}-{currentSpread * 2}
      </div>
    </div>
  )
})

export default SpreadNavigation
