'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import type { CtaSpread } from './spreads'

export function DiaryCtaLeft({ spread }: { spread: CtaSpread }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <p className="font-serif italic text-2xl md:text-3xl leading-snug max-w-[20ch]">
        {spread.text}
      </p>
      <p className="font-serif italic text-xs mt-6 opacity-50">— close the book gently</p>
    </div>
  )
}

export function DiaryCtaRight({ spread }: { spread: CtaSpread }) {
  const { theme } = useThemeStore()
  return (
    <div className="h-full flex items-center justify-center">
      <Link href={spread.buttonHref}>
        <motion.button
          type="button"
          className="relative px-10 py-4 rounded-full text-lg font-medium overflow-hidden"
          style={{
            background: theme.accent.primary,
            color: theme.bg.primary,
            boxShadow: `0 0 40px ${theme.accent.primary}30`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: theme.accent.warm }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">{spread.buttonLabel}</span>
        </motion.button>
      </Link>
    </div>
  )
}
