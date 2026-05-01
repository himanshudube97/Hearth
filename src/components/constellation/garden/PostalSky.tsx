'use client'

import { motion, useTransform } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { GardenParallax } from './useGardenParallax'

interface LayerProps {
  parallax: GardenParallax
  theme: Theme
}

function withAlpha(hex: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha))
  const aa = Math.round(a * 255).toString(16).padStart(2, '0')
  const base = hex.length === 9 ? hex.slice(0, 7) : hex
  return `${base}${aa}`
}

/* ----------------------------------------------------------------- */
/* DuskSky — warm gradient + a low sun glow + soft horizon haze      */
/* ----------------------------------------------------------------- */

export function DuskSky({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -2)
  const ty = useTransform(parallax.y, v => v * -1.5)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ x: tx, y: ty }}
    >
      {/* Sun blob — sits low on the horizon */}
      <motion.div
        className="absolute"
        style={{
          left: '58%',
          top: '38%',
          width: 360,
          height: 360,
          marginLeft: -180,
          marginTop: -180,
          borderRadius: '50%',
          background: `radial-gradient(circle,
            ${withAlpha(theme.accent.highlight, 0.55)} 0%,
            ${withAlpha(theme.accent.warm, 0.35)} 30%,
            ${withAlpha(theme.accent.warm, 0.12)} 55%,
            transparent 75%)`,
          filter: 'blur(2px)',
        }}
        animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.02, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Counter-glow on the opposite side, very soft */}
      <div
        className="absolute"
        style={{
          left: '-15%',
          top: '20%',
          width: '60%',
          height: '50%',
          background: `radial-gradient(ellipse at center,
            ${withAlpha(theme.accent.primary, 0.18)} 0%,
            transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Horizon haze band */}
      <div
        className="absolute"
        style={{
          left: '-5%',
          top: '52%',
          width: '110%',
          height: '14%',
          background: `linear-gradient(180deg,
            transparent 0%,
            ${withAlpha(theme.accent.warm, 0.18)} 50%,
            transparent 100%)`,
          filter: 'blur(24px)',
        }}
      />
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* StarField — scattered twinkling motes high in the sky             */
/* ----------------------------------------------------------------- */

const STARS = [
  { x: 8,  y: 10, r: 1.2, d: 0.0 }, { x: 14, y: 22, r: 1.6, d: 1.4 },
  { x: 22, y: 8,  r: 0.9, d: 2.2 }, { x: 28, y: 30, r: 1.4, d: 0.6 },
  { x: 36, y: 14, r: 1.0, d: 1.8 }, { x: 44, y: 26, r: 1.6, d: 3.1 },
  { x: 52, y: 6,  r: 1.2, d: 2.6 }, { x: 60, y: 18, r: 0.8, d: 0.9 },
  { x: 68, y: 10, r: 1.5, d: 4.0 }, { x: 76, y: 22, r: 1.0, d: 1.1 },
  { x: 84, y: 8,  r: 1.4, d: 2.0 }, { x: 92, y: 28, r: 1.1, d: 3.4 },
  { x: 18, y: 38, r: 0.9, d: 1.5 }, { x: 50, y: 40, r: 1.0, d: 2.8 },
  { x: 80, y: 36, r: 1.3, d: 0.4 },
]

export function StarField({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -6)
  const ty = useTransform(parallax.y, v => v * -4)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            background: theme.text.primary,
            boxShadow: `0 0 ${s.r * 6}px ${withAlpha(theme.text.primary, 0.5)}`,
          }}
          animate={{
            opacity: [0.15, 0.85, 0.3, 0.7, 0.15],
            scale: [1, 1.4, 1, 1.2, 1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.d,
          }}
        />
      ))}
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* CloudDrift — three watercolor cloud ribbons at different depths   */
/* ----------------------------------------------------------------- */

/* Sticker-style cloud — soft fluffy silhouette with subtle inner shading */
function StickerCloud({
  fill,
  stroke,
  variant = 0,
}: {
  fill: string
  stroke: string
  variant?: 0 | 1 | 2
}) {
  // Three different cloud silhouettes for variety
  const paths = [
    // Plump / wide
    'M30,52 C12,52 4,40 14,30 C8,18 24,8 38,16 C46,4 70,4 80,16 C96,8 116,16 118,30 C132,32 134,52 116,52 Z',
    // Flatter / longer
    'M20,48 C6,48 0,38 10,30 C6,18 22,12 34,18 C42,8 64,10 70,20 C84,14 102,22 102,32 C116,32 120,48 104,48 Z',
    // Smaller / rounder
    'M24,44 C10,44 4,34 14,28 C12,18 26,10 38,16 C46,8 62,10 68,20 C82,20 86,38 72,42 Z',
  ] as const

  return (
    <svg viewBox="0 0 140 60" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <path
        d={paths[variant]}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeLinejoin="round"
      />
      {/* Soft inner highlight */}
      <path
        d={paths[variant]}
        fill="#FFFFFF"
        opacity="0.45"
        transform="translate(0,-3) scale(0.9) translate(8,4)"
      />
    </svg>
  )
}

export function CloudDrift({ parallax, theme }: LayerProps) {
  const tx1 = useTransform(parallax.x, v => v * -8)
  const tx2 = useTransform(parallax.x, v => v * -14)
  const tx3 = useTransform(parallax.x, v => v * -22)
  const ty  = useTransform(parallax.y, v => v * -3)

  const fill = withAlpha(theme.accent.highlight, 0.55)
  const stroke = withAlpha(theme.text.primary, 0.5)

  // 8 clouds across 4 depth layers — more sky activity
  const clouds: Array<{
    left: string; top: string; w: number; h: number
    tx: typeof tx1; v: 0 | 1 | 2; dur: number; range: [string, string]
  }> = [
    { left: '-6%',  top: '8%',  w: 220, h: 95, tx: tx1, v: 0, dur: 90,  range: ['-6%', '10%'] },
    { left: '38%',  top: '4%',  w: 260, h: 110, tx: tx2, v: 1, dur: 75, range: ['0%', '-10%'] },
    { left: '72%',  top: '18%', w: 180, h: 80, tx: tx3, v: 2, dur: 60,  range: ['0%', '-6%'] },
    { left: '18%',  top: '28%', w: 150, h: 65, tx: tx2, v: 2, dur: 100, range: ['0%', '8%'] },
    { left: '58%',  top: '32%', w: 200, h: 90, tx: tx1, v: 0, dur: 110, range: ['0%', '-8%'] },
    { left: '4%',   top: '20%', w: 130, h: 60, tx: tx3, v: 2, dur: 80,  range: ['0%', '12%'] },
    { left: '88%',  top: '6%',  w: 170, h: 75, tx: tx2, v: 1, dur: 95,  range: ['0%', '-14%'] },
    { left: '28%',  top: '14%', w: 240, h: 100, tx: tx1, v: 0, dur: 130, range: ['0%', '-6%'] },
  ]

  return (
    <>
      {clouds.map((c, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: c.left, top: c.top, width: c.w, height: c.h, x: c.tx, y: ty }}
          animate={{ x: [c.range[0], c.range[1], c.range[0]] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        >
          <StickerCloud fill={fill} stroke={stroke} variant={c.v} />
        </motion.div>
      ))}
    </>
  )
}

/* ----------------------------------------------------------------- */
/* ChimneySmoke — wisps rising and dispersing from chimneys/stacks   */
/* ----------------------------------------------------------------- */

export function ChimneySmoke({
  left,
  bottom,
  scale = 1,
  delay = 0,
  color,
}: {
  left: string
  bottom: string
  scale?: number
  delay?: number
  color: string
}) {
  // Three puffs rising in sequence, fading and growing as they go up
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left, bottom, width: 30 * scale, height: 80 * scale }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: '50%',
            bottom: 0,
            width: 14 * scale,
            height: 14 * scale,
            marginLeft: -7 * scale,
            background: color,
          }}
          animate={{
            y: [0, -50 * scale, -90 * scale],
            x: [0, 4 * scale * (i % 2 === 0 ? 1 : -1), -2 * scale],
            opacity: [0, 0.55, 0],
            scale: [0.6, 1.2, 1.8],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: delay + i * 1.6,
          }}
        />
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* FarVillage — pale, hazy distant rooftops behind the main skyline  */
/* ----------------------------------------------------------------- */

export function FarVillage({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -6)
  const ty = useTransform(parallax.y, v => v * -1.2)

  // Quieter, lower silhouette suggesting more village stretching beyond
  const path =
    'M0,90 L0,68 L44,68 L52,52 L60,68 L100,68 L100,50 L130,50 L130,68 L170,68 L178,46 L186,68 L220,68 L220,40 L228,32 L236,40 L236,68 L280,68 L286,54 L292,68 L340,68 L340,46 L380,46 L380,68 L420,68 L426,54 L432,68 L470,68 L470,40 L478,30 L486,40 L486,68 L530,68 L538,52 L546,68 L590,68 L590,48 L640,48 L640,68 L680,68 L686,52 L692,68 L740,68 L740,42 L748,32 L756,42 L756,68 L800,68 L808,54 L816,68 L860,68 L860,50 L900,50 L900,68 L940,68 L946,54 L952,68 L1000,68 L1000,90 Z'

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: '-3%', top: '39%', width: '106%', height: '10%', x: tx, y: ty, zIndex: 1 }}
    >
      <svg viewBox="0 0 1000 90" width="100%" height="100%" preserveAspectRatio="none">
        <path d={path} fill={withAlpha(theme.text.primary, 0.35)} />
      </svg>
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* DistantVillage — detailed mid-distance skyline with landmarks     */
/* ----------------------------------------------------------------- */

export function DistantVillage({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -16)
  const ty = useTransform(parallax.y, v => v * -3)

  const fill = withAlpha(theme.text.primary, 0.85)
  const winColor = theme.accent.warm

  // Each window list is in absolute viewBox coords — paired with the SVG below
  const windows: [number, number][] = [
    [12, 130], [24, 130], [12, 144], [24, 144],
    [56, 122], [70, 122],
    [104, 138], [118, 138],
    [232, 138], [246, 138], [260, 138],
    [302, 122], [302, 138], [302, 154],
    [340, 134], [354, 134], [368, 134], [340, 150], [354, 150],
    [402, 124], [416, 124], [430, 124],
    [468, 110], [468, 130],
    [520, 130], [534, 130], [548, 130],
    [592, 138], [606, 138],
    [682, 130], [696, 130],
    [738, 134], [752, 134], [738, 150], [752, 150],
    [800, 124], [814, 124],
    [858, 130], [872, 130], [886, 130], [858, 146], [872, 146], [886, 146],
    [932, 134], [946, 134],
  ]

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: '-5%', top: '40%', width: '110%', height: '25%', x: tx, y: ty, zIndex: 2 }}
    >
      <svg viewBox="0 0 1000 180" width="100%" height="100%" preserveAspectRatio="none">
        <g fill={fill}>
          {/* 1. Townhouse cluster (steeply pitched) */}
          <path d="M0,180 L0,130 L18,114 L36,130 L36,180 Z" />
          <path d="M36,180 L36,138 L52,124 L68,138 L68,180 Z" />
          <rect x="14" y="100" width="4" height="16" /> {/* chimney */}

          {/* 2. Small church with pitched roof + cross */}
          <path d="M68,180 L68,130 L92,108 L116,130 L116,180 Z" />
          <rect x="89" y="92" width="6" height="20" />
          <rect x="84" y="96" width="16" height="4" />

          {/* 3. Townhouses */}
          <path d="M116,180 L116,128 L132,116 L148,128 L148,180 Z" />
          <path d="M148,180 L148,140 L164,128 L180,140 L180,180 Z" />
          <rect x="131" y="106" width="4" height="14" />

          {/* 4. CATHEDRAL — twin spires + central nave with rose window */}
          {/* Left spire tower */}
          <path d="M180,180 L180,90 L186,84 L196,84 L202,90 L202,180 Z" />
          <path d="M180,90 L191,60 L202,90 Z" />
          {/* Right spire tower */}
          <path d="M226,180 L226,90 L232,84 L242,84 L248,90 L248,180 Z" />
          <path d="M226,90 L237,60 L248,90 Z" />
          {/* Central tall nave + tallest spire */}
          <path d="M202,180 L202,108 L207,100 L213,100 L213,30 L221,12 L229,30 L229,100 L235,100 L240,108 L240,180 Z" />
          {/* Cross at very top */}
          <rect x="219" y="2" width="4" height="14" />
          <rect x="215" y="6" width="12" height="3" />
          {/* Rose window */}
          <circle cx="221" cy="130" r="6" fill={fill} stroke={winColor} strokeWidth="0.5" opacity="0.9" />

          {/* 5. Small townhouses with dormers */}
          <path d="M248,180 L248,130 L268,114 L288,130 L288,180 Z" />
          <path d="M261,114 L266,108 L271,114 Z" />
          <path d="M288,180 L288,134 L304,120 L320,134 L320,180 Z" />

          {/* 6. WATER TOWER — cylinder with conical hat + scaffold legs */}
          <rect x="328" y="100" width="32" height="46" rx="3" />
          <path d="M328,100 L344,80 L360,100 Z" />
          <rect x="343" y="74" width="2" height="8" />
          {/* Tank base ring */}
          <rect x="324" y="146" width="40" height="4" />
          {/* Scaffold legs */}
          <path d="M328,150 L320,180 M360,150 L368,180 M338,150 L334,180 M350,150 L354,180" stroke={fill} strokeWidth="2" fill="none" />
          {/* Cross-braces */}
          <path d="M320,165 L368,165 M324,178 L364,178" stroke={fill} strokeWidth="1.6" fill="none" />

          {/* 7. Apartment block with stepped roof */}
          <path d="M376,180 L376,124 L388,124 L388,118 L424,118 L424,124 L436,124 L436,180 Z" />

          {/* 8. ONION-DOME building */}
          <rect x="446" y="118" width="36" height="62" />
          <path d="M446,118 L446,108 L482,108 L482,118 Z" />
          {/* Onion dome — bezier curves */}
          <path d="M450,108 C450,90 460,86 464,68 C468,86 478,90 478,108 Z" />
          <rect x="463" y="58" width="2" height="10" />
          <circle cx="464" cy="56" r="2.5" />

          {/* 9. CLOCK TOWER */}
          <rect x="494" y="80" width="28" height="100" />
          {/* Clock face */}
          <circle cx="508" cy="106" r="8" fill="#FBF6E8" stroke={fill} strokeWidth="1.2" />
          <line x1="508" y1="106" x2="508" y2="100" stroke={fill} strokeWidth="1" />
          <line x1="508" y1="106" x2="512" y2="108" stroke={fill} strokeWidth="1" />
          <circle cx="508" cy="106" r="0.8" fill={fill} />
          {/* Belfry arches at top */}
          <rect x="498" y="78" width="20" height="4" />
          <path d="M500,80 L500,68 Q500,62 504,62 Q508,62 508,68 L508,80 Z" />
          <path d="M510,80 L510,68 Q510,62 514,62 Q518,62 518,68 L518,80 Z" />
          {/* Pyramid roof + finial */}
          <path d="M494,72 L508,52 L522,72 Z" />
          <rect x="507" y="44" width="2" height="10" />
          <circle cx="508" cy="42" r="2" />

          {/* 10. Townhouses */}
          <path d="M530,180 L530,134 L548,118 L566,134 L566,180 Z" />
          <path d="M566,180 L566,128 L584,114 L602,128 L602,180 Z" />
          <rect x="556" y="106" width="4" height="14" />

          {/* 11. SMOKESTACK / FACTORY */}
          <rect x="610" y="118" width="40" height="62" />
          {/* Tall stack */}
          <path d="M662,180 L660,68 L672,68 L674,180 Z" />
          {/* Stack rim/bands */}
          <rect x="659" y="78" width="14" height="3" />
          <rect x="660" y="92" width="13" height="2" />
          {/* Sawtooth roof */}
          <path d="M610,118 L618,108 L626,118 L634,108 L642,118 L650,108 L658,118 Z" />

          {/* 12. BELL TOWER with arched windows */}
          <rect x="688" y="100" width="28" height="80" />
          {/* Belfry openings */}
          <path d="M692,100 L692,86 Q692,78 698,78 Q704,78 704,86 L704,100 Z" fill="#161512" />
          <path d="M708,100 L708,86 Q708,78 714,78 Q720,78 720,86 L720,100 Z" fill="#161512" />
          {/* Bell hint */}
          <ellipse cx="702" cy="92" rx="3" ry="3" fill={winColor} opacity="0.8" />
          <ellipse cx="714" cy="92" rx="3" ry="3" fill={winColor} opacity="0.8" />
          {/* Pyramid roof */}
          <path d="M684,76 L702,56 L720,76 Z" />
          <rect x="701" y="48" width="2" height="10" />
          <path d="M702,46 L706,42 L702,38 L698,42 Z" /> {/* weathervane */}

          {/* 13. Townhouses with bay windows */}
          <path d="M724,180 L724,138 L738,124 L752,138 L752,180 Z" />
          <path d="M752,180 L752,128 L770,114 L788,128 L788,180 Z" />
          <rect x="760" y="104" width="4" height="14" />

          {/* 14. Mixed apartments */}
          <path d="M792,180 L792,118 L840,118 L840,180 Z" />
          <path d="M792,118 L796,114 L836,114 L840,118 Z" />

          {/* 15. Townhouse cluster */}
          <path d="M848,180 L848,134 L868,118 L888,134 L888,180 Z" />
          <path d="M888,180 L888,140 L902,128 L916,140 L916,180 Z" />
          <rect x="869" y="108" width="4" height="14" />

          {/* 16. Pagoda-like layered tower */}
          <rect x="928" y="120" width="22" height="60" />
          <path d="M922,120 L928,108 L950,108 L956,120 Z" />
          <rect x="930" y="92" width="18" height="14" />
          <path d="M925,92 L930,80 L948,80 L953,92 Z" />
          <rect x="936" y="64" width="6" height="14" />
          <path d="M932,64 L939,54 L946,64 Z" />

          {/* 17. End townhouse */}
          <path d="M962,180 L962,138 L978,124 L994,138 L994,180 Z" />
          <rect x="975" y="116" width="4" height="10" />
        </g>

        {/* Window lights */}
        {windows.map(([wx, wy], i) => (
          <rect
            key={`dw-${i}`}
            x={wx}
            y={wy}
            width={4}
            height={5}
            fill={winColor}
            style={{ filter: `drop-shadow(0 0 3px ${withAlpha(winColor, 0.85)})` }}
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.55;1;0.4"
              dur={`${3 + (i % 4)}s`}
              begin={`${((i * 0.4) % 5).toFixed(2)}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </svg>
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* PaperPlanes — folded planes drifting across the sky               */
/* ----------------------------------------------------------------- */

function PaperPlane({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 18" width="100%" height="100%">
      <defs>
        <linearGradient id={`pp-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBF6E8" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Bottom wing (shadowed) */}
      <path d="M0,9 L40,1 L18,18 Z" fill={color} opacity="0.55" />
      {/* Top wing */}
      <path d="M0,9 L40,1 L20,8 Z" fill={`url(#pp-${color.replace(/[^a-z0-9]/gi, '')})`} stroke={color} strokeWidth="0.4" strokeOpacity="0.7" />
      {/* Center fold */}
      <path d="M40,1 L18,18 L20,8 Z" fill="#fff" opacity="0.45" />
    </svg>
  )
}

export function PaperPlanes({ theme }: LayerProps) {
  // No cursor parallax on planes — they conflict with their own keyframe
  // animations and cause the planes to vanish when the mouse moves.
  const accent = theme.accent.primary
  const warm = theme.accent.warm
  const secondary = theme.accent.secondary

  return (
    <>
      {/* Plane A — slow lazy arc across the upper-mid sky, with vapor trail */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '-8%', top: '24%', width: 44, height: 20 }}
        animate={{
          x: ['-8vw', '108vw'],
          y: [0, -16, 8, -10, 0],
          rotate: [-4, 4, -2, 6, -4],
        }}
        transition={{
          x: { duration: 38, repeat: Infinity, ease: 'linear' },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <PaperPlane color={accent} />
        <svg
          className="absolute"
          style={{ right: '100%', top: '50%', width: 60, height: 6, marginTop: -3 }}
          viewBox="0 0 60 6"
        >
          <line x1="0" y1="3" x2="60" y2="3" stroke={accent} strokeWidth="0.8" strokeDasharray="2 4" opacity="0.45" />
        </svg>
      </motion.div>

      {/* Plane B — opposite direction, higher, faster */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '108%', top: '12%', width: 36, height: 16 }}
        animate={{
          x: ['0vw', '-118vw'],
          y: [0, 12, -6, 8, 0],
          rotate: [180 - 4, 180 + 4, 180 - 2, 180 + 6, 180 - 4],
        }}
        transition={{
          x: { duration: 52, repeat: Infinity, ease: 'linear', delay: 8 },
          y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <PaperPlane color={warm} />
      </motion.div>

      {/* Plane C — small, very high, slow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '-6%', top: '6%', width: 28, height: 12 }}
        animate={{
          x: ['-6vw', '106vw'],
          y: [0, -8, 4, -6, 0],
          rotate: [-3, 3, -1, 5, -3],
        }}
        transition={{
          x: { duration: 80, repeat: Infinity, ease: 'linear', delay: 18 },
          y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <PaperPlane color={secondary} />
      </motion.div>

      {/* Plane D — diving lower, with looping arc */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '-10%', top: '36%', width: 40, height: 18 }}
        animate={{
          x: ['-10vw', '110vw'],
          y: [0, 30, -10, 20, 0],
          rotate: [-8, 12, -4, 14, -8],
        }}
        transition={{
          x: { duration: 65, repeat: Infinity, ease: 'linear', delay: 22 },
          y: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <PaperPlane color={accent} />
        <svg
          className="absolute"
          style={{ right: '100%', top: '50%', width: 50, height: 6, marginTop: -3 }}
          viewBox="0 0 50 6"
        >
          <line x1="0" y1="3" x2="50" y2="3" stroke={accent} strokeWidth="0.7" strokeDasharray="2 5" opacity="0.4" />
        </svg>
      </motion.div>

      {/* Plane E — going right→left, mid sky, with vapor */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '110%', top: '28%', width: 38, height: 17 }}
        animate={{
          x: ['0vw', '-120vw'],
          y: [0, -10, 14, -8, 0],
          rotate: [180 - 6, 180 + 6, 180 - 3, 180 + 8, 180 - 6],
        }}
        transition={{
          x: { duration: 70, repeat: Infinity, ease: 'linear', delay: 35 },
          y: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <PaperPlane color={warm} />
        <svg
          className="absolute"
          style={{ left: '100%', top: '50%', width: 55, height: 6, marginTop: -3 }}
          viewBox="0 0 55 6"
        >
          <line x1="0" y1="3" x2="55" y2="3" stroke={warm} strokeWidth="0.8" strokeDasharray="2 4" opacity="0.45" />
        </svg>
      </motion.div>
    </>
  )
}

/* ----------------------------------------------------------------- */
/* EnvelopeBalloon — an envelope tied to a string, gently bobbing    */
/* ----------------------------------------------------------------- */

export function EnvelopeBalloon({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -12)
  const ty = useTransform(parallax.y, v => v * -8)

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        right: '14%',
        top: '14%',
        width: 84,
        height: 200,
        x: tx,
        y: ty,
      }}
      animate={{ y: [0, -8, 4, -6, 0], rotate: [-2, 2, -1.5, 1.5, -2] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 80 200" width="100%" height="100%">
        {/* String swaying */}
        <path
          d="M40,80 Q42,120 38,160 Q36,180 40,200"
          fill="none"
          stroke={theme.text.muted}
          strokeWidth="0.8"
          opacity="0.6"
        />
        {/* Envelope body */}
        <g>
          <rect x="10" y="20" width="60" height="46" rx="3" fill="#FBF6E8" stroke={theme.text.secondary} strokeWidth="0.8" />
          <path d="M10,22 L40,46 L70,22" fill="none" stroke={theme.text.secondary} strokeWidth="0.8" />
          {/* Wax seal */}
          <circle cx="40" cy="48" r="5" fill={theme.accent.primary} />
          <circle cx="38" cy="46" r="2" fill="#fff" opacity="0.4" />
          {/* Stamp */}
          <rect x="56" y="26" width="10" height="12" fill={theme.accent.warm} stroke="#fff" strokeWidth="0.4" strokeDasharray="1 1" />
          {/* Knot at top where string ties */}
          <circle cx="40" cy="20" r="2" fill={theme.text.muted} />
        </g>
      </svg>
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* NearVillage — detailed foreground row with smoke from chimneys    */
/* ----------------------------------------------------------------- */

export function NearVillage({ parallax, theme }: LayerProps) {
  const tx = useTransform(parallax.x, v => v * -28)
  const ty = useTransform(parallax.y, v => v * -5)

  const fill = withAlpha(theme.text.primary, 0.95)
  const winColor = theme.accent.warm
  const smoke = withAlpha(theme.text.primary, 0.4)

  // Window lights for the front buildings
  const windows: [number, number][] = [
    // Left big townhouse
    [22, 130], [42, 130], [62, 130], [82, 130],
    [22, 152], [42, 152], [62, 152], [82, 152],
    [22, 174], [42, 174], [62, 174], [82, 174],
    // Apartment with flagpole
    [128, 142], [148, 142], [168, 142], [128, 162], [148, 162], [168, 162], [128, 182], [148, 182], [168, 182],
    // Townhouse with door
    [212, 140], [240, 140], [212, 160], [240, 160],
    // Right cluster — apartment block
    [712, 130], [732, 130], [752, 130], [772, 130], [792, 130],
    [712, 150], [732, 150], [752, 150], [772, 150], [792, 150],
    [712, 170], [732, 170], [752, 170], [772, 170], [792, 170],
    // Townhouse with bay
    [840, 145], [868, 145], [840, 168], [868, 168],
    // Tall narrow with peaked roof
    [924, 132], [944, 132], [924, 154], [944, 154], [924, 176], [944, 176],
  ]

  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: '-3%', top: '45%', width: '106%', height: '20%', x: tx, y: ty, zIndex: 3 }}
      >
        <svg viewBox="0 0 1000 220" width="100%" height="100%" preserveAspectRatio="none">
          <g fill={fill}>
            {/* ===== LEFT CLUSTER ===== */}

            {/* Big townhouse with multi-pitched roof */}
            <path d="M-20,220 L-20,118 L20,90 L60,118 L60,90 L80,76 L100,90 L100,118 L100,220 Z" />
            {/* Front bay window detail */}
            <rect x="22" y="160" width="20" height="40" fill={fill} />
            <path d="M22,160 L20,150 L44,150 L42,160 Z" />
            {/* Door */}
            <rect x="62" y="180" width="16" height="40" fill="#161512" />
            <circle cx="74" cy="200" r="1" fill={winColor} />
            {/* Two chimneys */}
            <rect x="48" y="68" width="8" height="22" />
            <rect x="86" y="56" width="8" height="20" />
            {/* Decorative trim */}
            <rect x="-20" y="118" width="120" height="3" />

            {/* Apartment building with flagpole */}
            <path d="M114,220 L114,108 L186,108 L186,220 Z" />
            <path d="M114,108 L116,104 L184,104 L186,108 Z" />
            {/* Pediment */}
            <path d="M124,108 L150,90 L176,108 Z" />
            {/* Flagpole */}
            <rect x="148" y="60" width="2" height="32" />
            <path d="M150,62 L168,68 L150,74 Z" fill={theme.accent.primary} opacity="0.85" />
            {/* Awning above door */}
            <path d="M138,192 L162,192 L168,200 L132,200 Z" fill={theme.accent.primary} opacity="0.9" />
            <rect x="146" y="200" width="8" height="20" fill="#161512" />

            {/* Townhouse with peaked roof + dormers */}
            <path d="M198,220 L198,140 L228,108 L258,140 L258,220 Z" />
            {/* Dormer */}
            <rect x="216" y="150" width="10" height="14" fill={fill} />
            <path d="M216,150 L221,144 L226,150 Z" />
            <rect x="232" y="150" width="10" height="14" fill={fill} />
            <path d="M232,150 L237,144 L242,150 Z" />
            {/* Chimney */}
            <rect x="240" y="92" width="8" height="22" />

            {/* ===== RIGHT CLUSTER ===== */}

            {/* Apartment block */}
            <path d="M696,220 L696,108 L808,108 L808,220 Z" />
            <path d="M696,108 L700,102 L804,102 L808,108 Z" />
            {/* Roof parapet detail */}
            <rect x="700" y="100" width="6" height="6" />
            <rect x="798" y="100" width="6" height="6" />
            {/* Awning */}
            <path d="M740,196 L764,196 L770,204 L734,204 Z" fill={theme.accent.warm} opacity="0.85" />

            {/* Townhouse with bay window + steep roof */}
            <path d="M820,220 L820,128 L848,98 L876,128 L876,220 Z" />
            {/* Bay window */}
            <path d="M832,176 L832,158 L838,150 L858,150 L864,158 L864,176 Z" fill={fill} />
            <rect x="838" y="158" width="6" height="14" fill={winColor} opacity="0.9" />
            <rect x="852" y="158" width="6" height="14" fill={winColor} opacity="0.9" />
            {/* Chimney with smoke source */}
            <rect x="858" y="80" width="8" height="22" />

            {/* Tall narrow townhouse with peaked roof + weathervane */}
            <path d="M906,220 L906,108 L932,80 L958,108 L958,220 Z" />
            {/* Weathervane */}
            <rect x="931" y="60" width="2" height="22" />
            <path d="M932,58 L940,62 L932,66 L924,62 Z" fill={fill} />
            <circle cx="932" cy="56" r="2" />
            {/* Front door + steps */}
            <rect x="924" y="190" width="16" height="30" fill="#161512" />
            <rect x="918" y="216" width="28" height="4" fill={fill} />

            {/* Final low building edge */}
            <path d="M974,220 L974,154 L990,140 L1006,154 L1006,220 Z" />
            <rect x="996" y="124" width="6" height="18" />
          </g>

          {/* Window lights */}
          {windows.map(([wx, wy], i) => (
            <rect
              key={`nw-${i}`}
              x={wx}
              y={wy}
              width={6}
              height={7}
              fill={winColor}
              style={{ filter: `drop-shadow(0 0 4px ${withAlpha(winColor, 0.95)})` }}
            >
              <animate
                attributeName="opacity"
                values="0.55;1;0.7;1;0.55"
                dur={`${3 + (i % 4)}s`}
                begin={`${((i * 0.35) % 5).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </svg>
      </motion.div>

      {/* ─── Chimney smoke wisps overlaid on the foreground ─── */}
      {/* Each anchored to a chimney position. left % is approximate based on viewBox math (chimney_x / 1000 * 106% offset by -3%). */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: 0, top: '45%', width: '106%', height: '20%', x: tx, y: ty, zIndex: 3 }}
      >
        {/* Big townhouse left chimney  (x≈52 in vb) */}
        <ChimneySmoke left="2.0%" bottom="62%" scale={1.0} delay={0} color={smoke} />
        {/* Big townhouse right chimney (x≈90) */}
        <ChimneySmoke left="6.0%" bottom="68%" scale={0.9} delay={1.2} color={smoke} />
        {/* Townhouse w/ peaked roof chimney (x≈244) */}
        <ChimneySmoke left="22.5%" bottom="56%" scale={1.0} delay={0.6} color={smoke} />
        {/* Bay-window townhouse chimney (x≈862) */}
        <ChimneySmoke left="83.0%" bottom="60%" scale={1.1} delay={2.0} color={smoke} />
        {/* End low building chimney (x≈999) */}
        <ChimneySmoke left="96.5%" bottom="40%" scale={0.85} delay={1.6} color={smoke} />
      </motion.div>
    </>
  )
}

/* ----------------------------------------------------------------- */
/* MiniLamp — small reusable lamp graphic for the curved path        */
/* ----------------------------------------------------------------- */

function MiniLamp({ scale, theme }: { scale: number; theme: Theme }) {
  return (
    <svg
      viewBox="0 0 40 120"
      width={40 * scale}
      height={120 * scale}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`ml-bulb-${scale}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFFCEC" />
          <stop offset="40%" stopColor={theme.accent.highlight} />
          <stop offset="100%" stopColor={theme.accent.warm} stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="20" cy="118" rx="10" ry="2" fill="#000" opacity="0.18" />

      {/* Halo */}
      <circle cx="20" cy="22" r="22" fill={theme.accent.warm} opacity="0.18" />
      <circle cx="20" cy="22" r="11" fill={theme.accent.highlight} opacity="0.35" />

      {/* Pole */}
      <rect x="18" y="34" width="4" height="80" fill="#1a1a1a" opacity="0.95" />
      {/* Base */}
      <rect x="14" y="112" width="12" height="4" fill="#1a1a1a" />
      {/* Crossarm */}
      <path d="M20,36 Q12,30 8,22" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />

      {/* Lantern */}
      <path d="M12,16 L28,16 L26,30 L14,30 Z" fill="#1a1a1a" />
      <path d="M11,16 L20,8 L29,16 Z" fill="#1a1a1a" />
      <rect x="19" y="4" width="2" height="4" fill="#1a1a1a" />

      {/* Glowing bulb */}
      <circle cx="20" cy="22" r="5" fill={`url(#ml-bulb-${scale})`} />
      <circle cx="20" cy="20" r="2" fill="#FFFCEC" />
    </svg>
  )
}

/* ----------------------------------------------------------------- */
/* CurvedPath — perspective wedge road from building line to viewer  */
/* with paired lamps flanking each side at descending scale.          */
/* The road's vanishing point sits at the building base, so road      */
/* and buildings don't overlap.                                       */
/* ----------------------------------------------------------------- */

export function CurvedPath({ parallax, theme }: LayerProps) {
  const txPath = useTransform(parallax.x, v => v * -4)
  const tyPath = useTransform(parallax.y, v => v * -1)

  // Each lamp pair gets its own parallax depth — closer pairs move more
  const tx1 = useTransform(parallax.x, v => v * -5)   // far pair
  const tx2 = useTransform(parallax.x, v => v * -9)
  const tx3 = useTransform(parallax.x, v => v * -14)
  const tx4 = useTransform(parallax.x, v => v * -20)  // near pair
  const tyLamp = useTransform(parallax.y, v => v * -2)

  // Geometry: road is a perspective wedge.
  //   top edge:  x=488..512 at y=0
  //   bot edge:  x=200..800 at y=350
  // Lamps placed slightly OUTSIDE the road edge at each y level,
  // so they flank the path symmetrically.
  const pairs: Array<{ y: number; halfOffset: number; scale: number; tx: typeof tx1 }> = [
    { y: 4,   halfOffset: 16, scale: 0.32, tx: tx1 }, // farthest, near vanishing point
    { y: 26,  halfOffset: 22, scale: 0.45, tx: tx2 },
    { y: 56,  halfOffset: 31, scale: 0.6,  tx: tx3 },
    { y: 90,  halfOffset: 41, scale: 0.85, tx: tx4 }, // nearest along the visible road
  ]

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: '65%',
        width: '100%',
        height: '35%',
        zIndex: 4,
      }}
    >
      {/* Road wedge */}
      <motion.svg
        className="absolute inset-0"
        viewBox="0 0 1000 350"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ x: txPath, y: tyPath }}
      >
        <defs>
          <linearGradient id="cp-path" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={withAlpha(theme.text.primary, 0.04)} />
            <stop offset="40%" stopColor={withAlpha(theme.text.primary, 0.10)} />
            <stop offset="100%" stopColor={withAlpha(theme.text.primary, 0.18)} />
          </linearGradient>
        </defs>

        {/* Trapezoidal road — narrow at horizon (vanishing), wide at viewer */}
        <path
          d="M 488,0 L 512,0 L 800,350 L 200,350 Z"
          fill="url(#cp-path)"
        />

        {/* Center dashed lane converging to the vanishing point */}
        <line
          x1="500"
          y1="6"
          x2="500"
          y2="350"
          stroke={withAlpha(theme.accent.warm, 0.55)}
          strokeWidth="2.5"
          strokeDasharray="10 16"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Paired lamps flanking the road */}
      {pairs.map((p, i) => {
        // Convert viewBox y (0..350) to a CSS percentage of the container
        const topPct = (p.y / 350) * 100
        // Convert viewBox x (0..1000) to CSS left percentage
        // Road center is x=500. At y, road half-width is interpolated.
        const roadHalfWidth = 12 + (288 * p.y) / 350 // interp from 12 (top) to 300 (bot)
        const leftLampX = 500 - roadHalfWidth - p.halfOffset
        const rightLampX = 500 + roadHalfWidth + p.halfOffset
        const leftPct = (leftLampX / 1000) * 100
        const rightPct = (rightLampX / 1000) * 100

        return (
          <div key={`pair-${i}`}>
            {/* Left lamp */}
            <motion.div
              className="absolute"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                x: p.tx,
                y: tyLamp,
                transformOrigin: 'top center',
              }}
            >
              <MiniLamp scale={p.scale} theme={theme} />
            </motion.div>
            {/* Right lamp (mirrored) */}
            <motion.div
              className="absolute"
              style={{
                left: `${rightPct}%`,
                top: `${topPct}%`,
                x: p.tx,
                y: tyLamp,
                transformOrigin: 'top center',
              }}
            >
              <MiniLamp scale={p.scale} theme={theme} />
            </motion.div>
          </div>
        )
      })}
    </motion.div>
  )
}

/* ----------------------------------------------------------------- */
/* GroundLine — subtle ink-line "horizon ground"                     */
/* ----------------------------------------------------------------- */

export function GroundLine({ theme }: { theme: Theme }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: 0,
        bottom: 0,
        width: '100%',
        height: '12%',
        background: `linear-gradient(180deg,
          transparent 0%,
          ${withAlpha(theme.text.primary, 0.05)} 40%,
          ${withAlpha(theme.text.primary, 0.12)} 100%)`,
      }}
    />
  )
}
