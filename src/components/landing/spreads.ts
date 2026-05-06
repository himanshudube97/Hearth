// src/components/landing/spreads.ts

export type CoverSpread = {
  kind: 'cover'
  title: string
  subtitle: string
}

export type FeatureSpread = {
  kind: 'feature'
  numeral: string
  title: string
  copy: string
  marginalia: string
  illustration?: 'journal' | 'letters' | 'scrapbook' | 'memory'
  imagePath: string
  imageAlt: string
  caption: string
}

export type ThemesSpread = {
  kind: 'themes'
  numeral: string
  title: string
  copy: string
  marginalia: string
}

export type CtaSpread = {
  kind: 'cta'
  text: string
  buttonLabel: string
  buttonHref: string
}

export type SpreadDef = CoverSpread | FeatureSpread | ThemesSpread | CtaSpread

export const SPREADS: SpreadDef[] = [
  {
    kind: 'cover',
    title: 'HEARTH',
    subtitle: 'A small house for the days.',
  },
  {
    kind: 'feature',
    numeral: 'I',
    title: 'The page that listens',
    copy: 'Words, doodles, a song, a mood — left exactly where you set them down. The page holds them as you wrote them, no edits asked.',
    marginalia: '— for later',
    illustration: 'journal',
    imagePath: '/landing/diary/journal-entry.png',
    imageAlt: 'A written entry on the desk: text, a photo, an embedded song, a soft mood mark.',
    caption: 'words. a photo. a song. a mood.',
  },
  {
    kind: 'feature',
    numeral: 'II',
    title: 'Letters that wait',
    copy: 'Seal one to your future self, or to a friend. It returns when the time is right — a week from now, a year from now, on a date you choose.',
    marginalia: '— sealed and waiting',
    illustration: 'letters',
    imagePath: '/landing/diary/letter-sealed.png',
    imageAlt: 'A letter being sealed with a wax stamp.',
    caption: 'a wax stamp. a date you choose.',
  },
  {
    kind: 'feature',
    numeral: 'III',
    title: 'Small things, kept',
    copy: 'A scrapbook for photographs, scraps, and quiet keepsakes you don’t want to lose. Drag them where they want to live; pin them in place.',
    marginalia: '— pinned in place',
    illustration: 'scrapbook',
    imagePath: '/landing/diary/scrapbook.png',
    imageAlt: 'A populated scrapbook canvas with photos, notes, and stickers.',
    caption: 'photographs. scraps. keepsakes.',
  },
  {
    kind: 'feature',
    numeral: 'IV',
    title: 'Where memory grows',
    copy: 'A constellation, a garden, a small firelight — your year takes shape as something you can wander through. Every entry leaves a small light.',
    marginalia: '— look up',
    illustration: 'memory',
    imagePath: '/landing/diary/memory-constellation.png',
    imageAlt: 'A constellation of points, each a remembered day, drawn across a dark sky.',
    caption: 'a year, drawn out.',
  },
  {
    kind: 'themes',
    numeral: 'V',
    title: 'A house with many windows',
    copy: 'Seven weathers — fireflies, embers, sakura, mist, more. Pick the one that matches today; click any to feel it now.',
    marginalia: '— pick your weather',
  },
  {
    kind: 'feature',
    numeral: 'VI',
    title: 'Yours alone',
    copy: 'Encrypted with a key only you hold. Not us, not anyone. Lose the key, lose the diary. That’s the deal — and the point.',
    marginalia: '— only yours',
    // illustration intentionally absent — photo-only spread
    imagePath: '/landing/diary/master-key.png',
    imageAlt: 'The master-key unlock screen.',
    caption: 'a key only you hold.',
  },
  {
    kind: 'cta',
    text: 'The page is yours.',
    buttonLabel: 'Begin Writing',
    buttonHref: '/write',
  },
]
