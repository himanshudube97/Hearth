// src/hooks/useDiaryCover.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

const STORAGE_KEY = 'hearth-diary-cover-opened'

export type CoverState = 'closed' | 'open'

export interface UseDiaryCoverResult {
  coverState: CoverState
  progress: MotionValue<number>
  closeCover: () => void
  /** Internal: forces coverState to 'open' once the snap completes. */
  markOpen: () => void
}

export function useDiaryCover(): UseDiaryCoverResult {
  // Always start 'closed' on first render so SSR + initial client render match.
  // The real value is hydrated from sessionStorage in the effect below.
  const [coverState, setCoverState] = useState<CoverState>('closed')
  const progress = useMotionValue(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const wasOpened = window.sessionStorage.getItem(STORAGE_KEY) === 'true'
    if (wasOpened) {
      progress.set(1)
      setCoverState('open')
    }
  }, [progress])

  const markOpen = useCallback(() => {
    setCoverState('open')
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  const closeCover = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
    progress.set(0)
    setCoverState('closed')
  }, [progress])

  return { coverState, progress, closeCover, markOpen }
}
