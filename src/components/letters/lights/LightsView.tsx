'use client'

import { useState } from 'react'
import { useStrangerNotes } from '@/hooks/useStrangerNotes'
import Mailbox from './Mailbox'
import ComposePaper from './ComposePaper'
import ReadPaper from './ReadPaper'
import ReplyCard from './ReplyCard'

type Mode = 'idle' | 'composing' | 'reading-note' | 'reading-reply'

export default function LightsView() {
  const { data, loading, error, send, reply, burnNote, burnReply, markRead } = useStrangerNotes()
  const [mode, setMode] = useState<Mode>('idle')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

  if (loading && !data) {
    return <div className="p-6 text-sm opacity-70">Loading…</div>
  }
  if (error && !data) {
    return <div className="p-6 text-sm text-red-500">{error}</div>
  }
  if (!data) return null

  const activeNote = data.receivedNotes.find((n) => n.id === activeNoteId) ?? null
  const activeReply = data.receivedReplies.find((r) => r.id === activeReplyId) ?? null

  const unreadNoteCount = data.receivedNotes.filter((n) => !n.readAt).length
  const unreadReplyCount = data.receivedReplies.filter((r) => !r.readAt).length

  return (
    <div className="relative flex flex-col items-center gap-8 p-6 sm:p-10">
      <div className="text-center max-w-md">
        <p className="text-sm opacity-70">
          You&apos;ve sent {data.counters.sent} small lights into the world.
          {' '}
          {data.counters.received} have arrived at your door from strangers.
        </p>
      </div>

      <Mailbox
        unreadCount={unreadNoteCount + unreadReplyCount}
        canSendToday={data.canSendToday}
        onCompose={() => setMode('composing')}
        receivedNotes={data.receivedNotes}
        receivedReplies={data.receivedReplies}
        onPickNote={(id) => {
          setActiveNoteId(id)
          setMode('reading-note')
          markRead(id)
        }}
        onPickReply={(id) => {
          setActiveReplyId(id)
          setMode('reading-reply')
        }}
      />

      {mode === 'composing' && (
        <ComposePaper
          canSend={data.canSendToday}
          onCancel={() => setMode('idle')}
          onSend={async (content) => {
            await send(content)
            setMode('idle')
          }}
        />
      )}

      {mode === 'reading-note' && activeNote && (
        <ReadPaper
          note={activeNote}
          onClose={() => {
            setMode('idle')
            setActiveNoteId(null)
          }}
          onBurn={async () => {
            await burnNote(activeNote.id)
            setMode('idle')
            setActiveNoteId(null)
          }}
          onReply={async (text) => {
            await reply(activeNote.id, text)
          }}
        />
      )}

      {mode === 'reading-reply' && activeReply && (
        <ReplyCard
          reply={activeReply}
          onClose={() => {
            setMode('idle')
            setActiveReplyId(null)
          }}
          onBurn={async () => {
            await burnReply(activeReply.id)
            setMode('idle')
            setActiveReplyId(null)
          }}
        />
      )}
    </div>
  )
}
