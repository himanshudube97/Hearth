// src/components/scrapbook/ScrapbookTile.tsx
'use client'

import React from 'react'
import { stickers, StickerId } from './stickers'

export interface ScrapbookSummary {
  id: string
  title: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface Props {
  summary: ScrapbookSummary
  onOpen: () => void
  onDelete: () => void
}

// Hand-curated cover decorations — each combines a sticker with a short
// handwritten line. Picked deterministically per scrapbook id so the
// same card always shows the same cover.
const COVER_DECORATIONS: { sticker: StickerId; quote: string; tilt: number }[] = [
  { sticker: 'leaf',      quote: 'the days collect like leaves in a pocket', tilt: -6 },
  { sticker: 'star',      quote: 'small things, kept on purpose',            tilt: -8 },
  { sticker: 'heart',     quote: 'memory is a quiet kind of love',           tilt: 4 },
  { sticker: 'flower',    quote: 'everything ordinary, made beautiful',      tilt: -5 },
  { sticker: 'sparkle',   quote: 'for the things you don’t want to forget', tilt: 7 },
  { sticker: 'moon',      quote: 'love letters to the days',                 tilt: -4 },
  { sticker: 'butterfly', quote: 'a place for the small, kept things',       tilt: 6 },
  { sticker: 'sun',       quote: 'what stays, when nothing else does',       tilt: -7 },
  { sticker: 'daisy',     quote: 'pages, before they get away',              tilt: 5 },
]

function pickDecoration(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return COVER_DECORATIONS[Math.abs(h) % COVER_DECORATIONS.length]
}

export default function ScrapbookTile({ summary, onOpen, onDelete }: Props) {
  const dateLabel = new Date(summary.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const decoration = pickDecoration(summary.id)
  const StickerComponent = stickers[decoration.sticker]?.component

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <button
        onClick={onOpen}
        style={{
          aspectRatio: '4 / 5',
          background: '#e8d8b0',
          border: 'none',
          borderRadius: 4,
          boxShadow: '0 8px 22px rgba(20, 14, 4, 0.30), inset 0 0 0 1px rgba(255,255,255,0.35)',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundImage: [
              'radial-gradient(circle at 18% 22%, rgba(255, 240, 200, 0.45) 0%, transparent 55%)',
              'radial-gradient(circle at 82% 78%, rgba(120, 80, 30, 0.10) 0%, transparent 55%)',
            ].join(', '),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 22px 18px',
          }}
        >
          {StickerComponent && (
            <div
              style={{
                width: 36,
                height: 36,
                marginBottom: 14,
                transform: `rotate(${decoration.tilt}deg)`,
                filter: 'drop-shadow(0 1px 2px rgba(60, 40, 10, 0.18))',
                opacity: 0.92,
              }}
            >
              <StickerComponent />
            </div>
          )}

          <div
            style={{
              fontFamily: 'var(--font-caveat), cursive',
              fontSize: 19,
              lineHeight: 1.25,
              color: 'rgba(58, 52, 41, 0.78)',
              textAlign: 'center',
              maxWidth: '85%',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{decoration.quote}&rdquo;
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 16,
              color: 'rgba(58, 52, 41, 0.55)',
              fontFamily: 'var(--font-caveat), cursive',
              fontSize: 14,
            }}
          >
            {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: '#3a3429',
          }}
        >
          {summary.title ?? dateLabel}
        </div>
        <button
          onClick={() => {
            if (window.confirm('Delete this scrapbook? This cannot be undone.')) onDelete()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(58, 52, 41, 0.45)',
            fontSize: 14,
            cursor: 'pointer',
          }}
          title="Delete scrapbook"
        >
          ×
        </button>
      </div>
    </div>
  )
}
