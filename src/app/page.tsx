'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import HeroSection from '@/components/landing/HeroSection'
import DiarySection from '@/components/landing/DiarySection'
import FooterCTA from '@/components/landing/FooterCTA'
import StickyHeader from '@/components/landing/StickyHeader'

export default function LandingPage() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    document.documentElement.style.scrollSnapType = 'y mandatory'
    return () => {
      document.documentElement.style.scrollBehavior = ''
      document.documentElement.style.scrollSnapType = ''
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
      <DiarySection />
      <FooterCTA />
    </main>
  )
}
