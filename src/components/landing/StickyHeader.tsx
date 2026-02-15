'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/store/theme'

export default function StickyHeader() {
  const { theme } = useThemeStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling past 80% of viewport height
      const scrollThreshold = window.innerHeight * 0.8
      setIsVisible(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
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
        </motion.header>
      )}
    </AnimatePresence>
  )
}
