'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addWeeks } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { useProfileStore } from '@/store/profile'
import { useE2EE } from '@/hooks/useE2EE'
import { useEffect } from 'react'
import Postcard from '@/components/postcard/Postcard'
import PostcardFront from '@/components/postcard/PostcardFront'
import PostcardBack from '@/components/postcard/PostcardBack'
import FloatingEnvelope from '@/components/FloatingEnvelope'
import { StrokeData } from '@/store/journal'

type RecipientType = 'self' | 'friend'

export default function NewLettersPage() {
  const { theme } = useThemeStore()
  const { profile, fetchProfile } = useProfileStore()
  const { encryptEntryData } = useE2EE()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Letter type
  const [recipientType, setRecipientType] = useState<RecipientType>('self')

  // Flip state
  const [isFlipped, setIsFlipped] = useState(false)

  // Letter content
  const [letterText, setLetterText] = useState('')

  // Friend fields
  const [friendName, setFriendName] = useState('')
  const [friendEmail, setFriendEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [location, setLocation] = useState('')

  // Date
  const [unlockDate, setUnlockDate] = useState<Date>(addWeeks(new Date(), 1))

  // Media
  const [photos, setPhotos] = useState<{ url: string; rotation: number; position: 1 | 2 }[]>([])
  const [doodleStrokes, setDoodleStrokes] = useState<StrokeData[]>([])
  const [songLink, setSongLink] = useState('')

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.position !== position)
      return [...filtered, { url: dataUrl, rotation: position === 1 ? -5 : 4, position }]
    })
  }, [])

  // UI state
  const [saving, setSaving] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    recipientType: RecipientType
    recipientName?: string
    unlockDate: Date
  } | null>(null)

  const hasContent = letterText.trim() && letterText !== '<p></p>'
  const canSend = hasContent && (
    recipientType === 'self' ||
    (friendEmail.trim() && friendName.trim())
  )

  const handleSendLetter = useCallback(async () => {
    if (!canSend) return

    setSaving(true)
    try {
      const entryData = {
        text: letterText,
        mood: 2,
        entryType: 'letter',
        unlockDate: unlockDate.toISOString(),
        isSealed: true,
        recipientEmail: recipientType === 'friend' ? friendEmail : null,
        recipientName: recipientType === 'friend' ? friendName : null,
        senderName: recipientType === 'friend' ? senderName : null,
        letterLocation: location || null,
        photos: photos.map(p => p.url),
        song: songLink || null,
        doodles: doodleStrokes.length > 0
          ? [{ strokes: doodleStrokes, positionInEntry: 0 }]
          : [],
      }

      const finalData = await encryptEntryData(entryData)

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      if (res.ok) {
        setSuccessData({
          recipientType,
          recipientName: friendName,
          unlockDate,
        })
        setShowAnimation(true)
      }
    } catch (error) {
      console.error('Failed to send letter:', error)
    } finally {
      setSaving(false)
    }
  }, [canSend, letterText, unlockDate, recipientType, friendEmail, friendName, senderName, location, songLink, doodleStrokes, photos, encryptEntryData])

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
    setRecipientType('self')
    setIsFlipped(false)
    setSongLink('')
    setDoodleStrokes([])
    setPhotos([])
  }, [])

  // Success state
  if (showSuccess && successData) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-6xl mb-6"
          >
            &#x2728;
          </motion.div>

          <h2
            className="text-2xl font-light mb-3"
            style={{ color: theme.text.primary }}
          >
            Your postcard is on its way
          </h2>

          <p
            className="text-sm mb-8"
            style={{ color: theme.text.muted }}
          >
            {successData.recipientType === 'self'
              ? 'A message to your future self'
              : `A letter to ${successData.recipientName}`
            }
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
          >
            Write another postcard
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {/* Envelope animation */}
      <AnimatePresence>
        {showAnimation && (
          <FloatingEnvelope onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto flex flex-col px-4 min-h-[calc(100dvh-7rem)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4 shrink-0"
        >
          <h1
            className="text-2xl font-light tracking-wide mb-1"
            style={{ color: theme.text.primary }}
          >
            Write a Postcard
          </h1>
          <p className="text-xs" style={{ color: theme.text.muted }}>
            Words that travel through time
          </p>
        </motion.div>

        {/* Letter type toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex justify-center gap-3 mb-6 shrink-0"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRecipientType('self')}
            className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2"
            style={{
              background: recipientType === 'self' ? '#f5f0e6' : 'transparent',
              border: recipientType === 'self' ? '1px solid #c4a265' : `1px solid ${theme.glass.border}`,
              color: recipientType === 'self' ? '#8B6914' : theme.text.secondary,
              boxShadow: recipientType === 'self' ? '0 2px 8px rgba(139,105,20,0.15)' : 'none',
            }}
          >
            <span>&#x2709;&#xfe0f;</span>
            <span>To Future Self</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRecipientType('friend')}
            className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2"
            style={{
              background: recipientType === 'friend' ? '#f5f0e6' : 'transparent',
              border: recipientType === 'friend' ? '1px solid #c4a265' : `1px solid ${theme.glass.border}`,
              color: recipientType === 'friend' ? '#8B6914' : theme.text.secondary,
              boxShadow: recipientType === 'friend' ? '0 2px 8px rgba(139,105,20,0.15)' : 'none',
            }}
          >
            <span>&#x2708;&#xfe0f;</span>
            <span>To a Friend</span>
          </motion.button>
        </motion.div>

        {/* Postcard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex items-center justify-center min-h-0 mb-8"
        >
          <Postcard
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            front={
              <PostcardFront
                letterText={letterText}
                onTextChange={setLetterText}
                recipientType={recipientType}
              />
            }
            back={
              <PostcardBack
                recipientType={recipientType}
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
        </motion.div>

        {/* Send button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="shrink-0 pb-4"
        >
          {hasContent ? (
            <motion.button
              whileHover={{ scale: canSend ? 1.01 : 1 }}
              whileTap={{ scale: canSend ? 0.99 : 1 }}
              onClick={handleSendLetter}
              disabled={saving || !canSend}
              className="w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: canSend ? '#f5f0e6' : theme.glass.bg,
                border: `1px solid ${canSend ? '#c4a265' : theme.glass.border}`,
                color: canSend ? '#8B6914' : theme.text.muted,
                opacity: saving ? 0.5 : 1,
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend ? '0 4px 12px rgba(139,105,20,0.15)' : 'none',
              }}
            >
              {saving ? (
                'Sending...'
              ) : (
                <>
                  <span>Send Postcard</span>
                  <span>&#x2728;</span>
                </>
              )}
            </motion.button>
          ) : (
            <p className="text-center text-sm py-3" style={{ color: theme.text.muted }}>
              {recipientType === 'self'
                ? 'Write something to your future self...'
                : 'Write something to your friend...'
              }
            </p>
          )}

          {recipientType === 'friend' && hasContent && (!friendEmail.trim() || !friendName.trim()) && (
            <p className="text-center text-xs mt-2" style={{ color: '#c62828' }}>
              Flip the card to add your friend&apos;s name and email
            </p>
          )}
        </motion.div>
      </div>
    </>
  )
}
