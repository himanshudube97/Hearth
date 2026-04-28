// src/components/scrapbook/ScrapbookGrid.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScrapbookTile, { ScrapbookSummary } from './ScrapbookTile'

export default function ScrapbookGrid() {
  const router = useRouter()
  const [boards, setBoards] = useState<ScrapbookSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/scrapbooks')
      .then((r) => r.json())
      .then((list: ScrapbookSummary[]) => setBoards(list))
      .catch((err) => setError(String(err)))
  }, [])

  async function createBoard() {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/scrapbooks', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const created = await res.json()
      router.push(`/scrapbook/${created.id}`)
    } catch (err) {
      setError(String(err))
      setCreating(false)
    }
  }

  async function deleteBoard(id: string) {
    const res = await fetch(`/api/scrapbooks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(`Failed to delete (HTTP ${res.status})`)
      return
    }
    setBoards((prev) => (prev ? prev.filter((b) => b.id !== id) : prev))
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 32px 64px',
        fontFamily: 'var(--font-caveat), cursive',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontStyle: 'italic',
            fontSize: 32,
            color: '#3a3429',
          }}
        >
          your scrapbooks
        </div>
        <button
          onClick={createBoard}
          disabled={creating}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(58, 52, 41, 0.22)',
            background: '#3a3429',
            color: '#f4ecd8',
            cursor: creating ? 'wait' : 'pointer',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 18,
          }}
        >
          + new scrapbook
        </button>
      </div>

      {error && (
        <div style={{ color: '#a3413a', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      {boards === null && (
        <div style={{ color: 'rgba(58,52,41,0.55)' }}>loading…</div>
      )}

      {boards !== null && boards.length === 0 && (
        <div
          style={{
            padding: 40,
            color: 'rgba(58,52,41,0.55)',
            textAlign: 'center',
            fontSize: 18,
          }}
        >
          no scrapbooks yet — start one with the button above.
        </div>
      )}

      {boards !== null && boards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 24,
          }}
        >
          {boards.map((b) => (
            <ScrapbookTile
              key={b.id}
              summary={b}
              onOpen={() => router.push(`/scrapbook/${b.id}`)}
              onDelete={() => deleteBoard(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
