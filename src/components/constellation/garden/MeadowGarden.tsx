'use client'

import type { Theme } from '@/lib/themes'
import { Plant, type PlantName } from './Plant'

interface GardenItem {
  id: string
  name: PlantName
  /** X in % of viewport width */
  x: number
  /** Y in % of viewport height */
  y: number
  /** Sprite size in px */
  size: number
  /** Rotation in degrees */
  rotate: number
  /** Saturation override for this item */
  saturate?: number
  /** Z-order; higher = in front */
  z: number
}

/**
 * Back row: three fence segments straddling the mid-horizontal axis,
 * with slight horizontal jitter so they don't read as one continuous
 * line. Lower saturation pushes them visually behind the flower row.
 */
const FENCE: GardenItem[] = [
  { id: 'fence-l', name: 'fence', x: 18, y: 60, size: 110, rotate: 0, saturate: 0.55, z: 1 },
  { id: 'fence-c', name: 'fence', x: 42, y: 61, size: 130, rotate: 0, saturate: 0.55, z: 1 },
  { id: 'fence-r', name: 'fence', x: 66, y: 60, size: 110, rotate: 0, saturate: 0.55, z: 1 },
]

/**
 * Flower cluster — 11 stems / blossoms across the band. Sizes and
 * rotations chosen for a "tended but informal" look. Z-order layers
 * taller stems behind shorter ones so the bouquet reads as planted.
 */
const FLOWERS: GardenItem[] = [
  { id: 'sun-1', name: 'sunflower', x: 22, y: 72, size: 46, rotate: -4, z: 5 },
  { id: 'rose-1', name: 'rose', x: 30, y: 70, size: 36, rotate: 6, z: 6 },
  { id: 'tul-1', name: 'tulip', x: 36, y: 74, size: 32, rotate: -3, z: 7 },
  { id: 'hib-1', name: 'hibiscus', x: 44, y: 71, size: 38, rotate: 4, z: 6 },
  { id: 'bls-1', name: 'blossom', x: 50, y: 75, size: 28, rotate: -2, z: 7 },
  { id: 'bouq-1', name: 'bouquet', x: 56, y: 70, size: 44, rotate: 2, z: 5 },
  { id: 'wht-1', name: 'wheat', x: 62, y: 73, size: 34, rotate: -5, z: 6 },
  { id: 'tul-2', name: 'tulip', x: 68, y: 74, size: 30, rotate: 3, z: 7 },
  { id: 'rose-2', name: 'rose', x: 74, y: 72, size: 32, rotate: -4, z: 6 },
  { id: 'bls-2', name: 'blossom', x: 79, y: 75, size: 26, rotate: 5, z: 7 },
  { id: 'sun-2', name: 'sunflower', x: 84, y: 71, size: 40, rotate: -2, z: 5 },
]

/**
 * Two potted plants flanking the cluster as visual weight.
 */
const POTS: GardenItem[] = [
  { id: 'pot-l', name: 'potted-plant', x: 14, y: 78, size: 56, rotate: -2, z: 4 },
  { id: 'pot-r', name: 'potted-plant', x: 88, y: 78, size: 56, rotate: 2, z: 4 },
]

const ITEMS: GardenItem[] = [...FENCE, ...POTS, ...FLOWERS]

interface MeadowGardenProps {
  theme: Theme
}

export function MeadowGarden({ theme: _theme }: MeadowGardenProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      {ITEMS.map(item => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: item.z,
          }}
        >
          <Plant
            name={item.name}
            width={item.size}
            rotate={item.rotate}
            saturate={item.saturate ?? 0.7}
            opacity={0.95}
          />
        </div>
      ))}
    </div>
  )
}
