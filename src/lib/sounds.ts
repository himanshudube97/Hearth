import type { Theme } from '@/lib/themes'

export const ambientSources: Record<Theme['ambience'], string | null> = {
  forest: '/sounds/ambient/forest.mp3',
  firelight: '/sounds/ambient/candle.mp3',
  sun: null,
  rose: '/sounds/ambient/spring.mp3',
  sage: null,
  ocean: '/sounds/ambient/ocean.mp3',
  saffron: null,
  garden: null,
  postal: null,
  linen: null,
}

export type SfxName = 'pageTurn'

export const sfxSources: Record<SfxName, string> = {
  pageTurn: '/sounds/ui/page-turn.mp3',
}
