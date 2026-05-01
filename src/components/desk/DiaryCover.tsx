'use client'

import React from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'

interface DiaryCoverProps {
  rotateY: MotionValue<number>
  opacity: MotionValue<number>
  shadowBlur: MotionValue<number>
}

const COVER_WIDTH = 650
const COVER_HEIGHT = 820

export default function DiaryCover({ rotateY, opacity, shadowBlur }: DiaryCoverProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  // Compose the box-shadow CSS string from the motion blur value.
  // useTransform on a string output keeps it reactive on the GPU path.
  const boxShadow = useTransform(
    shadowBlur,
    (b) => `0 ${Math.round(b * 0.5)}px ${Math.round(b)}px rgba(0,0,0,0.45)`
  )

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginTop: -COVER_HEIGHT / 2,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        background: colors.cover,
        border: `1px solid ${colors.coverBorder}`,
        borderRadius: 4,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: 40,
        rotateY,
        opacity,
        boxShadow,
      }}
    />
  )
}
