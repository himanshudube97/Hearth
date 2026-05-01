'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SealedLetterTile from './SealedLetterTile'

interface MyLetter {
  id: string
  createdAt: string
  unlockDate: string | null
  isSealed: boolean
  recipientName: string | null
  recipientEmail: string | null
}

interface Props {
  onWriteClick: () => void
}

export default function SealedLetterList({ onWriteClick }: Props) {
  const [letters, setLetters] = useState<MyLetter[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/letters/mine')
      .then(r => r.json())
      .then((data: { letters: MyLetter[] }) => {
        if (!cancelled) setLetters(data.letters.filter(l => l.isSealed))
      })
      .catch(() => { if (!cancelled) setLetters([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-[var(--font-caveat),Caveat,cursive] text-3xl">my letters</h1>
        <button
          onClick={onWriteClick}
          className="rounded-full bg-[var(--color-accent,#c8742c)] px-5 py-2 text-sm text-white shadow-md hover:brightness-105"
        >
          ✎ Write a letter
        </button>
      </header>

      {letters === null ? (
        <p className="text-sm opacity-60">loading…</p>
      ) : letters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <p className="font-[var(--font-caveat),Caveat,cursive] text-2xl opacity-80">
            no sealed letters yet.
          </p>
          <p className="mt-2 text-sm opacity-60">
            write one to your future self, or to someone close.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map(l => (
            <SealedLetterTile
              key={l.id}
              recipientName={l.recipientName ?? 'someone close'}
              sealedAt={new Date(l.createdAt)}
              unlockDate={l.unlockDate ? new Date(l.unlockDate) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
