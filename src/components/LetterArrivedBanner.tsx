'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useThemeStore } from '@/store/theme'

interface ArrivedLetter {
  id: string
  text: string
  createdAt: string
  unlockDate: string
  letterLocation: string | null
}

interface LetterArrivedBannerProps {
  nickname?: string
}

// Floating sparkle particles for reading phase
function FloatingSparkle({ delay, index }: { delay: number; index: number }) {
  const angle = (index / 12) * Math.PI * 2
  const distance = 150 + Math.random() * 100
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        width: 3,
        height: 3,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: [0, x * 0.5, x],
        y: [0, y * 0.5 - 30, y - 60],
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 2,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

// Magic particle for envelope opening
function MagicParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FFF8DC', '#FFFACD', '#F0E68C']
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <motion.div
      className="fixed pointer-events-none rounded-full"
      style={{
        left: `${x}%`,
        bottom: '30%',
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: -200 - Math.random() * 200,
        opacity: [0, 1, 1, 0],
        x: (Math.random() - 0.5) * 100,
      }}
      transition={{
        duration: 2 + Math.random() * 2,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

// Star burst effect for envelope opening
function StarBurst({ delay }: { delay: number }) {
  return (
    <motion.div
      className="fixed pointer-events-none text-4xl"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 2, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeOut',
      }}
    >
      ✨
    </motion.div>
  )
}

export default function LetterArrivedBanner({ nickname }: LetterArrivedBannerProps) {
  const { theme } = useThemeStore()
  const [arrivedLetters, setArrivedLetters] = useState<ArrivedLetter[]>([])
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [envelopePhase, setEnvelopePhase] = useState<'closed' | 'opening' | 'open' | 'reading'>('closed')
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number }[]>([])
  const [hasChecked, setHasChecked] = useState(false)

  // Check for arrived letters
  const checkForLetters = useCallback(async () => {
    try {
      const viewedIds = sessionStorage.getItem('viewedLetterIds')
      const viewedSet = viewedIds ? new Set(JSON.parse(viewedIds)) : new Set()

      const res = await fetch('/api/letters/arrived')
      if (res.ok) {
        const data = await res.json()
        const unviewedLetters = data.letters.filter(
          (letter: ArrivedLetter) => !viewedSet.has(letter.id)
        )
        setArrivedLetters(unviewedLetters)
      }
    } catch (error) {
      console.error('Failed to check for arrived letters:', error)
    } finally {
      setHasChecked(true)
    }
  }, [])

  useEffect(() => {
    if (!hasChecked) {
      checkForLetters()
    }
  }, [checkForLetters, hasChecked])

  const handleOpenLetter = () => {
    setShowModal(true)
    setEnvelopePhase('closed')

    // Generate particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      delay: 1.5 + Math.random() * 0.5,
    }))
    setParticles(newParticles)

    // Animate through phases
    setTimeout(() => setEnvelopePhase('opening'), 500)
    setTimeout(() => setEnvelopePhase('open'), 1500)
    setTimeout(() => setEnvelopePhase('reading'), 2500)
  }

  const handleCloseLetter = () => {
    const currentLetter = arrivedLetters[currentLetterIndex]
    if (currentLetter) {
      const viewedIds = sessionStorage.getItem('viewedLetterIds')
      const viewedSet = viewedIds ? new Set(JSON.parse(viewedIds)) : new Set()
      viewedSet.add(currentLetter.id)
      sessionStorage.setItem('viewedLetterIds', JSON.stringify([...viewedSet]))
    }

    if (currentLetterIndex < arrivedLetters.length - 1) {
      setCurrentLetterIndex(currentLetterIndex + 1)
      setEnvelopePhase('closed')
      setTimeout(() => setEnvelopePhase('opening'), 500)
      setTimeout(() => setEnvelopePhase('open'), 1500)
      setTimeout(() => setEnvelopePhase('reading'), 2500)
    } else {
      setShowModal(false)
      setEnvelopePhase('closed')
      setParticles([])
      setArrivedLetters([])
    }
  }

  const currentLetter = arrivedLetters[currentLetterIndex]

  // Don't render if no letters
  if (arrivedLetters.length === 0) return null

  const displayName = nickname || 'me'

  return (
    <>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <motion.button
          onClick={handleOpenLetter}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 rounded-2xl text-center cursor-pointer relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.accent.primary}20, ${theme.accent.warm}20)`,
            border: `1px solid ${theme.accent.primary}40`,
          }}
        >
          {/* Subtle shimmer effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent.warm}10, transparent)`,
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            animate={{
              y: [0, -5, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-3xl mb-2"
          >
            ✉️
          </motion.div>
          <h2
            className="text-lg font-medium mb-1"
            style={{ color: theme.text.primary }}
          >
            A letter from the past has arrived
          </h2>
          <p
            className="text-sm"
            style={{ color: theme.text.muted }}
          >
            {arrivedLetters.length > 1
              ? `${arrivedLetters.length} letters are waiting for you`
              : 'tap to open'
            }
          </p>
        </motion.button>
      </motion.div>

      {/* Modal with envelope animation */}
      <AnimatePresence>
        {showModal && currentLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(5,5,15,0.98)' }}
          >
            {/* Magic particles */}
            {particles.map((p) => (
              <MagicParticle key={p.id} delay={p.delay} x={p.x} />
            ))}

            {/* Star bursts */}
            {envelopePhase === 'open' && (
              <>
                <StarBurst delay={0} />
                <StarBurst delay={0.2} />
                <StarBurst delay={0.4} />
              </>
            )}

            {/* Envelope animation container */}
            <div className="relative flex items-center justify-center w-full h-full p-4 overflow-hidden">

              {/* Closed/Opening Envelope */}
              <AnimatePresence>
                {(envelopePhase === 'closed' || envelopePhase === 'opening') && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {/* Envelope body */}
                    <motion.div
                      className="w-64 h-44 relative"
                      style={{
                        background: `linear-gradient(135deg, ${theme.accent.warm}40, ${theme.accent.primary}30)`,
                        borderRadius: 8,
                        border: `2px solid ${theme.accent.warm}60`,
                      }}
                    >
                      {/* Envelope flap */}
                      <motion.div
                        className="absolute -top-px left-0 right-0"
                        style={{
                          height: 80,
                          background: `linear-gradient(135deg, ${theme.accent.warm}50, ${theme.accent.primary}40)`,
                          borderRadius: '8px 8px 0 0',
                          transformOrigin: 'top center',
                          clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                          border: `2px solid ${theme.accent.warm}60`,
                        }}
                        animate={{
                          rotateX: envelopePhase === 'opening' ? 180 : 0,
                        }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                      />

                      {/* Wax seal */}
                      <motion.div
                        className="absolute top-12 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, #c41e3a, #8b0000)`,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        }}
                        animate={{
                          scale: envelopePhase === 'opening' ? [1, 1.2, 0] : 1,
                          opacity: envelopePhase === 'opening' ? [1, 1, 0] : 1,
                        }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        ♥
                      </motion.div>

                      {/* Letter peeking out */}
                      <motion.div
                        className="absolute top-4 left-4 right-4 bottom-4 rounded"
                        style={{
                          background: theme.bg.secondary,
                          border: `1px solid ${theme.glass.border}`,
                        }}
                        animate={{
                          y: envelopePhase === 'opening' ? -60 : 0,
                        }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </motion.div>

                    <motion.p
                      className="text-center mt-6 text-lg"
                      style={{ color: theme.text.muted }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {envelopePhase === 'closed' ? 'opening...' : 'revealing...'}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Open state - show glow */}
              <AnimatePresence>
                {envelopePhase === 'open' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1 }}
                    className="absolute w-32 h-32 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${theme.accent.warm}80, transparent)`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Reading phase - Letter content */}
              <AnimatePresence>
                {envelopePhase === 'reading' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="relative mx-4 flex flex-col items-center overflow-hidden"
                    style={{
                      width: '90vw',
                      maxWidth: '650px',
                      height: '85vh',
                      maxHeight: '850px',
                    }}
                  >
                    {/* Floating sparkles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <FloatingSparkle key={i} delay={0.1 * i} index={i} />
                    ))}

                    {/* Paper letter design - A4 proportions */}
                    <motion.div
                      initial={{ rotateX: -10 }}
                      animate={{ rotateX: 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative flex-1 w-full flex flex-col overflow-hidden min-h-0"
                      style={{ perspective: '1000px' }}
                    >
                      {/* Paper shadow */}
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          filter: 'blur(20px)',
                          transform: 'translateY(10px)',
                        }}
                      />

                      {/* Main paper */}
                      <div
                        className="relative rounded-lg flex-1 flex flex-col overflow-hidden min-h-0"
                        style={{
                          background: 'linear-gradient(165deg, #faf8f5 0%, #f5f0e8 50%, #efe8dc 100%)',
                          boxShadow: `
                            0 2px 4px rgba(0,0,0,0.1),
                            0 8px 16px rgba(0,0,0,0.1),
                            0 16px 32px rgba(0,0,0,0.15),
                            inset 0 0 80px rgba(139,119,101,0.05)
                          `,
                        }}
                      >
                        {/* Paper texture overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-30 rounded-lg"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                          }}
                        />

                        {/* Decorative corner flourish */}
                        <div
                          className="absolute top-4 right-4 text-3xl opacity-20"
                          style={{ color: '#8B7355' }}
                        >
                          ❧
                        </div>

                        {/* Letter header - fixed */}
                        <div className="pt-6 pb-3 px-8 text-center border-b border-amber-200/50 flex-shrink-0">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="inline-block mb-4"
                          >
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                              style={{
                                background: 'linear-gradient(135deg, #d4a574 0%, #c49a6c 100%)',
                                boxShadow: '0 4px 12px rgba(196,154,108,0.4)',
                              }}
                            >
                              <span className="text-2xl">✉</span>
                            </div>
                          </motion.div>

                          <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl font-serif tracking-wide mb-2"
                            style={{ color: '#4a3f35' }}
                          >
                            A Letter From The Past
                          </motion.h2>

                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm"
                            style={{ color: '#8B7355' }}
                          >
                            Written on {format(new Date(currentLetter.createdAt), 'MMMM d, yyyy')}
                            {currentLetter.letterLocation && (
                              <span className="block mt-1 text-xs italic">
                                from {currentLetter.letterLocation}
                              </span>
                            )}
                          </motion.p>

                          {arrivedLetters.length > 1 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="mt-3 flex items-center justify-center gap-2"
                            >
                              {arrivedLetters.map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full transition-all"
                                  style={{
                                    background: i === currentLetterIndex ? '#c49a6c' : '#d4c4b0',
                                    transform: i === currentLetterIndex ? 'scale(1.3)' : 'scale(1)',
                                  }}
                                />
                              ))}
                            </motion.div>
                          )}
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto px-10 py-6">
                          {/* Letter salutation */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mb-6"
                          >
                            <p
                              className="text-lg italic font-serif"
                              style={{ color: '#6b5b4f' }}
                            >
                              Dear future {displayName},
                            </p>
                          </motion.div>

                          {/* Letter content */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div
                              className="prose max-w-none"
                              style={{
                                fontFamily: 'Georgia, "Times New Roman", serif',
                                fontSize: '18px',
                                lineHeight: 2,
                                color: '#3d352e',
                              }}
                              dangerouslySetInnerHTML={{ __html: currentLetter.text }}
                            />
                          </motion.div>

                          {/* Letter signature */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mt-10 text-right"
                          >
                            <p
                              className="text-lg italic font-serif"
                              style={{ color: '#6b5b4f' }}
                            >
                              With love,
                            </p>
                            <p
                              className="text-xl font-serif mt-2"
                              style={{
                                color: '#4a3f35',
                                fontStyle: 'italic',
                              }}
                            >
                              Past {displayName}
                            </p>
                          </motion.div>
                        </div>

                        {/* Decorative bottom flourish */}
                        <div className="px-8 py-4 flex justify-center flex-shrink-0 border-t border-amber-200/30">
                          <div
                            className="text-2xl opacity-30"
                            style={{ color: '#8B7355' }}
                          >
                            ~ ✧ ~
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Close button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="text-center mt-4 flex-shrink-0"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCloseLetter}
                        className="px-10 py-3.5 rounded-full text-sm font-medium relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #c49a6c 0%, #a67c52 100%)',
                          color: '#fff',
                          boxShadow: '0 4px 20px rgba(196,154,108,0.4)',
                        }}
                      >
                        <span className="relative z-10">
                          {currentLetterIndex < arrivedLetters.length - 1
                            ? 'Read Next Letter →'
                            : 'Close & Cherish'
                          }
                        </span>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
