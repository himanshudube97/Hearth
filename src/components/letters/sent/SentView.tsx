'use client'

import { useEffect, useMemo, useState } from 'react'
import YearTabs from './YearTabs'
import StampGrid from './StampGrid'
import ReceiptModal from './ReceiptModal'
import { groupSentByYear } from '../lettersData'
import type { SentStamp } from '../letterTypes'

export default function SentView() {
  const [stamps, setStamps] = useState<SentStamp[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [open, setOpen] = useState<SentStamp | null>(null)

  useEffect(() => {
    fetch('/api/letters/sent')
      .then(r => r.json())
      .then(d => setStamps(d.stamps || []))
      .catch(() => {})
  }, [])

  const grouped = useMemo(() => groupSentByYear(stamps), [stamps])
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)
  const countByYear = Object.fromEntries(years.map(y => [y, grouped[y].length]))
  useEffect(() => { if (year === null && years.length) setYear(years[0]) }, [years, year])

  const totalSealed = stamps.filter(s => !s.isDelivered).length
  const totalDelivered = stamps.filter(s => s.isDelivered).length

  return (
    <section
      className="sent"
      style={{
        height: '100vh',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at 50% 0%, var(--paper-1), transparent 60%), linear-gradient(180deg, var(--bg-1), var(--bg-2))',
        padding: '90px 56px 40px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: 'var(--font-caveat), Caveat, cursive',
            fontSize: 36,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          letters i&rsquo;ve sent
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}
        >
          {totalSealed} sealed · {totalDelivered} delivered · the rest <em>are still on their way</em>
        </p>
      </header>

      {year !== null && (
        <YearTabs years={years} active={year} countByYear={countByYear} onChange={setYear} />
      )}

      <div className="album">
        <StampGrid
          stamps={year !== null ? (grouped[year] || []) : []}
          onStampClick={setOpen}
        />
        <style jsx>{`
          .album {
            flex: 1;
            max-width: 1180px;
            width: 100%;
            margin: 0 auto;
            background:
              repeating-linear-gradient(
                180deg,
                transparent 0 39px,
                color-mix(in oklab, var(--text-primary) 6%, transparent) 39px 40px),
              var(--paper-album);
            border: 1px solid color-mix(in oklab, var(--text-primary) 18%, transparent);
            border-radius: 4px;
            box-shadow:
              0 1px 0 rgba(255,255,255,0.4) inset,
              0 20px 40px rgba(0,0,0,0.10),
              0 4px 12px rgba(0,0,0,0.06);
            padding: 30px 32px 24px;
            position: relative;
            z-index: 1;
            overflow: hidden;
          }
          .album::before {
            content: '— sealed letters —';
            position: absolute;
            top: 10px; left: 50%;
            transform: translateX(-50%);
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: 11px;
            letter-spacing: 4px;
            color: var(--text-muted);
            opacity: 0.55;
            text-transform: lowercase;
          }
        `}</style>
      </div>

      <ReceiptModal stamp={open} onClose={() => setOpen(null)} />
    </section>
  )
}
