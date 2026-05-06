// src/components/landing/DiaryBook.tsx
'use client'

import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
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
  const colors = getGlassDiaryColors(theme)

  return (
    <div
      className="relative w-full max-w-[1200px] aspect-[16/10] mx-auto"
      style={{
        perspective: '2200px',
        perspectiveOrigin: '50% 30%',
        // Wire the page colors as CSS vars consumed by .diary-page
        ['--page-bg' as string]: colors.pageBg,
        ['--page-bg-solid' as string]: colors.pageBgSolid,
        ['--book-cover-bg' as string]: colors.cover,
        ['--book-cover-border' as string]: colors.coverBorder,
      } as React.CSSProperties}
    >
      {/* Hardcover frame using the existing .book-cover styles */}
      <div className="book-cover" />

      {/* Cast shadow underneath for the floating-modal feel */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '-6%',
          left: '8%',
          right: '8%',
          height: '14%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />

      {/* The book itself — tilted in 3D, two pages with theme-tinted backgrounds */}
      <div
        className="relative w-full h-full flex"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(6deg) rotateY(-1deg)',
          color: colors.bodyText,
          borderRadius: '4px',
          fontFamily: 'var(--font-serif, Georgia), serif',
          zIndex: 1,
        }}
      >
        {/* Left page — uses the existing .diary-page + .diary-page--left styles */}
        <div
          className="diary-page diary-page--left relative flex-1 p-10 md:p-14 overflow-hidden"
          style={{
            // Ruled lines from the theme-derived colors.ruledLine
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg}), repeating-linear-gradient(transparent, transparent 31px, ${colors.ruledLine} 31px, ${colors.ruledLine} 32px)`,
            backgroundBlendMode: 'normal, multiply',
          }}
        >
          {leftPage}
          {cornersEnabled && (
            <>
              <DiaryCornerPeel corner="tl" enabled onCommit={() => onPeelPrev?.()} />
              <DiaryCornerPeel corner="bl" enabled onCommit={() => onPeelPrev?.()} />
            </>
          )}
        </div>

        {/* Spine seam (very thin — the .book-cover frame provides the binding visual) */}
        <div
          className="relative pointer-events-none"
          style={{
            width: '2px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.45), rgba(0,0,0,0))',
            zIndex: 2,
          }}
        />

        {/* Right page */}
        <div
          className="diary-page diary-page--right relative flex-1 p-10 md:p-14 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg}), repeating-linear-gradient(transparent, transparent 31px, ${colors.ruledLine} 31px, ${colors.ruledLine} 32px)`,
            backgroundBlendMode: 'normal, multiply',
          }}
        >
          {rightPage}
          {rightFlipOverlay && (
            <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
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
