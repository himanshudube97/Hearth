'use client'

import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { PostalScene } from './garden/scenes/PostalScene'
import { MeadowScene } from './garden/scenes/MeadowScene'

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
    default:
      return <MeadowScene {...props} />
  }
}
