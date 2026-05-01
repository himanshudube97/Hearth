// src/components/scrapbook/items/ClipItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { ClipItemData } from '@/lib/scrapbook'

interface Props {
  item: ClipItemData
  isEditing: boolean
  onChange: (next: ClipItemData) => void
}

export default function ClipItem({ item, isEditing, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const display = item.lines.join('\n')

  useEffect(() => {
    if (ref.current && ref.current.innerText !== display) {
      ref.current.innerText = display
    }
  }, [display])

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.currentTarget as HTMLDivElement).innerText
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    onChange({ ...item, lines })
  }

  if (item.variant === 'ticket-stub') {
    return (
      <Surface
        background="#f5e7c4"
        ruled={false}
        leftPad={28}
      >
        <Editable
          refEl={ref}
          isEditing={isEditing}
          onInput={handleInput}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize={12}
          letterSpacing={1}
          textTransform="uppercase"
          color="#3a3429"
          text={display}
        />
      </Surface>
    )
  }

  if (item.variant === 'receipt') {
    return (
      <Surface background="#fdfcf6" ruled={false} leftPad={20}>
        <Editable
          refEl={ref}
          isEditing={isEditing}
          onInput={handleInput}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize={11}
          letterSpacing={0.4}
          color="#2a2a2a"
          text={display}
        />
      </Surface>
    )
  }

  // index-card (default)
  return (
    <Surface background="#fefdf8" ruled={true}>
      <Editable
        refEl={ref}
        isEditing={isEditing}
        onInput={handleInput}
        fontFamily="var(--font-caveat), cursive"
        fontSize={18}
        color="#3a3429"
        text={display}
      />
    </Surface>
  )
}

function Surface({
  children,
  background,
  ruled,
  leftPad = 14,
}: {
  children: React.ReactNode
  background: string
  ruled: boolean
  leftPad?: number
}) {
  return (
    <div
      className="w-full h-full"
      style={{
        background,
        backgroundImage: ruled
          ? 'repeating-linear-gradient(0deg, transparent 0 22px, rgba(58,52,41,0.10) 22px 23px)'
          : undefined,
        boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
        borderRadius: 2,
        padding: `8px 12px 8px ${leftPad}px`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function Editable({
  refEl,
  isEditing,
  onInput,
  fontFamily,
  fontSize,
  letterSpacing,
  textTransform,
  color,
  text,
}: {
  refEl: React.RefObject<HTMLDivElement | null>
  isEditing: boolean
  onInput: (e: React.FormEvent<HTMLDivElement>) => void
  fontFamily: string
  fontSize: number
  letterSpacing?: number
  textTransform?: 'uppercase' | 'none'
  color: string
  text: string
}) {
  return (
    // DOM children owned by the parent's useEffect — never pass {text} as JSX
    // children, or React resets the caret on every keystroke (backwards typing).
    <div
      ref={refEl}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={onInput}
      onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
      spellCheck={false}
      style={{
        fontFamily,
        fontSize,
        letterSpacing,
        textTransform,
        color,
        outline: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  )
}
