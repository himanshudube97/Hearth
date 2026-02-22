'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addWeeks, addMonths, addYears, isBefore, addDays, startOfDay } from 'date-fns'
import html2canvas from 'html2canvas-pro'
import { useThemeStore } from '@/store/theme'
import { useProfileStore } from '@/store/profile'
import { useE2EE } from '@/hooks/useE2EE'
import { ThemeName } from '@/lib/themes'
import Editor from '@/components/Editor'
import DatePicker from '@/components/DatePicker'
import CollagePhoto from '@/components/CollagePhoto'
import DoodleCanvas from '@/components/DoodleCanvas'
import DoodlePreview from '@/components/DoodlePreview'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import FloatingEnvelope from '@/components/FloatingEnvelope'
import Link from 'next/link'
import { StrokeData } from '@/store/journal'

type RecipientType = 'self' | 'friend'

// Theme-specific stamps
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

// Ink writing effect - words appear as if being written
function InkWriteText({ text, delay = 0 }: { text: string; delay?: number }) {
  // Strip HTML and split into words
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = plainText.split(' ')

  return (
    <p style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive", fontSize: '24px', lineHeight: 1.8, color: '#2a2520' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * 0.04,
            duration: 0.2,
            ease: 'easeOut',
          }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}

const unlockOptions = [
  { label: '1 week', getValue: () => addWeeks(new Date(), 1) },
  { label: '2 weeks', getValue: () => addWeeks(new Date(), 2) },
  { label: '1 month', getValue: () => addMonths(new Date(), 1) },
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addYears(new Date(), 1) },
]


// Success state after animation
function SuccessMessage({ recipientType, recipientName, unlockDate, onWriteAnother }: {
  recipientType: RecipientType
  recipientName?: string
  unlockDate: Date
  onWriteAnother: () => void
}) {
  const { theme } = useThemeStore()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-6xl mb-6"
      >
        ✨
      </motion.div>

      <h2
        className="text-2xl font-light mb-3"
        style={{ color: theme.text.primary }}
      >
        Your letter is on its way
      </h2>

      <p
        className="text-sm mb-2"
        style={{ color: theme.text.secondary }}
      >
        {recipientType === 'self'
          ? 'A message to your future self'
          : `A letter to ${recipientName}`
        }
      </p>

      <p
        className="text-sm mb-8"
        style={{ color: theme.text.muted }}
      >
        Arriving on {format(unlockDate, 'MMMM d, yyyy')}
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onWriteAnother}
        className="px-6 py-3 rounded-full text-sm"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
          color: theme.text.primary,
        }}
      >
        Write another letter
      </motion.button>
    </motion.div>
  )
}

export default function LettersPage() {
  const { theme, themeName } = useThemeStore()
  const { profile, fetchProfile } = useProfileStore()
  const { encryptEntryData, isE2EEReady } = useE2EE()

  // Fetch profile for nickname
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Hero card selection
  const [selectedCard, setSelectedCard] = useState<'self' | 'friend' | null>(null)

  // Doodle + music state
  const [songLink, setSongLink] = useState('')
  const [doodleStrokes, setDoodleStrokes] = useState<StrokeData[]>([])
  const [showDoodle, setShowDoodle] = useState(false)

  // Received letters state
  const [receivedLetters, setReceivedLetters] = useState<any[]>([])

  // Form state
  const [recipientType, setRecipientType] = useState<RecipientType>('self')
  const [letterText, setLetterText] = useState('')
  const [unlockDate, setUnlockDate] = useState<Date>(addWeeks(new Date(), 1))
  const [customDate, setCustomDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Friend-specific fields
  const [friendEmail, setFriendEmail] = useState('')
  const [friendName, setFriendName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [location, setLocation] = useState('')

  // Photo state
  const [photoTopRight, setPhotoTopRight] = useState<string | null>(null)
  const [photoBottomLeft, setPhotoBottomLeft] = useState<string | null>(null)

  // UI state
  const [showDrawer, setShowDrawer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    recipientType: RecipientType
    recipientName?: string
    unlockDate: Date
  } | null>(null)

  // Letters list state
  const [myLetters, setMyLetters] = useState<{
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
  }[]>([])
  const [selectedLetter, setSelectedLetter] = useState<typeof myLetters[0] | null>(null)
  const [showLetterModal, setShowLetterModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const letterCaptureRef = useRef<HTMLDivElement>(null)

  // Download letter as image
  const handleDownloadLetter = useCallback(async () => {
    if (!letterCaptureRef.current || !selectedLetter) return

    setIsDownloading(true)
    try {
      const element = letterCaptureRef.current

      // Keep off-screen but make visible for html2canvas
      element.style.position = 'fixed'
      element.style.left = '-9999px'
      element.style.top = '0'
      element.style.visibility = 'visible'
      element.style.opacity = '1'

      // Wait for fonts to be ready
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }

      // Wait for content to render
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

      // Hide again
      element.style.visibility = 'hidden'

      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.download = `letter-${format(new Date(selectedLetter.createdAt), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to download letter:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [selectedLetter])

  // Clear doodle draft from write page on mount so it doesn't bleed in
  useEffect(() => {
    try {
      localStorage.removeItem('hearth_doodle_draft')
    } catch {
      // ignore
    }
  }, [])

  // Fetch user's letters + received letters
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const res = await fetch('/api/letters/mine')
        if (res.ok) {
          const data = await res.json()
          setMyLetters(data.letters)
        }
      } catch (error) {
        console.error('Failed to fetch letters:', error)
      }
    }

    const fetchReceived = async () => {
      try {
        const res = await fetch('/api/letters/received')
        if (res.ok) {
          const data = await res.json()
          setReceivedLetters(data.letters || [])
        }
      } catch (err) {
        console.error('Failed to fetch received letters:', err)
      }
    }

    fetchLetters()
    fetchReceived()
  }, [showSuccess]) // Refetch after sending a new letter

  const handleSendLetter = async () => {
    if (!letterText.trim() || letterText === '<p></p>') return
    if (recipientType === 'friend' && (!friendEmail.trim() || !friendName.trim())) return

    setSaving(true)
    try {
      // Prepare photos array
      const photos = []
      if (photoTopRight) {
        photos.push({ url: photoTopRight, position: 1, spread: 1, rotation: 7 })
      }
      if (photoBottomLeft) {
        photos.push({ url: photoBottomLeft, position: 2, spread: 1, rotation: -7 })
      }

      // Prepare entry data
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
        photos,
        song: songLink || null,
        doodles: doodleStrokes.length > 0
          ? [{ strokes: doodleStrokes, positionInEntry: 0 }]
          : [],
      }

      // Encrypt if E2EE is ready
      const finalData = await encryptEntryData(entryData)

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      if (res.ok) {
        // Store success data before animation
        setSuccessData({
          recipientType,
          recipientName: friendName,
          unlockDate,
        })

        // Reset new state
        setSongLink('')
        setDoodleStrokes([])
        setSelectedCard(null)

        // Close drawer and trigger animation
        setShowDrawer(false)
        setShowAnimation(true)
      }
    } catch (error) {
      console.error('Failed to send letter:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    setShowSuccess(true)
  }

  const handleWriteAnother = () => {
    setShowSuccess(false)
    setSuccessData(null)
    setLetterText('')
    setFriendEmail('')
    setFriendName('')
    setSenderName('')
    setLocation('')
    setUnlockDate(addWeeks(new Date(), 1))
    setCustomDate('')
    setShowDatePicker(false)
    setRecipientType('self')
    setPhotoTopRight(null)
    setPhotoBottomLeft(null)
    setShowDrawer(false)
    setSongLink('')
    setDoodleStrokes([])
    setSelectedCard(null)
  }

  const handleCustomDateChange = (dateStr: string) => {
    setCustomDate(dateStr)
    if (dateStr) {
      const date = new Date(dateStr)
      // For self: minimum tomorrow, for friend: minimum 1 week
      const minDate = recipientType === 'self'
        ? addDays(new Date(), 1)
        : addDays(new Date(), 7)
      // Compare dates only (ignore time) by using startOfDay
      if (!isNaN(date.getTime()) && !isBefore(startOfDay(date), startOfDay(minDate))) {
        setUnlockDate(date)
        setShowDatePicker(false)
      }
    }
  }

  // Get minimum date based on recipient type
  const getMinDate = () => {
    return recipientType === 'self'
      ? addDays(new Date(), 1) // Tomorrow for self
      : addDays(new Date(), 7) // 1 week for friends
  }

  // Color theming based on letter type
  const letterColors = selectedCard === 'friend'
    ? { accent: 'rgba(100,140,200', warm: 'rgba(120,160,220', border: 'rgba(100,140,200,0.4)', glow: 'rgba(100,140,200,0.15)' }
    : { accent: 'rgba(232,148,90', warm: 'rgba(232,168,80', border: 'rgba(232,148,90,0.4)', glow: 'rgba(232,148,90,0.15)' }

  const hasContent = letterText.trim() && letterText !== '<p></p>'
  const canSend = hasContent && (
    recipientType === 'self' ||
    (friendEmail.trim() && friendName.trim())
  )

  // Show success state
  if (showSuccess && successData) {
    return (
      <div className="max-w-2xl mx-auto">
        <SuccessMessage
          recipientType={successData.recipientType}
          recipientName={successData.recipientName}
          unlockDate={successData.unlockDate}
          onWriteAnother={handleWriteAnother}
        />
      </div>
    )
  }

  return (
    <>
      {/* Sent to universe animation */}
      <AnimatePresence>
        {showAnimation && (
          <FloatingEnvelope onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>

      {/* Main area — fits viewport */}
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 7rem)' }}>
        {/* Header - compact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center mb-3 shrink-0"
        >
          <h1
            className="text-2xl font-light tracking-wide mb-1"
            style={{ color: theme.text.primary }}
          >
            Write a Letter
          </h1>
          <p className="text-xs" style={{ color: theme.text.muted }}>
            Words that travel through time
          </p>
          <Link href="/new-letters">
            <motion.span
              className="inline-block mt-2 text-xs px-3 py-1 rounded-full cursor-pointer"
              style={{
                background: 'rgba(139,105,20,0.1)',
                color: '#8B6914',
                border: '1px solid rgba(139,105,20,0.2)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try the Postcard view &#x2192;
            </motion.span>
          </Link>
        </motion.div>

        {/* Hero Cards — pick letter type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 mb-4 shrink-0"
        >
          {/* Card 1: Letter to Future Self */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedCard(selectedCard === 'self' ? null : 'self')
              setRecipientType('self')
            }}
            className="rounded-2xl p-5 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(232,148,90,0.15), rgba(232,168,80,0.08))',
              border: selectedCard === 'self'
                ? '1px solid rgba(232,148,90,0.5)'
                : `1px solid ${theme.glass.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">✉️</span>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
                  Letter to Future Self
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.text.muted }}>
                  Write to the person you&apos;re becoming. Seal your words in time — they&apos;ll find you when the moment is right.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Letter to a Friend */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedCard(selectedCard === 'friend' ? null : 'friend')
              setRecipientType('friend')
            }}
            className="rounded-2xl p-5 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(100,140,200,0.15), rgba(120,160,220,0.08))',
              border: selectedCard === 'friend'
                ? '1px solid rgba(100,140,200,0.5)'
                : `1px solid ${theme.glass.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
                  Letter to a Friend
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.text.muted }}>
                  Send your heart across the distance. A letter that arrives not when it&apos;s sent, but when it&apos;s meant to.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Writing area OR Archive — share the same flex-1 space */}
        <AnimatePresence mode="wait">
          {selectedCard ? (
            <motion.div
              key="writing-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Editor area */}
              <div className="flex-1 min-h-0 flex flex-col mb-3">
                {/* Envelope Header — colored by letter type */}
                <motion.div
                  className="rounded-t-2xl p-3 border-b-0 shrink-0"
                  animate={{
                    background: `linear-gradient(135deg, ${letterColors.accent},0.2), ${letterColors.warm},0.1))`,
                    borderColor: letterColors.border,
                  }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: `linear-gradient(135deg, ${letterColors.accent},0.2), ${letterColors.warm},0.1))`,
                    borderLeft: `1px solid ${letterColors.border}`,
                    borderRight: `1px solid ${letterColors.border}`,
                    borderTop: `1px solid ${letterColors.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: theme.text.muted }}>
                      {recipientType === 'self'
                        ? profile.nickname ? `Dear future ${profile.nickname},` : 'Dear future me,'
                        : friendName ? `Dear ${friendName},` : 'Dear friend,'
                      }
                    </span>
                    <span className="text-2xl">{recipientType === 'self' ? '✨' : '💌'}</span>
                  </div>
                </motion.div>

                {/* Editor with photos — border colored by letter type */}
                <div
                  className="rounded-b-2xl flex-1 min-h-0 flex flex-col relative"
                  style={{
                    background: theme.glass.bg,
                    backdropFilter: `blur(${theme.glass.blur})`,
                    borderLeft: `1px solid ${letterColors.border}`,
                    borderRight: `1px solid ${letterColors.border}`,
                    borderBottom: `1px solid ${letterColors.border}`,
                    overflow: 'visible',
                  }}
                >
                  {/* Collage Photos */}
                  <CollagePhoto
                    position="top-right"
                    photo={photoTopRight}
                    onPhotoChange={setPhotoTopRight}
                  />
                  <CollagePhoto
                    position="bottom-left"
                    photo={photoBottomLeft}
                    onPhotoChange={setPhotoBottomLeft}
                  />

                  <Editor
                    prompt={recipientType === 'self'
                      ? "What would you like to tell your future self?"
                      : "Write your letter... share your thoughts, feelings, the moment you're in."
                    }
                    value={letterText}
                    onChange={setLetterText}
                    flexible
                  />
                </div>

                {/* Action bar: doodle + song */}
                <div className="flex items-center gap-3 mt-3 px-4">
                  {/* Doodle button / preview */}
                  {doodleStrokes.length > 0 ? (
                    <button onClick={() => setShowDoodle(true)} className="relative group">
                      <DoodlePreview strokes={doodleStrokes} size={44} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowDoodle(true)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'rgba(255,255,255,0.1)', color: theme.text.secondary }}
                    >
                      ✎
                    </button>
                  )}

                  {/* Song input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={songLink}
                      onChange={(e) => setSongLink(e.target.value)}
                      placeholder="Paste a song link..."
                      className="w-full bg-transparent text-sm px-3 py-2 rounded-lg outline-none"
                      style={{
                        border: `1px solid ${theme.glass.border}`,
                        color: theme.text.primary,
                      }}
                    />
                  </div>
                </div>

                {/* Song embed preview */}
                {songLink && isMusicUrl(songLink) && (
                  <div className="mt-3 px-4">
                    <SongEmbed url={songLink} compact />
                  </div>
                )}
              </div>

              {/* Bottom bar: Ready to send trigger OR empty hint */}
              <div className="shrink-0 pb-1">
                {hasContent ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowDrawer(true)}
                    className="w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${letterColors.accent},0.25), ${letterColors.warm},0.2))`,
                      border: `1px solid ${letterColors.border}`,
                      color: theme.text.primary,
                    }}
                  >
                    <motion.span
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ▲
                    </motion.span>
                    <span>Ready to send</span>
                    <span>✨</span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center py-3"
                  >
                    <p className="text-sm" style={{ color: theme.text.muted }}>
                      {recipientType === 'self'
                        ? "Write words your future self needs to hear..."
                        : "Share a moment, a feeling, a memory with someone special..."
                      }
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Archive — shown when no card is selected */
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 min-h-0 overflow-y-auto mt-2 space-y-6 pb-4"
            >

        {/* Letters to Myself */}
        {(() => {
          const selfLetters = myLetters.filter(l => !l.recipientEmail)
          if (selfLetters.length === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                Letters to Myself
              </h2>
              <div className="space-y-3">
                {selfLetters.map((letter, index) => {
                  const arrived = letter.hasArrived
                  const unlockStr = letter.unlockDate
                    ? format(new Date(letter.unlockDate), 'MMM d, yyyy')
                    : null
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
                              {arrived
                                ? 'Arrived'
                                : unlockStr ? `Arriving ${unlockStr}` : 'Traveling through time'}
                            </p>
                          </div>
                        </div>
                        {arrived && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            background: `${theme.accent.warm}20`,
                            color: theme.accent.warm,
                          }}>
                            Open
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })()}

        {/* Letters to Friends */}
        {(() => {
          const friendLetters = myLetters.filter(l => l.recipientEmail)
          if (friendLetters.length === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-base font-light mb-4 px-1" style={{ color: theme.text.secondary }}>
                Letters to Friends
              </h2>
              <div className="space-y-3">
                {friendLetters.map((letter, index) => {
                  const unlockStr = letter.unlockDate
                    ? format(new Date(letter.unlockDate), 'MMM d, yyyy')
                    : null
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
                        background: `linear-gradient(135deg, rgba(100,140,200,0.1), rgba(120,160,220,0.05))`,
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
            </motion.div>
          )
        })()}

        {/* Letters from the past (self-letters that arrived) */}
        {(() => {
          const arrivedSelf = myLetters.filter(l => !l.recipientEmail && l.hasArrived)
          if (arrivedSelf.length === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-4 border-t"
              style={{ borderColor: theme.glass.border }}
            >
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
                      }}>
                        Read
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })()}

        {/* Letters from friends (received) */}
        {(() => {
          const arrivedFromFriends = receivedLetters.filter((l: any) => l.hasArrived)
          if (arrivedFromFriends.length === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-4 border-t"
              style={{ borderColor: theme.glass.border }}
            >
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
                      background: `linear-gradient(135deg, rgba(100,140,200,0.12), rgba(120,160,220,0.06))`,
                      border: `1px solid rgba(100,140,200,0.3)`,
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
                      }}>
                        Open
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })()}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Send Modal */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowDrawer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: theme.bg.primary,
                border: `1px solid ${theme.glass.border}`,
                boxShadow: `0 24px 50px rgba(0,0,0,0.4), 0 0 80px ${theme.accent.primary}10`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-6">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-light" style={{ color: theme.text.primary }}>
                    {recipientType === 'self' ? 'Send to the Universe' : 'Send to a Friend'}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDrawer(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: theme.glass.bg,
                      color: theme.text.muted,
                    }}
                  >
                    x
                  </motion.button>
                </div>

                {/* Friend fields */}
                {recipientType === 'friend' && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: theme.text.muted }}>
                          Friend&apos;s name *
                        </label>
                        <input
                          type="text"
                          value={friendName}
                          onChange={(e) => setFriendName(e.target.value)}
                          placeholder="Their name"
                          className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                          style={{
                            border: `1px solid ${theme.glass.border}`,
                            color: theme.text.primary,
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: theme.text.muted }}>
                          Friend&apos;s email *
                        </label>
                        <input
                          type="email"
                          value={friendEmail}
                          onChange={(e) => setFriendEmail(e.target.value)}
                          placeholder="friend@email.com"
                          className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                          style={{
                            border: `1px solid ${theme.glass.border}`,
                            color: theme.text.primary,
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: theme.text.muted }}>
                          Sign as (optional)
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="How you want to be known"
                          className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                          style={{
                            border: `1px solid ${theme.glass.border}`,
                            color: theme.text.primary,
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: theme.text.muted }}>
                          Writing from (optional)
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., Himachal Pradesh"
                          className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                          style={{
                            border: `1px solid ${theme.glass.border}`,
                            color: theme.text.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Location for self letters */}
                {recipientType === 'self' && (
                  <div className="mb-4">
                    <label className="block text-xs mb-1.5" style={{ color: theme.text.muted }}>
                      Writing from (optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Home, Himachal Pradesh, a quiet cafe..."
                      className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                      style={{
                        border: `1px solid ${theme.glass.border}`,
                        color: theme.text.primary,
                      }}
                    />
                  </div>
                )}

                {/* Date selection */}
                <p className="text-sm mb-2" style={{ color: theme.text.muted }}>
                  {recipientType === 'self'
                    ? 'When should this letter find you?'
                    : 'When should this letter arrive?'
                  }
                </p>

                {/* Quick Options */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {unlockOptions.map((option) => {
                    const optionDate = option.getValue()
                    const isSelected = format(unlockDate, 'yyyy-MM-dd') === format(optionDate, 'yyyy-MM-dd')

                    return (
                      <motion.button
                        key={option.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setUnlockDate(optionDate)
                          setShowDatePicker(false)
                          setCustomDate('')
                        }}
                        className="px-3 py-1.5 rounded-full text-sm"
                        style={{
                          background: isSelected ? `${theme.accent.primary}30` : theme.glass.bg,
                          border: `1px solid ${isSelected ? theme.accent.primary : theme.glass.border}`,
                          color: theme.text.primary,
                        }}
                      >
                        {option.label}
                      </motion.button>
                    )
                  })}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDatePicker(true)}
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{
                      background: theme.glass.bg,
                      border: `1px solid ${theme.glass.border}`,
                      color: theme.text.primary,
                    }}
                  >
                    Pick date
                  </motion.button>
                </div>

                {/* Date Picker Modal */}
                <DatePicker
                  value={customDate}
                  onChange={handleCustomDateChange}
                  minDate={getMinDate()}
                  mode="modal"
                  isOpen={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                />

                {/* Selected Date Display */}
                <div
                  className="mb-4 p-2.5 rounded-xl"
                  style={{ background: `${theme.accent.warm}15` }}
                >
                  <span className="text-sm" style={{ color: theme.text.primary }}>
                    {recipientType === 'self'
                      ? 'This letter will find you on '
                      : `${friendName || 'Your friend'} will receive this on `
                    }
                    <strong>{format(unlockDate, 'MMMM d, yyyy')}</strong>
                  </span>
                </div>

                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: canSend ? 1.02 : 1 }}
                  whileTap={{ scale: canSend ? 0.98 : 1 }}
                  onClick={handleSendLetter}
                  disabled={saving || !canSend}
                  className="w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                  style={{
                    background: canSend ? theme.accent.primary : theme.glass.bg,
                    color: canSend ? theme.bg.primary : theme.text.muted,
                    opacity: saving ? 0.5 : 1,
                    cursor: canSend ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? (
                    'Preparing...'
                  ) : (
                    <>
                      <span>Send to the Universe</span>
                      <span>✨</span>
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-center mt-2" style={{ color: theme.text.muted }}>
                  Once sent, this letter will disappear until {recipientType === 'self' ? 'it finds you again' : 'it arrives'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doodle Canvas Modal */}
      <AnimatePresence>
        {showDoodle && (
          <DoodleCanvas
            onSave={(strokes) => { setDoodleStrokes(strokes); setShowDoodle(false) }}
            onClose={() => setShowDoodle(false)}
            initialStrokes={doodleStrokes}
          />
        )}
      </AnimatePresence>

      {/* Letter Reading Modal - Postcard Design */}
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
              style={{
                width: '95vw',
                maxWidth: '900px',
                maxHeight: 'calc(100vh - 104px)',
                perspective: '1000px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Postcard container */}
              <div
                className="relative rounded-sm flex-1 flex flex-col overflow-hidden min-h-0"
                style={{
                  background: '#f5f0e6',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid #e0d5c5',
                }}
              >
                {/* Paper texture overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Fold line in the middle */}
                <div
                  className="absolute left-[5%] right-[5%] top-1/2 h-px pointer-events-none"
                  style={{
                    background: 'rgba(139,115,85,0.08)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.5)',
                  }}
                />

                {/* Postcard header with stamp and postmark */}
                <div className="relative pt-4 pb-3 px-6 shrink-0">
                  {/* Stamp and Postmark row */}
                  <div className="flex justify-between items-start mb-4">
                    {/* Left side - decorative */}
                    <div
                      className="text-xs uppercase tracking-widest"
                      style={{ color: 'rgba(139,115,85,0.5)' }}
                    >
                      Postcard
                    </div>

                    {/* Right side - Stamp and Postmark */}
                    <div className="flex items-start gap-2">
                      {/* Postmark */}
                      <div
                        className="relative flex items-center justify-center"
                        style={{
                          width: 70,
                          height: 70,
                          transform: 'rotate(-12deg)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: '3px solid rgba(139, 69, 69, 0.5)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 6,
                            borderRadius: '50%',
                            border: '2px solid rgba(139, 69, 69, 0.4)',
                          }}
                        />
                        <div className="text-center" style={{ color: 'rgba(139, 69, 69, 0.6)' }}>
                          <div style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>
                            {(selectedLetter.letterLocation || 'SOMEWHERE').toUpperCase().slice(0, 8)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                            {format(new Date(selectedLetter.createdAt), 'dd.MM.yy')}
                          </div>
                        </div>
                      </div>
                      {/* Stamp */}
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

                {/* Divider line */}
                <div
                  className="mx-6 h-px"
                  style={{ background: 'rgba(139,115,85,0.15)' }}
                />

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {/* Salutation with animation */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-caveat), 'Caveat', cursive",
                        fontSize: '28px',
                        color: '#2a2520',
                      }}
                    >
                      Dear future {profile.nickname || 'me'},
                    </p>
                  </motion.div>

                  {/* Content with ink writing effect */}
                  <InkWriteText text={selectedLetter.text} delay={0.5} />

                  {/* Signature with animation */}
                  <motion.div
                    className="mt-8 text-right"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-caveat), 'Caveat', cursive",
                        fontSize: '22px',
                        color: '#4a3f35',
                      }}
                    >
                      — Past {profile.nickname || 'me'}
                    </p>
                    <p
                      className="text-xs mt-1 italic"
                      style={{ color: 'rgba(139,115,85,0.6)' }}
                    >
                      {format(new Date(selectedLetter.createdAt), 'MMMM d, yyyy')}
                      {selectedLetter.letterLocation && ` • ${selectedLetter.letterLocation}`}
                    </p>
                  </motion.div>

                  {/* Photos */}
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
                          <img
                            src={photo.url}
                            alt=""
                            style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Doodle */}
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

                  {/* Song */}
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

                {/* Decorative bottom edge */}
                <div
                  className="h-3 shrink-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(139,115,85,0.06), transparent)',
                  }}
                />
              </div>

              {/* Action buttons */}
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
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ✦
                      </motion.span>
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

              {/* Hidden capture element - Postcard style for download */}
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
                {/* Paper texture overlay */}
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

                {/* Header with stamp area */}
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
                    {/* Postmark */}
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
                      <div
                        style={{
                          position: 'absolute',
                          inset: '4px',
                          borderRadius: '50%',
                          border: '2px solid rgba(139,69,69,0.3)',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: 'rgba(139,69,69,0.6)', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {(selectedLetter.letterLocation || 'SOMEWHERE').toUpperCase().slice(0, 8)}
                      </span>
                      <span style={{ fontSize: '14px', color: 'rgba(139,69,69,0.6)', fontWeight: 'bold', marginTop: '2px' }}>
                        {format(new Date(selectedLetter.createdAt), 'dd.MM.yy')}
                      </span>
                    </div>
                    {/* Stamp */}
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

                {/* Content */}
                <div style={{ position: 'relative', padding: '12px 0' }}>
                  <p
                    style={{
                      fontSize: '32px',
                      fontFamily: "var(--font-caveat), 'Caveat', cursive",
                      color: '#2a2520',
                      marginBottom: '24px',
                    }}
                  >
                    Dear future {profile.nickname || 'me'},
                  </p>

                  <div
                    style={{
                      fontFamily: "var(--font-caveat), 'Caveat', cursive",
                      fontSize: '26px',
                      lineHeight: 1.9,
                      color: '#2a2520',
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedLetter.text }}
                  />

                  <div style={{ marginTop: '40px', textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '26px',
                        fontFamily: "var(--font-caveat), 'Caveat', cursive",
                        color: '#4a3f35',
                      }}
                    >
                      — Past {profile.nickname || 'me'}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        marginTop: '6px',
                        color: 'rgba(139,115,85,0.6)',
                        fontStyle: 'italic',
                      }}
                    >
                      {format(new Date(selectedLetter.createdAt), 'MMMM d, yyyy')}
                      {selectedLetter.letterLocation && ` • ${selectedLetter.letterLocation}`}
                    </p>
                  </div>

                  {/* Photos for download */}
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
                          <img
                            src={photo.url}
                            alt=""
                            style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Doodle for download */}
                  {(selectedLetter as any).doodles?.length > 0 && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                      <DoodlePreview strokes={(selectedLetter as any).doodles[0].strokes} size={200} />
                    </div>
                  )}
                </div>

                {/* Footer */}
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
