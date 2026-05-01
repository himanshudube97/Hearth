// src/components/scrapbook/items/StampItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { StampItemData } from '@/lib/scrapbook'

interface Props {
  item: StampItemData
  isEditing: boolean
  onChange: (next: StampItemData) => void
}

const INK_COLORS: Record<StampItemData['ink'], string> = {
  red: '#a3413a',
  blue: '#3a5a8a',
  black: '#2a2a2a',
}

export default function StampItem({ item, isEditing, onChange }: Props) {
  const color = INK_COLORS[item.ink]

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        position: 'relative',
        color,
        opacity: 0.78,
        filter: 'contrast(1.05)',
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.4" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="0.7" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-playfair), serif',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          gap: 1,
        }}
      >
        <EditableLine
          text={item.topLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, topLine: t })}
          color={color}
          fontSize="min(1.1vw, 9px)"
        />
        <EditableLine
          text={item.midLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, midLine: t })}
          color={color}
          fontSize="min(1.6vw, 13px)"
          fontStyle="italic"
        />
        <EditableLine
          text={item.bottomLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, bottomLine: t })}
          color={color}
          fontSize="min(1vw, 8px)"
        />
      </div>
    </div>
  )
}

function EditableLine({
  text,
  isEditing,
  onChange,
  color,
  fontSize,
  fontStyle,
}: {
  text: string
  isEditing: boolean
  onChange: (t: string) => void
  color: string
  fontSize: string
  fontStyle?: 'italic' | 'normal'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text
    }
  }, [text])
  return (
    // DOM children owned by the useEffect above — never pass {text} as JSX
    // children, or React resets the caret on every keystroke (backwards typing).
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerText)}
      onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
      spellCheck={false}
      style={{
        color,
        fontSize,
        fontStyle,
        outline: 'none',
        textAlign: 'center',
        minHeight: 8,
        minWidth: 12,
      }}
    />
  )
}
