'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import type { Theme } from '@/lib/themes'
import type { MemoryStar } from '../ConstellationRenderer'
import { LetterDiamond } from './LetterDiamond'
import { letterPlacementForId } from './letterHash'

// Slot positions in % of the scene container. Index matches
// LetterPlacement.slotIndex. Tuned to my mockup:
//   0..2 — top row across the peaked roof
//   3,4  — sides (mid-height)
//   5,6  — lower row
const DESKTOP_SLOTS: Array<{ left: number; top: number }> = [
  { left: 32, top: 14 },
  { left: 50, top: 8 },
  { left: 68, top: 14 },
  { left: 18, top: 42 },
  { left: 82, top: 42 },
  { left: 22, top: 62 },
  { left: 78, top: 62 },
]

// Below ~600px we drop the lower row → 5 slots.
const MOBILE_SLOTS: Array<{ left: number; top: number }> = DESKTOP_SLOTS.slice(0, 5)

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

export interface LetterWallProps {
  memoryStars: MemoryStar[]
  theme: Theme
  onSelect: (star: MemoryStar) => void
}

export function LetterWall({ memoryStars, theme, onSelect }: LetterWallProps) {
  const mobile = useIsMobile()
  const slots = mobile ? MOBILE_SLOTS : DESKTOP_SLOTS

  // Resolve placement per memory. If two memories collide on the
  // same slot, the second one bumps to the next free index — keeps
  // the wall tidy without overlapping diamonds.
  const used = new Set<number>()
  const placed = memoryStars.slice(0, slots.length).map((star) => {
    const p = letterPlacementForId(star.id)
    let idx = p.slotIndex % slots.length
    while (used.has(idx)) idx = (idx + 1) % slots.length
    used.add(idx)
    return { star, slot: slots[idx], tilt: p.tilt, glow: p.glow }
  })

  const moodColor = (mood: number) =>
    [theme.moods[0], theme.moods[1], theme.moods[2], theme.moods[3], theme.moods[4]][mood] ??
    theme.accent.primary

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, slot, tilt, glow }) => (
        <LetterDiamond
          key={star.id}
          leftPct={slot.left}
          topPct={slot.top}
          tilt={tilt}
          sealColor={moodColor(star.entry.mood)}
          glow={glow}
          delay={star.delay}
          ariaLabel={`Memory from ${format(new Date(star.entry.createdAt), 'MMM d, yyyy')}`}
          onClick={() => onSelect(star)}
        />
      ))}
    </div>
  )
}
