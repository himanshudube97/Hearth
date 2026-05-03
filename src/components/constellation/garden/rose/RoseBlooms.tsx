'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { MemoryStar } from '../../ConstellationRenderer'
import { RoseSVG } from './RoseSVG'
import { roseSizeForId } from './roseHash'

interface RoseBloomsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  glowColor: string
}

// Five blooms clustered around the trellis: 3 along the arch + 2 flanking the posts.
// Color is fixed per anchor so the bouquet always reads as 2 yellow / 2 red / 1 white,
// regardless of which entries land in which slots.
const DESKTOP_ANCHORS: { x: number; y: number }[] = [
  { x: 38, y: 32 },
  { x: 50, y: 26 },
  { x: 62, y: 32 },
  { x: 30, y: 50 },
  { x: 70, y: 50 },
]

const MOBILE_ANCHORS: { x: number; y: number }[] = [
  { x: 32, y: 36 },
  { x: 50, y: 30 },
  { x: 68, y: 36 },
  { x: 24, y: 54 },
  { x: 76, y: 54 },
]

// Index-aligned with ANCHORS: arch-left, arch-top, arch-right, flank-left, flank-right.
const ANCHOR_COLORS: string[] = [
  '#F4D26B', // yellow — arch left
  '#F8E8D8', // cream/white — arch top centerpiece
  '#F4D26B', // yellow — arch right
  '#B12838', // crimson — flank left
  '#B12838', // crimson — flank right
]

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isMobile
}

export function RoseBlooms({ memoryStars, onSelect, glowColor }: RoseBloomsProps) {
  const isMobile = useIsMobile()
  const anchors = isMobile ? MOBILE_ANCHORS : DESKTOP_ANCHORS

  const placed = useMemo(() => {
    return memoryStars.slice(0, anchors.length).map((star, i) => ({
      star,
      anchor: anchors[i],
      color: ANCHOR_COLORS[i],
      size: roseSizeForId(star.id) * (isMobile ? 0.7 : 1),
    }))
  }, [memoryStars, anchors, isMobile])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, anchor, color, size }, i) => (
        <motion.button
          key={star.id}
          type="button"
          onClick={() => onSelect(star)}
          aria-label={`Open memory from ${new Date(star.entry.createdAt).toLocaleDateString()}`}
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
          <RoseSVG color={color} glow={glowColor} size={size} />
        </motion.button>
      ))}
    </div>
  )
}
