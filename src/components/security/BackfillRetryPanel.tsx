'use client'

import { useE2EEStore } from '@/store/e2ee'
import { useBackfill } from '@/hooks/useBackfill'

export function BackfillRetryPanel() {
  const failedIds = useE2EEStore(s => s.backfillProgress.failedIds)
  const status = useE2EEStore(s => s.backfillProgress.status)
  const { retryFailedIds } = useBackfill()

  if (failedIds.length === 0) return null

  const count = failedIds.length
  const noun = count === 1 ? 'item' : 'items'

  return (
    <section
      role="status"
      className="my-6 rounded-xl px-5 py-4 text-sm"
      style={{
        border: '1px solid color-mix(in oklab, #d97706 35%, transparent)',
        background: 'color-mix(in oklab, #d97706 8%, transparent)',
        color: 'var(--text-secondary)',
      }}
    >
      <h3 className="mb-2 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
        {count} {noun} failed to encrypt
      </h3>
      <p className="mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        These entries or scrapbooks were skipped during the encryption migration.
        They&apos;re still readable &mdash; they just stayed on server-side encryption
        instead of moving to E2EE. Retrying will attempt to migrate them again.
      </p>
      <button
        onClick={retryFailedIds}
        disabled={status === 'running'}
        className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{
          background: 'var(--accent-primary, #d97706)',
          color: 'white',
        }}
      >
        {status === 'running' ? 'Retrying…' : `Retry ${count} ${noun}`}
      </button>
    </section>
  )
}
