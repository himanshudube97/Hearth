'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { ReceivedNote, ReceivedReply } from '@/hooks/useStrangerNotes'

interface Props {
  unreadCount: number
  canSendToday: boolean
  onCompose: () => void
  receivedNotes: ReceivedNote[]
  receivedReplies: ReceivedReply[]
  onPickNote: (id: string) => void
  onPickReply: (id: string) => void
}

export default function Mailbox({
  unreadCount,
  canSendToday,
  onCompose,
  receivedNotes,
  receivedReplies,
  onPickNote,
  onPickReply,
}: Props) {
  const { theme } = useThemeStore()
  const [open, setOpen] = useState(false)

  const hasItems = receivedNotes.length > 0 || receivedReplies.length > 0

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        type="button"
        onClick={() => hasItems && setOpen((v) => !v)}
        className="relative w-32 h-40 rounded-xl flex items-center justify-center text-5xl"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
          backdropFilter: `blur(${theme.glass.blur})`,
          color: theme.text.primary,
          cursor: hasItems ? 'pointer' : 'default',
          opacity: hasItems ? 1 : 0.6,
        }}
        whileHover={hasItems ? { scale: 1.03 } : {}}
        animate={
          unreadCount > 0
            ? {
                boxShadow: [
                  `0 0 12px ${theme.accent.warm}40`,
                  `0 0 24px ${theme.accent.warm}80`,
                  `0 0 12px ${theme.accent.warm}40`,
                ],
              }
            : { boxShadow: 'none' }
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Lantern of stranger notes"
      >
        <span aria-hidden>🪔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: theme.accent.primary, color: theme.bg.primary }}
          >
            {unreadCount}
          </span>
        )}
      </motion.button>

      {open && hasItems && (
        <div
          className="w-full max-w-sm rounded-xl p-3 flex flex-col gap-2"
          style={{
            background: theme.glass.bg,
            border: `1px solid ${theme.glass.border}`,
            backdropFilter: `blur(${theme.glass.blur})`,
          }}
        >
          {receivedNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.text.muted }}>
                For you
              </p>
              {receivedNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="text-left text-sm py-2 px-3 rounded-md hover:opacity-80 transition-opacity"
                  style={{
                    color: theme.text.secondary,
                    background: n.readAt ? 'transparent' : `${theme.accent.warm}15`,
                  }}
                  onClick={() => onPickNote(n.id)}
                >
                  {n.content.slice(0, 60)}
                  {n.content.length > 60 ? '…' : ''}
                </button>
              ))}
            </div>
          )}
          {receivedReplies.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.text.muted }}>
                A warmth back
              </p>
              {receivedReplies.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="text-left text-sm py-2 px-3 rounded-md hover:opacity-80 transition-opacity"
                  style={{
                    color: theme.text.secondary,
                    background: r.readAt ? 'transparent' : `${theme.accent.primary}15`,
                  }}
                  onClick={() => onPickReply(r.id)}
                >
                  {r.content}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCompose}
        disabled={!canSendToday}
        className="px-6 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: theme.accent.primary,
          color: theme.bg.primary,
        }}
      >
        {canSendToday ? 'Send a small light' : 'Your light is on its way. Come back tomorrow.'}
      </button>
    </div>
  )
}
