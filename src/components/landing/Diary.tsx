'use client'

import React, { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import { SPREADS, type Spread } from './spreads'

type Palette = {
  page: string
  pageEdge: string
  ink: string
  inkSoft: string
  inkQuiet: string
  accent: string
  thread: string
}

function useDiaryPalette(): Palette {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)
  return {
    page: colors.pageBgSolid,
    pageEdge: colors.coverBorder,
    ink: colors.bodyText,
    inkSoft: colors.prompt,
    inkQuiet: colors.sectionLabel,
    accent: theme.accent.primary,
    thread: theme.accent.warm,
  }
}

function useCursorTilt(maxTilt = 12) {
  const ref = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 140, damping: 18, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 140, damping: 18, mass: 0.6 })
  const rotateY = useTransform(sx, [-1, 1], [-maxTilt, maxTilt])
  const rotateX = useTransform(sy, [-1, 1], [maxTilt * 0.7, -maxTilt * 0.7])

  // Light-spot position (0..100% of book width/height) follows cursor
  const lightX = useTransform(sx, [-1, 1], ['0%', '100%'])
  const lightY = useTransform(sy, [-1, 1], ['0%', '100%'])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    x.set(px * 2 - 1)
    y.set(py * 2 - 1)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }
  return { ref, onMove, onLeave, rotateX, rotateY, lightX, lightY }
}

function CornerFlourish({
  position,
  color,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br'
  color: string
}) {
  const positionStyle: Record<typeof position, React.CSSProperties> = {
    tl: { top: 18, left: 18 },
    tr: { top: 18, right: 18, transform: 'scaleX(-1)' },
    bl: { bottom: 18, left: 18, transform: 'scaleY(-1)' },
    br: { bottom: 18, right: 18, transform: 'scale(-1, -1)' },
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.45, ...positionStyle[position] }}
      aria-hidden
    >
      <path d="M 2 12 Q 2 2 12 2" stroke={color} strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <circle cx="2" cy="2" r="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function PageContent({ spread, idx, palette: p }: { spread: Spread; idx: number; palette: Palette }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      <CornerFlourish position="tl" color={p.accent} />
      <CornerFlourish position="bl" color={p.accent} />
      <CornerFlourish position="tr" color={p.accent} />
      <CornerFlourish position="br" color={p.accent} />

      {/* Left: title + bullets */}
      <div
        style={{
          flex: 1,
          padding: '56px 56px 56px 70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: `1px solid ${p.inkQuiet}33`,
          position: 'relative',
        }}
      >
        <div>
          {/* Numeral — large, glowing, breathing */}
          <motion.div
            key={`n-${idx}`}
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 0.7, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontStyle: 'italic',
              color: p.accent,
              letterSpacing: '.06em',
              fontSize: 56,
              lineHeight: 1,
              marginBottom: 8,
              textShadow: `0 0 24px ${p.accent}66, 0 0 4px ${p.accent}88`,
            }}
          >
            <motion.span
              animate={{ textShadow: [`0 0 16px ${p.accent}55`, `0 0 28px ${p.accent}88`, `0 0 16px ${p.accent}55`] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-block' }}
            >
              {spread.n}
            </motion.span>
          </motion.div>

          {/* Title */}
          <motion.h3
            key={`t-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 40,
              lineHeight: 1.08,
              color: p.ink,
              margin: '0 0 22px',
              textWrap: 'balance' as React.CSSProperties['textWrap'],
              textShadow: `0 1px 0 ${p.page}, 0 0 24px ${p.accent}14`,
            }}
          >
            {spread.title}
          </motion.h3>

          {/* Blurb */}
          <motion.p
            key={`b-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              fontSize: 15.5,
              lineHeight: 1.7,
              color: p.inkSoft,
              margin: '0 0 30px',
              maxWidth: 380,
            }}
          >
            {spread.blurb}
          </motion.p>

          {/* Bullets — sequential pop-in with glowing dots */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {spread.bullets.map((b, i) => (
              <motion.li
                key={`bul-${idx}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                style={{
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 14,
                  color: p.inkSoft,
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                <motion.span
                  animate={{ boxShadow: [`0 0 4px ${p.accent}66`, `0 0 12px ${p.accent}aa`, `0 0 4px ${p.accent}66`] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: p.accent,
                    flexShrink: 0,
                  }}
                />
                {b}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer line — italic spread title */}
        <motion.div
          key={`f-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontStyle: 'italic',
            fontSize: 11,
            color: p.inkQuiet,
            letterSpacing: '.08em',
          }}
        >
          {spread.title.toLowerCase()} · hearth
        </motion.div>
      </div>

      {/* Right: media polaroid */}
      <div
        style={{
          flex: 1,
          padding: '56px 70px 56px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <motion.div
          key={`m-${idx}`}
          initial={{ opacity: 0, y: 12, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          style={{
            flex: 1,
            position: 'relative',
            background: '#fbf9f3',
            padding: 14,
            borderRadius: 2,
            boxShadow: `0 1px 0 ${p.pageEdge}88, 0 14px 28px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Inner gradient panel */}
          <div
            style={{
              position: 'absolute',
              inset: 14,
              background: `linear-gradient(135deg, ${p.pageEdge}66 0%, ${p.accent}1a 50%, ${p.pageEdge}66 100%)`,
              overflow: 'hidden',
            }}
          >
            {/* Sweeping shimmer */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(110deg, transparent 30%, ${p.accent}55 50%, transparent 70%)`,
                mixBlendMode: 'screen',
              }}
              animate={{ x: ['-110%', '110%'] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Soft drifting glow */}
            <motion.div
              style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                left: '20%',
                top: '20%',
                background: `radial-gradient(circle, ${p.accent}40 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
              animate={{ x: [-20, 20, -20], y: [-10, 10, -10], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 24 }}>
            <div
              style={{
                fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
                fontSize: 10,
                color: p.inkQuiet,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                marginBottom: 10,
                opacity: 0.7,
              }}
            >
              media slot
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 14,
                color: p.inkSoft,
                lineHeight: 1.5,
                maxWidth: 240,
              }}
            >
              {spread.media}
            </div>
          </div>
        </motion.div>

        <motion.div
          key={`p-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontSize: 11,
            color: p.inkQuiet,
            letterSpacing: '.12em',
            textAlign: 'right',
            marginTop: 18,
          }}
        >
          {String(SPREADS.indexOf(spread) + 1).padStart(2, '0')} / {String(SPREADS.length).padStart(2, '0')}
        </motion.div>
      </div>
    </div>
  )
}

function KnotBinding({ palette: p }: { palette: Palette }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: -18,
        bottom: -18,
        width: 36,
        transform: 'translateX(-50%) translateZ(2px)',
        pointerEvents: 'none',
      }}
    >
      <svg width="36" height="32" viewBox="0 0 36 32" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d="M 8 0 Q 18 14 28 0" stroke={p.thread} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 6 4 Q 18 22 30 4" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
        <circle cx="18" cy="16" r="3.2" fill={p.thread} />
        <path d="M 14 18 L 10 30" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 22 18 L 26 30" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', left: 13, top: 28, bottom: 28, width: 1.8, background: p.thread, opacity: 0.85 }} />
      <div style={{ position: 'absolute', left: 22, top: 28, bottom: 28, width: 1.8, background: p.thread, opacity: 0.85 }} />
      <svg
        width="36"
        height="32"
        viewBox="0 0 36 32"
        style={{ position: 'absolute', bottom: 0, left: 0, transform: 'rotate(180deg)' }}
      >
        <path d="M 8 0 Q 18 14 28 0" stroke={p.thread} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 6 4 Q 18 22 30 4" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
        <circle cx="18" cy="16" r="3.2" fill={p.thread} />
        <path d="M 14 18 L 10 30" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 22 18 L 26 30" stroke={p.thread} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function btnStyle(p: Palette, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--font-serif), Georgia, serif',
    fontStyle: 'italic',
    fontSize: 15,
    color: disabled ? p.inkQuiet : p.ink,
    background: 'transparent',
    border: `1px solid ${disabled ? p.inkQuiet + '44' : p.inkQuiet + '88'}`,
    borderRadius: 99,
    padding: '10px 20px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all .25s ease',
    letterSpacing: '.04em',
  }
}

export default function Diary() {
  const palette = useDiaryPalette()
  const tilt = useCursorTilt(12)
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)

  const spread = SPREADS[idx]

  const go = (d: number) => {
    setDir(d)
    setIdx((i) => Math.max(0, Math.min(SPREADS.length - 1, i + d)))
  }

  const bookW = 920
  const bookH = 580

  const pageVariants = {
    enter: (d: number) => ({
      rotateY: d > 0 ? -90 : 90,
      opacity: 0,
      transformOrigin: d > 0 ? 'left center' : 'right center',
    }),
    center: { rotateY: 0, opacity: 1 },
    exit: (d: number) => ({
      rotateY: d > 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: d > 0 ? 'right center' : 'left center',
    }),
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 620 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            letterSpacing: '.32em',
            textTransform: 'uppercase',
            fontSize: 12,
            color: palette.inkQuiet,
            marginBottom: 14,
          }}
        >
          Inside the journal
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 54,
            lineHeight: 1.05,
            margin: '0 0 14px',
            color: palette.ink,
            textWrap: 'balance' as React.CSSProperties['textWrap'],
          }}
        >
          A small house for the days
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontSize: 15.5,
            color: palette.inkSoft,
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 460,
            marginInline: 'auto',
          }}
        >
          Turn the pages. Each spread is a feature — hover the diary to feel its weight.
        </p>
      </div>

      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMove}
        onMouseLeave={tilt.onLeave}
        style={{
          width: bookW,
          maxWidth: '100%',
          height: bookH,
          perspective: 1800,
          position: 'relative',
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
          }}
        >
          {/* Outer accent ring (sits behind the book) */}
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${palette.accent}55 0%, ${palette.thread}33 50%, ${palette.accent}55 100%)`,
              filter: 'blur(6px)',
              opacity: 0.55,
              transform: 'translateZ(-3px)',
            }}
          />

          {/* Soft halo underneath */}
          <div
            style={{
              position: 'absolute',
              left: '4%',
              right: '4%',
              bottom: -42,
              height: 72,
              background: `radial-gradient(50% 50% at 50% 50%, ${palette.accent}55, transparent 70%)`,
              filter: 'blur(14px)',
              transform: 'translateZ(-1px)',
            }}
          />

          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
            {/* Page-stack edge */}
            <div
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${palette.pageEdge} 0%, ${palette.page} 8%, ${palette.page} 92%, ${palette.pageEdge} 100%)`,
                boxShadow: `0 1px 0 ${palette.pageEdge}, 0 2px 0 ${palette.pageEdge}, 0 30px 60px -20px rgba(0,0,0,.4)`,
                transform: 'translateZ(-2px)',
              }}
            />

            {/* The spread */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: palette.page,
                boxShadow: `
                  inset 0 0 0 1px ${palette.accent}26,
                  inset 0 0 80px ${palette.pageEdge}55,
                  0 0 24px ${palette.accent}14,
                  0 18px 40px -12px rgba(0,0,0,.35)
                `,
                display: 'flex',
                overflow: 'hidden',
                borderRadius: 2,
              }}
            >
              {/* Cursor-following soft light spot — gives the page surface texture */}
              <motion.div
                aria-hidden
                style={{
                  position: 'absolute',
                  width: 360,
                  height: 360,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${palette.accent}33 0%, transparent 60%)`,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                  left: tilt.lightX,
                  top: tilt.lightY,
                  x: '-50%',
                  y: '-50%',
                  mixBlendMode: 'soft-light',
                  zIndex: 1,
                }}
              />

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={idx}
                  custom={dir}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                  style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2 }}
                >
                  <PageContent spread={spread} idx={idx} palette={palette} />
                </motion.div>
              </AnimatePresence>

              {/* Spine shadow */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 60,
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(90deg, transparent 0%, ${palette.pageEdge}88 35%, ${palette.pageEdge}aa 50%, ${palette.pageEdge}88 65%, transparent 100%)`,
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              />

              {/* Paper grain */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle at 20% 30%, ${palette.pageEdge}22 0%, transparent 40%),
                                    radial-gradient(circle at 80% 70%, ${palette.pageEdge}22 0%, transparent 40%)`,
                  mixBlendMode: 'multiply',
                }}
              />
            </div>

            <KnotBinding palette={palette} />
          </div>
        </motion.div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <button onClick={() => go(-1)} disabled={idx === 0} style={btnStyle(palette, idx === 0)}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span>Prev</span>
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SPREADS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDir(i > idx ? 1 : -1)
                setIdx(i)
              }}
              aria-label={`Go to spread ${i + 1}`}
              style={{
                width: i === idx ? 24 : 7,
                height: 7,
                borderRadius: 99,
                background: i === idx ? palette.accent : `${palette.inkQuiet}55`,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all .35s cubic-bezier(.4,0,.2,1)',
                boxShadow: i === idx ? `0 0 12px ${palette.accent}88` : 'none',
              }}
            />
          ))}
        </div>

        <button onClick={() => go(1)} disabled={idx === SPREADS.length - 1} style={btnStyle(palette, idx === SPREADS.length - 1)}>
          <span>Next</span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
        </button>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-serif), Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: palette.inkQuiet,
        }}
      >
        {String(idx + 1).padStart(2, '0')} of {String(SPREADS.length).padStart(2, '0')} · {spread.title}
      </div>
    </div>
  )
}
