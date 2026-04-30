'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getCaretLocalCoords } from '@/lib/textarea-caret'

const DRY_TIMEOUT = 1200
const PULSE_DECAY = 250

interface WetInkGlowProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  inkColor: string
  enabled: boolean
}

export default function WetInkGlow({ textareaRef, inkColor, enabled }: WetInkGlowProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [pulse, setPulse] = useState(0)
  const [active, setActive] = useState(false)
  const dryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const ta = textareaRef.current
    if (!ta) return

    const tick = () => {
      try {
        const { left, top, height } = getCaretLocalCoords(ta)
        setCoords({ x: left, y: top + height * 0.5 })
      } catch {
        /* detaching — ignore */
      }
    }

    const onInput = () => {
      tick()
      setActive(true)
      setPulse(1)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = setTimeout(() => setPulse(0), PULSE_DECAY)
      if (dryTimerRef.current) clearTimeout(dryTimerRef.current)
      dryTimerRef.current = setTimeout(() => setActive(false), DRY_TIMEOUT)
    }
    const onMove = () => tick()

    ta.addEventListener('input', onInput)
    ta.addEventListener('keyup', onMove)
    ta.addEventListener('click', onMove)
    tick()
    return () => {
      ta.removeEventListener('input', onInput)
      ta.removeEventListener('keyup', onMove)
      ta.removeEventListener('click', onMove)
      if (dryTimerRef.current) clearTimeout(dryTimerRef.current)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [textareaRef, enabled])

  if (!enabled || !coords) return null

  const baseOpacity = 0.35
  const pulseBoost = 0.20
  const opacity = active ? baseOpacity + pulse * pulseBoost : 0

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <span
        style={{
          position: 'absolute',
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: '24px',
          height: '24px',
          marginLeft: '-12px',
          marginTop: '-12px',
          borderRadius: '50%',
          background: inkColor,
          filter: 'blur(4px)',
          opacity,
          transition: 'opacity 200ms ease-out',
        }}
      />
    </div>
  )
}
