// src/components/landing/DiarySection.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import { SPREADS } from './spreads'
import { useDiaryNav } from './useDiaryNav'
import DiaryNav from './DiaryNav'
import DiaryBook from './DiaryBook'

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
        <Background />
      </div>

      <DiaryBook
        leftPage={
          <div>
            <p className="font-serif italic text-3xl md:text-4xl opacity-40 leading-none mb-3">
              {'numeral' in spread ? spread.numeral : ''}
            </p>
            <h3 className="font-serif italic text-2xl md:text-3xl mb-4">
              {'title' in spread ? spread.title : 'Cover'}
            </h3>
            {'copy' in spread && (
              <p className="text-base leading-relaxed max-w-[36ch]" style={{ opacity: 0.85 }}>
                {spread.copy}
              </p>
            )}
          </div>
        }
        rightPage={
          <div className="w-full h-full flex items-center justify-center text-sm italic opacity-40">
            (right page — coming next)
          </div>
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
