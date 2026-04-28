'use client'

import React, { useEffect, useRef, useState } from 'react'
import { stickerIds, stickers } from './stickers'

interface Props {
  onAddText: () => void
  onAddSticker: (stickerId: string) => void
  onAddPhoto: (dataUrl: string) => void
  onAddSong: (url: string) => void
  onAddDoodle: () => void
}

export default function CanvasToolbar({
  onAddText,
  onAddSticker,
  onAddPhoto,
  onAddSong,
  onAddDoodle,
}: Props) {
  const [stickerOpen, setStickerOpen] = useState(false)
  const [songPromptOpen, setSongPromptOpen] = useState(false)
  const [photoPromptOpen, setPhotoPromptOpen] = useState(false)
  const [songUrl, setSongUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const stickerWrapRef = useRef<HTMLDivElement>(null)
  const songWrapRef = useRef<HTMLDivElement>(null)
  const photoWrapRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (stickerWrapRef.current && !stickerWrapRef.current.contains(e.target as Node)) {
        setStickerOpen(false)
      }
      if (songWrapRef.current && !songWrapRef.current.contains(e.target as Node)) {
        setSongPromptOpen(false)
      }
      if (photoWrapRef.current && !photoWrapRef.current.contains(e.target as Node)) {
        setPhotoPromptOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') {
        onAddPhoto(result)
      }
    }
    reader.readAsDataURL(file)
    // reset so same file can be picked again
    e.target.value = ''
  }

  function submitSong() {
    const trimmed = songUrl.trim()
    if (trimmed) {
      onAddSong(trimmed)
      setSongUrl('')
      setSongPromptOpen(false)
    }
  }

  function submitPhotoUrl() {
    const trimmed = photoUrl.trim()
    if (trimmed) {
      onAddPhoto(trimmed)
      setPhotoUrl('')
      setPhotoPromptOpen(false)
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

      <div className="relative" ref={photoWrapRef}>
        <ToolbarButton
          onClick={() => setPhotoPromptOpen((o) => !o)}
          icon="◰"
          label="photo"
          active={photoPromptOpen}
        />
        {photoPromptOpen && (
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
            <button
              onClick={() => {
                fileInputRef.current?.click()
                setPhotoPromptOpen(false)
              }}
              style={{
                padding: '10px 12px',
                background: '#3a3429',
                color: '#f4ecd8',
                border: 'none',
                borderRadius: 10,
                fontFamily: 'var(--font-caveat), cursive',
                fontSize: 17,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              <span>⬆</span> upload from device
            </button>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(58, 52, 41, 0.55)',
                fontFamily: 'var(--font-caveat), cursive',
                textAlign: 'center',
                margin: '2px 0',
              }}
            >
              or
            </div>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitPhotoUrl()
                if (e.key === 'Escape') setPhotoPromptOpen(false)
              }}
              placeholder="paste an image URL…"
              style={{
                padding: '8px 10px',
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
              onClick={submitPhotoUrl}
              disabled={!photoUrl.trim()}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: photoUrl.trim() ? '#3a3429' : 'rgba(58, 52, 41, 0.25)',
                color: '#f4ecd8',
                borderRadius: 8,
                fontSize: 14,
                cursor: photoUrl.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-caveat), cursive',
              }}
            >
              add from URL
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFile}
        style={{ display: 'none' }}
      />

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
