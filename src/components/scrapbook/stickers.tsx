// Static sticker library — small SVGs rendered inline.
// Each sticker is a React component that fills its parent box.

import React from 'react'

export type StickerId =
  | 'star'
  | 'heart'
  | 'leaf'
  | 'flower'
  | 'moon'
  | 'sun'
  | 'sparkle'
  | 'washi-tape'

interface StickerProps {
  size?: number | string
}

const baseProps = {
  width: '100%',
  height: '100%',
  viewBox: '0 0 100 100',
  preserveAspectRatio: 'xMidYMid meet',
  xmlns: 'http://www.w3.org/2000/svg',
}

const Star: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M50 8 L60 38 L92 40 L66 60 L76 92 L50 73 L24 92 L34 60 L8 40 L40 38 Z"
      fill="#e6b450"
      stroke="#7a4a1a"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

const Heart: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M50 88 C 18 66, 6 46, 18 28 C 28 14, 44 18, 50 32 C 56 18, 72 14, 82 28 C 94 46, 82 66, 50 88 Z"
      fill="#d97a6c"
      stroke="#6a2a22"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

const Leaf: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M20 80 C 20 40, 50 14, 84 16 C 86 50, 60 80, 20 80 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M22 78 C 38 64, 56 48, 80 22"
      stroke="#3d5a30"
      strokeWidth="1.6"
      fill="none"
    />
  </svg>
)

const Flower: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse
        key={angle}
        cx="50"
        cy="28"
        rx="11"
        ry="20"
        fill="#e8b4d4"
        stroke="#7a3a5a"
        strokeWidth="2"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#f5d76e" stroke="#7a4a1a" strokeWidth="2" />
  </svg>
)

const Moon: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M70 20 C 50 22, 32 38, 32 58 C 32 76, 48 90, 68 88 C 50 80, 38 64, 38 48 C 38 36, 50 24, 70 20 Z"
      fill="#f0e6c8"
      stroke="#5a4a2a"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

const Sun: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <circle cx="50" cy="50" r="20" fill="#f5b840" stroke="#7a4a1a" strokeWidth="2.5" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        x1="50"
        y1="20"
        x2="50"
        y2="10"
        stroke="#7a4a1a"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}
  </svg>
)

const Sparkle: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M50 10 C 50 35, 60 45, 90 50 C 60 55, 50 65, 50 90 C 50 65, 40 55, 10 50 C 40 45, 50 35, 50 10 Z"
      fill="#e8d370"
      stroke="#7a4a1a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
)

const WashiTape: React.FC<StickerProps> = () => (
  <svg {...baseProps} viewBox="0 0 200 60" preserveAspectRatio="none">
    <defs>
      <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.4" fill="#7a5a3a" opacity="0.5" />
      </pattern>
    </defs>
    {/* torn jagged edges */}
    <path
      d="M0 8 L 6 4 L 14 9 L 22 5 L 30 9 L 40 6 L 48 9 L 58 5 L 68 9 L 80 6 L 92 9 L 104 5 L 116 9 L 128 6 L 140 9 L 152 5 L 164 9 L 176 6 L 188 9 L 200 6 L 200 52 L 192 56 L 180 51 L 168 55 L 156 51 L 144 55 L 132 51 L 120 55 L 108 51 L 96 55 L 84 51 L 72 55 L 60 51 L 48 55 L 36 51 L 24 55 L 12 51 L 0 55 Z"
      fill="#c4a878"
      opacity="0.78"
    />
    <rect x="0" y="6" width="200" height="50" fill="url(#dots)" opacity="0.7" />
  </svg>
)

export const stickers: Record<StickerId, { label: string; component: React.FC<StickerProps>; aspect: number }> = {
  star: { label: 'Star', component: Star, aspect: 1 },
  heart: { label: 'Heart', component: Heart, aspect: 1 },
  leaf: { label: 'Leaf', component: Leaf, aspect: 1 },
  flower: { label: 'Flower', component: Flower, aspect: 1 },
  moon: { label: 'Moon', component: Moon, aspect: 1 },
  sun: { label: 'Sun', component: Sun, aspect: 1 },
  sparkle: { label: 'Sparkle', component: Sparkle, aspect: 1 },
  'washi-tape': { label: 'Washi tape', component: WashiTape, aspect: 200 / 60 },
}

export const stickerIds = Object.keys(stickers) as StickerId[]
