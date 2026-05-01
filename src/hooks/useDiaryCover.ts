'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'hearth-diary-cover-opened'

export type CoverState = 'closed' | 'open'

export interface UseDiaryCoverResult {
  coverState: CoverState
  /** Mark the cover as open and persist for the rest of the session.
   *  Caller is responsible for any visual transition. */
  markOpen: () => void
  /** Mark the cover as closed and clear the session flag. */
  closeCover: () => void
}

export function useDiaryCover(): UseDiaryCoverResult {
  // Always start 'closed' on first render so SSR + initial client render match.
  // Real value is hydrated from sessionStorage in the effect below.
  const [coverState, setCoverState] = useState<CoverState>('closed')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setCoverState('open')
    }
  }, [])

  const markOpen = useCallback(() => {
    setCoverState('open')
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  const closeCover = useCallback(() => {
    setCoverState('closed')
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { coverState, markOpen, closeCover }
}
