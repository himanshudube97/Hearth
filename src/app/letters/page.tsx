'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addWeeks } from 'date-fns'
import html2canvas from 'html2canvas-pro'
import { useThemeStore } from '@/store/theme'
import { useProfileStore } from '@/store/profile'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import { ThemeName } from '@/lib/themes'
import Postcard from '@/components/postcard/Postcard'
import PostcardFront, { Recipient } from '@/components/postcard/PostcardFront'
import PostcardBack from '@/components/postcard/PostcardBack'
import FloatingEnvelope from '@/components/FloatingEnvelope'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import DoodlePreview from '@/components/DoodlePreview'
import { StrokeData } from '@/store/journal'

const themeStamps: Record<ThemeName, { icon: string; color: string }> = {
  rivendell: { icon: '🍃', color: '#5E8B5A' },
  hobbiton: { icon: '🌻', color: '#60B060' },
  winterSunset: { icon: '❄️', color: '#E8945A' },
  cherryBlossom: { icon: '🌸', color: '#E8A0B8' },
  northernLights: { icon: '✨', color: '#4ECCA3' },
  mistyMountains: { icon: '⛰️', color: '#8BA4B8' },
  gentleRain: { icon: '🌧️', color: '#6B8FAD' },
  cosmos: { icon: '🌟', color: '#9D8CFF' },
  candlelight: { icon: '🕯️', color: '#E8A050' },
  oceanTwilight: { icon: '🌊', color: '#50A0C8' },
  quietSnow: { icon: '❄️', color: '#88A8C8' },
}

// Used by the read-modal: stagger words in like ink hitting paper.
function InkWriteText({ text, delay = 0 }: { text: string; delay?: number }) {
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = plainText.split(' ')
  return (
    <p style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive", fontSize: '24px', lineHeight: 1.8, color: '#2a2520' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.04, duration: 0.2, ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}

interface MyLetter {
  id: string
  text: string
  createdAt: string
  unlockDate: string | null
  isSealed: boolean
  letterLocation: string | null
  recipientEmail: string | null
  recipientName: string | null
  hasArrived: boolean
  isViewed: boolean
}

export default function LettersPage() {
  const { theme, themeName } = useThemeStore()
  const { profile, fetchProfile } = useProfileStore()

  // Autosave the in-progress letter as a draft (entryType=letter, isSealed=false).
  // The hook returns the entry id once the first POST lands; subsequent edits
  // are PUT to that id. Server enforces that drafts are fully editable until
  // sealed, after which any write returns 403.
  const autosave = useAutosaveEntry()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Top-level mode toggle: writing surface vs. archive list
  const [viewMode, setViewMode] = useState<'write' | 'archive'>('write')

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

  // Archive state
  const [myLetters, setMyLetters] = useState<MyLetter[]>([])
  const [receivedLetters, setReceivedLetters] = useState<any[]>([])
  const [selectedLetter, setSelectedLetter] = useState<MyLetter | null>(null)
  const [showLetterModal, setShowLetterModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const letterCaptureRef = useRef<HTMLDivElement>(null)

  // Fetch letters (mine + received). Refetches after a successful send so the
  // archive picks up the new letter without a hard reload.
  useEffect(() => {
    const run = async () => {
      try {
        const [mine, received] = await Promise.all([
          fetch('/api/letters/mine').then(r => r.ok ? r.json() : { letters: [] }),
          fetch('/api/letters/received').then(r => r.ok ? r.json() : { letters: [] }),
        ])
        setMyLetters(mine.letters || [])
        setReceivedLetters(received.letters || [])
      } catch (err) {
        console.error('Failed to fetch letters:', err)
      }
    }
    run()
  }, [showSuccess])

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

  // Snapshot the read-modal as a PNG via html2canvas.
  const handleDownloadLetter = useCallback(async () => {
    if (!letterCaptureRef.current || !selectedLetter) return
    setIsDownloading(true)
    try {
      const element = letterCaptureRef.current
      element.style.position = 'fixed'
      element.style.left = '-9999px'
      element.style.top = '0'
      element.style.visibility = 'visible'
      element.style.opacity = '1'
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 100))
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#faf8f5',
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        height: element.scrollHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.scrollHeight,
      })
      element.style.visibility = 'hidden'
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.download = `letter-${format(new Date(selectedLetter.createdAt), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to download letter:', err)
    } finally {
      setIsDownloading(false)
    }
  }, [selectedLetter])

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

  // Only show sealed letters in the archive — unsealed drafts are still being
  // written and shouldn't appear as travelling letters.
  const sealedLetters = myLetters.filter(l => l.isSealed)
  const selfLetters = sealedLetters.filter(l => !l.recipientEmail)
  const friendLetters = sealedLetters.filter(l => l.recipientEmail)
  const arrivedSelf = selfLetters.filter(l => l.hasArrived)
  const arrivedFromFriends = receivedLetters.filter((l: any) => l.hasArrived)
  const archiveCount = sealedLetters.length + receivedLetters.length

  return (
    <>
      {/* Envelope animation on send */}
      <AnimatePresence>
        {showAnimation && <FloatingEnvelope onComplete={handleAnimationComplete} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center pt-6 pb-4"
        >
          <h1 className="text-2xl font-light tracking-wide mb-1" style={{ color: theme.text.primary }}>
            Letters
          </h1>
          <p className="text-xs" style={{ color: theme.text.muted }}>
            Words that travel through time
          </p>
        </motion.div>

        {/* View tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {(['write', 'archive'] as const).map((mode) => {
            const selected = viewMode === mode
            return (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(mode)}
                className="px-4 py-1.5 rounded-full text-sm"
                style={{
                  background: selected ? `${theme.accent.warm}25` : 'transparent',
                  border: `1px solid ${selected ? theme.accent.warm : theme.glass.border}`,
                  color: selected ? theme.text.primary : theme.text.secondary,
                  backdropFilter: `blur(${theme.glass.blur})`,
                }}
              >
                {mode === 'write' ? 'Write' : `Archive (${archiveCount})`}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {viewMode === 'write' ? (
            <motion.div
              key="write"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Letters to Myself */}
              {selfLetters.length > 0 && (
                <div>
                  <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                    Letters to Myself
                  </h2>
                  <div className="space-y-3">
                    {selfLetters.map((letter, index) => {
                      const arrived = letter.hasArrived
                      const unlockStr = letter.unlockDate ? format(new Date(letter.unlockDate), 'MMM d, yyyy') : null
                      const createdStr = format(new Date(letter.createdAt), 'MMM d, yyyy')
                      return (
                        <motion.div
                          key={letter.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={arrived ? () => { setSelectedLetter(letter); setShowLetterModal(true) } : undefined}
                          className={`p-4 rounded-xl ${arrived ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{
                            background: arrived
                              ? `linear-gradient(135deg, ${theme.accent.warm}15, ${theme.accent.primary}08)`
                              : `linear-gradient(135deg, ${theme.accent.primary}08, ${theme.accent.warm}05)`,
                            border: arrived
                              ? `1px solid ${theme.accent.warm}40`
                              : `1px solid ${theme.glass.border}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{arrived ? '💌' : '🔒'}</span>
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                  Sealed on {createdStr}
                                  {letter.letterLocation && ` · ${letter.letterLocation}`}
                                </p>
                                <p className="text-xs" style={{ color: theme.text.muted }}>
                                  {arrived ? 'Arrived' : unlockStr ? `Arriving ${unlockStr}` : 'Traveling through time'}
                                </p>
                              </div>
                            </div>
                            {arrived && (
                              <span className="text-xs px-2 py-1 rounded-full" style={{
                                background: `${theme.accent.warm}20`,
                                color: theme.accent.warm,
                              }}>Open</span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Letters to Friends */}
              {friendLetters.length > 0 && (
                <div>
                  <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                    Letters to Friends
                  </h2>
                  <div className="space-y-3">
                    {friendLetters.map((letter, index) => {
                      const unlockStr = letter.unlockDate ? format(new Date(letter.unlockDate), 'MMM d, yyyy') : null
                      const sentStr = format(new Date(letter.createdAt), 'MMM d, yyyy')
                      return (
                        <motion.div
                          key={letter.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-xl cursor-default"
                          style={{
                            background: 'linear-gradient(135deg, rgba(100,140,200,0.1), rgba(120,160,220,0.05))',
                            border: `1px solid ${theme.glass.border}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🔒</span>
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                  To {letter.recipientName || letter.recipientEmail}
                                </p>
                                <p className="text-xs" style={{ color: theme.text.muted }}>
                                  Sent {sentStr}{unlockStr ? ` · Arriving ${unlockStr}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Letters from the past */}
              {arrivedSelf.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: theme.glass.border }}>
                  <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                    Letters from the past
                  </h2>
                  <div className="space-y-3">
                    {arrivedSelf.map((letter, index) => (
                      <motion.div
                        key={letter.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => { setSelectedLetter(letter); setShowLetterModal(true) }}
                        className="p-4 rounded-xl cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${theme.accent.warm}15, ${theme.accent.primary}08)`,
                          border: `1px solid ${theme.accent.warm}40`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">✨</span>
                            <div>
                              <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                Letter to self
                              </p>
                              <p className="text-xs" style={{ color: theme.text.muted }}>
                                Written {format(new Date(letter.createdAt), 'MMM d, yyyy')}
                                {letter.letterLocation && ` from ${letter.letterLocation}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            background: `${theme.accent.warm}20`,
                            color: theme.accent.warm,
                          }}>Read</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Letters from friends */}
              {arrivedFromFriends.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: theme.glass.border }}>
                  <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                    Letters from friends
                  </h2>
                  <div className="space-y-3">
                    {arrivedFromFriends.map((letter: any, index: number) => (
                      <motion.div
                        key={letter.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => { setSelectedLetter(letter); setShowLetterModal(true) }}
                        className="p-4 rounded-xl cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(100,140,200,0.12), rgba(120,160,220,0.06))',
                          border: '1px solid rgba(100,140,200,0.3)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">💌</span>
                            <div>
                              <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                From {letter.senderName || 'a friend'}
                              </p>
                              <p className="text-xs" style={{ color: theme.text.muted }}>
                                Arrived {letter.unlockDate ? format(new Date(letter.unlockDate), 'MMM d, yyyy') : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            background: 'rgba(100,140,200,0.2)',
                            color: 'rgba(100,140,200,0.9)',
                          }}>Open</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {(myLetters.length === 0 && receivedLetters.length === 0) && (
                <p className="text-center text-sm py-12" style={{ color: theme.text.muted }}>
                  Nothing in the archive yet. Switch to Write to send your first postcard.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Letter Reading Modal — preserved cream-paper postcard look so existing
          letters render exactly as they did before. The writing surface is the
          new glass postcard; the reading surface stays nostalgic. */}
      <AnimatePresence>
        {showLetterModal && selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(5,5,15,0.95)', paddingTop: '80px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}
            onClick={() => setShowLetterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative mx-4 flex flex-col"
              style={{ width: '95vw', maxWidth: '900px', maxHeight: 'calc(100vh - 104px)', perspective: '1000px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative rounded-sm flex-1 flex flex-col overflow-hidden min-h-0"
                style={{
                  background: '#f5f0e6',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid #e0d5c5',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />
                <div
                  className="absolute left-[5%] right-[5%] top-1/2 h-px pointer-events-none"
                  style={{ background: 'rgba(139,115,85,0.08)', boxShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
                />

                <div className="relative pt-4 pb-3 px-6 shrink-0">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(139,115,85,0.5)' }}>
                      Postcard
                    </div>
                    <div className="flex items-start gap-2">
                      <div
                        className="relative flex items-center justify-center"
                        style={{ width: 70, height: 70, transform: 'rotate(-12deg)' }}
                      >
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(139, 69, 69, 0.5)' }} />
                        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid rgba(139, 69, 69, 0.4)' }} />
                        <div className="text-center" style={{ color: 'rgba(139, 69, 69, 0.6)' }}>
                          <div style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>
                            {(selectedLetter.letterLocation || 'SOMEWHERE').toUpperCase().slice(0, 8)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                            {format(new Date(selectedLetter.createdAt), 'dd.MM.yy')}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: 55,
                          height: 65,
                          background: 'linear-gradient(145deg, #faf8f5, #f0ebe0)',
                          border: '3px dashed rgba(139,115,85,0.5)',
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        }}
                      >
                        <span style={{ fontSize: 22, marginBottom: 2 }}>{themeStamps[themeName]?.icon || '🍃'}</span>
                        <span style={{ fontSize: 7, color: themeStamps[themeName]?.color || '#5E8B5A', fontWeight: 'bold', letterSpacing: 1 }}>HEARTH</span>
                        <span style={{ fontSize: 9, color: '#8B7355', fontWeight: 'bold', marginTop: 1 }}>₹ 5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-6 h-px" style={{ background: 'rgba(139,115,85,0.15)' }} />

                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <p style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive", fontSize: '28px', color: '#2a2520' }}>
                      Dear future {profile.nickname || 'me'},
                    </p>
                  </motion.div>

                  <InkWriteText text={selectedLetter.text} delay={0.5} />

                  <motion.div
                    className="mt-8 text-right"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                  >
                    <p style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive", fontSize: '22px', color: '#4a3f35' }}>
                      — Past {profile.nickname || 'me'}
                    </p>
                    <p className="text-xs mt-1 italic" style={{ color: 'rgba(139,115,85,0.6)' }}>
                      {format(new Date(selectedLetter.createdAt), 'MMMM d, yyyy')}
                      {selectedLetter.letterLocation && ` • ${selectedLetter.letterLocation}`}
                    </p>
                  </motion.div>

                  {(selectedLetter as any).photos?.length > 0 && (
                    <motion.div
                      className="mt-6 flex flex-wrap gap-4 justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.4, duration: 0.5 }}
                    >
                      {(selectedLetter as any).photos.map((photo: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: '#fff',
                            padding: '8px 8px 32px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: `rotate(${photo.rotation || (i % 2 === 0 ? 3 : -3)}deg)`,
                          }}
                        >
                          <img src={photo.url} alt="" style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {(selectedLetter as any).doodles?.length > 0 && (
                    <motion.div
                      className="mt-6 flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 0.5 }}
                    >
                      <DoodlePreview strokes={(selectedLetter as any).doodles[0].strokes} size={200} />
                    </motion.div>
                  )}

                  {(selectedLetter as any).song && isMusicUrl((selectedLetter as any).song) && (
                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.8, duration: 0.5 }}
                    >
                      <SongEmbed url={(selectedLetter as any).song} compact />
                    </motion.div>
                  )}
                </div>

                <div className="h-3 shrink-0" style={{ background: 'linear-gradient(to top, rgba(139,115,85,0.06), transparent)' }} />
              </div>

              <div className="flex justify-center gap-3 mt-4 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadLetter}
                  disabled={isDownloading}
                  className="px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 relative overflow-hidden"
                  style={{
                    background: '#f5f0e6',
                    border: '1px solid rgba(139,115,85,0.3)',
                    color: '#5a4a3e',
                    boxShadow: '0 4px 12px rgba(139,115,85,0.15)',
                    opacity: isDownloading ? 0.7 : 1,
                  }}
                >
                  {isDownloading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>✦</motion.span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '14px' }}>📷</span>
                      <span>Save</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLetterModal(false)}
                  className="px-8 py-3 rounded-full text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #8B7355 0%, #6b5a45 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(139,115,85,0.3)',
                  }}
                >
                  Close
                </motion.button>
              </div>

              {/* Hidden capture element used by html2canvas to render the
                  download PNG. Identical visual to the modal but full-width
                  and laid out for export. */}
              <div
                ref={letterCaptureRef}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: 0,
                  width: '900px',
                  minWidth: '900px',
                  background: '#f5f0e6',
                  borderRadius: '8px',
                  border: '1px solid #e0d5c5',
                  padding: '32px',
                  visibility: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.3,
                    borderRadius: '8px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid rgba(139,115,85,0.2)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(139,115,85,0.6)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '500' }}>
                    Postcard
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '3px solid rgba(139,69,69,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(-15deg)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', border: '2px solid rgba(139,69,69,0.3)' }} />
                      <span style={{ fontSize: '10px', color: 'rgba(139,69,69,0.6)', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {(selectedLetter.letterLocation || 'SOMEWHERE').toUpperCase().slice(0, 8)}
                      </span>
                      <span style={{ fontSize: '14px', color: 'rgba(139,69,69,0.6)', fontWeight: 'bold', marginTop: '2px' }}>
                        {format(new Date(selectedLetter.createdAt), 'dd.MM.yy')}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '65px',
                        height: '78px',
                        background: 'linear-gradient(145deg, #faf8f5, #f0ebe0)',
                        border: '3px dashed rgba(139,115,85,0.5)',
                        borderRadius: '3px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      <span style={{ fontSize: '28px', marginBottom: '4px' }}>{themeStamps[themeName]?.icon || '🍃'}</span>
                      <span style={{ fontSize: '8px', color: themeStamps[themeName]?.color || '#5E8B5A', fontWeight: 'bold', letterSpacing: '1px' }}>HEARTH</span>
                      <span style={{ fontSize: '10px', color: '#8B7355', fontWeight: 'bold', marginTop: '2px' }}>₹ 5</span>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', padding: '12px 0' }}>
                  <p style={{ fontSize: '32px', fontFamily: "var(--font-caveat), 'Caveat', cursive", color: '#2a2520', marginBottom: '24px' }}>
                    Dear future {profile.nickname || 'me'},
                  </p>
                  <div
                    style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive", fontSize: '26px', lineHeight: 1.9, color: '#2a2520' }}
                    dangerouslySetInnerHTML={{ __html: selectedLetter.text }}
                  />
                  <div style={{ marginTop: '40px', textAlign: 'right' }}>
                    <p style={{ fontSize: '26px', fontFamily: "var(--font-caveat), 'Caveat', cursive", color: '#4a3f35' }}>
                      — Past {profile.nickname || 'me'}
                    </p>
                    <p style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(139,115,85,0.6)', fontStyle: 'italic' }}>
                      {format(new Date(selectedLetter.createdAt), 'MMMM d, yyyy')}
                      {selectedLetter.letterLocation && ` • ${selectedLetter.letterLocation}`}
                    </p>
                  </div>

                  {(selectedLetter as any).photos?.length > 0 && (
                    <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                      {(selectedLetter as any).photos.map((photo: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: '#fff',
                            padding: '8px 8px 32px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: `rotate(${photo.rotation || (i % 2 === 0 ? 3 : -3)}deg)`,
                          }}
                        >
                          <img src={photo.url} alt="" style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedLetter as any).doodles?.length > 0 && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                      <DoodlePreview strokes={(selectedLetter as any).doodles[0].strokes} size={200} />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    position: 'relative',
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(139,115,85,0.15)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'rgba(139,115,85,0.5)', letterSpacing: '3px', fontWeight: '500' }}>
                    HEARTH • A LETTER FROM THE PAST
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
