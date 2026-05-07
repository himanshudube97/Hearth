'use client'

/**
 * Per-spread mini animated mock — replaces the dashed "media slot" placeholder.
 * Each variant is a small CSS+framer composition that hints at what the
 * underlying feature does, until real screenshots/videos land.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { themes, type ThemeName } from '@/lib/themes'

type Palette = {
  page: string
  pageEdge: string
  ink: string
  inkSoft: string
  inkQuiet: string
  accent: string
  thread: string
}

// I — animated lines of text appearing on a blank page
function MockJournalText({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div style={{ width: '85%', maxWidth: 280 }}>
        {[0.95, 0.7, 0.85, 0.55, 0.78].map((w, i) => (
          <motion.div
            key={i}
            style={{
              height: 6,
              borderRadius: 99,
              background: p.ink,
              opacity: 0.5,
              marginBottom: 13,
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: w }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.35, ease: [0.22, 0.61, 0.36, 1], repeat: Infinity, repeatDelay: 5, repeatType: 'reverse' }}
          />
        ))}
      </div>
    </div>
  )
}

// II — envelope with a pulsing wax seal landing
function MockSealedLetter({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ position: 'relative', width: 200, height: 130 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fbf6e7',
            border: `1.5px solid ${p.inkQuiet}`,
            borderRadius: 2,
            boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
          }}
        />
        <svg width="200" height="130" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d="M 0 0 L 100 70 L 200 0" stroke={p.inkQuiet} strokeWidth="1.5" fill="none" />
        </svg>
        <motion.div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            translateX: '-50%',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${p.accent} 0%, ${p.thread} 70%)`,
            boxShadow: `0 2px 6px rgba(0,0,0,0.25), 0 0 12px ${p.accent}88`,
          }}
          animate={{ scale: [0.85, 1.08, 0.85], boxShadow: [`0 0 8px ${p.accent}66`, `0 0 24px ${p.accent}aa`, `0 0 8px ${p.accent}66`] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 32 32" width="32" height="32">
            <path d="M 10 11 L 22 21 M 22 11 L 10 21" stroke={p.page} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
          </svg>
        </motion.div>
      </div>
    </div>
  )
}

// III — three polaroid scraps drifting/bobbing
function MockScrapbook({ p }: { p: Palette }) {
  const items = [
    { rot: -8, x: -50, y: 0, delay: 0 },
    { rot: 4, x: 0, y: -10, delay: 0.4 },
    { rot: -3, x: 50, y: 6, delay: 0.8 },
  ]
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ position: 'relative', width: 220, height: 150 }}>
        {items.map((it, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 80,
              height: 96,
              background: '#fbf6e7',
              padding: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              translateX: '-50%',
              translateY: '-50%',
              x: it.x,
              y: it.y,
              rotate: it.rot,
              borderRadius: 2,
            }}
            animate={{ y: [it.y, it.y - 3, it.y], rotate: [it.rot, it.rot + 1.5, it.rot] }}
            transition={{ duration: 5 + i * 0.8, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div style={{ width: '100%', height: 60, background: i === 1 ? p.accent + '55' : p.thread + '44', borderRadius: 1 }} />
            <div style={{ marginTop: 6, height: 3, background: p.inkQuiet, opacity: 0.5, borderRadius: 99 }} />
            <div
              style={{
                position: 'absolute',
                top: -5,
                left: 18,
                width: 36,
                height: 12,
                background: `${p.accent}55`,
                transform: 'rotate(-12deg)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// IV — constellation: dots appearing, lines connecting, twinkle
function MockConstellation({ p }: { p: Palette }) {
  const stars = [
    { cx: 30, cy: 60 },
    { cx: 60, cy: 30 },
    { cx: 100, cy: 50 },
    { cx: 140, cy: 25 },
    { cx: 170, cy: 60 },
    { cx: 130, cy: 80 },
    { cx: 80, cy: 95 },
  ]
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {stars.slice(0, -1).map((s, i) => {
          const next = stars[i + 1]
          return (
            <motion.line
              key={`l-${i}`}
              x1={s.cx}
              y1={s.cy}
              x2={next.cx}
              y2={next.cy}
              stroke={p.accent}
              strokeOpacity="0.4"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.18, repeat: Infinity, repeatDelay: 4, repeatType: 'reverse' }}
            />
          )
        })}
        {stars.map((s, i) => (
          <motion.circle
            key={`s-${i}`}
            cx={s.cx}
            cy={s.cy}
            r="2.4"
            fill={p.accent}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 2.2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
            style={{ filter: `drop-shadow(0 0 4px ${p.accent}aa)` }}
          />
        ))}
      </svg>
    </div>
  )
}

// V — notification badge fading away to a calm circle
function MockQuiet({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${p.inkQuiet}`,
            borderRadius: 18,
            opacity: 0.65,
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: p.thread,
            boxShadow: `0 0 8px ${p.thread}aa`,
          }}
          animate={{ opacity: [1, 0, 0, 1], scale: [1, 0.4, 0.4, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.7, 1], ease: 'easeInOut' }}
        />
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            translateX: '-50%',
            translateY: '-50%',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: p.accent,
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

// VI — padlock that opens and closes
function MockLock({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="100" height="120" viewBox="0 0 100 120">
        <motion.path
          d="M 28 48 L 28 32 Q 28 16 50 16 Q 72 16 72 32 L 72 48"
          stroke={p.accent}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          animate={{ d: [
            'M 28 48 L 28 32 Q 28 16 50 16 Q 72 16 72 32 L 72 48',
            'M 28 48 L 28 22 Q 28 6 50 6 Q 72 6 72 22 L 72 32',
            'M 28 48 L 28 32 Q 28 16 50 16 Q 72 16 72 32 L 72 48',
          ] }}
          transition={{ duration: 4, times: [0, 0.4, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${p.accent}66)` }}
        />
        <rect x="20" y="48" width="60" height="56" rx="6" fill={p.accent} opacity="0.85" />
        <motion.circle
          cx="50"
          cy="76"
          r="6"
          fill={p.page}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}

// VII — Interactive theme switcher. Click any swatch to switch the diary's theme.
const THEME_ORDER: ThemeName[] = ['rivendell', 'hearth', 'rose', 'sage', 'ocean', 'postal', 'linen']

function MockThemeSwitcher() {
  const themeName = useThemeStore((s) => s.themeName)
  const setTheme = useThemeStore((s) => s.setTheme)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div style={{ display: 'flex', gap: 6 }}>
        {THEME_ORDER.map((name) => {
          const t = themes[name]
          const active = name === themeName
          return (
            <motion.button
              key={name}
              type="button"
              onClick={() => setTheme(name)}
              aria-label={`Try ${t.name}`}
              aria-pressed={active}
              whileHover={{ y: -4, scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 22,
                height: 88,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: t.bg.gradient,
                boxShadow: active
                  ? `0 0 0 2px ${t.accent.primary}, 0 4px 14px rgba(0,0,0,0.22)`
                  : '0 2px 8px rgba(0,0,0,0.18)',
                transition: 'box-shadow 0.25s ease',
                position: 'relative',
              }}
            >
              {/* Tiny accent dot inside each swatch — reads as a particle */}
              <span
                style={{
                  position: 'absolute',
                  top: '30%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: t.accent.primary,
                  boxShadow: `0 0 6px ${t.accent.primary}`,
                  opacity: 0.85,
                }}
              />
            </motion.button>
          )
        })}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif), Georgia, serif',
          fontStyle: 'italic',
          fontSize: 11,
          color: themes[themeName].text.muted,
          opacity: 0.75,
        }}
      >
        {themes[themeName].name}
      </div>
    </div>
  )
}

// VIII — Desktop app preview: a window frame with a tiny diary inside
function MockDownload({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        style={{
          position: 'relative',
          width: 220,
          height: 150,
          background: p.page,
          border: `1.5px solid ${p.inkQuiet}`,
          borderRadius: 6,
          boxShadow: '0 12px 28px rgba(0,0,0,0.22), 0 4px 8px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 18,
            background: `${p.inkQuiet}22`,
            borderBottom: `1px solid ${p.inkQuiet}55`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            gap: 6,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ed6a5e' }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f6c046' }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#62c554' }} />
        </div>
        {/* "Hearth" inside the window — a tiny open diary */}
        <div style={{ position: 'absolute', inset: '28px 22px 22px 22px', display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, background: `${p.accent}1a`, borderRadius: 2, padding: 6 }}>
            {[0.9, 0.7, 0.85].map((w, i) => (
              <motion.div
                key={i}
                style={{ height: 3, borderRadius: 99, background: p.ink, opacity: 0.4, marginBottom: 5, transformOrigin: 'left' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: w }}
                transition={{ duration: 0.7, delay: 0.4 + i * 0.25, repeat: Infinity, repeatDelay: 4, repeatType: 'reverse' }}
              />
            ))}
          </div>
          <div style={{ flex: 1, background: `${p.thread}1a`, borderRadius: 2, position: 'relative' }}>
            <motion.div
              style={{
                position: 'absolute',
                inset: 8,
                background: `linear-gradient(135deg, ${p.accent}33, ${p.thread}22)`,
                borderRadius: 2,
              }}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
      {/* Soft glow underneath */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '18%',
          width: '60%',
          height: 24,
          background: `radial-gradient(ellipse, ${p.accent}55, transparent 70%)`,
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

const MOCKS: Record<string, React.FC<{ p: Palette }>> = {
  I: MockJournalText,
  II: MockSealedLetter,
  III: MockScrapbook,
  IV: MockConstellation,
  V: MockQuiet,
  VI: MockLock,
  VIII: MockDownload,
}

export default function MediaPreview({ n, palette }: { n: string; palette: Palette }) {
  // VII is the interactive theme switcher — special-cased because it talks
  // to the global theme store directly (no palette prop needed).
  if (n === 'VII') return <MockThemeSwitcher />
  const Mock = MOCKS[n] ?? MockJournalText
  return <Mock p={palette} />
}
