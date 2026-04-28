'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ScrapbookCanvas from '@/components/scrapbook/ScrapbookCanvas'
import type { ScrapbookItem } from '@/lib/scrapbook'

interface BoardData {
  id: string
  title: string | null
  items: ScrapbookItem[]
}

export default function ScrapbookBoardPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [board, setBoard] = useState<BoardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/scrapbooks/${params.id}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error('Board not found')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<BoardData>
      })
      .then((data) => { if (!cancelled) setBoard(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [params.id])

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(58,52,41,0.7)' }}>
        <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 22 }}>
          couldn’t open this scrapbook
        </div>
        <div style={{ marginTop: 6, fontSize: 14 }}>{error}</div>
        <button
          onClick={() => router.push('/scrapbook')}
          style={{
            marginTop: 16,
            padding: '6px 14px',
            border: '1px solid rgba(58,52,41,0.22)',
            borderRadius: 999,
            background: '#fefdf8',
            cursor: 'pointer',
          }}
        >
          back to scrapbooks
        </button>
      </div>
    )
  }

  if (!board) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(58,52,41,0.55)' }}>
        opening…
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '8px 24px' }}>
        <button
          onClick={() => router.push('/scrapbook')}
          style={{
            padding: '4px 12px',
            border: '1px solid rgba(58,52,41,0.22)',
            borderRadius: 999,
            background: '#fefdf8',
            cursor: 'pointer',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            color: '#3a3429',
          }}
        >
          ← all scrapbooks
        </button>
      </div>
      <ScrapbookCanvas boardId={board.id} initialItems={board.items} />
    </div>
  )
}
