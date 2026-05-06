// src/components/landing/DiaryBook.tsx
'use client'

import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/theme'
import DiaryCornerPeel from './DiaryCornerPeel'

type Props = {
  leftPage: ReactNode
  rightPage: ReactNode
  rightFlipOverlay?: ReactNode
  coverOverlay?: ReactNode
  cornersEnabled?: boolean
  onPeelNext?: () => void
  onPeelPrev?: () => void
}

export default function DiaryBook({
  leftPage,
  rightPage,
  rightFlipOverlay,
  coverOverlay,
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
      style={{
        perspective: '2200px',
        perspectiveOrigin: '50% 30%',
      }}
    >
      {/* Cast shadow under the tilted book — gives the floating-modal feel */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '-6%',
          left: '8%',
          right: '8%',
          height: '14%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* The book itself — tilted in 3D */}
      <div
        className="relative w-full h-full flex"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(6deg) rotateY(-1deg)',
          background: paper,
          color: ink,
          borderRadius: '4px',
          boxShadow:
            '0 40px 80px rgba(0,0,0,0.32), 0 18px 40px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.05)',
          fontFamily: 'var(--font-serif, Georgia), serif',
          // Deckled edge: slightly irregular polygon clip
          clipPath:
            'polygon(0% 0.3%, 0.3% 0%, 99.7% 0%, 100% 0.3%, 100% 99.7%, 99.7% 100%, 0.3% 100%, 0% 99.7%)',
        }}
      >
        {/* Ruled lines overlay — theme-aware */}
        <div
          aria-hidden
          className="diary-ruled-lines"
          style={{
            // Use the theme's text muted color, low alpha, for the lines
            ['--rule-color' as never]: theme.text.muted,
          }}
        />

        {/* Paper grain overlay */}
        <div className="diary-paper-grain" />

        {/* Left page */}
        <div className="relative flex-1 p-10 md:p-14 overflow-hidden">
          {leftPage}
          {cornersEnabled && (
            <>
              <DiaryCornerPeel corner="tl" enabled onCommit={() => onPeelPrev?.()} />
              <DiaryCornerPeel corner="bl" enabled onCommit={() => onPeelPrev?.()} />
            </>
          )}
        </div>

        {/* Spine */}
        <div
          className="relative pointer-events-none"
          style={{
            width: '20px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04))',
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
          {cornersEnabled && (
            <>
              <DiaryCornerPeel corner="tr" enabled onCommit={() => onPeelNext?.()} />
              <DiaryCornerPeel corner="br" enabled onCommit={() => onPeelNext?.()} />
            </>
          )}
        </div>
      </div>

      {coverOverlay}
    </div>
  )
}
