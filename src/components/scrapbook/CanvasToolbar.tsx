'use client'

import React, { useEffect, useRef, useState } from 'react'
import { stickerIds, stickers } from './stickers'

interface Props {
  onAddText: () => void
  onAddSticker: (stickerId: string) => void
  onAddPhoto: () => void
  onAddSong: (url: string) => void
  onAddDoodle: () => void
  onAddClip: (variant: 'index-card' | 'ticket-stub' | 'receipt') => void
  onAddMood: () => void
  onAddStamp: () => void
  onReset: () => void
}

export default function CanvasToolbar({
  onAddText,
  onAddSticker,
  onAddPhoto,
  onAddSong,
  onAddDoodle,
  onAddClip,
  onAddMood,
  onAddStamp,
  onReset,
}: Props) {
  const [stickerOpen, setStickerOpen] = useState(false)
  const [songPromptOpen, setSongPromptOpen] = useState(false)
  const [songUrl, setSongUrl] = useState('')
  const [clipOpen, setClipOpen] = useState(false)
  const stickerWrapRef = useRef<HTMLDivElement>(null)
  const songWrapRef = useRef<HTMLDivElement>(null)
  const clipWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (stickerWrapRef.current && !stickerWrapRef.current.contains(e.target as Node)) {
        setStickerOpen(false)
      }
      if (songWrapRef.current && !songWrapRef.current.contains(e.target as Node)) {
        setSongPromptOpen(false)
      }
      if (clipWrapRef.current && !clipWrapRef.current.contains(e.target as Node)) {
        setClipOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function submitSong() {
    const trimmed = songUrl.trim()
    if (trimmed) {
      onAddSong(trimmed)
      setSongUrl('')
      setSongPromptOpen(false)
    }
  }

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

      <ToolbarButton onClick={onAddPhoto} icon="◰" label="photo" />

      <div className="relative" ref={songWrapRef}>
        <ToolbarButton
          onClick={() => setSongPromptOpen((o) => !o)}
          icon="♪"
          label="song"
          active={songPromptOpen}
        />
        {songPromptOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 p-3 rounded-2xl flex flex-col gap-2"
            style={{
              top: '100%',
              background: '#fefaf0',
              border: '1px solid rgba(58, 52, 41, 0.18)',
              boxShadow: '0 8px 24px rgba(20, 14, 4, 0.22)',
              zIndex: 50,
              width: 280,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: 'rgba(58, 52, 41, 0.7)',
                fontFamily: 'var(--font-caveat), cursive',
              }}
            >
              paste a spotify, youtube, or apple music link
            </div>
            <input
              type="text"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSong()
                if (e.key === 'Escape') setSongPromptOpen(false)
              }}
              placeholder="https://..."
              autoFocus
              style={{
                padding: '6px 10px',
                border: '1px solid rgba(58, 52, 41, 0.22)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                color: '#3a3429',
                background: '#fefdf8',
                outline: 'none',
              }}
            />
            <button
              onClick={submitSong}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: '#3a3429',
                color: '#f4ecd8',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-caveat), cursive',
              }}
            >
              add song
            </button>
          </div>
        )}
      </div>

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
              width: 280,
            }}
          >
            <div className="grid grid-cols-5 gap-2">
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

      <ToolbarButton onClick={onAddDoodle} icon="✏" label="doodle" />

      <div className="relative" ref={clipWrapRef}>
        <ToolbarButton
          onClick={() => setClipOpen((o) => !o)}
          icon="✂"
          label="clip"
          active={clipOpen}
        />
        {clipOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 p-2 rounded-2xl flex flex-col gap-1"
            style={{
              top: '100%',
              background: '#fefaf0',
              border: '1px solid rgba(58, 52, 41, 0.18)',
              boxShadow: '0 8px 24px rgba(20, 14, 4, 0.22)',
              zIndex: 50,
              width: 160,
            }}
          >
            {(['index-card', 'ticket-stub', 'receipt'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { onAddClip(v); setClipOpen(false) }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(58, 52, 41, 0.18)',
                  background: '#fefdf8',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 16,
                  color: '#3a3429',
                  textAlign: 'left',
                }}
              >
                {v.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarButton onClick={onAddMood} icon="❤" label="mood" />
      <ToolbarButton onClick={onAddStamp} icon="◉" label="stamp" />

      <div style={{ width: 1, height: 22, background: 'rgba(58, 52, 41, 0.18)', margin: '0 4px' }} />

      <ToolbarButton
        onClick={() => {
          if (window.confirm('Reset this scrapbook? All items will be removed.')) {
            onReset()
          }
        }}
        icon="↺"
        label="reset"
      />
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
