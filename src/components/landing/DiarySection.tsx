// src/components/landing/DiarySection.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import { SPREADS, type SpreadDef } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'
import DiaryPageFlip from './DiaryPageFlip'
import { DiarySpreadLeft, DiarySpreadRight } from './DiarySpread'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  // Track the previous-rendered spread index so we can render the "from"
  // face of the flip while the animation is in flight.
  const [prevSpreadIndex, setPrevSpreadIndex] = useState(0)
  useEffect(() => {
    if (!nav.isFlipping) {
      setPrevSpreadIndex(nav.currentSpread)
    }
  }, [nav.isFlipping, nav.currentSpread])

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
    if (s.kind === 'cta') {
      return (
        <div className="h-full flex items-center justify-center font-serif italic text-2xl">
          {s.text}
        </div>
      )
    }
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
        <div className="h-full flex items-center justify-center text-sm italic opacity-40">
          (polaroids wired in Task 8)
        </div>
      )
    }
    if (s.kind === 'cta') {
      return (
        <div className="h-full flex items-center justify-center text-sm italic opacity-40">
          (CTA wired in Task 9)
        </div>
      )
    }
    const _exhaustive: never = s
    void _exhaustive
    return null
  }

  const prevSpread = SPREADS[prevSpreadIndex]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 overflow-hidden"
      style={{
        background: theme.bg.gradient,
        color: theme.text.primary,
      }}
    >
      {/* Theme-aware particle layer behind the diary */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <Background bounded />
      </div>

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
    </section>
  )
}
