'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useTransform } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { GardenParallax } from './useGardenParallax'

const LETTERS = [
  { from: 'Anya',  city: 'Lisbon',     tint: '#F4E1B8', stamp: '#B04830' },
  { from: 'River', city: 'Kyoto',      tint: '#E6D6E8', stamp: '#5A3A6A' },
  { from: 'Mira',  city: 'Marrakesh',  tint: '#FFE0CC', stamp: '#C2562A' },
  { from: 'Kai',   city: 'Reykjavík',  tint: '#D6E4DC', stamp: '#2C5260' },
  { from: 'Sol',   city: 'Havana',     tint: '#FFD8D0', stamp: '#9A4555' },
]

interface Props {
  theme: Theme
  parallax: GardenParallax
}

/**
 * Foreground anchor: a tall Victorian gas lamp with a glowing halo,
 * and the rust postbox tucked beneath. The whole group counter-parallaxes
 * (moves opposite to the background layers) for depth.
 */
export function LampLetterbox({ theme, parallax }: Props) {
  const [open, setOpen] = useState(false)

  const tx = useTransform(parallax.x, v => v * 8)
  const ty = useTransform(parallax.y, v => v * 3)

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        right: '7%',
        bottom: 0,
        width: 180,
        height: '44%',
        x: tx,
        y: ty,
        zIndex: 30,
      }}
    >
      {/* ─────── Halo glow behind everything ─────── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '5%',
          width: 280,
          height: 280,
          marginLeft: -140,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}55 0%,
            ${theme.accent.warm}33 25%,
            ${theme.accent.warm}11 50%,
            transparent 75%)`,
          filter: 'blur(4px)',
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '8%',
          width: 140,
          height: 140,
          marginLeft: -70,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}88 0%,
            ${theme.accent.highlight}22 50%,
            transparent 75%)`,
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ─────── Lamppost SVG (full height) ─────── */}
      <svg
        viewBox="0 0 220 800"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          <linearGradient id="ll-pole" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="48%" stopColor="#3a3530" />
            <stop offset="52%" stopColor="#3a3530" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id="ll-glass" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={theme.accent.highlight} stopOpacity="1" />
            <stop offset="50%" stopColor={theme.accent.warm} stopOpacity="0.95" />
            <stop offset="100%" stopColor={theme.accent.warm} stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="ll-bulb" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FFFCEC" stopOpacity="1" />
            <stop offset="40%" stopColor={theme.accent.highlight} stopOpacity="0.95" />
            <stop offset="100%" stopColor={theme.accent.warm} stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="110" cy="794" rx="50" ry="5" fill="#000" opacity="0.18" />

        {/* Stepped base */}
        <rect x="92" y="780" width="36" height="14" fill="url(#ll-pole)" />
        <rect x="86" y="772" width="48" height="10" fill="url(#ll-pole)" />
        <rect x="98" y="760" width="24" height="14" fill="url(#ll-pole)" />

        {/* Pole — tapered with subtle ring */}
        <rect x="106" y="180" width="8" height="582" fill="url(#ll-pole)" />
        {/* Pole rings */}
        <rect x="100" y="600" width="20" height="6" fill="url(#ll-pole)" />
        <rect x="100" y="400" width="20" height="6" fill="url(#ll-pole)" />
        {/* Decorative ornament partway up */}
        <ellipse cx="110" cy="220" rx="11" ry="6" fill="url(#ll-pole)" />
        <ellipse cx="110" cy="208" rx="14" ry="5" fill="url(#ll-pole)" />

        {/* ───── Lamp head assembly (top of pole) ───── */}
        {/* Decorative crossarm scrollwork */}
        <path
          d="M110,180 Q86,170 80,150 M110,180 Q134,170 140,150"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Crossarm hangers */}
        <circle cx="80" cy="150" r="3" fill="#1a1a1a" />
        <circle cx="140" cy="150" r="3" fill="#1a1a1a" />

        {/* Lantern hanging hoop */}
        <path d="M100,156 Q110,148 120,156" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lantern cap (the metal top) */}
        <path
          d="M86,158 L86,166 L134,166 L134,158 Z"
          fill="#1a1a1a"
        />
        {/* Conical roof */}
        <path
          d="M82,158 L110,128 L138,158 Z"
          fill="#1a1a1a"
        />
        {/* Roof finial */}
        <rect x="108" y="120" width="4" height="8" fill="#1a1a1a" />
        <circle cx="110" cy="118" r="3" fill="#1a1a1a" />

        {/* Lantern glass body — hexagonal lantern shape */}
        <path
          d="M86,166
             L86,222
             L96,234
             L124,234
             L134,222
             L134,166 Z"
          fill="url(#ll-glass)"
          stroke="#1a1a1a"
          strokeWidth="2.2"
        />
        {/* Vertical mullions on the glass */}
        <line x1="100" y1="166" x2="100" y2="234" stroke="#1a1a1a" strokeWidth="1.4" opacity="0.85" />
        <line x1="120" y1="166" x2="120" y2="234" stroke="#1a1a1a" strokeWidth="1.4" opacity="0.85" />
        {/* Horizontal cross-mullion */}
        <line x1="86" y1="200" x2="134" y2="200" stroke="#1a1a1a" strokeWidth="1.2" opacity="0.7" />

        {/* Glowing bulb inside the lantern */}
        <motion.circle
          cx="110"
          cy="200"
          r="14"
          fill="url(#ll-bulb)"
          animate={{
            opacity: [0.92, 1, 0.95, 1, 0.92],
            r: [13.5, 14.5, 14, 14.5, 13.5],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner brightest core */}
        <motion.circle
          cx="110"
          cy="198"
          r="5"
          fill="#FFFCEC"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Bottom bracket */}
        <path
          d="M96,234 L102,244 L118,244 L124,234 Z"
          fill="#1a1a1a"
        />
        <circle cx="110" cy="248" r="3" fill="#1a1a1a" />
      </svg>

      {/* ─────── Letterbox in front of the lamppost pole ─────── */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute pointer-events-auto"
        style={{
          left: '50%',
          bottom: 24,
          marginLeft: -55,
          width: 110,
          height: 150,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          zIndex: 5,
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        aria-label={open ? 'Close letterbox' : 'Open letterbox'}
      >
        {/* Pole */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 0,
            width: 8,
            height: 52,
            background:
              'linear-gradient(180deg, #4a3320 0%, #2a1d10 60%, #1a1208 100%)',
            borderRadius: 2,
          }}
        />

        {/* Box body */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: 46,
            transform: 'translateX(-50%)',
            width: 70,
            height: 80,
            background:
              'linear-gradient(180deg, #C9542F 0%, #A53D24 55%, #7E2C18 100%)',
            borderRadius: '16px 16px 8px 8px',
            boxShadow:
              '0 12px 22px -8px rgba(0,0,0,0.45), inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(0,0,0,0.2)',
          }}
        >
          {/* Top arched cap highlight */}
          <div
            className="absolute"
            style={{
              top: 4,
              left: 6,
              right: 6,
              height: 12,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.28), transparent)',
              borderRadius: '12px 12px 4px 4px',
            }}
          />
          {/* "POST" name plate */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 18,
              width: 56,
              height: 13,
              background:
                'linear-gradient(180deg, #F4E1B8 0%, #E8D3A0 100%)',
              borderRadius: 2,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15), 0 1px 0 rgba(0,0,0,0.2)',
              fontFamily: 'serif',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#1F2750',
              textAlign: 'center',
              lineHeight: '13px',
            }}
          >
            POST
          </div>
          {/* Slot */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 38,
              width: 44,
              height: 5,
              background: '#1a0c08',
              borderRadius: 3,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.7)',
            }}
            animate={open ? { scaleY: 1.6 } : { scaleY: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
          {/* Envelope corner peeking out when closed */}
          <AnimatePresence>
            {!open && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: 33,
                  width: 24,
                  height: 13,
                  background: '#FBF6E8',
                  borderRadius: '2px 2px 0 0',
                  boxShadow: '0 -1px 2px rgba(0,0,0,0.2)',
                  zIndex: -1,
                }}
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 4, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
              />
            )}
          </AnimatePresence>
          {/* Two rivet bolts */}
          <div className="absolute" style={{ bottom: 6, left: 9, width: 4, height: 4, borderRadius: '50%', background: '#3a1d10' }} />
          <div className="absolute" style={{ bottom: 6, right: 9, width: 4, height: 4, borderRadius: '50%', background: '#3a1d10' }} />
          {/* Pulsing "5" badge */}
          <motion.div
            className="absolute"
            style={{
              top: -10,
              right: -10,
              width: 26,
              height: 26,
              background:
                'radial-gradient(circle at 35% 30%, #2C3766 0%, #1F2750 60%, #161D40 100%)',
              color: '#F0E5C8',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: '26px',
              textAlign: 'center',
              borderRadius: '50%',
              boxShadow:
                '0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px rgba(244, 225, 184, 0.7)',
              fontFamily: 'serif',
            }}
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                '0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px rgba(244, 225, 184, 0.7)',
                '0 2px 8px rgba(0,0,0,0.45), 0 0 0 4px rgba(244, 225, 184, 0.45)',
                '0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px rgba(244, 225, 184, 0.7)',
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            5
          </motion.div>
          {/* Side flag */}
          <motion.div
            className="absolute"
            style={{
              top: 14,
              right: -14,
              width: 14,
              height: 16,
              background: 'linear-gradient(180deg, #1F2750, #161D40)',
              clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)',
              transformOrigin: 'left center',
              boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
            animate={open ? { rotate: -28 } : { rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          />
        </div>

        {/* Ground shadow under the box */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -2,
            width: 64,
            height: 7,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35), transparent 70%)',
            filter: 'blur(2px)',
          }}
        />
      </motion.button>

      {/* ─────── 5 letters fan (popped to the LEFT of the box) ─────── */}
      <AnimatePresence>
        {open && (
          <div
            className="absolute pointer-events-none"
            style={{ left: -120, bottom: 80, width: 280, height: 220 }}
          >
            {LETTERS.map((l, i) => {
              const angle = (-118 + i * 28) * (Math.PI / 180)
              const r = 130
              const x = Math.cos(angle) * r
              const y = -Math.sin(angle) * r
              const tilt = -14 + i * 6

              return (
                <motion.div
                  key={l.from}
                  className="absolute"
                  style={{
                    right: 16,
                    bottom: 0,
                    width: 110,
                    height: 70,
                    transformOrigin: 'bottom center',
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.55 }}
                  animate={{
                    x: -x,
                    y: y,
                    opacity: 1,
                    rotate: tilt,
                    scale: 1,
                  }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.55, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 18,
                    delay: i * 0.08,
                  }}
                >
                  <Envelope l={l} />
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Envelope({ l }: { l: typeof LETTERS[number] }) {
  return (
    <div
      className="relative w-full h-full"
      style={{
        background: l.tint,
        borderRadius: 3,
        boxShadow:
          '0 8px 16px -4px rgba(31,39,80,0.35), 0 2px 5px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      <div className="absolute" style={{ top: 14, left: 10, right: 38, height: 1, background: 'rgba(84, 72, 44, 0.35)' }} />
      <div className="absolute" style={{ top: 22, left: 10, width: '55%', height: 1, background: 'rgba(84, 72, 44, 0.25)' }} />
      <div className="absolute" style={{ top: 30, left: 10, width: '40%', height: 1, background: 'rgba(84, 72, 44, 0.2)' }} />

      <div
        className="absolute"
        style={{
          top: 6,
          right: 6,
          width: 22,
          height: 26,
          background: l.stamp,
          border: '1px dashed rgba(255,255,255,0.65)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 2,
            border: '0.5px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'serif',
            fontSize: 11,
          }}
        >
          ✦
        </div>
      </div>

      <div
        className="absolute"
        style={{
          left: '50%',
          bottom: 10,
          width: 12,
          height: 12,
          marginLeft: -6,
          background: 'radial-gradient(circle at 35% 35%, #D26845, #8a3624)',
          borderRadius: '50%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />

      <div
        className="absolute"
        style={{
          left: 10,
          bottom: 8,
          fontSize: 12,
          fontFamily: 'var(--font-caveat), Caveat, cursive',
          color: '#3a2a18',
          lineHeight: 1,
        }}
      >
        from {l.from}
        <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'serif', letterSpacing: 0.5, marginTop: 2 }}>
          {l.city.toUpperCase()}
        </div>
      </div>
    </div>
  )
}
