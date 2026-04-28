'use client'

import React, { useEffect, useRef } from 'react'
import { SongItemData } from '@/lib/scrapbook'

interface Props {
  item: SongItemData
  isEditing: boolean
  onChange: (next: SongItemData) => void
}

const providerLabel: Record<SongItemData['provider'], string> = {
  spotify: 'spotify',
  youtube: 'youtube',
  apple: 'apple music',
  soundcloud: 'soundcloud',
  unknown: 'song',
}

const providerAccent: Record<SongItemData['provider'], string> = {
  spotify: '#1db954',
  youtube: '#cc1b1b',
  apple: '#fa57c1',
  soundcloud: '#ff7700',
  unknown: '#8b6f47',
}

export default function SongItem({ item, isEditing, onChange }: Props) {
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (titleRef.current && titleRef.current.innerText !== item.title) {
      titleRef.current.innerText = item.title
    }
  }, [item.title])

  useEffect(() => {
    if (isEditing && titleRef.current) {
      const el = titleRef.current
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  return (
    <div
      className="w-full h-full flex items-center gap-3 px-3"
      style={{
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        borderLeft: `4px solid ${providerAccent[item.provider]}`,
        borderRadius: 10,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 34,
          height: 34,
          background: providerAccent[item.provider],
          color: '#fff',
          fontSize: 18,
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        ♪
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          ref={titleRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) =>
            onChange({ ...item, title: (e.currentTarget as HTMLDivElement).innerText })
          }
          onPointerDown={(e) => {
            if (isEditing) e.stopPropagation()
          }}
          spellCheck={false}
          className="outline-none truncate"
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 20,
            color: '#3a3429',
            lineHeight: 1.1,
            cursor: isEditing ? 'text' : 'inherit',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 14,
            color: providerAccent[item.provider],
            opacity: 0.8,
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
