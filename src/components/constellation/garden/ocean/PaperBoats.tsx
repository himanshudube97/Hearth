'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MemoryStar } from '../../ConstellationRenderer'
import { PaperBoat } from './PaperBoat'
import { oceanHashForId } from './oceanHash'

interface PaperBoatsProps {
  memoryStars: MemoryStar[]
  onSelect: (s: MemoryStar) => void
  glowColor: string
}

interface Slot {
  /** % from left edge of viewport */
  x: number
  /** % from bottom edge of viewport */
  yFromBottom: number
}

// 5 desktop slots — slight Y variance gives "boats on uneven water" feel.
// Slot indices match oceanHash output (0..4). Mobile drops slot 4 (far right).
const DESKTOP_SLOTS: Slot[] = [
  { x: 14, yFromBottom: 13 },
  { x: 32, yFromBottom: 11 },
  { x: 50, yFromBottom: 14 },
  { x: 68, yFromBottom: 10 },
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
  glowColor,
}: PaperBoatsProps) {
  const isMobile = useIsMobile()

  const placed = useMemo(() => {
    const usableSlotCount = isMobile ? 4 : 5
    // Track which slots are filled so two entries can't collide on the same slot.
    const taken = new Set<number>()
    // Cap entries to the slot count BEFORE allocating, so the linear-probe
    // loop below always terminates (it would spin forever if there were more
    // entries than slots).
    return memoryStars.slice(0, usableSlotCount).map((star) => {
      const h = oceanHashForId(star.id)
      let slot = h.slotIndex % usableSlotCount
      while (taken.has(slot)) {
        slot = (slot + 1) % usableSlotCount
      }
      taken.add(slot)
      return { star, hash: h, slotIndex: slot }
    })
  }, [memoryStars, isMobile])

  return (
    <div className="absolute inset-0">
      {placed.map(({ star, hash, slotIndex }) => {
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
            glowColor={glowColor}
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
