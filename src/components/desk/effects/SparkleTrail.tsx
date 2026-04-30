'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getCaretLocalCoords } from '@/lib/textarea-caret'

interface Particle {
  id: number
  x: number
  y: number
  born: number
}

const PARTICLE_TTL = 600
const MAX_PARTICLES = 12
const SCATTER = 4

interface SparkleTrailProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  inkColor: string
  enabled: boolean
}

export default function SparkleTrail({ textareaRef, inkColor, enabled }: SparkleTrailProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const ta = textareaRef.current
    if (!ta) return

    const onInput = () => {
      try {
        const { left, top, height } = getCaretLocalCoords(ta)
        const x = left + (Math.random() - 0.5) * SCATTER * 2
        const y = top + height * 0.6 + (Math.random() - 0.5) * SCATTER
        const id = ++idRef.current
        setParticles((prev) => {
          const next = prev.length >= MAX_PARTICLES ? prev.slice(-MAX_PARTICLES + 1) : prev
          return [...next, { id, x, y, born: performance.now() }]
        })
      } catch {
        // measureAt can throw if the textarea is detaching — ignore.
      }
    }
    ta.addEventListener('input', onInput)
    return () => ta.removeEventListener('input', onInput)
  }, [textareaRef, enabled])

  useEffect(() => {
    if (!enabled) return
    const t = setInterval(() => {
      const cutoff = performance.now() - PARTICLE_TTL
      setParticles((prev) => prev.filter((p) => p.born > cutoff))
    }, 200)
    return () => clearInterval(t)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'hidden' }}
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="hearth-sparkle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            background: inkColor,
            boxShadow: `0 0 6px ${inkColor}`,
          }}
        />
      ))}
    </div>
  )
}
