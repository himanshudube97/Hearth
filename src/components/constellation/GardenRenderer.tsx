'use client'

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { PostalScene } from './garden/scenes/PostalScene'
import { MeadowScene } from './garden/scenes/MeadowScene'
import { RoseGardenScene } from './garden/scenes/RoseGardenScene'
import { OceanHarbourScene } from './garden/scenes/OceanHarbourScene'
import { SunsetScene } from './garden/scenes/SunsetScene'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function GardenRenderer(props: GardenRendererProps) {
  switch (props.theme.ambience) {
    case 'postal':
      return <PostalScene {...props} />
    case 'rose':
      return <RoseGardenScene {...props} />
    case 'ocean':
      return <OceanHarbourScene {...props} />
    case 'sunset':
      return <SunsetScene {...props} />
    default:
      return <MeadowScene {...props} />
  }
}
