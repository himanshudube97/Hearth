'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/store/theme'

export default function StickyHeader() {
  const { theme } = useThemeStore()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1) over the first 30% of viewport
      const scrollThreshold = window.innerHeight * 0.3
      const progress = Math.min(window.scrollY / scrollThreshold, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        opacity: scrollProgress,
        y: (1 - scrollProgress) * -20,
        pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
      }}
    >
          <div
            className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3 rounded-full"
            style={{
              background: theme.glass.bg,
              backdropFilter: `blur(${theme.glass.blur})`,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            {/* Logo */}
            <Link href="/">
              <motion.span
                className="text-xl font-serif tracking-widest"
                style={{ color: theme.text.primary }}
                whileHover={{ scale: 1.02 }}
              >
                HEARTH
              </motion.span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/pricing">
                <motion.span
                  className="text-sm"
                  style={{ color: theme.text.secondary }}
                  whileHover={{ color: theme.text.primary }}
                >
                  Pricing
                </motion.span>
              </Link>

              <Link href="/download">
                <motion.span
                  className="text-sm"
                  style={{ color: theme.text.secondary }}
                  whileHover={{ color: theme.text.primary }}
                >
                  Desktop
                </motion.span>
              </Link>

              {/* CTA */}
              <Link href="/write">
                <motion.button
                  className="px-6 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: theme.accent.primary,
                    color: theme.bg.primary,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Begin Writing
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.header>
  )
}
