// Static sticker library — small SVGs rendered inline.
// Each sticker is a React component that fills its parent box.

import React from 'react'

export type StickerId =
  | 'star'
  | 'heart'
  | 'leaf'
  | 'leaves'
  | 'stem'
  | 'flower'
  | 'tulip'
  | 'daisy'
  | 'sunflower'
  | 'moon'
  | 'sun'
  | 'sparkle'
  | 'washi-tape'
  | 'butterfly'
  | 'butterfly-blue'
  | 'butterfly-orange'
  | 'butterfly-monarch'
  | 'bee'
  | 'bumblebee'
  | 'dragonfly'
  | 'ladybug'
  | 'firefly'
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

function makeButterfly(
  wingTop: string,
  wingBottom: string,
  wingStroke: string,
  bodyFill: string = '#3a2a1a',
  spotColor?: string,
): React.FC<StickerProps> {
  return () => (
    <svg {...baseProps}>
      {/* left wing — pinches toward body */}
      <g className="sb-wing-left">
        <path
          d="M48 38 C 22 24, 14 36, 18 52 C 22 64, 36 60, 48 56 Z"
          fill={wingTop}
          stroke={wingStroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M48 56 C 28 62, 22 70, 32 74 C 40 76, 46 70, 48 64 Z"
          fill={wingBottom}
          stroke={wingStroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {spotColor && <circle cx="28" cy="46" r="2.5" fill={spotColor} />}
      </g>
      {/* right wing — pinches toward body */}
      <g className="sb-wing-right">
        <path
          d="M52 38 C 78 24, 86 36, 82 52 C 78 64, 64 60, 52 56 Z"
          fill={wingTop}
          stroke={wingStroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M52 56 C 72 62, 78 70, 68 74 C 60 76, 54 70, 52 64 Z"
          fill={wingBottom}
          stroke={wingStroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {spotColor && <circle cx="72" cy="46" r="2.5" fill={spotColor} />}
      </g>
      {/* body — drawn last so it's on top of wings */}
      <ellipse cx="50" cy="50" rx="2.5" ry="22" fill={bodyFill} />
      <circle cx="50" cy="30" r="3" fill={bodyFill} />
    </svg>
  )
}

const Bee: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* wings — translucent, flap together */}
    <g className="sb-anim sb-anim-flap">
      <ellipse cx="40" cy="32" rx="14" ry="9" fill="#fdfaf2" stroke="#5a4a2a" strokeWidth="1.4" opacity="0.85" />
      <ellipse cx="60" cy="32" rx="14" ry="9" fill="#fdfaf2" stroke="#5a4a2a" strokeWidth="1.4" opacity="0.85" />
    </g>
    {/* body */}
    <ellipse cx="50" cy="58" rx="22" ry="16" fill="#f5c842" stroke="#3a2a0a" strokeWidth="2.5" />
    {/* stripes */}
    <path d="M40 44 C 40 54, 40 66, 40 72" stroke="#3a2a0a" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    <path d="M52 43 C 52 54, 52 66, 52 73" stroke="#3a2a0a" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    {/* head */}
    <circle cx="74" cy="54" r="9" fill="#3a2a0a" stroke="#1a0e02" strokeWidth="1.2" />
    {/* eye */}
    <circle cx="76" cy="52" r="1.6" fill="#fdfaf2" />
    {/* antennae */}
    <path d="M78 46 C 80 40, 82 34, 82 30" stroke="#3a2a0a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d="M70 46 C 68 40, 68 34, 70 30" stroke="#3a2a0a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <circle cx="82" cy="30" r="1.4" fill="#3a2a0a" />
    <circle cx="70" cy="30" r="1.4" fill="#3a2a0a" />
    {/* stinger */}
    <path d="M28 60 L 18 58 L 28 64 Z" fill="#3a2a0a" />
  </svg>
)

const Bumblebee: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* wings — fluttery, slightly tilted out */}
    <g className="sb-anim sb-anim-flap">
      <ellipse cx="30" cy="38" rx="14" ry="20" fill="#fdfaf2" stroke="#7a7060" strokeWidth="1.4" opacity="0.7" transform="rotate(-22 30 38)" />
      <ellipse cx="70" cy="38" rx="14" ry="20" fill="#fdfaf2" stroke="#7a7060" strokeWidth="1.4" opacity="0.7" transform="rotate(22 70 38)" />
    </g>
    {/* round body */}
    <ellipse cx="50" cy="58" rx="24" ry="22" fill="#f5c842" stroke="#3a2a0a" strokeWidth="2.5" />
    {/* curved stripes */}
    <path d="M30 50 C 40 44, 60 44, 70 50" stroke="#3a2a0a" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M28 62 C 40 58, 60 58, 72 62" stroke="#3a2a0a" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M30 74 C 40 78, 60 78, 70 74" stroke="#3a2a0a" strokeWidth="4" fill="none" strokeLinecap="round" />
    {/* head */}
    <circle cx="50" cy="34" r="11" fill="#3a2a0a" stroke="#1a0e02" strokeWidth="1.2" />
    {/* eyes */}
    <circle cx="46" cy="32" r="1.8" fill="#fdfaf2" />
    <circle cx="54" cy="32" r="1.8" fill="#fdfaf2" />
    {/* antennae */}
    <path d="M44 24 C 40 18, 38 12, 36 8" stroke="#3a2a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M56 24 C 60 18, 62 12, 64 8" stroke="#3a2a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="36" cy="8" r="1.6" fill="#3a2a0a" />
    <circle cx="64" cy="8" r="1.6" fill="#3a2a0a" />
  </svg>
)

const Dragonfly: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* upper wings — translucent blue */}
    <g className="sb-anim sb-anim-flap">
      <ellipse cx="26" cy="32" rx="22" ry="6" fill="#bfdfe8" stroke="#3a5a6a" strokeWidth="1.2" opacity="0.65" transform="rotate(-12 26 32)" />
      <ellipse cx="74" cy="32" rx="22" ry="6" fill="#bfdfe8" stroke="#3a5a6a" strokeWidth="1.2" opacity="0.65" transform="rotate(12 74 32)" />
    </g>
    {/* lower wings — slightly smaller */}
    <g className="sb-anim sb-anim-flap">
      <ellipse cx="28" cy="56" rx="18" ry="5" fill="#bfdfe8" stroke="#3a5a6a" strokeWidth="1.2" opacity="0.65" transform="rotate(12 28 56)" />
      <ellipse cx="72" cy="56" rx="18" ry="5" fill="#bfdfe8" stroke="#3a5a6a" strokeWidth="1.2" opacity="0.65" transform="rotate(-12 72 56)" />
    </g>
    {/* long thin body */}
    <ellipse cx="50" cy="52" rx="3.6" ry="38" fill="#3a6a78" stroke="#1a3040" strokeWidth="1.8" />
    {/* segment marks */}
    <line x1="46" y1="62" x2="54" y2="62" stroke="#1a3040" strokeWidth="1.2" />
    <line x1="46" y1="72" x2="54" y2="72" stroke="#1a3040" strokeWidth="1.2" />
    <line x1="46" y1="82" x2="54" y2="82" stroke="#1a3040" strokeWidth="1.2" />
    {/* head */}
    <circle cx="50" cy="14" r="6.5" fill="#3a6a78" stroke="#1a3040" strokeWidth="1.8" />
    {/* big eyes */}
    <circle cx="46" cy="13" r="2.2" fill="#1a3040" />
    <circle cx="54" cy="13" r="2.2" fill="#1a3040" />
    <circle cx="46.5" cy="12.5" r="0.7" fill="#fdfaf2" />
    <circle cx="54.5" cy="12.5" r="0.7" fill="#fdfaf2" />
  </svg>
)

const Ladybug: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <g className="sb-anim sb-anim-wobble">
      {/* shell */}
      <path
        d="M14 52 C 14 30, 30 14, 50 14 C 70 14, 86 30, 86 52 C 86 72, 70 88, 50 88 C 30 88, 14 72, 14 52 Z"
        fill="#e63d2a"
        stroke="#3a0a08"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* center seam */}
      <line x1="50" y1="16" x2="50" y2="86" stroke="#3a0a08" strokeWidth="2" />
      {/* spots */}
      <circle cx="30" cy="34" r="5.5" fill="#3a0a08" />
      <circle cx="70" cy="34" r="5.5" fill="#3a0a08" />
      <circle cx="26" cy="58" r="5" fill="#3a0a08" />
      <circle cx="74" cy="58" r="5" fill="#3a0a08" />
      <circle cx="38" cy="76" r="4" fill="#3a0a08" />
      <circle cx="62" cy="76" r="4" fill="#3a0a08" />
      {/* head */}
      <path d="M28 18 C 32 10, 68 10, 72 18 C 64 24, 36 24, 28 18 Z" fill="#1a0604" stroke="#0a0202" strokeWidth="1.8" strokeLinejoin="round" />
      {/* eyes */}
      <circle cx="40" cy="16" r="1.6" fill="#fdfaf2" />
      <circle cx="60" cy="16" r="1.6" fill="#fdfaf2" />
    </g>
  </svg>
)

const Firefly: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* glow aura — pulses */}
    <circle cx="50" cy="64" r="28" fill="#f5e87a" opacity="0.35" className="sb-anim sb-glow-pulse" />
    <circle cx="50" cy="64" r="16" fill="#fdfaa0" opacity="0.55" className="sb-anim sb-glow-pulse" />
    {/* wings */}
    <g className="sb-anim sb-anim-flap">
      <ellipse cx="36" cy="40" rx="12" ry="7" fill="#fdfaf2" stroke="#7a7060" strokeWidth="1.2" opacity="0.7" />
      <ellipse cx="64" cy="40" rx="12" ry="7" fill="#fdfaf2" stroke="#7a7060" strokeWidth="1.2" opacity="0.7" />
    </g>
    {/* body */}
    <ellipse cx="50" cy="46" rx="9" ry="14" fill="#3a2a1a" stroke="#1a0a04" strokeWidth="1.6" />
    {/* glowing tail */}
    <ellipse cx="50" cy="64" rx="7" ry="11" fill="#f5e87a" stroke="#a08a30" strokeWidth="1.2" />
    {/* head */}
    <circle cx="50" cy="30" r="6" fill="#3a2a1a" stroke="#1a0a04" strokeWidth="1.4" />
    {/* eyes */}
    <circle cx="47" cy="29" r="1.3" fill="#fdfaf2" />
    <circle cx="53" cy="29" r="1.3" fill="#fdfaf2" />
    {/* antennae */}
    <path d="M46 24 C 44 20, 42 16, 40 14" stroke="#3a2a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M54 24 C 56 20, 58 16, 60 14" stroke="#3a2a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </svg>
)

const Butterfly = makeButterfly('#c98ec4', '#a36ca0', '#5a2a4a')
const ButterflyBlue = makeButterfly('#8ab8e8', '#5e90c8', '#1f3d6a', '#1a1614', '#fdfaf2')
const ButterflyOrange = makeButterfly('#f5a865', '#e8843d', '#7a3a14')
const ButterflyMonarch = makeButterfly('#e88a3a', '#3a1a0a', '#1a0a04', '#1a0a04', '#fdfaf2')

const Stem: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    <path
      d="M50 8 C 56 26, 44 46, 50 64 C 56 80, 50 92, 50 92"
      stroke="#4a7838"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* tiny node bumps for character */}
    <circle cx="51" cy="34" r="1.6" fill="#3d5a30" />
    <circle cx="49" cy="64" r="1.6" fill="#3d5a30" />
  </svg>
)

const Leaves: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* central twig */}
    <path
      d="M50 12 C 50 30, 50 60, 50 88"
      stroke="#3d5a30"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* alternating leaves */}
    <path
      d="M50 24 C 32 20, 24 30, 40 38 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M32 26 C 36 30, 40 34, 40 38"
      stroke="#3d5a30"
      strokeWidth="0.8"
      fill="none"
    />
    <path
      d="M50 44 C 68 40, 76 50, 60 58 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M68 46 C 64 50, 60 54, 60 58"
      stroke="#3d5a30"
      strokeWidth="0.8"
      fill="none"
    />
    <path
      d="M50 64 C 32 60, 24 70, 40 78 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M32 66 C 36 70, 40 74, 40 78"
      stroke="#3d5a30"
      strokeWidth="0.8"
      fill="none"
    />
  </svg>
)

const Tulip: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* stem */}
    <path
      d="M50 50 L 50 92"
      stroke="#4a7838"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* leaf */}
    <path
      d="M50 70 C 32 66, 22 76, 40 84 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* tulip cup */}
    <path
      d="M50 16 C 28 22, 26 50, 50 56 C 74 50, 72 22, 50 16 Z"
      fill="#e88aa6"
      stroke="#7a2a4a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* petal seams */}
    <path d="M50 16 L 50 56" stroke="#7a2a4a" strokeWidth="1" opacity="0.45" fill="none" />
    <path d="M44 22 C 38 36, 38 48, 44 54" stroke="#7a2a4a" strokeWidth="1" opacity="0.45" fill="none" />
    <path d="M56 22 C 62 36, 62 48, 56 54" stroke="#7a2a4a" strokeWidth="1" opacity="0.45" fill="none" />
  </svg>
)

const Daisy: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* stem */}
    <path
      d="M50 38 L 50 92"
      stroke="#4a7838"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* leaf */}
    <path
      d="M50 60 C 36 56, 28 66, 42 72 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    {/* petals */}
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse
        key={angle}
        cx="50"
        cy="20"
        rx="6"
        ry="13"
        fill="#fdfaf2"
        stroke="#5a4a2a"
        strokeWidth="1.5"
        transform={`rotate(${angle} 50 30)`}
      />
    ))}
    {/* center */}
    <circle cx="50" cy="30" r="6.5" fill="#f5d76e" stroke="#7a4a1a" strokeWidth="1.6" />
  </svg>
)

const Sunflower: React.FC<StickerProps> = () => (
  <svg {...baseProps}>
    {/* stem */}
    <path
      d="M50 40 L 50 92"
      stroke="#4a7838"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* leaf */}
    <path
      d="M50 64 C 30 58, 20 70, 38 80 Z"
      fill="#7da668"
      stroke="#3d5a30"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* outer petals */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
      <ellipse
        key={angle}
        cx="50"
        cy="14"
        rx="5"
        ry="11"
        fill="#f5b840"
        stroke="#7a4a1a"
        strokeWidth="1.4"
        transform={`rotate(${angle} 50 28)`}
      />
    ))}
    {/* center */}
    <circle cx="50" cy="28" r="9" fill="#5a3a1a" stroke="#3a1a0a" strokeWidth="1.5" />
    {/* seed dots */}
    <circle cx="46" cy="26" r="0.9" fill="#3a1a0a" />
    <circle cx="54" cy="27" r="0.9" fill="#3a1a0a" />
    <circle cx="50" cy="32" r="0.9" fill="#3a1a0a" />
    <circle cx="48" cy="30" r="0.7" fill="#3a1a0a" />
    <circle cx="52" cy="30" r="0.7" fill="#3a1a0a" />
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
  sun: { label: 'Sun', component: Sun, aspect: 1 },
  moon: { label: 'Moon', component: Moon, aspect: 1 },
  cloud: { label: 'Cloud', component: Cloud, aspect: 1 },
  raindrop: { label: 'Raindrop', component: Raindrop, aspect: 1 },
  leaf: { label: 'Leaf', component: Leaf, aspect: 1 },
  leaves: { label: 'Leafy branch', component: Leaves, aspect: 1 },
  stem: { label: 'Stem', component: Stem, aspect: 1 },
  flower: { label: 'Flower head', component: Flower, aspect: 1 },
  tulip: { label: 'Tulip', component: Tulip, aspect: 1 },
  daisy: { label: 'Daisy', component: Daisy, aspect: 1 },
  sunflower: { label: 'Sunflower', component: Sunflower, aspect: 1 },
  mushroom: { label: 'Mushroom', component: Mushroom, aspect: 1 },
  butterfly: { label: 'Butterfly (pink)', component: Butterfly, aspect: 1 },
  'butterfly-blue': { label: 'Butterfly (blue)', component: ButterflyBlue, aspect: 1 },
  'butterfly-orange': { label: 'Butterfly (orange)', component: ButterflyOrange, aspect: 1 },
  'butterfly-monarch': { label: 'Butterfly (monarch)', component: ButterflyMonarch, aspect: 1 },
  bee: { label: 'Bee', component: Bee, aspect: 1 },
  bumblebee: { label: 'Bumblebee', component: Bumblebee, aspect: 1 },
  dragonfly: { label: 'Dragonfly', component: Dragonfly, aspect: 1 },
  ladybug: { label: 'Ladybug', component: Ladybug, aspect: 1 },
  firefly: { label: 'Firefly', component: Firefly, aspect: 1 },
  bookmark: { label: 'Bookmark', component: Bookmark, aspect: 1 },
  pencil: { label: 'Pencil', component: Pencil, aspect: 1 },
  'washi-tape': { label: 'Washi tape', component: WashiTape, aspect: 200 / 60 },
}

export const stickerIds = Object.keys(stickers) as StickerId[]
