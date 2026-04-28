// Theme definitions for Hearth

export type ThemeName = 'rivendell'

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

export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
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
