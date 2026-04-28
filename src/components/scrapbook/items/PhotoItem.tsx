'use client'

import React, { useEffect, useRef } from 'react'
import { PhotoItemData } from '@/lib/scrapbook'

interface Props {
  item: PhotoItemData
  isEditing: boolean
  onChange: (next: PhotoItemData) => void
}

export default function PhotoItem({ item, isEditing, onChange }: Props) {
  const captionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (captionRef.current && captionRef.current.innerText !== (item.caption ?? '')) {
      captionRef.current.innerText = item.caption ?? ''
    }
  }, [item.caption])

  if (item.polaroid) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{
          background: '#fefdf8',
          padding: '8px 8px 26px 8px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="flex-1 overflow-hidden"
          style={{
            background: '#1a1614',
            backgroundImage: `url(${item.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          ref={captionRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) =>
            onChange({ ...item, caption: (e.currentTarget as HTMLDivElement).innerText })
          }
          onPointerDown={(e) => {
            if (isEditing) e.stopPropagation()
          }}
          spellCheck={false}
          className="text-center outline-none"
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            color: '#3a3429',
            cursor: isEditing ? 'text' : 'inherit',
            minHeight: 18,
          }}
        >
          {item.caption ?? ''}
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: `url(${item.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 4,
      }}
    />
  )
}
