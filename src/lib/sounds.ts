import type { Theme } from '@/lib/themes'

export const ambientSources: Record<Theme['ambience'], string> = {
  forest: '/sounds/ambient/forest.mp3',
  shire: '/sounds/ambient/shire.mp3',
  sunset: '/sounds/ambient/sunset.mp3',
  spring: '/sounds/ambient/spring.mp3',
  arctic: '/sounds/ambient/arctic.mp3',
  mountains: '/sounds/ambient/mountains.mp3',
  rainy: '/sounds/ambient/rainy.mp3',
  cosmos: '/sounds/ambient/cosmos.mp3',
  candle: '/sounds/ambient/candle.mp3',
  ocean: '/sounds/ambient/ocean.mp3',
  snowy: '/sounds/ambient/snowy.mp3',
}

export type SfxName = 'pageTurn' | 'themeSwitch' | 'letterSeal' | 'newEntry'

export const sfxSources: Record<SfxName, string> = {
  pageTurn: '/sounds/ui/page-turn.mp3',
  themeSwitch: '/sounds/ui/theme-switch.mp3',
  letterSeal: '/sounds/ui/letter-seal.mp3',
  newEntry: '/sounds/ui/new-entry.mp3',
}
