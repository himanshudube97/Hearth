'use client'

import React, { useEffect, useRef } from 'react'
import { SongItemData } from '@/lib/scrapbook'

interface Props {
  item: SongItemData
  selected: boolean
  onChange: (next: SongItemData) => void
}

const providerLabel: Record<SongItemData['provider'], string> = {
  spotify: 'spotify',
  youtube: 'youtube',
  apple: 'apple music',
  soundcloud: 'soundcloud',
  unknown: 'song',
}

export default function SongItem({ item, selected, onChange }: Props) {
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (titleRef.current && titleRef.current.innerText !== item.title) {
      titleRef.current.innerText = item.title
    }
  }, [item.title])

  return (
    <div
      className="w-full h-full flex items-center gap-3 px-3"
      style={{
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        borderRadius: 10,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
      }}
    >
      {/* Music note icon */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 34,
          height: 34,
          background: '#f3ead2',
          border: '1px solid rgba(58, 52, 41, 0.18)',
          color: '#3a3429',
          fontSize: 18,
        }}
      >
        ♪
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          ref={titleRef}
          contentEditable={selected}
          suppressContentEditableWarning
          onInput={(e) =>
            onChange({ ...item, title: (e.currentTarget as HTMLDivElement).innerText })
          }
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          className="outline-none truncate"
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 20,
            color: '#3a3429',
            lineHeight: 1.1,
            cursor: selected ? 'text' : 'inherit',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 14,
            color: 'rgba(58, 52, 41, 0.55)',
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          {providerLabel[item.provider]}
        </div>
      </div>
    </div>
  )
}
