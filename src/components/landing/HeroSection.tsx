'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/store/theme'
import { whispers } from '@/lib/themes'

const title = 'HEARTH'
const tagline = 'a meditative journal that listens'

export default function HeroSection() {
  const { theme } = useThemeStore()
  const [currentWhisper, setCurrentWhisper] = useState('')
  const [whisperKey, setWhisperKey] = useState(0)

  useEffect(() => {
    const changeWhisper = () => {
      setCurrentWhisper(whispers[Math.floor(Math.random() * whispers.length)])
      setWhisperKey(prev => prev + 1)
    }
    changeWhisper()
    const interval = setInterval(changeWhisper, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: theme.bg.gradient, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
      {/* Soft Glowing Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary accent orb - top right */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.accent.primary}25 0%, transparent 70%)`,
            filter: 'blur(60px)',
            top: '-10%',
            right: '-5%',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary accent orb - bottom left */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.accent.secondary}20 0%, transparent 70%)`,
            filter: 'blur(50px)',
            bottom: '5%',
            left: '-5%',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Warm accent orb - center */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.accent.warm}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Gentle floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              background: theme.text.muted,
              left: `${5 + (i * 4.7) % 90}%`,
              top: `${10 + (i * 7.3) % 80}%`,
            }}
            animate={{
              y: [-20, -60 - (i % 3) * 20],
              x: [(i % 2 === 0 ? -10 : 10), (i % 2 === 0 ? 10 : -10)],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 8 + (i % 5) * 2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Letter-by-letter Title */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-[0.3em] mb-6"
          style={{ color: theme.text.primary }}
        >
          {title.split('').map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                textShadow: `0 0 40px ${theme.accent.primary}40`,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Typewriter Tagline */}
        <motion.p
          className="text-lg md:text-xl font-light tracking-wide mb-12"
          style={{ color: theme.text.secondary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <TypewriterText text={tagline} delay={1} />
        </motion.p>

        {/* Floating Whisper */}
        <div className="h-16 mb-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={whisperKey}
              className="text-sm md:text-base italic max-w-md"
              style={{ color: theme.text.muted }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1 }}
            >
              "{currentWhisper}"
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          <Link href="/write">
            <motion.button
              className="relative px-10 py-4 rounded-full text-lg font-medium overflow-hidden"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
                boxShadow: `0 0 40px ${theme.accent.primary}30`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulse Animation */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: theme.accent.warm }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="relative z-10">Begin Writing</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 3, duration: 1 },
          y: { delay: 3, duration: 2, repeat: Infinity },
        }}
        style={{ color: theme.text.muted }}
      >
        <span className="text-2xl">↓</span>
      </motion.div>
    </section>
  )
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const { theme } = useThemeStore()

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
          // Hide cursor after a brief pause
          setTimeout(() => setIsComplete(true), 1500)
        }
      }, 60)
      return () => clearInterval(interval)
    }, delay * 1000)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ color: theme.accent.primary }}
        >
          |
        </motion.span>
      )}
    </span>
  )
}
