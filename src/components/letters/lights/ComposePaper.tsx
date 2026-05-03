'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { MAX_NOTE_CHARS, MIN_NOTE_CHARS } from '@/lib/stranger-notes'

interface Props {
  canSend: boolean
  onCancel: () => void
  onSend: (content: string) => Promise<void>
}

export default function ComposePaper({ canSend, onCancel, onSend }: Props) {
  const { theme } = useThemeStore()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const trimmed = text.trim()
  const okLength = trimmed.length >= MIN_NOTE_CHARS && trimmed.length <= MAX_NOTE_CHARS
  const canSubmit = canSend && okLength && !busy

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-md p-6 rounded-2xl flex flex-col gap-4"
      style={{
        background: theme.glass.bg,
        border: `1px solid ${theme.glass.border}`,
        backdropFilter: `blur(${theme.glass.blur})`,
        fontFamily: 'var(--font-playfair, serif)',
      }}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_NOTE_CHARS + 50))}
        placeholder="a gratitude, a wish, a kindness — anything gentle you'd send to a stranger."
        rows={6}
        className="w-full bg-transparent outline-none resize-none text-base leading-relaxed"
        style={{ color: theme.text.primary }}
      />

      <div className="flex items-center justify-between text-xs" style={{ color: theme.text.muted }}>
        <span>
          {trimmed.length}/{MAX_NOTE_CHARS}
          {trimmed.length < MIN_NOTE_CHARS && trimmed.length > 0 && (
            <span className="ml-2 opacity-70">a little longer…</span>
          )}
        </span>
        <span>one per day</span>
      </div>

      {err && <p className="text-sm" style={{ color: '#c44' }}>{err}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 rounded-full text-sm transition-opacity disabled:opacity-50"
          style={{ color: theme.text.muted }}
        >
          Close
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            setBusy(true)
            setErr(null)
            try {
              await onSend(trimmed)
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Failed to send.')
            } finally {
              setBusy(false)
            }
          }}
          className="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          style={{ background: theme.accent.primary, color: theme.bg.primary }}
        >
          {busy ? 'Sending…' : 'Send into the world'}
        </button>
      </div>
    </motion.div>
  )
}
