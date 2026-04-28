'use client'

import React from 'react'
import { useThemeStore } from '@/store/theme'
import { paperForTheme } from '@/lib/scrapbook'

interface Props {
  children: React.ReactNode
}

/**
 * Per-theme paper sheet. Each theme has its own hand-tuned paper stock in
 * `paperForTheme()` — always reads as paper, never as a colored panel.
 */
export default function PageSurface({ children }: Props) {
  const { themeName } = useThemeStore()
  const paper = paperForTheme(themeName)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: paper.base,
        backgroundImage: [
          `radial-gradient(circle at 18% 22%, ${paper.highlight} 0%, transparent 55%)`,
          `radial-gradient(circle at 82% 78%, ${paper.shadow} 0%, transparent 55%)`,
          `radial-gradient(circle at 35% 60%, ${paper.grain} 0%, transparent 6%)`,
          `radial-gradient(circle at 70% 30%, ${paper.grain} 0%, transparent 4%)`,
        ].join(', '),
        boxShadow: [
          '0 14px 40px rgba(0,0,0,0.40)',
          '0 2px 6px rgba(0,0,0,0.22)',
          'inset 0 0 0 1px rgba(255, 255, 255, 0.35)',
          `inset 0 0 60px ${paper.shadow}`,
        ].join(', '),
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
