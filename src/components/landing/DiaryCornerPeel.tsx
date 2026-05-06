// src/components/landing/DiaryCornerPeel.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

type Props = {
  corner: Corner
  onCommit: () => void
  enabled: boolean
}

const HOT_RADIUS = 120
const MAX_PEEL_DEG = 42

export default function DiaryCornerPeel({ corner, onCommit, enabled }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current?.parentElement
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const anchorX = corner === 'tl' || corner === 'bl' ? rect.left : rect.right
      const anchorY = corner === 'tl' || corner === 'tr' ? rect.top : rect.bottom
      const dx = e.clientX - anchorX
      const dy = e.clientY - anchorY
      const dist = Math.hypot(dx, dy)
      setProgress(Math.max(0, Math.min(1, 1 - dist / HOT_RADIUS)))
    }
    const onLeave = () => setProgress(0)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [corner, enabled])

  if (!enabled) return null

  const positionClasses: Record<Corner, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }
  const rotateAxes: Record<Corner, [number, number, number]> = {
    tl: [1, -1, 0],
    tr: [1, 1, 0],
    bl: [-1, -1, 0],
    br: [-1, 1, 0],
  }
  const origins: Record<Corner, string> = {
    tl: '0% 0%',
    tr: '100% 0%',
    bl: '0% 100%',
    br: '100% 100%',
  }

  const peel = progress * MAX_PEEL_DEG
  const [rx, ry, rz] = rotateAxes[corner]

  return (
    <div
      ref={ref}
      onClick={() => progress > 0.5 && onCommit()}
      className={`absolute ${positionClasses[corner]} pointer-events-auto`}
      style={{ width: HOT_RADIUS, height: HOT_RADIUS, zIndex: 5 }}
    >
      <div
        className="absolute inset-0"
        style={{
          transformOrigin: origins[corner],
          transform: `rotate3d(${rx}, ${ry}, ${rz}, ${peel}deg)`,
          background:
            'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.4) 60%, rgba(0,0,0,0.18) 100%)',
          boxShadow: progress > 0.1 ? '-2px -2px 12px rgba(0,0,0,0.16)' : 'none',
          transition: 'box-shadow 200ms',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  )
}
