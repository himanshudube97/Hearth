'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../../ConstellationRenderer'
import { RoseSVG } from './RoseSVG'
import { roseColorForId, roseSizeForId } from './roseHash'

interface RoseBloomsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  getMoodColor: (mood: number) => string
  theme: Theme
}

// Anchor positions for up to 7 blooms, in viewport-percentage coords.
// Index 0..2 → on the trellis arch; 3..6 → flanking bushes.
const ANCHORS: { x: number; y: number }[] = [
  { x: 38, y: 32 }, // arch left
  { x: 50, y: 26 }, // arch top
  { x: 62, y: 32 }, // arch right
  { x: 18, y: 62 }, // bush far-left
  { x: 30, y: 70 }, // bush mid-left
  { x: 70, y: 70 }, // bush mid-right
  { x: 82, y: 62 }, // bush far-right
]

export function RoseBlooms({ memoryStars, onSelect, getMoodColor }: RoseBloomsProps) {
  const placed = useMemo(() => {
    return memoryStars.slice(0, ANCHORS.length).map((star, i) => ({
      star,
      anchor: ANCHORS[i],
      color: roseColorForId(star.id),
      size: roseSizeForId(star.id),
    }))
  }, [memoryStars])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, anchor, color, size }, i) => (
        <motion.button
          key={star.id}
          type="button"
          onClick={() => onSelect(star)}
          className="absolute cursor-pointer focus:outline-none"
          style={{
            left: `${anchor.x}%`,
            top: `${anchor.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 1.25, y: -4 }}
        >
          <RoseSVG color={color} glow={getMoodColor(star.entry.mood)} size={size} />
        </motion.button>
      ))}
    </div>
  )
}
