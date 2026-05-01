'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface SealedLetterTileProps {
  recipientName: string             // e.g. "future me", "Mom"
  sealedAt: Date
  unlockDate: Date | null           // null = "someday" with no date picked (rare)
}

export default function SealedLetterTile({ recipientName, sealedAt, unlockDate }: SealedLetterTileProps) {
  const opensLabel = unlockDate ? `opens ${format(unlockDate, 'MMM d, yyyy')}` : 'opens someday'
  const sealedLabel = `sealed ${format(sealedAt, 'MMM d, yyyy')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="
        relative aspect-[5/3] w-full rounded-md
        bg-[var(--color-paper,#f4ead0)]
        shadow-[0_2px_8px_rgba(70,50,30,0.15)]
        border border-[rgba(80,60,40,0.18)]
        cursor-default select-none
      "
      title={`${sealedLabel} · ${opensLabel}`}
    >
      {/* fold line — purely decorative */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(80,60,40,0.12)]" />

      {/* wax seal dot */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--color-accent,#c8742c)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 font-[var(--font-caveat),Caveat,cursive]">
        <div className="text-xs uppercase tracking-wider opacity-60">a sealed letter</div>
        <div className="text-2xl leading-tight">to {recipientName}</div>
        <div className="text-xs opacity-70 flex justify-between">
          <span>{sealedLabel}</span>
          <span>{opensLabel}</span>
        </div>
      </div>
    </motion.div>
  )
}
