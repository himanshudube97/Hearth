'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MemoryStar } from '../../ConstellationRenderer'
import { PaperBoat } from './PaperBoat'
import { oceanHashForId } from './oceanHash'

interface PaperBoatsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  getMoodColor: (mood: number) => string
}

interface Slot {
  /** % from left edge of viewport */
  x: number
  /** % from bottom edge of viewport */
  yFromBottom: number
}

// 7 desktop slots — slight Y variance gives "boats on uneven water" feel.
// Slot indices match oceanHash output (0..6). Mobile drops slots 5 and 6.
const DESKTOP_SLOTS: Slot[] = [
  { x: 8, yFromBottom: 14 },
  { x: 25, yFromBottom: 12 },
  { x: 34, yFromBottom: 18 },
  { x: 42, yFromBottom: 10 },
  { x: 58, yFromBottom: 14 },
  { x: 73, yFromBottom: 9 },
  { x: 86, yFromBottom: 13 },
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

export function PaperBoats({
  memoryStars,
  onSelect,
  getMoodColor,
}: PaperBoatsProps) {
  const isMobile = useIsMobile()

  const placed = useMemo(() => {
    const usableSlotCount = isMobile ? 5 : 7
    // Track which slots are filled so two entries can't collide on the same slot.
    const taken = new Set<number>()
    return memoryStars
      .map((star) => {
        const h = oceanHashForId(star.id)
        let slot = h.slotIndex % usableSlotCount
        // Linear-probe to next free slot if collision.
        while (taken.has(slot)) {
          slot = (slot + 1) % usableSlotCount
        }
        taken.add(slot)
        return { star, hash: h, slotIndex: slot }
      })
      .slice(0, usableSlotCount)
  }, [memoryStars, isMobile])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, hash, slotIndex }, i) => {
        const slot = DESKTOP_SLOTS[slotIndex]
        return (
          <PaperBoat
            key={star.id}
            slotX={slot.x}
            slotYFromBottom={slot.yFromBottom}
            tilt={hash.tilt}
            scale={hash.scale}
            phaseOffset={(slotIndex * 0.5) % 3.5}
            glow={hash.glow}
            glowColor={getMoodColor(star.entry.mood)}
            delay={0.4 + i * 0.12}
            onClick={() => onSelect(star)}
            ariaLabel={`Open memory from ${new Date(
              star.entry.createdAt,
            ).toLocaleDateString()}`}
          />
        )
      })}
    </div>
  )
}
