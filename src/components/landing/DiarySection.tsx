// src/components/landing/DiarySection.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'

export default function DiarySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { theme } = useThemeStore()
  const nav = useDiaryNav(sectionRef)
  const spread = SPREADS[nav.currentSpread]

  // The stub has no flip animation, so release the flip lock immediately on
  // each spread change. The 3D book stage (Task 3) will replace this by calling
  // nav.onFlipComplete from its Framer Motion onAnimationComplete.
  useEffect(() => {
    nav.onFlipComplete()
  }, [nav.currentSpread, nav.onFlipComplete])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 min-h-[80vh] flex flex-col items-center justify-center"
      style={{ color: theme.text.primary }}
    >
      <div
        className="w-full max-w-4xl mx-auto p-12 rounded-md"
        style={{
          background: `color-mix(in srgb, #fbf4e3, ${theme.accent.primary} 8%)`,
          color: '#3a3128',
          fontFamily: 'var(--font-serif, Georgia), serif',
        }}
      >
        <p className="text-xs uppercase tracking-[0.3em] opacity-50 mb-4">
          spread {nav.currentSpread + 1} / {nav.total}
        </p>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(spread, null, 2)}</pre>
      </div>

      <DiaryNav
        total={nav.total}
        current={nav.currentSpread}
        canGoForward={nav.canGoForward}
        canGoBack={nav.canGoBack}
        onPrev={nav.flipPrev}
        onNext={nav.flipNext}
        onJump={nav.jumpTo}
      />
    </section>
  )
}
