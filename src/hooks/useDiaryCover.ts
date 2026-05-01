// src/hooks/useDiaryCover.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useMotionValue, useTransform, type MotionValue } from 'framer-motion'

const STORAGE_KEY = 'hearth-diary-cover-opened'

export type CoverState = 'closed' | 'open'

export interface UseDiaryCoverResult {
  coverState: CoverState
  progress: MotionValue<number>
  /** Negative offset that shifts the wrapper left so the closed cover
   *  lands at screen center. Eases to 0 as the spread opens up. */
  wrapperX: MotionValue<number>
  /** 0 → 1, drives the spread fade-in behind the lifting cover. */
  spreadOpacity: MotionValue<number>
  /** 1 until progress > 0.95, then linear to 0 at 1.0. */
  coverOpacity: MotionValue<number>
  /** 0° → -180° as progress goes 0 → 1. */
  coverRotateY: MotionValue<number>
  /** Drop-shadow blur radius in px; grows as the cover lifts. */
  coverShadowBlur: MotionValue<number>
  closeCover: () => void
  /** Internal: forces coverState to 'open' once the snap completes. */
  markOpen: () => void
}

export function useDiaryCover(): UseDiaryCoverResult {
  // Always start 'closed' on first render so SSR + initial client render match.
  // The real value is hydrated from sessionStorage in the effect below.
  const [coverState, setCoverState] = useState<CoverState>('closed')
  const progress = useMotionValue(0)

  const wrapperX = useTransform(progress, [0, 1], [-325, 0])
  const spreadOpacity = useTransform(progress, [0.1, 0.7], [0, 1], { clamp: true })
  const coverOpacity = useTransform(progress, [0.95, 1], [1, 0], { clamp: true })
  const coverRotateY = useTransform(progress, [0, 1], [0, -180])
  const coverShadowBlur = useTransform(progress, [0, 1], [16, 64])

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

  return {
    coverState,
    progress,
    wrapperX,
    spreadOpacity,
    coverOpacity,
    coverRotateY,
    coverShadowBlur,
    closeCover,
    markOpen,
  }
}
