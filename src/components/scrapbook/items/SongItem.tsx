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

// Providers whose embed can play with the iframe hidden off-screen.
// Spotify and Apple Music require a visible widget — user has to click
// play inside their iframe per their TOS.
const HIDDEN_AUDIO_PROVIDERS: SongItemData['provider'][] = ['youtube', 'soundcloud']

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

  useEffect(() => {
    setDraftUrl(item.url)
  }, [item.url])

  const embed = getSongEmbedUrl(item)
  const accent = providerAccent[item.provider]
  const hiddenAudio = HIDDEN_AUDIO_PROVIDERS.includes(item.provider)

  function commitUrl() {
    const url = draftUrl.trim()
    if (url && url !== item.url) {
      const meta = deriveSongMeta(url)
      onChange({ ...item, url, title: meta.title, provider: meta.provider })
      setIsPlaying(false)
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
        background: 'linear-gradient(135deg, #fefaf0 0%, #f4ecd8 100%)',
        border: '1px solid rgba(58, 52, 41, 0.2)',
        borderRadius: 12,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
      }}
    >
      <div className="w-full h-full flex items-center gap-3 px-3">
        {/* Vinyl disc with overlay play button */}
        <div
          className="relative flex-shrink-0"
          style={{ width: 56, height: 56 }}
        >
          {/* Spinning disc — only the disc itself rotates so the play
              button stays a stable click target. */}
          <div
            className={isPlaying ? 'sb-vinyl-spin' : ''}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(circle at center,
                transparent 18%,
                rgba(255,255,255,0.03) 19%,
                transparent 22%,
                rgba(255,255,255,0.03) 30%,
                transparent 33%,
                rgba(255,255,255,0.03) 42%,
                transparent 45%
              ), #1a1614`,
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 0 6px rgba(0,0,0,0.4)',
            }}
          >
            {/* Center label */}
            <div
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: accent,
                transform: 'translate(-50%, -50%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            />
            {/* Spindle hole */}
            <div
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#0a0a0a',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          {/* Play overlay — sits on top of the disc, doesn't spin */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (!embed) return
              setIsPlaying((p) => !p)
            }}
            disabled={!embed}
            className="absolute flex items-center justify-center transition-transform"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(254, 250, 240, 0.96)',
              color: '#1a1614',
              border: 'none',
              cursor: embed ? 'pointer' : 'not-allowed',
              opacity: embed ? 1 : 0.5,
              fontSize: 11,
              boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (embed)
                (e.currentTarget as HTMLElement).style.transform =
                  'translate(-50%, -50%) scale(1.12)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform =
                'translate(-50%, -50%)'
            }}
            title={embed ? (isPlaying ? 'pause' : 'play') : 'no embed available'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
        </div>

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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{providerLabel[item.provider]}</span>
                {isPlaying && hiddenAudio && (
                  <span style={{ fontSize: 11, opacity: 0.7 }}>· playing</span>
                )}
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

      {/* Hidden audio iframe — YouTube and SoundCloud autoplay reliably
          while invisible because we mount it on a real user gesture. */}
      {isPlaying && embed && hiddenAudio && (
        <iframe
          src={embed.src}
          allow="autoplay; encrypted-media"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            left: -9999,
            top: 0,
            border: 'none',
            opacity: 0,
            pointerEvents: 'none',
          }}
          title="audio playback"
        />
      )}

      {/* Visible compact embed for Spotify / Apple Music — their players
          require a visible widget to start audio. We make it as small as
          possible so the CD card stays the hero. */}
      {isPlaying && embed && !hiddenAudio && (
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
