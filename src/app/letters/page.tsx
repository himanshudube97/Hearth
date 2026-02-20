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

// Twinkling background star
function BackgroundStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: 'white',
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.3, 0.8, 0.3, 0],
        scale: [0.5, 1, 1.2, 1, 0.5],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Shooting star that flies across the screen
function ShootingStar({ delay, startX, startY }: { delay: number; startX: number; startY: number }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, 150, 300],
        y: [0, 100, 200],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: 'easeOut',
      }}
    >
      {/* Star head */}
      <div
        className="w-2 h-2 rounded-full"
        style={{
          background: 'white',
          boxShadow: '0 0 10px 4px rgba(255,255,255,0.8), 0 0 20px 8px rgba(255,220,180,0.4)',
        }}
      />
      {/* Trail */}
      <motion.div
        className="absolute top-1/2 right-full h-px"
        style={{
          background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)',
          width: 60,
          transformOrigin: 'right center',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 0.5], opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      />
    </motion.div>
  )
}

// Particle that bursts from the envelope
function BurstParticle({ delay, angle, distance, color }: {
  delay: number; angle: number; distance: number; color: string
}) {
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        left: '50%',
        top: '50%',
        background: color,
        boxShadow: `0 0 6px 2px ${color}`,
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, x * 0.3, x * 0.7, x],
        y: [0, y * 0.3 - 20, y * 0.7 - 50, y - 100],
        scale: [0, 1.5, 1, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  )
}

// Orbital ring around the envelope
function OrbitalRing({ radius, duration, delay, clockwise }: {
  radius: number; duration: number; delay: number; clockwise: boolean
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: radius * 2,
        height: radius * 2,
        left: '50%',
        top: '50%',
        marginLeft: -radius,
        marginTop: -radius,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
      animate={{
        opacity: [0, 0.6, 0.3, 0],
        scale: [0.5, 1, 1.5, 2],
        rotate: clockwise ? [0, 180, 360] : [0, -180, -360],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    >
      {/* Orbiting dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: 'white',
          boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)',
          top: -4,
          left: '50%',
          marginLeft: -4,
        }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration, delay, ease: 'easeOut' }}
      />
    </motion.div>
  )
}

// Nebula cloud effect
function NebulaCloud({ x, y, size, color, delay }: {
  x: number; y: number; size: number; color: string; delay: number
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}30 0%, ${color}10 40%, transparent 70%)`,
        filter: 'blur(30px)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.6, 0.4, 0],
        scale: [0.5, 1.2, 1.5, 2],
        x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100],
        y: [-50, -150],
      }}
      transition={{
        duration: 4,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

// Main envelope animation
function FloatingEnvelope({ onComplete }: { onComplete: () => void }) {
  const { theme } = useThemeStore()
  const [phase, setPhase] = useState<'rise' | 'burst' | 'fade'>('rise')

  useEffect(() => {
    const riseTimer = setTimeout(() => setPhase('burst'), 2000)
    const fadeTimer = setTimeout(() => setPhase('fade'), 4000)
    const completeTimer = setTimeout(onComplete, 9000) // Hold final message for 5 seconds
    return () => {
      clearTimeout(riseTimer)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  // Background stars
  const backgroundStars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 2,
  }))

  // Shooting stars
  const shootingStars = [
    { id: 1, delay: 0.5, startX: 10, startY: 20 },
    { id: 2, delay: 1.5, startX: 70, startY: 10 },
    { id: 3, delay: 2.5, startX: 30, startY: 5 },
    { id: 4, delay: 3.5, startX: 80, startY: 30 },
  ]

  // Burst particles (created when envelope transforms)
  const burstParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * Math.PI * 2,
    distance: 80 + Math.random() * 120,
    delay: 1.8 + Math.random() * 0.3,
    color: i % 3 === 0 ? theme.accent.warm : i % 3 === 1 ? theme.accent.primary : '#ffffff',
  }))

  // Orbital rings
  const orbitalRings = [
    { id: 1, radius: 60, duration: 3, delay: 0.5, clockwise: true },
    { id: 2, radius: 90, duration: 3.5, delay: 0.8, clockwise: false },
    { id: 3, radius: 120, duration: 4, delay: 1.1, clockwise: true },
  ]

  // Nebula clouds
  const nebulaClouds = [
    { id: 1, x: 45, y: 45, size: 200, color: theme.accent.warm, delay: 1.8 },
    { id: 2, x: 55, y: 50, size: 180, color: theme.accent.primary, delay: 2 },
    { id: 3, x: 50, y: 55, size: 160, color: '#9D8CFF', delay: 2.2 },
  ]

  // Message sequence
  const messages = [
    { text: 'Sealing your words...', delay: 0, duration: 1.8 },
    { text: 'Releasing to the cosmos...', delay: 1.8, duration: 1.8 },
    { text: 'Traveling through time...', delay: 3.6, duration: 1.8 },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'radial-gradient(ellipse at center, #050508 0%, #020204 50%, #000000 100%)',
      }}
    >
      {/* Deep space background gradient - subtle colored hints */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${theme.accent.primary}05 0%, transparent 40%),
                       radial-gradient(ellipse at 70% 80%, ${theme.accent.warm}03 0%, transparent 40%)`,
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Background stars */}
      {backgroundStars.map((star) => (
        <BackgroundStar key={star.id} {...star} />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((star) => (
        <ShootingStar key={star.id} {...star} />
      ))}

      {/* Nebula clouds (appear during burst) */}
      <AnimatePresence>
        {phase !== 'rise' && nebulaClouds.map((cloud) => (
          <NebulaCloud key={cloud.id} {...cloud} />
        ))}
      </AnimatePresence>

      {/* Orbital rings */}
      {orbitalRings.map((ring) => (
        <OrbitalRing key={ring.id} {...ring} />
      ))}

      {/* Burst particles */}
      <AnimatePresence>
        {phase !== 'rise' && burstParticles.map((particle) => (
          <BurstParticle key={particle.id} {...particle} />
        ))}
      </AnimatePresence>

      {/* Central envelope */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{
          scale: phase === 'rise' ? [0.8, 1, 1.05] : phase === 'burst' ? [1.05, 1.2, 0] : 0,
          y: phase === 'rise' ? [50, 0, -10] : phase === 'burst' ? [-10, -80, -200] : -200,
          opacity: phase === 'rise' ? [0, 1, 1] : phase === 'burst' ? [1, 0.8, 0] : 0,
          rotate: phase === 'rise' ? [0, -3, 3] : [3, 0, -5],
        }}
        transition={{
          duration: phase === 'rise' ? 1.8 : 1.7,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Multi-layer glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `radial-gradient(circle, ${theme.accent.warm}50 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'scale(2)',
          }}
          animate={{
            opacity: phase === 'burst' ? [0.8, 1, 0] : [0.4, 0.6, 0.4],
            scale: phase === 'burst' ? [2, 4, 6] : [2, 2.2, 2],
          }}
          transition={{
            duration: phase === 'burst' ? 1.5 : 2,
            repeat: phase === 'burst' ? 0 : Infinity,
            ease: 'easeOut',
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `radial-gradient(circle, ${theme.accent.primary}40 0%, transparent 60%)`,
            filter: 'blur(20px)',
            transform: 'scale(1.5)',
          }}
          animate={{
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Envelope container */}
        <motion.div
          className="relative px-16 py-12 rounded-3xl"
          style={{
            background: `linear-gradient(145deg, ${theme.accent.warm}25, ${theme.accent.primary}15, rgba(255,255,255,0.05))`,
            border: `2px solid ${theme.accent.warm}40`,
            boxShadow: `
              0 0 30px ${theme.accent.warm}30,
              0 0 60px ${theme.accent.primary}20,
              inset 0 0 30px rgba(255,255,255,0.05)
            `,
          }}
          animate={{
            boxShadow: phase === 'burst'
              ? [
                  `0 0 30px ${theme.accent.warm}30, 0 0 60px ${theme.accent.primary}20`,
                  `0 0 80px ${theme.accent.warm}60, 0 0 120px ${theme.accent.primary}40`,
                  `0 0 150px ${theme.accent.warm}80, 0 0 200px ${theme.accent.primary}60`,
                ]
              : undefined,
          }}
          transition={{ duration: 1.5 }}
        >
          {/* Envelope icon with glow */}
          <motion.span
            className="text-7xl block"
            style={{
              filter: `drop-shadow(0 0 20px ${theme.accent.warm})`,
            }}
            animate={{
              filter: phase === 'burst'
                ? [
                    `drop-shadow(0 0 20px ${theme.accent.warm})`,
                    `drop-shadow(0 0 40px ${theme.accent.warm}) drop-shadow(0 0 60px white)`,
                  ]
                : `drop-shadow(0 0 20px ${theme.accent.warm})`,
            }}
            transition={{ duration: 1 }}
          >
            ✉
          </motion.span>

          {/* Sparkle effects on envelope */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + (i % 2) * 40}%`,
                boxShadow: '0 0 4px 2px white',
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Message sequence */}
      <div className="absolute bottom-1/4 left-0 right-0 text-center">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className="absolute inset-x-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [20, 0, 0, -10],
            }}
            transition={{
              duration: msg.duration,
              delay: msg.delay,
              times: [0, 0.2, 0.8, 1],
            }}
          >
            <p
              className="text-xl font-light tracking-widest"
              style={{
                color: theme.text.primary,
                textShadow: `0 0 20px ${theme.accent.warm}60`,
              }}
            >
              {msg.text}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Final fade message */}
      <motion.div
        className="absolute bottom-1/4 left-0 right-0 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'fade' ? 1 : 0 }}
        transition={{ duration: 0.5, delay: phase === 'fade' ? 0 : 0 }}
      >
        <motion.p
          className="text-2xl font-light tracking-wide mb-2"
          style={{ color: theme.text.primary }}
          animate={{ opacity: [0, 1], y: [20, 0] }}
          transition={{ duration: 0.8 }}
        >
          Your words are among the stars
        </motion.p>
        <motion.p
          className="text-sm"
          style={{ color: theme.text.muted }}
          animate={{ opacity: [0, 1], y: [10, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          They will find their way home
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

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

  // Fetch user's letters
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
    fetchLetters()
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

      {/* Main writing area - fits viewport, no scroll */}
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
        </motion.div>

        {/* Recipient Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex justify-center gap-2 mb-3 shrink-0"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRecipientType('self')}
            className="px-5 py-2 rounded-full text-sm flex items-center gap-2"
            style={{
              background: recipientType === 'self' ? `${theme.accent.primary}30` : theme.glass.bg,
              border: `1px solid ${recipientType === 'self' ? theme.accent.primary : theme.glass.border}`,
              color: theme.text.primary,
            }}
          >
            <span>✨</span>
            <span>To Future Me</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRecipientType('friend')}
            className="px-5 py-2 rounded-full text-sm flex items-center gap-2"
            style={{
              background: recipientType === 'friend' ? `${theme.accent.primary}30` : theme.glass.bg,
              border: `1px solid ${recipientType === 'friend' ? theme.accent.primary : theme.glass.border}`,
              color: theme.text.primary,
            }}
          >
            <span>💌</span>
            <span>To a Friend</span>
          </motion.button>
        </motion.div>

        {/* Editor area - flex-1, takes remaining space */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex-1 min-h-0 flex flex-col mb-3"
        >
          {/* Envelope Header */}
          <div
            className="rounded-t-2xl p-3 border-b-0 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${theme.accent.warm}20, ${theme.accent.primary}10)`,
              borderLeft: `1px solid ${theme.glass.border}`,
              borderRight: `1px solid ${theme.glass.border}`,
              borderTop: `1px solid ${theme.glass.border}`,
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
          </div>

          {/* Editor with photos */}
          <div
            className="rounded-b-2xl flex-1 min-h-0 flex flex-col relative overflow-hidden"
            style={{
              background: theme.glass.bg,
              backdropFilter: `blur(${theme.glass.blur})`,
              borderLeft: `1px solid ${theme.glass.border}`,
              borderRight: `1px solid ${theme.glass.border}`,
              borderBottom: `1px solid ${theme.glass.border}`,
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
        </motion.div>

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
                background: `linear-gradient(135deg, ${theme.accent.primary}25, ${theme.accent.warm}20)`,
                border: `1px solid ${theme.accent.primary}50`,
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
      </div>

      {/* Self Letters Sections - below the viewport-fit writing area */}
      <div className="max-w-2xl mx-auto">
        {recipientType === 'self' && (
          <>
            {/* Wandering Letters Count */}
            {(() => {
              const wanderingLetters = myLetters.filter(l => !l.recipientEmail && !l.hasArrived)
              if (wanderingLetters.length === 0) return null

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <motion.div
                    className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent.primary}08, ${theme.accent.warm}05)`,
                      border: `1px solid ${theme.glass.border}`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 20px ${theme.accent.primary}10`,
                        `0 0 30px ${theme.accent.warm}15`,
                        `0 0 20px ${theme.accent.primary}10`,
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.span
                      className="text-2xl"
                      animate={{ rotate: [0, 10, -10, 0], y: [0, -3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ✉️
                    </motion.span>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                        {wanderingLetters.length} {wanderingLetters.length === 1 ? 'letter' : 'letters'} to yourself
                      </p>
                      <p className="text-xs" style={{ color: theme.text.muted }}>
                        wandering through the universe, will find you in time
                      </p>
                    </div>
                    <motion.div
                      className="flex gap-1"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="text-xs"
                          style={{ color: theme.accent.warm }}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        >
                          ✦
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )
            })()}

            {/* Letters from the past */}
            {(() => {
              const viewedSelfLetters = myLetters.filter(l =>
                !l.recipientEmail && l.hasArrived && l.isViewed
              )

              if (viewedSelfLetters.length === 0) return null

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 pt-8 border-t"
                  style={{ borderColor: theme.glass.border }}
                >
                  <h2
                    className="text-lg font-light mb-6 text-center"
                    style={{ color: theme.text.secondary }}
                  >
                    Letters from the past
                  </h2>

                  <div className="space-y-3">
                    {viewedSelfLetters.map((letter, index) => (
                      <motion.div
                        key={letter.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSelectedLetter(letter)
                          setShowLetterModal(true)
                        }}
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
          </>
        )}
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

      {/* Letter Reading Modal - Postcard Design */}
      <AnimatePresence>
        {showLetterModal && selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
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
