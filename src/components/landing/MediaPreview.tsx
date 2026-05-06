'use client'

/**
 * Per-spread mini animated mock — replaces the dashed "media slot" placeholder.
 * Each variant is a small CSS+framer composition that hints at what the
 * underlying feature does, until real screenshots/videos land.
 */

import React from 'react'
import { motion } from 'framer-motion'

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
        {/* envelope */}
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
        {/* envelope flap (V shape) */}
        <svg width="200" height="130" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d="M 0 0 L 100 70 L 200 0" stroke={p.inkQuiet} strokeWidth="1.5" fill="none" />
        </svg>
        {/* wax seal */}
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
            {/* washi tape strip */}
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
        {/* connecting lines */}
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
        {/* phone outline */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${p.inkQuiet}`,
            borderRadius: 18,
            opacity: 0.65,
          }}
        />
        {/* notification badge — fades and shrinks to nothing */}
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
        {/* the calm dot in the middle */}
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
        {/* shackle */}
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
        {/* body */}
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

// VII — soft speech bubble pulsing with three dots
function MockReflect({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ position: 'relative', width: 160, height: 100 }}>
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: p.accent + '22',
            border: `1.5px solid ${p.accent}66`,
            borderRadius: 24,
          }}
          animate={{ scale: [1, 1.025, 1], boxShadow: [`0 0 0 0 ${p.accent}33`, `0 0 0 10px ${p.accent}00`, `0 0 0 0 ${p.accent}33`] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* tail */}
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: 28,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `12px solid ${p.accent}22`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{ width: 8, height: 8, borderRadius: '50%', background: p.accent }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// VIII — palette swatches cycling colors (warm → cool → night)
function MockThemes({ p }: { p: Palette }) {
  const swatches = ['#d6b890', '#a8b890', '#7a8da8', '#3e4a64', '#2a1d2e', '#5a3d3a', '#d6b890']
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ display: 'flex', gap: 6 }}>
        {swatches.slice(0, 6).map((color, i) => (
          <motion.div
            key={i}
            style={{
              width: 18,
              height: 84,
              background: color,
              borderRadius: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
            animate={{ scaleY: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {/* glow underneath */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '20%',
          width: '60%',
          height: 24,
          background: `radial-gradient(ellipse, ${p.accent}55, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// IX — stack of devices (phone, tablet, laptop) — twinkling
function MockDevices({ p }: { p: Palette }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div style={{ position: 'relative', width: 160, height: 110 }}>
        {/* laptop base */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            translateX: '-50%',
            width: 130,
            height: 6,
            background: p.inkQuiet,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
        {/* laptop screen */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            translateX: '-50%',
            width: 110,
            height: 70,
            border: `2px solid ${p.inkQuiet}`,
            borderRadius: 4,
            background: p.accent + '22',
          }}
          animate={{ background: [`${p.accent}1a`, `${p.accent}44`, `${p.accent}1a`] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* phone */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 30,
            right: -8,
            width: 28,
            height: 50,
            border: `1.5px solid ${p.inkQuiet}`,
            borderRadius: 4,
            background: p.thread + '33',
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* twinkle */}
        <motion.div
          style={{
            position: 'absolute',
            top: 16,
            left: 28,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: p.accent,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
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
  VII: MockReflect,
  VIII: MockThemes,
  IX: MockDevices,
}

export default function MediaPreview({ n, palette }: { n: string; palette: Palette }) {
  const Mock = MOCKS[n] ?? MockJournalText
  return <Mock p={palette} />
}
