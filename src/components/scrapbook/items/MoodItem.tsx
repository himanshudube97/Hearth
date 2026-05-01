// src/components/scrapbook/items/MoodItem.tsx
'use client'

import React from 'react'
import { MoodItemData } from '@/lib/scrapbook'

export const MOOD_LABELS = ['heavy', 'low', 'tender', 'warm', 'radiant']
export const MOOD_EMOJIS = ['😔', '😕', '🥺', '😊', '🤩']

export default function MoodItem({ item }: { item: MoodItemData }) {
  const emoji = MOOD_EMOJIS[item.level]
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <span
        style={{
          fontSize: 'min(5vw, 44px)',
          lineHeight: 1,
          // emoji-friendly fallback chain
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        }}
      >
        {emoji}
      </span>
    </div>
  )
}
