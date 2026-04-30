'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useDeskStore } from '@/store/desk'

interface SaveShimmerProps {
  enabled: boolean
}

export default function SaveShimmer({ enabled }: SaveShimmerProps) {
  const status = useDeskStore((s) => s.autosaveStatus)
  const [pulseId, setPulseId] = useState(0)
  const prevStatus = useRef(status)

  useEffect(() => {
    if (enabled && prevStatus.current === 'saving' && status === 'saved') {
      setPulseId((n) => n + 1)
    }
    prevStatus.current = status
  }, [status, enabled])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pulseId > 0 && <span key={pulseId} className="hearth-shimmer" />}
    </div>
  )
}
