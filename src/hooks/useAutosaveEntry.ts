'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { StrokeData } from '@/store/journal'
import { getClientTz } from '@/lib/entry-lock-client'

const DEBOUNCE_MS = 1500
const RETRY_DELAY_MS = 2000

export interface AutosaveDraft {
  text: string
  mood: number
  song: string | null
  photos: { url: string; position: number; rotation: number; spread: number }[]
  doodles: { strokes: StrokeData[]; spread: number }[]
  // Letter-only fields. Absent for normal journal entries; present (possibly
  // null) for letter drafts so the server can persist recipient/scheduling.
  entryType?: string
  recipientEmail?: string | null
  recipientName?: string | null
  senderName?: string | null
  letterLocation?: string | null
  unlockDate?: string | null
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutosaveResult {
  entryId: string | null
  status: AutosaveStatus
  flush: () => Promise<void>
  reset: (nextEntryId?: string | null) => void
  trigger: (draft: AutosaveDraft) => void
}

function isDraftEmpty(d: AutosaveDraft): boolean {
  if (d.text && d.text.trim().length > 0) return false
  if (d.song && d.song.trim().length > 0) return false
  if (d.photos.length > 0) return false
  if (d.doodles.some(x => x.strokes.length > 0)) return false
  return true
}

export function useAutosaveEntry(initialEntryId: string | null = null): UseAutosaveResult {
  const [entryId, setEntryId] = useState<string | null>(initialEntryId)
  const [status, setStatus] = useState<AutosaveStatus>('idle')

  // All save bookkeeping lives in refs so the save closure is stable across
  // renders and always sees the latest draft / entry id.
  const entryIdRef = useRef<string | null>(initialEntryId)
  const draftRef = useRef<AutosaveDraft | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const dirtyRef = useRef(false)

  const performSaveRef = useRef<(retryCount?: number) => Promise<void>>(async () => {})

  performSaveRef.current = async (retryCount = 0) => {
    const draft = draftRef.current
    if (!draft) return
    if (isDraftEmpty(draft) && !entryIdRef.current) {
      // Nothing to save and no entry yet — stay idle.
      return
    }
    if (inFlightRef.current) {
      dirtyRef.current = true
      return
    }

    inFlightRef.current = true
    dirtyRef.current = false
    setStatus('saving')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-TZ': getClientTz(),
    }
    const body = JSON.stringify({
      text: draft.text,
      mood: draft.mood,
      song: draft.song,
      photos: draft.photos.map(p => ({
        url: p.url,
        position: p.position,
        rotation: p.rotation,
        spread: p.spread ?? 1,
      })),
      doodles: draft.doodles,
      // Letter fields — only included when present, so journal saves stay
      // identical on the wire.
      ...(draft.entryType !== undefined ? { entryType: draft.entryType } : {}),
      ...(draft.recipientEmail !== undefined ? { recipientEmail: draft.recipientEmail } : {}),
      ...(draft.recipientName !== undefined ? { recipientName: draft.recipientName } : {}),
      ...(draft.senderName !== undefined ? { senderName: draft.senderName } : {}),
      ...(draft.letterLocation !== undefined ? { letterLocation: draft.letterLocation } : {}),
      ...(draft.unlockDate !== undefined ? { unlockDate: draft.unlockDate } : {}),
    })

    try {
      const id = entryIdRef.current
      const res = id
        ? await fetch(`/api/entries/${id}`, { method: 'PUT', headers, body })
        : await fetch('/api/entries', { method: 'POST', headers, body })

      if (res.ok) {
        if (!id) {
          const data = await res.json()
          if (data?.id) {
            entryIdRef.current = data.id
            setEntryId(data.id)
          }
        }
        inFlightRef.current = false
        if (dirtyRef.current) {
          // Another change came in while we were saving — kick off another round.
          performSaveRef.current?.(0)
        } else {
          setStatus('saved')
        }
        return
      }

      // Lock-violation: don't retry, surface error.
      if (res.status === 403) {
        inFlightRef.current = false
        setStatus('error')
        return
      }

      throw new Error(`HTTP ${res.status}`)
    } catch {
      inFlightRef.current = false
      if (retryCount < 1) {
        setTimeout(() => performSaveRef.current?.(1), RETRY_DELAY_MS)
      } else {
        setStatus('error')
      }
    }
  }

  const trigger = useCallback((draft: AutosaveDraft) => {
    draftRef.current = draft
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      performSaveRef.current?.(0)
    }, DEBOUNCE_MS)
  }, [])

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSaveRef.current?.(0)
  }, [])

  const reset = useCallback((nextEntryId: string | null = null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    draftRef.current = null
    entryIdRef.current = nextEntryId
    inFlightRef.current = false
    dirtyRef.current = false
    setEntryId(nextEntryId)
    setStatus('idle')
  }, [])

  // Cancel pending save on unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { entryId, status, flush, reset, trigger }
}
