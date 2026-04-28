'use client'

import { useEffect } from 'react'
import { MotionValue, useMotionValue, useSpring } from 'framer-motion'

export interface GardenParallax {
  /** Smoothed cursor x offset from center, ~[-1, 1] */
  x: MotionValue<number>
  /** Smoothed cursor y offset from center, ~[-1, 1] */
  y: MotionValue<number>
}

/**
 * Tracks the cursor over the viewport and exposes spring-smoothed
 * motion values in the [-1, 1] range. Layers downstream multiply
 * by their own depth factor to produce the parallax shift.
 */
export function useGardenParallax(): GardenParallax {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 60, damping: 22, mass: 0.8 })
  const sy = useSpring(y, { stiffness: 60, damping: 22, mass: 0.8 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth) * 2 - 1)
      y.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [x, y])

  return { x: sx, y: sy }
}
