'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import PostcardFront from './PostcardFront'
import PostcardBack from './PostcardBack'
import PostcardFolded from './PostcardFolded'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import { useProfileStore } from '@/store/profile'
import type { StrokeData } from '@/store/journal'
import {
  type LetterRecipient,
  type UnlockChoice,
  DEFAULT_UNLOCK,
  resolveUnlockDate,
  mapRecipientToSchema,
} from '../letterTypes'

type Phase = 'front' | 'back' | 'folded' | 'sending'

export default function ComposeView() {
  const router = useRouter()
  const { fetchProfile } = useProfileStore()
  const autosave = useAutosaveEntry()

  const [phase, setPhase] = useState<Phase>('front')
  const [recipient, setRecipient] = useState<LetterRecipient>('future_me')
  const [closeName, setCloseName] = useState('')
  const [unlock, setUnlock] = useState<UnlockChoice>(DEFAULT_UNLOCK)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<[string | null, string | null]>([null, null])
  const [song, setSong] = useState<string | null>(null)
  const [doodleStrokes, setDoodleStrokes] = useState<StrokeData[]>([])
  const [createdAt] = useState<Date>(() => new Date())
  const [sealing, setSealing] = useState(false)

  // For the send slide-out animation
  const sendAnimDoneRef = useRef(false)

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const mapping = mapRecipientToSchema(recipient, closeName, null)
  const unlockDate = resolveUnlockDate(unlock, createdAt)

  // Autosave whenever fields change
  useEffect(() => {
    autosave.trigger({
      text: body,
      song: song,
      photos: photos
        .map((url, idx) => url ? { url, position: idx, rotation: 0, spread: 1 } : null)
        .filter(Boolean) as { url: string; position: number; rotation: number; spread: number }[],
      doodles: doodleStrokes.length > 0 ? [{ strokes: doodleStrokes, spread: 1 }] : [],
      entryType: mapping.entryType,
      recipientEmail: mapping.recipientEmail,
      recipientName: mapping.recipientName,
      unlockDate: unlockDate ? unlockDate.toISOString() : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, song, photos, doodleStrokes, mapping.entryType, mapping.recipientName, mapping.recipientEmail, unlockDate])

  const plainText = body.replace(/<[^>]*>/g, '').trim()
  const canSeal =
    plainText.length > 0 &&
    unlockDate !== null &&
    (recipient === 'future_me' || closeName.trim().length > 0)

  async function handleFoldAndSeal() {
    if (!canSeal || sealing) return
    setSealing(true)
    setPhase('folded')
    setSealing(false)
  }

  async function handleSend() {
    setSealing(true)
    try {
      await autosave.flush()
      const id = autosave.entryId
      if (!id) return
      const res = await fetch(`/api/entries/${id}/seal`, { method: 'POST' })
      if (res.ok) {
        setPhase('sending')
        sendAnimDoneRef.current = true
        // Wait for send animation (postcard slides up), then navigate back
        setTimeout(() => {
          router.push('/letters')
        }, 900)
      }
    } finally {
      setSealing(false)
    }
  }

  // Card flip control: front→back = 180 degrees
  const cardRotateY = phase === 'front' ? 0 : 180

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))',
        perspective: 1600,
      }}
    >
      {/* Back button — returns to the inbox */}
      <button
        onClick={() => router.push('/letters')}
        style={{
          position: 'absolute',
          top: 90,
          left: 32,
          zIndex: 210,
          padding: '7px 16px 8px 14px',
          borderRadius: 999,
          border: '1px solid color-mix(in oklab, var(--text-muted) 40%, transparent)',
          background: 'var(--paper-1)',
          color: 'var(--text-secondary)',
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          fontSize: 14,
          letterSpacing: 0.4,
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s, transform 0.2s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.background = 'var(--paper-2)'
          el.style.color = 'var(--text-primary)'
          el.style.transform = 'translateX(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.background = 'var(--paper-1)'
          el.style.color = 'var(--text-secondary)'
          el.style.transform = 'none'
        }}
        aria-label="back to letters"
      >
        ← back to letters
      </button>

      {/* The postcard itself — landscape */}
      <motion.div
        animate={
          phase === 'sending'
            ? { y: '-200vh', opacity: 0, scale: 0.92 }
            : { y: 0, opacity: 1, scale: 1 }
        }
        transition={
          phase === 'sending'
            ? { duration: 0.7, ease: [0.4, 0, 0.8, 0.5] }
            : { type: 'spring', stiffness: 280, damping: 26 }
        }
        style={{
          width: 'min(1100px, calc(100vw - 80px))',
          height: 'min(640px, calc(100vh - 180px))',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 3D flip wrapper */}
        <motion.div
          animate={{ rotateY: cardRotateY }}
          transition={{ duration: 0.85, ease: [0.45, 0.05, 0.15, 1] }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* FRONT face */}
          <PostcardFront
            recipient={recipient}
            onRecipientChange={setRecipient}
            closeName={closeName}
            onCloseNameChange={setCloseName}
            createdAt={createdAt}
            onTurnOver={() => setPhase('back')}
            onClose={() => router.push('/letters')}
          />

          {/* BACK face (visible when phase=back or folded) */}
          {phase !== 'front' && phase !== 'sending' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                pointerEvents: 'auto',
              }}
            >
              {phase === 'back' ? (
                <PostcardBack
                  recipient={recipient}
                  closeName={closeName}
                  body={body}
                  onBodyChange={setBody}
                  unlock={unlock}
                  onUnlockChange={setUnlock}
                  photos={photos}
                  onPhotosChange={setPhotos}
                  song={song}
                  onSongChange={setSong}
                  doodleStrokes={doodleStrokes}
                  onDoodleChange={setDoodleStrokes}
                  onBack={() => setPhase('front')}
                  onSeal={handleFoldAndSeal}
                  canSeal={canSeal && !sealing}
                  sealing={sealing}
                />
              ) : (
                // folded phase — show folded face instead of back
                <PostcardFolded
                  recipient={recipient}
                  closeName={closeName}
                  unlock={unlock}
                  createdAt={createdAt}
                  sending={sealing}
                  onSend={handleSend}
                />
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
