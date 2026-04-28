'use client'

import React, { useEffect, useRef, useState } from 'react'
import { stickerIds, stickers } from './stickers'

interface Props {
  onAddText: () => void
  onAddSticker: (stickerId: string) => void
}

export default function CanvasToolbar({ onAddText, onAddSticker }: Props) {
  const [stickerOpen, setStickerOpen] = useState(false)
  const stickerWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!stickerWrapRef.current) return
      if (!stickerWrapRef.current.contains(e.target as Node)) {
        setStickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full"
      style={{
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        boxShadow: '0 6px 22px rgba(20, 14, 4, 0.18)',
        fontFamily: 'var(--font-caveat), cursive',
      }}
    >
      <ToolbarButton onClick={onAddText} icon="✎" label="text" />

      <div className="relative" ref={stickerWrapRef}>
        <ToolbarButton
          onClick={() => setStickerOpen((o) => !o)}
          icon="✦"
          label="sticker"
          active={stickerOpen}
        />
        {stickerOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 p-3 rounded-2xl"
            style={{
              top: '100%',
              background: '#fefaf0',
              border: '1px solid rgba(58, 52, 41, 0.18)',
              boxShadow: '0 8px 24px rgba(20, 14, 4, 0.22)',
              zIndex: 50,
              width: 240,
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              {stickerIds.map((id) => {
                const entry = stickers[id]
                const Sticker = entry.component
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onAddSticker(id)
                      setStickerOpen(false)
                    }}
                    className="aspect-square rounded-lg flex items-center justify-center transition-transform"
                    style={{
                      background: '#f4ecd8',
                      border: '1px solid rgba(58, 52, 41, 0.12)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform =
                        'scale(1.08) rotate(-3deg)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.transform = ''
                    }}
                    title={entry.label}
                  >
                    <div style={{ width: '70%', height: '70%' }}>
                      <Sticker />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <ToolbarButton onClick={() => {}} icon="◰" label="photo" disabled />
      <ToolbarButton onClick={() => {}} icon="♪" label="song" disabled />
      <ToolbarButton onClick={() => {}} icon="✏" label="doodle" disabled />
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: string
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all"
      style={{
        background: active ? '#3a3429' : 'transparent',
        color: disabled ? 'rgba(58, 52, 41, 0.35)' : active ? '#f4ecd8' : '#3a3429',
        fontSize: 16,
        fontFamily: 'var(--font-caveat), cursive',
        border: '1px solid',
        borderColor: active ? '#3a3429' : 'rgba(58, 52, 41, 0.22)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={disabled ? 'coming soon' : label}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
