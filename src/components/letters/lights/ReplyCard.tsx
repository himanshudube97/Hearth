'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { ReceivedReply } from '@/hooks/useStrangerNotes'

interface Props {
  reply: ReceivedReply
  onClose: () => void
  onBurn: () => Promise<void>
}

export default function ReplyCard({ reply, onClose, onBurn }: Props) {
  const { theme } = useThemeStore()
  const [confirmingBurn, setConfirmingBurn] = useState(false)
  const [busy, setBusy] = useState(false)

  const expiresIn = humanizeFromNow(new Date(reply.expiresAt))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-sm p-5 rounded-2xl flex flex-col gap-3"
      style={{
        background: theme.glass.bg,
        border: `1px solid ${theme.glass.border}`,
        backdropFilter: `blur(${theme.glass.blur})`,
        fontFamily: 'var(--font-playfair, serif)',
      }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: theme.text.muted }}>
        a warmth back
      </p>
      <p className="text-base leading-relaxed" style={{ color: theme.text.primary }}>
        {reply.content}
      </p>
      {expiresIn && (
        <p className="text-xs italic" style={{ color: theme.text.muted }}>
          fades in {expiresIn}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 mt-1">
        {!confirmingBurn ? (
          <button
            type="button"
            onClick={() => setConfirmingBurn(true)}
            disabled={busy}
            className="px-3 py-2 rounded-full text-sm transition-opacity disabled:opacity-50"
            style={{ color: theme.text.muted }}
          >
            Burn
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.text.secondary }}>
            Let it go?
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try { await onBurn() } finally { setBusy(false) }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: '#c44', color: 'white' }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmingBurn(false)}
              className="px-3 py-1 rounded-full text-xs"
              style={{ color: theme.text.muted }}
            >
              No
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-full text-sm"
          style={{ color: theme.text.muted }}
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}

function humanizeFromNow(target: Date): string | null {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return null
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'}`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr} hour${diffHr === 1 ? '' : 's'}`
}
