'use client'

import React, { useEffect, useRef, useState } from 'react'
import { SongItemData, deriveSongMeta, getSongEmbedUrl } from '@/lib/scrapbook'

interface Props {
  item: SongItemData
  isEditing: boolean
  onChange: (next: SongItemData) => void
}

const providerLabel: Record<SongItemData['provider'], string> = {
  spotify: 'spotify',
  youtube: 'youtube',
  apple: 'apple music',
  soundcloud: 'soundcloud',
  unknown: 'song',
}

const providerAccent: Record<SongItemData['provider'], string> = {
  spotify: '#1db954',
  youtube: '#cc1b1b',
  apple: '#fa57c1',
  soundcloud: '#ff7700',
  unknown: '#8b6f47',
}

export default function SongItem({ item, isEditing, onChange }: Props) {
  const titleRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [editingUrl, setEditingUrl] = useState(false)
  const [draftUrl, setDraftUrl] = useState(item.url)

  useEffect(() => {
    if (titleRef.current && titleRef.current.innerText !== item.title) {
      titleRef.current.innerText = item.title
    }
  }, [item.title])

  useEffect(() => {
    if (isEditing && titleRef.current && !editingUrl) {
      const el = titleRef.current
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing, editingUrl])

  // Tapping into edit mode for the title shouldn't auto-open URL editor.
  // Reset draft when item URL changes externally.
  useEffect(() => {
    setDraftUrl(item.url)
  }, [item.url])

  const embed = getSongEmbedUrl(item)
  const accent = providerAccent[item.provider]

  function commitUrl() {
    const url = draftUrl.trim()
    if (url && url !== item.url) {
      const meta = deriveSongMeta(url)
      onChange({ ...item, url, title: meta.title, provider: meta.provider })
      setIsPlaying(false) // reset player when URL changes
    }
    setEditingUrl(false)
  }

  function cancelUrlEdit() {
    setDraftUrl(item.url)
    setEditingUrl(false)
  }

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
      }}
    >
      {/* Compact card row */}
      <div className="w-full h-full flex items-center gap-2 px-2.5">
        {/* Play / pause button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (!embed) return
            setIsPlaying((p) => !p)
          }}
          disabled={!embed}
          className="flex items-center justify-center rounded-full flex-shrink-0 transition-transform"
          style={{
            width: 36,
            height: 36,
            background: accent,
            color: '#fff',
            fontSize: 16,
            border: 'none',
            cursor: embed ? 'pointer' : 'not-allowed',
            opacity: embed ? 1 : 0.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            if (embed) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.transform = ''
          }}
          title={embed ? (isPlaying ? 'pause' : 'play') : 'no embed available'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        {/* Title + provider OR URL editor */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {editingUrl ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitUrl()
                  if (e.key === 'Escape') cancelUrlEdit()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                placeholder="paste a song URL…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '4px 8px',
                  border: `1px solid ${accent}`,
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#3a3429',
                  background: '#fff',
                  outline: 'none',
                }}
              />
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  commitUrl()
                }}
                style={{
                  flexShrink: 0,
                  padding: '4px 8px',
                  background: accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-caveat), cursive',
                }}
                title="save"
              >
                ✓
              </button>
            </div>
          ) : (
            <>
              <div
                ref={titleRef}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onInput={(e) =>
                  onChange({ ...item, title: (e.currentTarget as HTMLDivElement).innerText })
                }
                onPointerDown={(e) => {
                  if (isEditing) e.stopPropagation()
                }}
                spellCheck={false}
                className="outline-none truncate"
                style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 19,
                  color: '#3a3429',
                  lineHeight: 1.1,
                  cursor: isEditing ? 'text' : 'inherit',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 13,
                  color: accent,
                  opacity: 0.85,
                  lineHeight: 1.2,
                  marginTop: 1,
                }}
              >
                {providerLabel[item.provider]}
              </div>
            </>
          )}
        </div>

        {/* Edit URL pencil */}
        {!editingUrl && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setEditingUrl(true)
              setIsPlaying(false)
            }}
            className="flex items-center justify-center rounded-md flex-shrink-0 transition-colors"
            style={{
              width: 26,
              height: 26,
              background: 'transparent',
              color: 'rgba(58, 52, 41, 0.55)',
              border: '1px solid rgba(58, 52, 41, 0.15)',
              fontSize: 13,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(58, 52, 41, 0.06)'
              ;(e.currentTarget as HTMLElement).style.color = '#3a3429'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(58, 52, 41, 0.55)'
            }}
            title="change link"
          >
            ✎
          </button>
        )}
      </div>

      {/* Embed iframe — appears below the card when playing.
          Anchored to bottom so it overflows downward; the wrapper
          rotation carries it visually. */}
      {isPlaying && embed && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute"
          style={{
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            height: embed.height,
            background: '#fefaf0',
            border: '1px solid rgba(58, 52, 41, 0.18)',
            borderTop: `3px solid ${accent}`,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 8px 22px rgba(20, 14, 4, 0.32)',
          }}
        >
          <iframe
            src={embed.src}
            width="100%"
            height="100%"
            allow="autoplay; encrypted-media; fullscreen"
            style={{ border: 'none', display: 'block' }}
            title={item.title}
          />
        </div>
      )}
    </div>
  )
}
