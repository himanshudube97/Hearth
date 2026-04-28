// Theme definitions for Hearth

export type ThemeName =
  | 'rivendell'
  | 'hearth'
  | 'paperSun'
  | 'rose'
  | 'sage'
  | 'ocean'

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
  particles: 'fireflies' | 'embers' | 'goldFlecks' | 'leaves' | 'sakura' | 'sunbeam' | 'foam' | 'mist' | 'dust'
  ambience: 'forest' | 'firelight' | 'midnight' | 'sun' | 'rose' | 'sage' | 'ocean' | 'saffron' | 'garden' | 'postal' | 'linen'
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

// Hearth — firelight night (deep brown + amber + cream)
export const hearthTheme: Theme = {
  name: 'Hearth',
  description: 'Firelight at the close of the day',
  mode: 'dark',
  bg: {
    primary: '#1A140E',
    secondary: '#221A12',
    gradient: 'linear-gradient(180deg, #221A12 0%, #1A140E 50%, #14100A 100%)',
  },
  text: {
    primary: '#E8DCC8',
    secondary: '#C8B898',
    muted: '#8A7858',
  },
  accent: {
    primary: '#C8742C',
    secondary: '#B0651F',
    warm: '#E8A050',
    highlight: '#FFD090',
  },
  glass: {
    bg: 'rgba(34, 26, 18, 0.55)',
    border: 'rgba(200, 116, 44, 0.15)',
    blur: '28px',
  },
  moods: {
    0: '#5A4A3A',
    1: '#7A6A50',
    2: '#A08050',
    3: '#C8742C',
    4: '#E8A050',
  },
  moodEmojis: ['🔥', '🕯️', '✨', '🌟', '💫'],
  moodLabels: ['Embers', 'Flicker', 'Steady', 'Bright', 'Glowing'],
  particles: 'embers',
  ambience: 'firelight',
}

// Paper Sun — warm cream paper with rust accent
export const paperSunTheme: Theme = {
  name: 'Paper Sun',
  description: 'Warm afternoon light on cream paper',
  mode: 'light',
  bg: {
    primary: '#F5E8C8',
    secondary: '#F0E0B5',
    gradient: 'linear-gradient(180deg, #F8EDD0 0%, #F2E2B8 50%, #ECD8A8 100%)',
  },
  text: {
    primary: '#3A2818',
    secondary: '#6A4F30',
    muted: '#9A7B58',
  },
  accent: {
    primary: '#B8612A',
    secondary: '#9A4F1F',
    warm: '#D4823A',
    highlight: '#E89A50',
  },
  glass: {
    bg: 'rgba(248, 237, 208, 0.65)',
    border: 'rgba(184, 97, 42, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#8A7050',
    1: '#A88858',
    2: '#C49060',
    3: '#B8612A',
    4: '#D4823A',
  },
  moodEmojis: ['☁️', '🌤️', '☀️', '🌻', '🌅'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'sunbeam',
  ambience: 'sun',
}

// Rose — blush & cherry blossom paper
export const roseTheme: Theme = {
  name: 'Rose',
  description: 'Blush paper and cherry blossom drift',
  mode: 'light',
  bg: {
    primary: '#FFEAEA',
    secondary: '#F8D8D0',
    gradient: 'linear-gradient(180deg, #FFEEEC 0%, #F8DCD4 50%, #F2D0CC 100%)',
  },
  text: {
    primary: '#3A2025',
    secondary: '#6A4048',
    muted: '#9A7078',
  },
  accent: {
    primary: '#9A4555',
    secondary: '#843E4F',
    warm: '#C2667A',
    highlight: '#D88898',
  },
  glass: {
    bg: 'rgba(255, 234, 234, 0.7)',
    border: 'rgba(154, 69, 85, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#7A6068',
    1: '#9A707A',
    2: '#C2667A',
    3: '#9A4555',
    4: '#D88898',
  },
  moodEmojis: ['🥀', '🌸', '💮', '🌷', '🏵️'],
  moodLabels: ['Wilting', 'Budding', 'Blooming', 'Radiant', 'Full Bloom'],
  particles: 'sakura',
  ambience: 'rose',
}

// Sage — matcha & cream
export const sageTheme: Theme = {
  name: 'Sage',
  description: 'Matcha morning, cream paper',
  mode: 'light',
  bg: {
    primary: '#E8E8CC',
    secondary: '#D8DDB8',
    gradient: 'linear-gradient(180deg, #ECECCE 0%, #DCE0BC 50%, #CED4AC 100%)',
  },
  text: {
    primary: '#2F2D1F',
    secondary: '#5A5A40',
    muted: '#8A8868',
  },
  accent: {
    primary: '#6B7A4B',
    secondary: '#5A6840',
    warm: '#8A9A65',
    highlight: '#A8B888',
  },
  glass: {
    bg: 'rgba(232, 232, 204, 0.7)',
    border: 'rgba(107, 122, 75, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#7A7858',
    1: '#8A8868',
    2: '#6B7A4B',
    3: '#8A9A65',
    4: '#A8B888',
  },
  moodEmojis: ['🍂', '🌱', '🌿', '🌾', '🍃'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'leaves',
  ambience: 'sage',
}

// Ocean — misty seaside dawn
export const oceanTheme: Theme = {
  name: 'Ocean',
  description: 'Pale dawn light on the harbour',
  mode: 'light',
  bg: {
    primary: '#E8E8E0',
    secondary: '#D8D8D0',
    gradient: 'linear-gradient(180deg, #ECECE4 0%, #DCDCD4 50%, #CCCCCC 100%)',
  },
  text: {
    primary: '#2A2820',
    secondary: '#54584C',
    muted: '#8A8A78',
  },
  accent: {
    primary: '#2C5260',
    secondary: '#1F4250',
    warm: '#4A7080',
    highlight: '#7090A0',
  },
  glass: {
    bg: 'rgba(232, 232, 224, 0.7)',
    border: 'rgba(44, 82, 96, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#5A6868',
    1: '#7A8888',
    2: '#2C5260',
    3: '#4A7080',
    4: '#7090A0',
  },
  moodEmojis: ['🌫️', '🌊', '🐚', '🌅', '✨'],
  moodLabels: ['Misty', 'Drifting', 'Surfacing', 'Clear', 'Radiant'],
  particles: 'foam',
  ambience: 'ocean',
}

export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
  hearth: hearthTheme,
  paperSun: paperSunTheme,
  rose: roseTheme,
  sage: sageTheme,
  ocean: oceanTheme,
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
