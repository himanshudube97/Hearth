'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useLayoutMode } from '@/hooks/useMediaQuery'

function ExpandIcon({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    // Brackets pointing inward → "exit fullscreen"
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      </svg>
    )
  }
  // Brackets pointing outward → "enter fullscreen"
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  )
}

export default function FullscreenButton() {
  const { theme } = useThemeStore()
  const { isFullscreen, supported, toggle } = useFullscreen()
  const layoutMode = useLayoutMode()
  if (!supported) return null
  // Mobile browsers handle fullscreen via PWA install / native chrome; the
  // fullscreen API is unreliable here and the slot is reused by the menu.
  if (layoutMode === 'mobile') return null

  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={() => void toggle()}
      // Sits one slot to the left of the gear (gear is at right-6, 12 wide → fullscreen at right-20).
      className="fixed top-6 right-20 z-50 w-12 h-12 rounded-full flex items-center justify-center"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
        color: theme.accent.warm,
      }}
      title={label}
      aria-label={label}
    >
      <ExpandIcon collapsed={isFullscreen} />
    </motion.button>
  )
}
