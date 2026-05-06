// src/components/landing/DiarySection.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import { SPREADS, type SpreadDef, type CoverSpread } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'
import DiaryCover from './DiaryCover'
import DiaryPageFlip from './DiaryPageFlip'
import { DiarySpreadLeft, DiarySpreadRight } from './DiarySpread'
import { type ThemeName } from '@/lib/themes'
import DiaryPolaroidGrid from './DiaryPolaroidGrid'
import { DiaryCtaLeft, DiaryCtaRight } from './DiaryCTASpread'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const themeName = useThemeStore((s) => s.themeName)
  const setTheme = useThemeStore((s) => s.setTheme)
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  // Capture the user's original theme exactly once on mount
  const originalThemeRef = useRef<ThemeName | null>(null)
  const [hasOverridden, setHasOverridden] = useState(false)

  useEffect(() => {
    if (originalThemeRef.current === null) {
      originalThemeRef.current = themeName
    }
  }, [themeName])

  const handlePickTheme = (name: ThemeName) => {
    setTheme(name)
    setHasOverridden(name !== originalThemeRef.current)
  }
  const handleResetTheme = () => {
    if (originalThemeRef.current) {
      setTheme(originalThemeRef.current)
      setHasOverridden(false)
    }
  }

  // Track the previous-rendered spread index so we can render the "from"
  // face of the flip while the animation is in flight.
  const [prevSpreadIndex, setPrevSpreadIndex] = useState(0)
  useEffect(() => {
    if (!nav.isFlipping) {
      setPrevSpreadIndex(nav.currentSpread)
    }
  }, [nav.isFlipping, nav.currentSpread])

  // Hover-corner-bend gating: disable for reduced-motion and touch devices.
  const [cornersEnabled, setCornersEnabled] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    setCornersEnabled(!reduceMotion && !isTouch)
  }, [])
  const peelable = cornersEnabled && !nav.isFlipping

  const renderLeft = (s: SpreadDef): React.ReactNode => {
    if (s.kind === 'feature') return <DiarySpreadLeft spread={s} />
    if (s.kind === 'cover') {
      return (
        <div className="h-full flex items-center justify-center">
          <h2 className="font-serif italic text-4xl tracking-[0.3em]">{s.title}</h2>
        </div>
      )
    }
    if (s.kind === 'themes') return <DiarySpreadLeft spread={s} />
    if (s.kind === 'cta') return <DiaryCtaLeft spread={s} />
    const _exhaustive: never = s
    void _exhaustive
    return null
  }

  const renderRight = (s: SpreadDef, index: number): React.ReactNode => {
    if (s.kind === 'feature') return <DiarySpreadRight spread={s} spreadIndex={index} />
    if (s.kind === 'cover') {
      return (
        <div className="h-full flex items-center justify-center text-sm italic opacity-40">
          (cover wired in Task 7)
        </div>
      )
    }
    if (s.kind === 'themes') {
      return (
        <DiaryPolaroidGrid
          current={themeName}
          hasOverridden={hasOverridden}
          onPick={handlePickTheme}
          onReset={handleResetTheme}
        />
      )
    }
    if (s.kind === 'cta') return <DiaryCtaRight spread={s} />
    const _exhaustive: never = s
    void _exhaustive
    return null
  }

  const prevSpread = SPREADS[prevSpreadIndex]

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 py-16"
      style={{
        background: theme.bg.gradient,
        color: theme.text.primary,
      }}
    >
      {/* Theme-aware particle layer behind the diary */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <Background bounded />
      </div>

      {/* Animated colored glow underneath the book */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: '70vw',
          height: '70vw',
          maxWidth: 1100,
          maxHeight: 1100,
          background: `radial-gradient(circle, ${theme.accent.primary}55 0%, transparent 60%)`,
          filter: 'blur(80px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
        animate={{
          opacity: [0.55, 0.85, 0.55],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: '50vw',
          height: '50vw',
          maxWidth: 800,
          maxHeight: 800,
          background: `radial-gradient(circle, ${theme.accent.warm}66 0%, transparent 65%)`,
          filter: 'blur(70px)',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.12, 1],
          x: ['-50%', '-46%', '-50%'],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Book + nav, in a relative container so they stack above the glow */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <DiaryBook
          leftPage={renderLeft(spread)}
          rightPage={renderRight(spread, nav.currentSpread)}
          rightFlipOverlay={
            <DiaryPageFlip
              spreadKey={`${prevSpreadIndex}-${nav.currentSpread}`}
              current={renderRight(prevSpread, prevSpreadIndex)}
              upcoming={renderRight(spread, nav.currentSpread)}
              direction={nav.flipDirection}
              isFlipping={nav.isFlipping}
              onComplete={nav.onFlipComplete}
            />
          }
          coverOverlay={
            SPREADS[0].kind === 'cover' && (
              <DiaryCover
                spread={SPREADS[0] as CoverSpread}
                open={nav.currentSpread !== 0}
              />
            )
          }
          cornersEnabled={peelable}
          onPeelNext={nav.flipNext}
          onPeelPrev={nav.flipPrev}
        />

        <DiaryNav
          total={nav.total}
          current={nav.currentSpread}
          canGoForward={nav.canGoForward}
          canGoBack={nav.canGoBack}
          isFlipping={nav.isFlipping}
          onPrev={nav.flipPrev}
          onNext={nav.flipNext}
          onJump={nav.jumpTo}
        />
      </div>
    </section>
  )
}
