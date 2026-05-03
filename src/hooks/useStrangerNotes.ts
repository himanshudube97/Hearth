'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ReceivedNote {
  id: string
  content: string
  matchedAt: string | null
  expiresAt: string | null
  readAt: string | null
  myReply: string | null
}

export interface ReceivedReply {
  id: string
  content: string
  createdAt: string
  expiresAt: string
  readAt: string | null
}

export interface InboxPayload {
  receivedNotes: ReceivedNote[]
  receivedReplies: ReceivedReply[]
  canSendToday: boolean
  counters: { sent: number; received: number }
}

const TZ_HEADER = 'X-User-TZ'

function userTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set(TZ_HEADER, userTz())
  const res = await fetch(input, { ...init, headers, credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return data as T
}

export function useStrangerNotes() {
  const [data, setData] = useState<InboxPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const inbox = await jsonFetch<InboxPayload>('/api/stranger-notes/inbox')
      setData(inbox)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const send = useCallback(
    async (content: string) => {
      await jsonFetch('/api/stranger-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      await refresh()
    },
    [refresh]
  )

  const reply = useCallback(
    async (noteId: string, content: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      await refresh()
    },
    [refresh]
  )

  const burnNote = useCallback(
    async (noteId: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/burn`, {
        method: 'POST',
      })
      await refresh()
    },
    [refresh]
  )

  const burnReply = useCallback(
    async (replyId: string) => {
      await jsonFetch(`/api/stranger-notes/replies/${encodeURIComponent(replyId)}/burn`, {
        method: 'POST',
      })
      await refresh()
    },
    [refresh]
  )

  const markRead = useCallback(
    async (noteId: string) => {
      await jsonFetch(`/api/stranger-notes/${encodeURIComponent(noteId)}/read`, {
        method: 'POST',
      }).catch(() => {})
    },
    []
  )

  return { data, loading, error, refresh, send, reply, burnNote, burnReply, markRead }
}
