'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { MAX_REPLY_WORDS, countWords } from '@/lib/stranger-notes'
import type { ReceivedNote } from '@/hooks/useStrangerNotes'

interface Props {
  note: ReceivedNote
  onClose: () => void
  onBurn: () => Promise<void>
  onReply: (text: string) => Promise<void>
}

export default function ReadPaper({ note, onClose, onBurn, onReply }: Props) {
  const { theme } = useThemeStore()
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingBurn, setConfirmingBurn] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const words = useMemo(() => countWords(text), [text])
  const overWordLimit = words > MAX_REPLY_WORDS
  const canSubmitReply = !busy && text.trim().length > 0 && !overWordLimit

  const expiresIn = note.expiresAt ? humanizeFromNow(new Date(note.expiresAt)) : null
  const alreadyReplied = note.myReply !== null

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
      <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: theme.text.primary }}>
        {note.content}
      </p>

      {expiresIn && (
        <p className="text-xs italic" style={{ color: theme.text.muted }}>
          fades away in {expiresIn}
        </p>
      )}

      {alreadyReplied && (
        <div className="text-sm rounded-md p-3" style={{ background: `${theme.accent.primary}10`, color: theme.text.secondary }}>
          You replied: <span style={{ color: theme.text.primary }}>{note.myReply}</span>
        </div>
      )}

      {!alreadyReplied && replying && (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="send a warmth back — 20 words"
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{ color: theme.text.primary, borderTop: `1px solid ${theme.glass.border}` }}
          />
          <div className="flex items-center justify-between text-xs" style={{ color: overWordLimit ? '#c44' : theme.text.muted }}>
            <span>{words}/{MAX_REPLY_WORDS} words</span>
            <button
              type="button"
              disabled={!canSubmitReply}
              onClick={async () => {
                setBusy(true)
                setErr(null)
                try {
                  await onReply(text.trim())
                  setReplying(false)
                  setText('')
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'Failed to send.')
                } finally {
                  setBusy(false)
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50"
              style={{ background: theme.accent.primary, color: theme.bg.primary }}
            >
              {busy ? 'Sending…' : 'Send warmth'}
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-sm" style={{ color: '#c44' }}>{err}</p>}

      <div className="flex items-center justify-end gap-3 mt-1">
        {!alreadyReplied && !replying && (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="px-4 py-2 rounded-full text-sm"
            style={{ background: theme.accent.primary, color: theme.bg.primary }}
          >
            Reply
          </button>
        )}
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
            Let this go?
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onBurn()
                } finally {
                  setBusy(false)
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: '#c44', color: 'white' }}
            >
              Yes, burn
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
