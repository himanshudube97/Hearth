'use client'

import { useEffect, useState } from 'react'
import { gapDaysLocal, shouldShowComeback, tierFor } from '@/lib/comeback'
import type { ComebackTier } from '@/lib/comeback-messages'

interface ComebackDecision {
  tier: ComebackTier | null
  gapDays: number
  markShown(): Promise<void>
}

export function useComeback(): ComebackDecision | null {
  const [decision, setDecision] = useState<ComebackDecision | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const flagsRes = await fetch('/api/me/profile-flags')
        if (!flagsRes.ok) return
        const flags = await flagsRes.json()
        const lastComebackShownAt = flags?.profile?.lastComebackShownAt
          ? new Date(flags.profile.lastComebackShownAt) : null

        const lastEntryRes = await fetch('/api/me/last-entry')
        if (!lastEntryRes.ok) return
        const lastEntry = await lastEntryRes.json()
        const lastEntryAt = lastEntry?.createdAt ? new Date(lastEntry.createdAt) : null

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        const now = new Date()

        if (!shouldShowComeback({ now, lastComebackShownAt, tz })) return

        const gap = gapDaysLocal({ now, lastEntryAt, tz })
        const tier = tierFor(gap)
        if (!tier) return  // 0 days, nothing to show

        if (cancelled) return
        setDecision({
          tier,
          gapDays: gap === Infinity ? 0 : gap,
          markShown: async () => {
            await fetch('/api/me/profile-flags', {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ lastComebackShownAt: new Date().toISOString() }),
            }).catch(() => {})
          },
        })
      } catch {
        // swallow — comeback is non-critical
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return decision
}
