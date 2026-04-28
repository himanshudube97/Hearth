'use client'

import React, { useEffect, useRef } from 'react'
import { TextItemData } from '@/lib/scrapbook'

interface Props {
  item: TextItemData
  selected: boolean
  onChange: (next: TextItemData) => void
}

export default function TextItem({ item, selected, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Keep DOM in sync if text is updated externally (without losing caret on keystrokes)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== item.text) {
      ref.current.innerText = item.text
    }
  }, [item.text])

  const fontStack =
    item.fontFamily === 'caveat'
      ? 'var(--font-caveat), "Bradley Hand", cursive'
      : 'var(--font-playfair), Georgia, serif'

  return (
    <div
      className="w-full h-full flex items-center"
      style={{
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        borderRadius: 6,
        padding: '10px 14px',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
      }}
    >
      <div
        ref={ref}
        contentEditable={selected}
        suppressContentEditableWarning
        onInput={(e) => {
          const text = (e.currentTarget as HTMLDivElement).innerText
          onChange({ ...item, text })
        }}
        // Don't let edits trigger drag start
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        spellCheck={false}
        className="w-full outline-none"
        style={{
          fontFamily: fontStack,
          fontSize: item.fontSize,
          color: item.color,
          lineHeight: 1.2,
          cursor: selected ? 'text' : 'inherit',
        }}
      >
        {item.text}
      </div>
    </div>
  )
}
