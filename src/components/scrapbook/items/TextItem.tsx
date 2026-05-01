'use client'

import React, { useEffect, useRef } from 'react'
import { TextItemData } from '@/lib/scrapbook'

interface Props {
  item: TextItemData
  selected: boolean
  isEditing: boolean
  onChange: (next: TextItemData) => void
}

export default function TextItem({ item, selected, isEditing, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Keep DOM in sync if text is updated externally (without losing caret on keystrokes)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== item.text) {
      ref.current.innerText = item.text
    }
  }, [item.text])

  // When entering edit mode, focus the editable & put caret at end
  useEffect(() => {
    if (isEditing && ref.current) {
      const el = ref.current
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  const fontStack =
    item.fontFamily === 'caveat'
      ? 'var(--font-caveat), "Bradley Hand", cursive'
      : 'var(--font-playfair), Georgia, serif'

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: item.bg,
        // Sticky-note paper feel: subtle gradient + grain
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 30%, rgba(0,0,0,0.04) 100%)`,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -10px 18px rgba(0,0,0,0.04)',
        padding: '14px 14px 12px 14px',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      {/* a tiny tape strip across the top — playful, like washi */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -6,
          left: '30%',
          width: '40%',
          height: 12,
          background: item.tape,
          opacity: 0.78,
          transform: 'rotate(-1.5deg)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }}
      />

      {/* DOM children are owned by the useEffect above — never pass {item.text}
          as JSX children, or React reconciliation resets the caret on every
          keystroke and the user types backwards. */}
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={(e) => {
          const text = (e.currentTarget as HTMLDivElement).innerText
          onChange({ ...item, text })
        }}
        // Don't let editing pointer events bubble to the wrapper drag tracker
        onPointerDown={(e) => {
          if (isEditing) e.stopPropagation()
        }}
        spellCheck={false}
        className="w-full outline-none"
        style={{
          fontFamily: fontStack,
          fontSize: item.fontSize,
          color: item.color,
          lineHeight: 1.18,
          cursor: isEditing ? 'text' : 'inherit',
          minHeight: '1.2em',
          // Soft "ink" effect: very subtle text shadow that warms the color
          textShadow: '0 0.5px 0 rgba(0,0,0,0.08)',
        }}
      />

      {/* corner fold detail when selected — pure delight, no functional use */}
      {selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            right: 0,
            bottom: 0,
            width: 14,
            height: 14,
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.10) 50%)`,
          }}
        />
      )}
    </div>
  )
}
