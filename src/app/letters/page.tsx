'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addWeeks } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { useProfileStore } from '@/store/profile'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import Postcard from '@/components/postcard/Postcard'
import PostcardFront, { Recipient } from '@/components/postcard/PostcardFront'
import PostcardBack from '@/components/postcard/PostcardBack'
import FloatingEnvelope from '@/components/FloatingEnvelope'
import SealedLetterList from '@/components/letters/SealedLetterList'
import { StrokeData } from '@/store/journal'

type Surface = 'list' | 'write'

export default function LettersPage() {
  const { theme } = useThemeStore()
  const { fetchProfile } = useProfileStore()

  // Autosave the in-progress letter as a draft (entryType=letter, isSealed=false).
  // The hook returns the entry id once the first POST lands; subsequent edits
  // are PUT to that id. Server enforces that drafts are fully editable until
  // sealed, after which any write returns 403.
  const autosave = useAutosaveEntry()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const [surface, setSurface] = useState<Surface>('list')

  // Postcard editor state. The recipient picker lives inline on the front
  // (`Dear [▾ ...] ,`); the back's TO area + send action follow whichever
  // value is selected.
  const [recipient, setRecipient] = useState<Recipient>('self')
  const [isFlipped, setIsFlipped] = useState(false)
  const [letterText, setLetterText] = useState('')
  const [friendName, setFriendName] = useState('')
  const [friendEmail, setFriendEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [location, setLocation] = useState('')
  const [unlockDate, setUnlockDate] = useState<Date>(addWeeks(new Date(), 1))
  const [photos, setPhotos] = useState<{ url: string; rotation: number; position: 1 | 2 }[]>([])
  const [doodleStrokes, setDoodleStrokes] = useState<StrokeData[]>([])
  const [songLink, setSongLink] = useState('')

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.position !== position)
      return [...filtered, { url: dataUrl, rotation: position === 1 ? -5 : 4, position }]
    })
  }, [])

  // Push the current state through autosave whenever any letter field changes.
  // The hook debounces to 1500ms internally, so rapid typing fires one save.
  // Empty drafts (no text/song/photos/doodles) skip the network call.
  useEffect(() => {
    autosave.trigger({
      text: letterText,
      mood: 2,
      song: songLink || null,
      photos: photos.map((p) => ({ url: p.url, position: p.position, rotation: p.rotation, spread: 1 })),
      doodles: doodleStrokes.length > 0 ? [{ strokes: doodleStrokes, spread: 1 }] : [],
      entryType: 'letter',
      // Recipient comes from the inline picker on the front. For self letters
      // we explicitly null out the friend fields so the entry's recipient
      // metadata matches the user's last picker choice — even if they typed
      // a friend's name and then switched back to "Future Me."
      recipientEmail: recipient === 'friend' ? (friendEmail || null) : null,
      recipientName: recipient === 'friend' ? (friendName || null) : null,
      senderName: recipient === 'friend' ? (senderName || null) : null,
      letterLocation: location || null,
      unlockDate: unlockDate.toISOString(),
    })
    // autosave.trigger is stable (useCallback []), safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterText, songLink, photos, doodleStrokes, recipient, friendEmail, friendName, senderName, location, unlockDate])

  // UI state for sending
  const [saving, setSaving] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    toLabel: string
    isFriend: boolean
    unlockDate: Date
  } | null>(null)

  const hasContent = letterText.trim() && letterText !== '<p></p>'

  // Resolved recipient label for the Send button + success message. Friend
  // letters surface name → email → generic, in that order.
  const isFriend = recipient === 'friend'
  const trimmedEmail = friendEmail.trim()
  const friendEmailValid = trimmedEmail.length > 0 && trimmedEmail.includes('@')
  const friendEmailMissing = isFriend && trimmedEmail.length === 0
  const friendEmailInvalid = isFriend && trimmedEmail.length > 0 && !friendEmailValid
  const recipientLabel = isFriend
    ? (friendName.trim() || trimmedEmail || 'a friend')
    : 'Future Me'

  const canSend = hasContent && (!isFriend || friendEmailValid)

  const handleSendLetter = useCallback(async () => {
    if (!canSend) return
    setSaving(true)
    try {
      // Make sure the latest edits are persisted before sealing — otherwise
      // the seal could land on a stale draft.
      await autosave.flush()
      const entryId = autosave.entryId
      if (!entryId) {
        console.error('No draft to seal')
        return
      }
      const res = await fetch(`/api/entries/${entryId}/seal`, { method: 'POST' })
      if (res.ok) {
        setSuccessData({ toLabel: recipientLabel, isFriend, unlockDate })
        setShowAnimation(true)
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Failed to seal letter:', data?.error || res.status)
      }
    } catch (err) {
      console.error('Failed to send letter:', err)
    } finally {
      setSaving(false)
    }
  }, [canSend, autosave, recipientLabel, isFriend, unlockDate])

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false)
    setShowSuccess(true)
  }, [])

  const handleWriteAnother = useCallback(() => {
    setShowSuccess(false)
    setSuccessData(null)
    setLetterText('')
    setFriendEmail('')
    setFriendName('')
    setSenderName('')
    setLocation('')
    setUnlockDate(addWeeks(new Date(), 1))
    setRecipient('self')
    setIsFlipped(false)
    setSongLink('')
    setDoodleStrokes([])
    setPhotos([])
    // Detach autosave from the just-sealed letter so the next typing creates
    // a brand-new draft via POST instead of trying to PUT to the sealed id.
    autosave.reset(null)
  }, [autosave])

  if (surface === 'list') {
    return <SealedLetterList onWriteClick={() => setSurface('write')} />
  }

  // Success splash after a successful send
  if (showSuccess && successData) {
    return (
      <>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-6xl mb-6"
            >✨</motion.div>
            <h2 className="text-2xl font-light mb-3" style={{ color: theme.text.primary }}>
              Your postcard is on its way
            </h2>
            <p className="text-sm mb-8" style={{ color: theme.text.muted }}>
              {successData.isFriend
                ? `A letter to ${successData.toLabel}`
                : 'A message to your future self'}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWriteAnother}
              className="px-6 py-3 rounded-full text-sm"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: theme.text.primary,
              }}
            >Write another postcard</motion.button>
          </motion.div>
        </div>
      </>
    )
  }

  // surface === 'write' — the existing postcard JSX, with a back button added at the top
  return (
    <>
      {/* Envelope animation on send */}
      <AnimatePresence>
        {showAnimation && <FloatingEnvelope onComplete={handleAnimationComplete} />}
      </AnimatePresence>

      <button
        onClick={() => setSurface('list')}
        className="m-4 text-sm underline opacity-70 hover:opacity-100"
        style={{ color: theme.text.secondary }}
      >
        ← back to letters
      </button>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Postcard */}
        <div className="mb-10">
          <Postcard
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            front={
              <PostcardFront
                letterText={letterText}
                onTextChange={setLetterText}
                recipient={recipient}
                onRecipientChange={setRecipient}
                friendName={friendName}
              />
            }
            back={
              <PostcardBack
                recipient={recipient}
                photos={photos}
                onPhotoAdd={handlePhotoAdd}
                doodleStrokes={doodleStrokes}
                onDoodleChange={setDoodleStrokes}
                songLink={songLink}
                onSongChange={setSongLink}
                friendName={friendName}
                onFriendNameChange={setFriendName}
                friendEmail={friendEmail}
                onFriendEmailChange={setFriendEmail}
                senderName={senderName}
                onSenderNameChange={setSenderName}
                location={location}
                onLocationChange={setLocation}
                unlockDate={unlockDate}
                onUnlockDateChange={setUnlockDate}
              />
            }
          />
        </div>

        {/* Send button — label resolves to whoever the postcard is
            addressed to right now. Empty TO field → "Future Me." */}
        {hasContent ? (
          <motion.button
            whileHover={{ scale: canSend ? 1.01 : 1 }}
            whileTap={{ scale: canSend ? 0.99 : 1 }}
            onClick={handleSendLetter}
            disabled={saving || !canSend}
            className="w-full max-w-md mx-auto py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2"
            style={{
              background: canSend ? `${theme.accent.warm}25` : theme.glass.bg,
              border: `1px solid ${canSend ? theme.accent.warm : theme.glass.border}`,
              color: canSend ? theme.text.primary : theme.text.muted,
              opacity: saving ? 0.5 : 1,
              cursor: canSend ? 'pointer' : 'not-allowed',
              backdropFilter: `blur(${theme.glass.blur})`,
            }}
          >
            {saving
              ? 'Sending...'
              : <><span>Send to {recipientLabel}</span><span>✨</span></>}
          </motion.button>
        ) : (
          <p className="text-center text-sm" style={{ color: theme.text.muted }}>
            {isFriend
              ? 'Write your friend a letter — flip to add their email.'
              : 'Write something to your future self...'}
          </p>
        )}

        {friendEmailMissing && hasContent && (
          <p className="text-center text-xs mt-2" style={{ color: theme.text.muted }}>
            Flip the card and add your friend&apos;s email to send.
          </p>
        )}
        {friendEmailInvalid && (
          <p className="text-center text-xs mt-2" style={{ color: '#c62828' }}>
            That email doesn&apos;t look right — fix it on the back.
          </p>
        )}
      </div>
    </>
  )
}
