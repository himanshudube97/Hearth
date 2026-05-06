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

  const flipNext = useCallback(() => {
    if (isFlipping) return
    if (currentSpread >= TOTAL - 1) return
    flipDirectionRef.current = 'forward'
    setIsFlipping(true)
    setCurrentSpread((s) => s + 1)
  }, [isFlipping, currentSpread])

  const flipPrev = useCallback(() => {
    if (isFlipping) return
    if (currentSpread <= 0) return
    flipDirectionRef.current = 'backward'
    setIsFlipping(true)
    setCurrentSpread((s) => s - 1)
  }, [isFlipping, currentSpread])

  const jumpTo = useCallback((index: number) => {
    if (isFlipping) return
    if (index === currentSpread || index < 0 || index >= TOTAL) return
    flipDirectionRef.current = index > currentSpread ? 'forward' : 'backward'
    setIsFlipping(true)
    setCurrentSpread(index)
  }, [isFlipping, currentSpread])

  const onFlipComplete = useCallback(() => {
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
  }, [containerRef, flipNext, flipPrev])

  return {
    currentSpread,
    total: TOTAL,
    isFlipping,
    flipDirection: flipDirectionRef.current,
    flipNext,
    flipPrev,
    jumpTo,
    onFlipComplete,
    canGoForward: currentSpread < TOTAL - 1,
    canGoBack: currentSpread > 0,
  }
}
