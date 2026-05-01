'use client'

import Stamp from './Stamp'
import type { SentStamp } from '../letterTypes'

interface Props {
  stamps: SentStamp[]
  onStampClick: (s: SentStamp) => void
}

export default function StampGrid({ stamps, onStampClick }: Props) {
  return (
    <div className="stamp-grid">
      {stamps.map(s => <Stamp key={s.id} stamp={s} onClick={onStampClick} />)}
      <style jsx>{`
        .stamp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
          gap: 22px 14px;
          padding: 14px 0 6px;
        }
      `}</style>
    </div>
  )
}
