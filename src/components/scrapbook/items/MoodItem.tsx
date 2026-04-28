// src/components/scrapbook/items/MoodItem.tsx
'use client'

import React from 'react'
import { MoodItemData, MOOD_COLORS } from '@/lib/scrapbook'

const MOOD_LABELS = ['heavy', 'low', 'tender', 'warm', 'radiant']

interface Props {
  item: MoodItemData
  onChange: (next: MoodItemData) => void
}

export default function MoodItem({ item, onChange }: Props) {
  const color = MOOD_COLORS[item.level]
  const label = MOOD_LABELS[item.level]

  function cycle() {
    const next = ((item.level + 1) % 5) as 0 | 1 | 2 | 3 | 4
    onChange({ ...item, level: next })
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); cycle() }}
      style={{
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${lighten(color)} 0%, ${color} 50%, ${darken(color)} 100%)`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.30), inset 0 -2px 4px rgba(0,0,0,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-playfair), serif',
          fontStyle: 'italic',
          fontSize: 'min(1.4vw, 11px)',
          letterSpacing: 0.4,
          textShadow: '0 1px 1px rgba(0,0,0,0.35)',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function lighten(hex: string): string {
  return shade(hex, 30)
}

function darken(hex: string): string {
  return shade(hex, -30)
}

function shade(hex: string, amount: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
