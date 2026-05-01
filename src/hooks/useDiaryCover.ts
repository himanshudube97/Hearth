// src/hooks/useDiaryCover.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, useTransform, type MotionValue } from 'framer-motion'

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
  /** Wheel handler. Typed as native WheelEvent because we attach via
   *  addEventListener with { passive: false } in DeskScene — React's
   *  synthetic wheel handler cannot reliably preventDefault. */
  onWheel: (e: WheelEvent) => void
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

  const SENSITIVITY = 1 / 600
  const SNAP_DELAY_MS = 150
  const SNAP_THRESHOLD = 0.5

  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSnappingRef = useRef(false)
  const animationRef = useRef<ReturnType<typeof animate> | null>(null)

  const scheduleSnap = useCallback(() => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
    snapTimerRef.current = setTimeout(() => {
      if (isSnappingRef.current) return
      isSnappingRef.current = true
      const current = progress.get()
      const target = current >= SNAP_THRESHOLD ? 1 : 0
      animationRef.current = animate(progress, target, {
        type: 'spring',
        stiffness: 200,
        damping: 26,
        onComplete: () => {
          isSnappingRef.current = false
          animationRef.current = null
          if (target === 1) {
            markOpen()
          }
        },
      })
    }, SNAP_DELAY_MS)
  }, [progress, markOpen])

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (isSnappingRef.current) return // ignore wheel while snap animation is running
      e.preventDefault()
      const next = Math.max(0, Math.min(1, progress.get() + e.deltaY * SENSITIVITY))
      progress.set(next)
      scheduleSnap()
    },
    [progress, scheduleSnap]
  )

  // Cleanup any pending snap and in-flight animation on unmount.
  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      animationRef.current?.stop()
    }
  }, [])

  return {
    coverState,
    progress,
    wrapperX,
    spreadOpacity,
    coverOpacity,
    coverRotateY,
    coverShadowBlur,
    onWheel,
    closeCover,
    markOpen,
  }
}
