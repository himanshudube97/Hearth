'use client'

import { useEffect, useRef, useState } from 'react'
import type { ScrapbookItem } from '@/lib/scrapbook'
import { useE2EEStore } from '@/store/e2ee'
import { encryptString } from '@/lib/e2ee/crypto'

const DEBOUNCE_MS = 1500
const RETRY_DELAY_MS = 2000

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Options {
  boardId: string
}

interface UseAutosaveScrapbookResult {
  status: SaveStatus
  trigger: (items: ScrapbookItem[], title?: string | null) => void
  flush: () => Promise<void>
}

export function useAutosaveScrapbook({ boardId }: Options): UseAutosaveScrapbookResult {
  const [status, setStatus] = useState<SaveStatus>('idle')

  const draftRef = useRef<{ items: ScrapbookItem[]; title?: string | null } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const dirtyRef = useRef(false)

  async function performSave(retryCount = 0): Promise<void> {
    const draft = draftRef.current
    if (!draft) return
    if (inFlightRef.current) {
      dirtyRef.current = true
      return
    }
    inFlightRef.current = true
    setStatus('saving')
    try {
      // Build payload — encrypt when E2EE is unlocked
      const state = useE2EEStore.getState()
      const masterKey = state.masterKey
      const isE2EEReady = state.isEnabled && state.isUnlocked && masterKey !== null

      let payload: Record<string, unknown>
      if (isE2EEReady && masterKey) {
        const titleEnc = draft.title ? await encryptString(draft.title, masterKey) : null
        const itemsEnc = await encryptString(JSON.stringify(draft.items), masterKey)
        payload = {
          title: titleEnc?.ciphertext ?? null,
          items: itemsEnc.ciphertext,
          encryptionType: 'e2ee',
          e2eeIVs: {
            ...(titleEnc ? { title: titleEnc.iv } : {}),
            items: itemsEnc.iv,
          },
        }
      } else {
        payload = { ...draft, encryptionType: 'server' }
      }

      const res = await fetch(`/api/scrapbooks/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('saved')
      if (dirtyRef.current) {
        dirtyRef.current = false
        await performSave(0)
      }
    } catch (err) {
      console.error('Scrapbook autosave failed:', err)
      setStatus('error')
      if (retryCount < 2) {
        setTimeout(() => performSave(retryCount + 1), RETRY_DELAY_MS)
      }
    } finally {
      inFlightRef.current = false
    }
  }

  function trigger(items: ScrapbookItem[], title?: string | null) {
    draftRef.current = { items, title }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, DEBOUNCE_MS)
  }

  async function flush() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { status, trigger, flush }
}
