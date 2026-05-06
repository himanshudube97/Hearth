// src/components/landing/useDiaryNav.ts
'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { SPREADS } from './spreads'

const TOTAL = SPREADS.length

export type FlipDirection = 'forward' | 'backward'

export function useDiaryNav(containerRef: RefObject<HTMLElement | null>) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const flipDirectionRef = useRef<FlipDirection>('forward')

  // Mirror state into refs so guards in flipNext/flipPrev/jumpTo can read
  // synchronously and avoid double-flip races under key-repeat / rapid taps.
  const isFlippingRef = useRef(false)
  const currentSpreadRef = useRef(0)

  // keep refs in sync with state on each render
  useEffect(() => {
    currentSpreadRef.current = currentSpread
  }, [currentSpread])
  useEffect(() => {
    isFlippingRef.current = isFlipping
  }, [isFlipping])

  const flipNext = useCallback(() => {
    if (isFlippingRef.current) return
    if (currentSpreadRef.current >= TOTAL - 1) return
    flipDirectionRef.current = 'forward'
    isFlippingRef.current = true
    setIsFlipping(true)
    setCurrentSpread((s) => s + 1)
  }, [])

  const flipPrev = useCallback(() => {
    if (isFlippingRef.current) return
    if (currentSpreadRef.current <= 0) return
    flipDirectionRef.current = 'backward'
    isFlippingRef.current = true
    setIsFlipping(true)
    setCurrentSpread((s) => s - 1)
  }, [])

  const jumpTo = useCallback((index: number) => {
    if (isFlippingRef.current) return
    const current = currentSpreadRef.current
    if (index === current || index < 0 || index >= TOTAL) return
    flipDirectionRef.current = index > current ? 'forward' : 'backward'
    isFlippingRef.current = true
    setIsFlipping(true)
    setCurrentSpread(index)
  }, [])

  const onFlipComplete = useCallback(() => {
    isFlippingRef.current = false
    setIsFlipping(false)
  }, [])

  // Keyboard navigation, only while the diary is on screen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let visible = false
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0.3 }
    )
    io.observe(el)

    const onKey = (e: KeyboardEvent) => {
      if (!visible) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        flipNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        flipPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [containerRef])

  return {
    currentSpread,
    total: TOTAL,
    isFlipping,
    /**
     * Read-only snapshot of the current flip direction, valid only during render.
     * Do not close over this value in effects or memos — read directly from the
     * hook's return value at use time, or pass through to a Framer Motion variant.
     */
    flipDirection: flipDirectionRef.current,
    flipNext,
    flipPrev,
    jumpTo,
    onFlipComplete,
    canGoForward: currentSpread < TOTAL - 1,
    canGoBack: currentSpread > 0,
  }
}
