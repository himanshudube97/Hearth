'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  type EntryStyle,
  type FontKey,
  FONT_KEYS,
  FONT_DEFS,
  resolveFontFamily,
} from '@/lib/entry-style'

interface PenMenuProps {
  value: EntryStyle
  onChange: (next: EntryStyle) => void
  onClose: () => void
  bodyText: string
  panelBg: string
  panelBorder: string
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export default function PenMenu({
  value,
  onChange,
  onClose,
  bodyText,
  panelBg,
  panelBorder,
  triggerRef,
}: PenMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return
      const target = e.target as Node
      if (ref.current.contains(target)) return
      if (triggerRef?.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [onClose, triggerRef])

  const currentFont = value.font ?? 'caveat'

  const pick = (font: FontKey) => {
    onChange({ ...value, font })
    onClose()
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 4, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 4, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 rounded-lg shadow-md flex gap-1"
      style={{
        top: '-2px',
        right: '32px',
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        padding: '3px',
      }}
      role="dialog"
      aria-label="Font"
    >
      {FONT_KEYS.map((key) => {
        const selected = key === currentFont
        return (
          <button
            key={key}
            onClick={() => pick(key)}
            className="px-1.5 rounded-md transition-opacity"
            style={{
              fontFamily: resolveFontFamily(key),
              fontSize: '14px',
              lineHeight: 1.4,
              color: bodyText,
              background: selected ? `${bodyText}18` : 'transparent',
              border: `1px solid ${selected ? bodyText : panelBorder}`,
              opacity: selected ? 1 : 0.85,
            }}
            title={FONT_DEFS[key].label}
            aria-pressed={selected}
          >
            aA
          </button>
        )
      })}
    </motion.div>
  )
}
