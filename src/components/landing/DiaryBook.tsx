// src/components/landing/DiaryBook.tsx
'use client'

import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/theme'
import DiaryCornerPeel from './DiaryCornerPeel'

type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
  rightFlipOverlay?: ReactNode
  cornersEnabled?: boolean
  onPeelNext?: () => void
  onPeelPrev?: () => void
}

export default function DiaryBook({
  leftPage,
  rightPage,
  rightFlipOverlay,
  cornersEnabled,
  onPeelNext,
  onPeelPrev,
}: Props) {
  const { theme } = useThemeStore()

  // Tinted paper: cream base, theme accent at 8%
  const paper = `color-mix(in oklab, #fbf4e3, ${theme.accent.primary} 8%)`
  // Cover stock for the spine shadow
  const ink = '#3a3128'

  return (
    <div
      className="relative w-full max-w-[1100px] aspect-[16/10] mx-auto"
      style={{ perspective: '2400px' }}
    >
      {/* Stage vignette */}
      <div
        className="absolute -inset-12 pointer-events-none rounded-[40px]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      <div
        className="relative w-full h-full flex"
        style={{
          transformStyle: 'preserve-3d',
          background: paper,
          color: ink,
          borderRadius: '4px',
          boxShadow:
            '0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.04)',
          fontFamily: 'var(--font-serif, Georgia), serif',
          // Deckled edge: slightly irregular polygon clip
          clipPath:
            'polygon(0% 0.3%, 0.3% 0%, 99.7% 0%, 100% 0.3%, 100% 99.7%, 99.7% 100%, 0.3% 100%, 0% 99.7%)',
        }}
      >
        {/* Paper grain overlay */}
        <div className="diary-paper-grain" />

        {/* Left page */}
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {leftPage}
          <DiaryCornerPeel
            corner="tl"
            enabled={!!cornersEnabled}
            onCommit={() => onPeelPrev?.()}
          />
          <DiaryCornerPeel
            corner="bl"
            enabled={!!cornersEnabled}
            onCommit={() => onPeelPrev?.()}
          />
        </div>

        {/* Spine */}
        <div
          className="relative pointer-events-none"
          style={{
            width: '20px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.04))',
          }}
        />

        {/* Right page */}
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {rightPage}
          {rightFlipOverlay && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {rightFlipOverlay}
            </div>
          )}
          <DiaryCornerPeel
            corner="tr"
            enabled={!!cornersEnabled}
            onCommit={() => onPeelNext?.()}
          />
          <DiaryCornerPeel
            corner="br"
            enabled={!!cornersEnabled}
            onCommit={() => onPeelNext?.()}
          />
        </div>
      </div>
    </div>
  )
}
