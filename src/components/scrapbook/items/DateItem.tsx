// src/components/scrapbook/items/DateItem.tsx
'use client'

import React from 'react'
import { DateItemData } from '@/lib/scrapbook'

// "friday, 1 may" — lowercased, day before month.
function formatLine(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
  return `${weekday}, ${d.getDate()} ${month}`
}

export default function DateItem({ item }: { item: DateItemData }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: '#fefdf8',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.10)',
        borderRadius: 6,
        padding: '4px 14px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontStyle: 'italic',
          fontSize: 'min(2.6vw, 19px)',
          color: '#a3413a',
          letterSpacing: 0.3,
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
        }}
      >
        {formatLine(item.isoDate)}
      </span>
    </div>
  )
}
