'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useFullscreen } from '@/hooks/useFullscreen'

// Bottom-right pill on public pages (landing/pricing) inviting the visitor
// into a fullscreen view. Hides itself once already in fullscreen, and on
// platforms that don't support the Fullscreen API (e.g. iOS Safari).
export default function FullscreenPrompt() {
  const { theme } = useThemeStore()
  const { isFullscreen, supported, toggle } = useFullscreen()

  const visible = supported && !isFullscreen

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="fullscreen-prompt"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => void toggle()}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            letterSpacing: '0.01em',
            boxShadow: '0 6px 22px rgba(0,0,0,0.18)',
          }}
          aria-label="Enter fullscreen for the best view"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ color: theme.accent.warm }}
          >
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          <span>Go fullscreen for the best view</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
