'use client'

import React from 'react'
import { motion, type MotionValue } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'

interface DiaryCoverProps {
  /** 0 (closed) → 1 (open). Drives all internal transforms. */
  progress: MotionValue<number>
}

const COVER_WIDTH = 650
const COVER_HEIGHT = 820

export default function DiaryCover({ progress: _progress }: DiaryCoverProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  return (
    <motion.div
      style={{
        position: 'absolute',
        // Anchor at the wrapper's horizontal center, extending right.
        // The wrapper translateX is what makes this appear centered on screen
        // when closed (see useDiaryCover wrapperX transform in Task 4).
        left: '50%',
        top: '50%',
        marginTop: -COVER_HEIGHT / 2,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        background: colors.cover,
        border: `1px solid ${colors.coverBorder}`,
        borderRadius: 4,
        // Hinge at the left edge (= the spine when open).
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: 40, // above the BookSpread (zIndex 30 in DeskScene)
      }}
    />
  )
}
