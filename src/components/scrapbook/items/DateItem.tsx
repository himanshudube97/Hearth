// src/components/scrapbook/items/DateItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { DateItemData } from '@/lib/scrapbook'

interface Props {
  item: DateItemData
  isEditing: boolean
  onChange: (next: DateItemData) => void
}

function formatDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toLowerCase()
}

export default function DateItem({ item, isEditing, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const text = item.displayText ?? formatDisplay(item.isoDate)

  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text
    }
  }, [text])

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
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={(e) =>
          onChange({ ...item, displayText: (e.currentTarget as HTMLDivElement).innerText })
        }
        onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
        spellCheck={false}
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontStyle: 'italic',
          fontSize: 'min(2.6vw, 19px)',
          color: '#a3413a',
          letterSpacing: 0.3,
          outline: 'none',
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  )
}
