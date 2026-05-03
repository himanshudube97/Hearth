'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FooterCTA from '@/components/landing/FooterCTA'
import StickyHeader from '@/components/landing/StickyHeader'

export default function LandingPage() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <main
      className="relative"
      style={{
        background: theme.bg.gradient,
        color: theme.text.primary,
      }}
    >
      {/* Ambient Background - only shows below the fold */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ top: '100vh' }}>
        {/* Subtle glow for lower sections */}
        <motion.div
          className="absolute top-1/4 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: theme.accent.primary }}
          animate={{
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-3/4 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: theme.accent.secondary }}
          animate={{
            opacity: [0.05, 0.08, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Sticky Header - appears on scroll */}
      <StickyHeader />

      {/* Page Sections */}
      <HeroSection />

      {/* Whisper Gallery - Floating whispers between sections */}
      <WhisperGallery />

      <FeaturesSection />
      <FooterCTA />
    </main>
  )
}

function WhisperGallery() {
  const { theme } = useThemeStore()

  const floatingWhispers = [
    "The stars have time. So do you.",
    "Write freely.",
    "This moment is yours alone.",
    "Be gentle with yourself.",
    "Let your thoughts drift.",
  ]

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {floatingWhispers.map((whisper, i) => (
          <motion.p
            key={i}
            className="absolute text-sm italic whitespace-nowrap"
            style={{
              color: theme.text.muted,
              left: `${5 + i * 20}%`,
              top: `${20 + (i % 3) * 30}%`,
              fontSize: `${0.75 + (i % 3) * 0.15}rem`,
            }}
            animate={{
              x: [0, 30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'easeInOut',
            }}
          >
            "{whisper}"
          </motion.p>
        ))}
      </div>
    </section>
  )
}
