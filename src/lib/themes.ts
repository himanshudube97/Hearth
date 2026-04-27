// Theme definitions for Hearth

export type ThemeName = 'rivendell' | 'hobbiton' | 'winterSunset' | 'cherryBlossom' | 'northernLights' | 'mistyMountains' | 'gentleRain' | 'cosmos' | 'candlelight' | 'oceanTwilight' | 'quietSnow' | 'warmPeaceful'

export interface Theme {
  name: string
  description: string
  mode: 'light' | 'dark'
  bg: {
    primary: string
    secondary: string
    gradient: string
  }
  text: {
    primary: string
    secondary: string
    muted: string
  }
  accent: {
    primary: string
    secondary: string
    warm: string
    highlight: string
  }
  glass: {
    bg: string
    border: string
    blur: string
  }
  moods: {
    0: string
    1: string
    2: string
    3: string
    4: string
  }
  moodEmojis: string[]
  moodLabels: string[]
  particles: 'fireflies' | 'snow' | 'sakura' | 'aurora' | 'mist' | 'rain' | 'stars' | 'dust' | 'foam' | 'snowflakes' | 'dandelion' | 'sunbeam'
  ambience: 'forest' | 'sunset' | 'spring' | 'arctic' | 'mountains' | 'rainy' | 'cosmos' | 'candle' | 'ocean' | 'snowy' | 'shire'
}

// Rivendell Sunset - Forest greens with fireflies
export const rivendellTheme: Theme = {
  name: 'Rivendell Sunset',
  description: 'Elvish forest at golden hour',
  mode: 'dark',
  bg: {
    primary: '#081408',
    secondary: '#121C12',
    gradient: 'linear-gradient(180deg, #081408 0%, #121C12 50%, #0A1A0A 100%)',
  },
  text: {
    primary: '#C8D2BE',
    secondary: '#98A88E',
    muted: '#6B7A62',
  },
  accent: {
    primary: '#5E8B5A',
    secondary: '#8B9B5A',
    warm: '#D4A84B',
    highlight: '#E8A855',
  },
  glass: {
    bg: 'rgba(18, 28, 18, 0.45)',
    border: 'rgba(94, 139, 90, 0.1)',
    blur: '30px',
  },
  moods: {
    0: '#6B5A4F',
    1: '#5A6B6B',
    2: '#5E8B5A',
    3: '#8B9B5A',
    4: '#D4A84B',
  },
  moodEmojis: ['🍂', '🌧', '🌿', '🌻', '✨'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'fireflies',
  ambience: 'forest',
}

// Hobbiton - Sunny day in the Shire
export const hobbitonTheme: Theme = {
  name: 'Hobbiton',
  description: 'A sunny day by the river in the Shire',
  mode: 'dark',
  bg: {
    primary: '#0D1A12',
    secondary: '#142A1C',
    gradient: 'linear-gradient(180deg, #1A3525 0%, #122A1A 30%, #0D1A12 70%, #0A1510 100%)',
  },
  text: {
    primary: '#E8F5E0',
    secondary: '#C0D8B0',
    muted: '#7AA068',
  },
  accent: {
    primary: '#60B060',
    secondary: '#88C888',
    warm: '#F0E070',
    highlight: '#98D8E8',
  },
  glass: {
    bg: 'rgba(20, 42, 28, 0.5)',
    border: 'rgba(96, 176, 96, 0.15)',
    blur: '28px',
  },
  moods: {
    0: '#5A6858',
    1: '#6A8860',
    2: '#60B060',
    3: '#88C888',
    4: '#F0E070',
  },
  moodEmojis: ['🌧️', '🌱', '🌿', '☀️', '🌈'],
  moodLabels: ['Cloudy', 'Growing', 'Fresh', 'Sunny', 'Blessed'],
  particles: 'dandelion',
  ambience: 'shire',
}

// Winter Sunset - Warm oranges and snow at dusk
export const winterSunsetTheme: Theme = {
  name: 'Winter Sunset',
  description: 'Snow falling at golden hour',
  mode: 'dark',
  bg: {
    primary: '#1A1215',
    secondary: '#2D1F24',
    gradient: 'linear-gradient(180deg, #2D1F24 0%, #1A1215 40%, #151018 100%)',
  },
  text: {
    primary: '#F5E6D3',
    secondary: '#D4B896',
    muted: '#9A7B5B',
  },
  accent: {
    primary: '#E8945A',
    secondary: '#D4A84B',
    warm: '#F2C879',
    highlight: '#FFD699',
  },
  glass: {
    bg: 'rgba(45, 31, 36, 0.55)',
    border: 'rgba(232, 148, 90, 0.15)',
    blur: '28px',
  },
  moods: {
    0: '#6B5A5A',
    1: '#8B6B5A',
    2: '#D4A84B',
    3: '#E8945A',
    4: '#F2C879',
  },
  moodEmojis: ['🌑', '🌘', '🌗', '🌖', '🌕'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'snow',
  ambience: 'sunset',
}

// Cherry Blossom - Soft pinks and falling sakura petals
export const cherryBlossomTheme: Theme = {
  name: 'Cherry Blossom',
  description: 'Sakura petals in spring breeze',
  mode: 'dark',
  bg: {
    primary: '#1A1520',
    secondary: '#251D2A',
    gradient: 'linear-gradient(180deg, #2A2030 0%, #1A1520 50%, #151218 100%)',
  },
  text: {
    primary: '#F8E8F0',
    secondary: '#E0C4D4',
    muted: '#A8899A',
  },
  accent: {
    primary: '#E8A0B8',
    secondary: '#F0B8C8',
    warm: '#FFD4E0',
    highlight: '#FFC8D8',
  },
  glass: {
    bg: 'rgba(40, 28, 38, 0.55)',
    border: 'rgba(232, 160, 184, 0.12)',
    blur: '30px',
  },
  moods: {
    0: '#7A6070',
    1: '#9A7088',
    2: '#C890A8',
    3: '#E8A0B8',
    4: '#FFD4E0',
  },
  moodEmojis: ['🥀', '🌸', '💮', '🌷', '🏵️'],
  moodLabels: ['Wilting', 'Budding', 'Blooming', 'Radiant', 'Full Bloom'],
  particles: 'sakura',
  ambience: 'spring',
}

// Northern Lights - Arctic sky with flowing aurora
export const northernLightsTheme: Theme = {
  name: 'Northern Lights',
  description: 'Aurora dancing in the arctic night',
  mode: 'dark',
  bg: {
    primary: '#0A0E1A',
    secondary: '#0F1628',
    gradient: 'linear-gradient(180deg, #0A0E1A 0%, #0F1628 40%, #0D1220 100%)',
  },
  text: {
    primary: '#E8F4F8',
    secondary: '#B8D4DC',
    muted: '#6A8A94',
  },
  accent: {
    primary: '#4ECCA3',
    secondary: '#7B68EE',
    warm: '#88D4AB',
    highlight: '#A8E6CF',
  },
  glass: {
    bg: 'rgba(15, 22, 40, 0.6)',
    border: 'rgba(78, 204, 163, 0.15)',
    blur: '32px',
  },
  moods: {
    0: '#4A5568',
    1: '#5B6B8A',
    2: '#4ECCA3',
    3: '#7B68EE',
    4: '#88D4AB',
  },
  moodEmojis: ['🌑', '🌒', '🌓', '🌔', '🌟'],
  moodLabels: ['Dark', 'Waning', 'Balanced', 'Bright', 'Radiant'],
  particles: 'aurora',
  ambience: 'arctic',
}

// Misty Mountains - Serene peaks with drifting fog
export const mistyMountainsTheme: Theme = {
  name: 'Misty Mountains',
  description: 'Serene peaks veiled in gentle fog',
  mode: 'dark',
  bg: {
    primary: '#1A1D24',
    secondary: '#252A33',
    gradient: 'linear-gradient(180deg, #2A3040 0%, #1A1D24 40%, #151820 100%)',
  },
  text: {
    primary: '#E8ECF0',
    secondary: '#B8C4D0',
    muted: '#7A8A9A',
  },
  accent: {
    primary: '#8BA4B8',
    secondary: '#A0B8C8',
    warm: '#C8D8E8',
    highlight: '#D0E0F0',
  },
  glass: {
    bg: 'rgba(30, 35, 45, 0.6)',
    border: 'rgba(139, 164, 184, 0.12)',
    blur: '30px',
  },
  moods: {
    0: '#4A5568',
    1: '#5A6A7A',
    2: '#7A8A9A',
    3: '#8BA4B8',
    4: '#C8D8E8',
  },
  moodEmojis: ['🌫️', '⛰️', '🏔️', '🌄', '✨'],
  moodLabels: ['Foggy', 'Grounded', 'Rising', 'Clear', 'Transcendent'],
  particles: 'mist',
  ambience: 'mountains',
}

// Gentle Rain - Cozy rainfall at dusk
export const gentleRainTheme: Theme = {
  name: 'Gentle Rain',
  description: 'Soft rainfall on a quiet evening',
  mode: 'dark',
  bg: {
    primary: '#12151A',
    secondary: '#1A1E26',
    gradient: 'linear-gradient(180deg, #1E2530 0%, #12151A 50%, #0E1115 100%)',
  },
  text: {
    primary: '#D8E0E8',
    secondary: '#A8B8C8',
    muted: '#6A7A8A',
  },
  accent: {
    primary: '#6B8FAD',
    secondary: '#8AA8C0',
    warm: '#A0C0D8',
    highlight: '#B8D4E8',
  },
  glass: {
    bg: 'rgba(26, 30, 38, 0.6)',
    border: 'rgba(107, 143, 173, 0.12)',
    blur: '30px',
  },
  moods: {
    0: '#4A5A6A',
    1: '#5A6A7A',
    2: '#6B8FAD',
    3: '#8AA8C0',
    4: '#B8D4E8',
  },
  moodEmojis: ['🌧️', '🌦️', '☁️', '🌤️', '🌈'],
  moodLabels: ['Stormy', 'Drizzle', 'Overcast', 'Clearing', 'Rainbow'],
  particles: 'rain',
  ambience: 'rainy',
}

// Cosmos - Deep space serenity
export const cosmosTheme: Theme = {
  name: 'Cosmos',
  description: 'Drifting through infinite stars',
  mode: 'dark',
  bg: {
    primary: '#050510',
    secondary: '#0A0A1A',
    gradient: 'linear-gradient(180deg, #08081A 0%, #050510 50%, #030308 100%)',
  },
  text: {
    primary: '#E8E8F8',
    secondary: '#B8B8D8',
    muted: '#7878A8',
  },
  accent: {
    primary: '#9D8CFF',
    secondary: '#7B68EE',
    warm: '#C8B8FF',
    highlight: '#E0D8FF',
  },
  glass: {
    bg: 'rgba(10, 10, 26, 0.7)',
    border: 'rgba(157, 140, 255, 0.1)',
    blur: '35px',
  },
  moods: {
    0: '#3A3A5A',
    1: '#5A5A8A',
    2: '#7B68EE',
    3: '#9D8CFF',
    4: '#E0D8FF',
  },
  moodEmojis: ['🌑', '🌒', '🌓', '🌔', '🌕'],
  moodLabels: ['Void', 'Distant', 'Orbiting', 'Bright', 'Supernova'],
  particles: 'stars',
  ambience: 'cosmos',
}

// Candlelight - Warm intimate glow
export const candlelightTheme: Theme = {
  name: 'Candlelight',
  description: 'Warm glow in the quiet hours',
  mode: 'dark',
  bg: {
    primary: '#14100C',
    secondary: '#1E1812',
    gradient: 'linear-gradient(180deg, #1E1812 0%, #14100C 50%, #0E0A08 100%)',
  },
  text: {
    primary: '#F8E8D8',
    secondary: '#D8C4A8',
    muted: '#A08868',
  },
  accent: {
    primary: '#E8A050',
    secondary: '#F0B868',
    warm: '#FFD090',
    highlight: '#FFE0B0',
  },
  glass: {
    bg: 'rgba(30, 24, 18, 0.6)',
    border: 'rgba(232, 160, 80, 0.12)',
    blur: '28px',
  },
  moods: {
    0: '#5A4A3A',
    1: '#7A6A50',
    2: '#A08050',
    3: '#E8A050',
    4: '#FFD090',
  },
  moodEmojis: ['🕯️', '🔥', '✨', '💫', '🌟'],
  moodLabels: ['Dim', 'Flickering', 'Steady', 'Warm', 'Glowing'],
  particles: 'dust',
  ambience: 'candle',
}

// Ocean Twilight - Peaceful waves at dusk
export const oceanTwilightTheme: Theme = {
  name: 'Ocean Twilight',
  description: 'Gentle waves at the edge of night',
  mode: 'dark',
  bg: {
    primary: '#0A1520',
    secondary: '#142030',
    gradient: 'linear-gradient(180deg, #1A2840 0%, #0A1520 50%, #081018 100%)',
  },
  text: {
    primary: '#E0F0F8',
    secondary: '#A8C8D8',
    muted: '#6090A8',
  },
  accent: {
    primary: '#50A0C8',
    secondary: '#70B8D8',
    warm: '#90D0E8',
    highlight: '#B0E0F0',
  },
  glass: {
    bg: 'rgba(20, 32, 48, 0.6)',
    border: 'rgba(80, 160, 200, 0.12)',
    blur: '32px',
  },
  moods: {
    0: '#3A5A6A',
    1: '#4A7A8A',
    2: '#50A0C8',
    3: '#70B8D8',
    4: '#B0E0F0',
  },
  moodEmojis: ['🌊', '🐚', '🦋', '🐬', '🌅'],
  moodLabels: ['Deep', 'Adrift', 'Floating', 'Surfacing', 'Horizon'],
  particles: 'foam',
  ambience: 'ocean',
}

// Quiet Snow - Peaceful evening snowfall
export const quietSnowTheme: Theme = {
  name: 'Quiet Snow',
  description: 'Peaceful snowfall on a still evening',
  mode: 'dark',
  bg: {
    primary: '#0E1218',
    secondary: '#161C24',
    gradient: 'linear-gradient(180deg, #1A2230 0%, #0E1218 50%, #080C10 100%)',
  },
  text: {
    primary: '#E8EEF4',
    secondary: '#B8C8D8',
    muted: '#6888A0',
  },
  accent: {
    primary: '#88A8C8',
    secondary: '#A0C0D8',
    warm: '#C8D8E8',
    highlight: '#E0EEF8',
  },
  glass: {
    bg: 'rgba(22, 28, 36, 0.6)',
    border: 'rgba(136, 168, 200, 0.1)',
    blur: '30px',
  },
  moods: {
    0: '#4A5A6A',
    1: '#5A7088',
    2: '#6888A0',
    3: '#88A8C8',
    4: '#C8D8E8',
  },
  moodEmojis: ['❄️', '🌨️', '☁️', '🌤️', '✨'],
  moodLabels: ['Frozen', 'Snowy', 'Cloudy', 'Clearing', 'Peaceful'],
  particles: 'snowflakes',
  ambience: 'snowy',
}

// Warm & Peaceful - Bright cream afternoon (the only light theme)
export const warmPeacefulTheme: Theme = {
  name: 'Warm & Peaceful',
  description: 'A gentle afternoon bathed in golden light',
  mode: 'light',
  bg: {
    primary: '#FFF6E6',
    secondary: '#FFE8D6',
    gradient: 'linear-gradient(180deg, #FFF4D8 0%, #FFEAD0 35%, #FFE0D2 70%, #FBD8D8 100%)',
  },
  text: {
    primary: '#3A2A20',
    secondary: '#7A5A48',
    muted: '#B59882',
  },
  accent: {
    primary: '#E8704A',
    secondary: '#F2A06B',
    warm: '#F5C078',
    highlight: '#FFD4A8',
  },
  glass: {
    bg: 'rgba(255, 248, 235, 0.65)',
    border: 'rgba(232, 112, 74, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#8A7868',
    1: '#B89888',
    2: '#E8945A',
    3: '#F08858',
    4: '#F5C078',
  },
  moodEmojis: ['☁️', '🌤️', '☀️', '🌻', '🌅'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'sunbeam',
  ambience: 'spring',
}

export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
  hobbiton: hobbitonTheme,
  winterSunset: winterSunsetTheme,
  cherryBlossom: cherryBlossomTheme,
  northernLights: northernLightsTheme,
  mistyMountains: mistyMountainsTheme,
  gentleRain: gentleRainTheme,
  cosmos: cosmosTheme,
  candlelight: candlelightTheme,
  oceanTwilight: oceanTwilightTheme,
  quietSnow: quietSnowTheme,
  warmPeaceful: warmPeacefulTheme,
}

// Time-based greetings
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'the quiet hours'
  if (hour < 12) return 'good morning'
  if (hour < 17) return 'good afternoon'
  if (hour < 21) return 'good evening'
  return 'the quiet hours'
}

// Whispers - poetic lines
export const whispers = [
  "The trees don't rush to grow. Neither should you.",
  "The river doesn't fight its path. It finds it.",
  "You're here now. That's what matters.",
  "Some things take root slowly.",
  "The page is patient.",
  "Even the forest rests in winter.",
  "What's growing in you today?",
  "The stars have time. So do you.",
  "Write freely. The words will find their way.",
  "This moment is yours alone.",
  "Let the thoughts come like leaves falling.",
  "There's wisdom in the quiet.",
  "Your story continues with each word.",
  "The light returns. It always does.",
  "Be gentle with yourself today.",
  "The snow falls softly. So can your thoughts.",
  "Warmth finds those who wait.",
  "The sun sets, but it will rise again.",
  "Petals fall, but spring always returns.",
  "Like cherry blossoms, some moments are brief but beautiful.",
  "Let your thoughts drift like petals on the wind.",
  "Listen to the rain. It knows how to let go.",
  "The storm passes. It always does.",
  "Cozy moments are meant to be savored.",
  "You are made of stardust and wonder.",
  "The universe is vast. Your worries are small.",
  "In the darkness, even small lights matter.",
  "The flame dances, but it endures.",
  "Warmth begins from within.",
  "The ocean holds no grudges against the shore.",
  "Waves come and go. So do feelings.",
  "Float. The water will hold you.",
  "The tide knows when to rest.",
  "Each snowflake finds its place.",
  "The world grows quiet under snow.",
  "Stillness is its own kind of beauty.",
  "Let the cold air clear your mind.",
  "Home is where the heart rests.",
  "Simple joys are the truest ones.",
  "There's magic in ordinary days.",
  "A warm hearth mends many things.",
  "Good food, good friends, good life.",
]

// Journal prompts
export const prompts = [
  "What's growing in you today?",
  "What would you say to the river, if it could listen?",
  "If this feeling were a season, which would it be?",
  "What are you carrying that you could set down?",
  "What small thing brought you peace today?",
  "What would your younger self think of this moment?",
  "If your heart could speak, what would it say?",
  "What's one thing you're grateful for right now?",
  "What's been on your mind lately?",
  "Describe a moment of beauty you noticed recently.",
  "What does rest look like for you today?",
  "What would you tell someone you love?",
  "What's something you've been avoiding?",
  "Where do you feel most at home?",
  "What's a question you're sitting with?",
  "If today had a color, what would it be?",
  "What would you whisper to the sunset?",
  "What blooms in you when no one is watching?",
]

export function getRandomWhisper(): string {
  return whispers[Math.floor(Math.random() * whispers.length)]
}

export function getRandomPrompt(): string {
  return prompts[Math.floor(Math.random() * prompts.length)]
}
