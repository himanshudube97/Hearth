'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

/**
 * Kraft scrapbook page — replaces the corkboard / cream-paper surface from v0.
 * Theme-tinted variants are deferred to v2.
 */
export default function PageSurface({ children }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#e8d8b0',
        backgroundImage: [
          // soft warm shading — gives the page a slight bowl / depth feel
          'radial-gradient(circle at 18% 22%, rgba(255, 240, 200, 0.45) 0%, transparent 55%)',
          'radial-gradient(circle at 82% 78%, rgba(120, 80, 30, 0.10) 0%, transparent 55%)',
          // micro-grain dots — paper fibers
          'radial-gradient(circle at 35% 60%, rgba(120, 80, 30, 0.06) 0%, transparent 6%)',
          'radial-gradient(circle at 70% 30%, rgba(120, 80, 30, 0.05) 0%, transparent 4%)',
        ].join(', '),
        boxShadow: [
          '0 14px 40px rgba(0,0,0,0.40)',
          '0 2px 6px rgba(0,0,0,0.22)',
          'inset 0 0 0 1px rgba(255, 255, 255, 0.35)',
          'inset 0 0 60px rgba(120, 80, 30, 0.10)',
        ].join(', '),
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
