// src/components/landing/DiarySection.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'
import { DiarySpreadLeft, DiarySpreadRight } from './DiarySpread'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  // STUB-ONLY: Task 1's hook locks until onFlipComplete fires. Until Task 5
  // wires the page-flip animation's onAnimationComplete to onFlipComplete,
  // release the lock immediately on spread change so subsequent flips work.
  useEffect(() => {
    nav.onFlipComplete()
  }, [nav.currentSpread, nav.onFlipComplete])

  let left: React.ReactNode = null
  let right: React.ReactNode = null

  if (spread.kind === 'feature') {
    left = <DiarySpreadLeft spread={spread} />
    right = <DiarySpreadRight spread={spread} spreadIndex={nav.currentSpread} />
  } else if (spread.kind === 'cover') {
    left = (
      <div className="h-full flex items-center justify-center">
        <h2 className="font-serif italic text-4xl tracking-[0.3em]">{spread.title}</h2>
      </div>
    )
    right = (
      <div className="h-full flex items-center justify-center text-sm italic opacity-40">
        (cover wired in Task 7)
      </div>
    )
  } else if (spread.kind === 'themes') {
    left = <DiarySpreadLeft spread={spread} />
    right = (
      <div className="h-full flex items-center justify-center text-sm italic opacity-40">
        (polaroids wired in Task 8)
      </div>
    )
  } else if (spread.kind === 'cta') {
    left = (
      <div className="h-full flex items-center justify-center font-serif italic text-2xl">
        {spread.text}
      </div>
    )
    right = (
      <div className="h-full flex items-center justify-center text-sm italic opacity-40">
        (CTA wired in Task 9)
      </div>
    )
  } else {
    // Exhaustiveness guard — TS will error here if a new SpreadDef kind is added
    const _exhaustive: never = spread
    void _exhaustive
  }

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

      <DiaryBook leftPage={left} rightPage={right} />

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
