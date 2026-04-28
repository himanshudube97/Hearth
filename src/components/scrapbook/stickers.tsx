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
  | 'butterfly'
  | 'mushroom'
  | 'cloud'
  | 'raindrop'
  | 'bookmark'
  | 'pencil'

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
      className="sb-anim sb-anim-pulse"
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
      className="sb-anim sb-anim-beat"
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
    <g className="sb-anim sb-anim-sway">
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
    </g>
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
    <g className="sb-anim sb-anim-spin">
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
    </g>
    <circle cx="50" cy="50" r="20" fill="#f5b840" stroke="#7a4a1a" strokeWidth="2.5" />
  </svg>
)

const Sparkle: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      className="sb-anim sb-anim-twinkle"
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
    <path
      d="M0 8 L 6 4 L 14 9 L 22 5 L 30 9 L 40 6 L 48 9 L 58 5 L 68 9 L 80 6 L 92 9 L 104 5 L 116 9 L 128 6 L 140 9 L 152 5 L 164 9 L 176 6 L 188 9 L 200 6 L 200 52 L 192 56 L 180 51 L 168 55 L 156 51 L 144 55 L 132 51 L 120 55 L 108 51 L 96 55 L 84 51 L 72 55 L 60 51 L 48 55 L 36 51 L 24 55 L 12 51 L 0 55 Z"
      fill="#c4a878"
      opacity="0.78"
    />
    <rect x="0" y="6" width="200" height="50" fill="url(#dots)" opacity="0.7" />
  </svg>
)

const Butterfly: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* left wing — pinches toward body */}
    <g className="sb-wing-left">
      <path
        d="M48 38 C 22 24, 14 36, 18 52 C 22 64, 36 60, 48 56 Z"
        fill="#c98ec4"
        stroke="#5a2a4a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M48 56 C 28 62, 22 70, 32 74 C 40 76, 46 70, 48 64 Z"
        fill="#a36ca0"
        stroke="#5a2a4a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
    {/* right wing — pinches toward body */}
    <g className="sb-wing-right">
      <path
        d="M52 38 C 78 24, 86 36, 82 52 C 78 64, 64 60, 52 56 Z"
        fill="#c98ec4"
        stroke="#5a2a4a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M52 56 C 72 62, 78 70, 68 74 C 60 76, 54 70, 52 64 Z"
        fill="#a36ca0"
        stroke="#5a2a4a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
    {/* body — drawn last so it's on top of wings */}
    <ellipse cx="50" cy="50" rx="2.5" ry="22" fill="#3a2a1a" />
    <circle cx="50" cy="30" r="3" fill="#3a2a1a" />
  </svg>
)

const Mushroom: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <g className="sb-anim sb-anim-wobble">
      {/* cap */}
      <path
        d="M16 50 C 16 28, 38 14, 50 14 C 62 14, 84 28, 84 50 C 84 54, 80 56, 50 56 C 20 56, 16 54, 16 50 Z"
        fill="#c83a36"
        stroke="#5a1a18"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="38" cy="32" rx="6" ry="5" fill="#fdf3ee" />
      <ellipse cx="60" cy="40" rx="5" ry="4" fill="#fdf3ee" />
      <ellipse cx="48" cy="22" rx="4" ry="3.5" fill="#fdf3ee" />
      {/* stem */}
      <path
        d="M36 56 L 38 84 C 38 90, 62 90, 62 84 L 64 56 Z"
        fill="#f0e0c0"
        stroke="#5a4a2a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  </svg>
)

const Cloud: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      className="sb-anim sb-anim-drift"
      d="M22 64 C 12 64, 12 50, 22 48 C 22 36, 38 32, 44 40 C 48 30, 64 30, 68 42 C 80 40, 86 56, 76 60 C 78 70, 64 72, 60 66 C 54 72, 38 72, 34 64 C 30 70, 22 70, 22 64 Z"
      fill="#fdfaf2"
      stroke="#7a7060"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

const Raindrop: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <g className="sb-anim sb-anim-bob">
      <path
        d="M50 12 C 30 38, 22 56, 26 70 C 30 84, 70 84, 74 70 C 78 56, 70 38, 50 12 Z"
        fill="#7ab2d9"
        stroke="#2a4a6a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M40 50 C 36 58, 36 66, 42 70"
        fill="none"
        stroke="#fdfaf2"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  </svg>
)

const Bookmark: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M28 10 L 72 10 L 72 90 L 50 74 L 28 90 Z"
      fill="#b04a3a"
      stroke="#5a1a14"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <line x1="38" y1="30" x2="62" y2="30" stroke="#fdfaf2" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="38" y1="40" x2="62" y2="40" stroke="#fdfaf2" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
)

const Pencil: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* body */}
    <path
      d="M14 70 L 70 14 L 86 30 L 30 86 Z"
      fill="#e8b450"
      stroke="#5a4020"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* metal ring */}
    <path d="M62 22 L 78 38" stroke="#5a4020" strokeWidth="2" />
    {/* eraser */}
    <path
      d="M70 14 L 78 6 L 94 22 L 86 30 Z"
      fill="#d4756a"
      stroke="#5a1a18"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* tip */}
    <path
      d="M14 70 L 22 78 L 30 86 Z"
      fill="#3a2a1a"
      stroke="#3a2a1a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
)

export const stickers: Record<StickerId, { label: string; component: React.FC<StickerProps>; aspect: number }> = {
  star: { label: 'Star', component: Star, aspect: 1 },
  heart: { label: 'Heart', component: Heart, aspect: 1 },
  sparkle: { label: 'Sparkle', component: Sparkle, aspect: 1 },
  moon: { label: 'Moon', component: Moon, aspect: 1 },
  sun: { label: 'Sun', component: Sun, aspect: 1 },
  cloud: { label: 'Cloud', component: Cloud, aspect: 1 },
  raindrop: { label: 'Raindrop', component: Raindrop, aspect: 1 },
  leaf: { label: 'Leaf', component: Leaf, aspect: 1 },
  flower: { label: 'Flower', component: Flower, aspect: 1 },
  mushroom: { label: 'Mushroom', component: Mushroom, aspect: 1 },
  butterfly: { label: 'Butterfly', component: Butterfly, aspect: 1 },
  bookmark: { label: 'Bookmark', component: Bookmark, aspect: 1 },
  pencil: { label: 'Pencil', component: Pencil, aspect: 1 },
  'washi-tape': { label: 'Washi tape', component: WashiTape, aspect: 200 / 60 },
}

export const stickerIds = Object.keys(stickers) as StickerId[]
