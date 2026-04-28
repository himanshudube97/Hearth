// src/components/scrapbook/ScrapbookTile.tsx
'use client'

import React from 'react'

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

export default function ScrapbookTile({ summary, onOpen, onDelete }: Props) {
  const dateLabel = new Date(summary.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
            width: '100%',
            height: '100%',
            backgroundImage: [
              'radial-gradient(circle at 18% 22%, rgba(255, 240, 200, 0.45) 0%, transparent 55%)',
              'radial-gradient(circle at 82% 78%, rgba(120, 80, 30, 0.10) 0%, transparent 55%)',
            ].join(', '),
            display: 'flex',
            alignItems: 'flex-end',
            padding: 16,
            color: 'rgba(58, 52, 41, 0.7)',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
          }}
        >
          {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
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
