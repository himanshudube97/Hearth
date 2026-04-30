'use client'

import React, { useEffect, useState } from 'react'
import { useDeskStore } from '@/store/desk'

interface SaveShimmerProps {
  enabled: boolean
}

export default function SaveShimmer({ enabled }: SaveShimmerProps) {
  const [pulseId, setPulseId] = useState(0)

  // Subscribe to autosave status transitions via Zustand's external store
  // subscription. Doing this in the subscribe callback (rather than inside
  // the effect body via a selector + status dep) avoids react-hooks/
  // set-state-in-effect — the setState fires on the external event, not on
  // every render of this component.
  useEffect(() => {
    if (!enabled) return
    let prev = useDeskStore.getState().autosaveStatus
    return useDeskStore.subscribe((state) => {
      const next = state.autosaveStatus
      if (prev === 'saving' && next === 'saved') {
        setPulseId((n) => n + 1)
      }
      prev = next
    })
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pulseId > 0 && <span key={pulseId} className="hearth-shimmer" />}
    </div>
  )
}
