'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  type EntryStyle,
  type FontKey,
  type ColorKey,
  type EffectKey,
  FONT_KEYS,
  COLOR_KEYS,
  EFFECT_KEYS,
  FONT_DEFS,
  COLOR_DEFS,
  EFFECT_DEFS,
  resolveFontFamily,
  resolveInkColor,
} from '@/lib/entry-style'

interface PenMenuProps {
  value: EntryStyle
  onChange: (next: EntryStyle) => void
  onClose: () => void
  themeBodyText: string
  panelBg: string
  panelBorder: string
  labelColor: string
  // Trigger element ref. Excluded from outside-click closure so a second
  // click on the pen-nib (the toggle) doesn't fire close-then-reopen: the
  // mousedown would otherwise close it and the click handler immediately
  // re-toggle it open.
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export default function PenMenu({
  value,
  onChange,
  onClose,
  themeBodyText,
  panelBg,
  panelBorder,
  labelColor,
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

  const setFont = (font: FontKey) => onChange({ ...value, font })
  const setColor = (color: ColorKey | null) => onChange({ ...value, color })
  const setEffect = (effect: EffectKey | undefined) => {
    const next: EntryStyle = { ...value }
    if (effect) next.effect = effect
    else delete next.effect
    onChange(next)
  }

  const currentFont = value.font ?? 'caveat'
  const currentColorHex = resolveInkColor(value.color, themeBodyText)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 rounded-xl shadow-lg"
      style={{
        top: '24px',
        right: '0px',
        width: '280px',
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        padding: '14px 14px 12px',
      }}
      role="dialog"
      aria-label="Pen settings"
    >
      {/* Font row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Font
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {FONT_KEYS.map((key) => {
          const selected = key === currentFont
          return (
            <button
              key={key}
              onClick={() => setFont(key)}
              className="px-2 py-1 rounded-md transition-opacity"
              style={{
                fontFamily: resolveFontFamily(key),
                fontSize: '20px',
                lineHeight: 1,
                color: currentColorHex,
                background: selected ? `${currentColorHex}18` : 'transparent',
                border: `1px solid ${selected ? currentColorHex : panelBorder}`,
                opacity: selected ? 1 : 0.85,
              }}
              title={FONT_DEFS[key].label}
              aria-pressed={selected}
            >
              aA
            </button>
          )
        })}
      </div>

      {/* Color row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Ink
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Default swatch (null) — rendered as a ring of theme body color. */}
        <button
          onClick={() => setColor(null)}
          className="rounded-full transition-all"
          style={{
            width: '22px',
            height: '22px',
            background: 'transparent',
            border: `2px solid ${themeBodyText}`,
            boxShadow: value.color == null ? `0 0 0 2px ${themeBodyText}33` : 'none',
          }}
          title="Default"
          aria-pressed={value.color == null}
        />
        {COLOR_KEYS.map((key) => {
          const def = COLOR_DEFS[key]
          const selected = value.color === key
          return (
            <button
              key={key}
              onClick={() => setColor(key)}
              className="rounded-full transition-all"
              style={{
                width: '22px',
                height: '22px',
                background: def.hex,
                border: `2px solid ${selected ? def.hex : 'transparent'}`,
                boxShadow: selected ? `0 0 0 2px ${def.hex}33` : 'none',
              }}
              title={def.label}
              aria-pressed={selected}
            />
          )
        })}
      </div>

      {/* Effect row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Effect
      </div>
      <div className="flex gap-2">
        <EffectChip
          label="None"
          selected={!value.effect}
          onClick={() => setEffect(undefined)}
          accent={currentColorHex}
          panelBorder={panelBorder}
        />
        {EFFECT_KEYS.map((key) => (
          <EffectChip
            key={key}
            label={EFFECT_DEFS[key].label}
            selected={value.effect === key}
            onClick={() => setEffect(key)}
            accent={currentColorHex}
            panelBorder={panelBorder}
          />
        ))}
      </div>
    </motion.div>
  )
}

function EffectChip({
  label,
  selected,
  onClick,
  accent,
  panelBorder,
}: {
  label: string
  selected: boolean
  onClick: () => void
  accent: string
  panelBorder: string
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1 rounded-full transition-all"
      style={{
        background: selected ? `${accent}18` : 'transparent',
        border: `1px solid ${selected ? accent : panelBorder}`,
        color: accent,
        opacity: selected ? 1 : 0.85,
      }}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
