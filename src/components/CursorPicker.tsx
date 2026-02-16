'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useCursorStore } from '@/store/cursor'
import { useThemeStore } from '@/store/theme'
import { cursors, cursorIcons, CursorName } from '@/lib/cursors'

export default function CursorPicker() {
  const [isOpen, setIsOpen] = useState(false)
  const { cursor, cursorName, setCursor } = useCursorStore()
  const { theme } = useThemeStore()

  const cursorList = Object.entries(cursors) as [CursorName, typeof cursor][]

  // Apply cursor styles globally
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'custom-cursor-styles'

    const existingStyle = document.getElementById('custom-cursor-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    style.textContent = `
      body {
        cursor: ${cursor.default} ${cursor.hotspot.x} ${cursor.hotspot.y}, auto !important;
      }
      a, button, [role="button"], input[type="submit"], input[type="button"], .cursor-pointer {
        cursor: ${cursor.pointer} ${cursor.pointerHotspot.x} ${cursor.pointerHotspot.y}, pointer !important;
      }
      input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"] {
        cursor: ${cursor.text} ${cursor.textHotspot.x} ${cursor.textHotspot.y}, text !important;
      }
    `

    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [cursor])

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
          color: theme.accent.warm,
        }}
        title="Change cursor"
      >
        {cursorIcons[cursorName]}
      </motion.button>

      {/* Cursor Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute bottom-16 left-0 p-3 rounded-2xl min-w-[220px]"
            style={{
              background: theme.glass.bg,
              backdropFilter: `blur(${theme.glass.blur})`,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            <p className="text-xs mb-3 px-2" style={{ color: theme.text.muted }}>
              choose your cursor
            </p>

            <div className="grid grid-cols-2 gap-2">
              {cursorList.map(([name, c]) => (
                <motion.button
                  key={name}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  onClick={() => {
                    setCursor(name)
                    setIsOpen(false)
                  }}
                  className="p-3 rounded-xl flex flex-col items-center gap-2 text-center transition-all"
                  style={{
                    background: cursorName === name ? `${theme.accent.primary}20` : 'transparent',
                    border: cursorName === name ? `1px solid ${theme.accent.primary}` : '1px solid transparent',
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent.warm}30, ${theme.accent.primary}30)`,
                    }}
                  >
                    {cursorIcons[name]}
                  </span>
                  <div>
                    <p className="text-xs font-medium" style={{ color: theme.text.primary }}>
                      {c.name}
                    </p>
                    <p className="text-[10px]" style={{ color: theme.text.muted }}>
                      {c.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
