export type Spread = {
  n: string
  title: string
  blurb: string
  bullets: string[]
  /** Short label for the right-page media slot (until real screenshots land). */
  media: string
}

export const SPREADS: Spread[] = [
  {
    n: 'I',
    title: 'The page that listens',
    blurb:
      'Words, doodles, a song, a mood — left exactly where you set them down. No prompts, no streaks, no judgement.',
    bullets: ['Free-form text + sketches', 'Voice notes, photos, songs', 'Auto-saved & encrypted'],
    media: 'Write screen — short loop',
  },
  {
    n: 'II',
    title: 'Letters that wait',
    blurb: 'Seal one to your future self, or to a friend. It returns when the time is right.',
    bullets: ['Choose a delivery date', 'Wax-seal & postmark', 'Open with a single tap'],
    media: 'Letter fold & seal — 4s gif',
  },
  {
    n: 'III',
    title: 'Small things, kept',
    blurb: "A scrapbook for photographs, scraps, and quiet keepsakes you don't want to lose.",
    bullets: ['Drag-drop scrapbook', 'Tag by feeling, not folder', 'Pinch to arrange'],
    media: 'Scrapbook arrangement screenshot',
  },
  {
    n: 'IV',
    title: 'Where memory grows',
    blurb:
      'A constellation, a garden, a small firelight — your year takes shape as something you can wander through.',
    bullets: ['Stars · constellation view', 'Garden · pressed leaves', 'Lanterns · monthly glow'],
    media: 'Stars page — slow drift',
  },
  {
    n: 'V',
    title: 'Quiet by design',
    blurb: 'No notifications. No streaks. No leaderboards. The journal opens when you do.',
    bullets: ['Zero push pings', 'Distraction-free editor', 'Optional daily nudge — once'],
    media: 'Settings panel screenshot',
  },
  {
    n: 'VI',
    title: 'Yours, encrypted',
    blurb: "End-to-end encrypted. Even we can't read it. Sync across devices, lose nothing.",
    bullets: ['E2E with your passphrase', 'Local-first sync', 'Export anytime, in plain text'],
    media: 'Lock animation gif',
  },
  {
    n: 'VII',
    title: 'It listens back',
    blurb:
      'Optional reflections — your journal can gently mirror what it heard, when you want.',
    bullets: ['On-device summaries', 'Weekly mirror, if you ask', 'You stay in charge'],
    media: 'Reflect modal screenshot',
  },
  {
    n: 'VIII',
    title: 'Made for late nights',
    blurb:
      'Vignette, embers, and a soft hearth glow that adapts to the hour. Easy on tired eyes.',
    bullets: ['Time-of-day vignette', 'Seven hand-tuned palettes', 'Ambient particles, off-able'],
    media: 'Theme cycle — 6s loop',
  },
  {
    n: 'IX',
    title: 'Begin anywhere',
    blurb: 'Web, desktop, mobile — the same hush, on whatever you reach for first.',
    bullets: ['Web, macOS, iOS, Android', 'Offline-first', 'Free to begin'],
    media: 'Devices mosaic',
  },
]
