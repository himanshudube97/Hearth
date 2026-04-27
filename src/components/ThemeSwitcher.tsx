'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useThemeStore } from '@/store/theme'
import { themes, ThemeName } from '@/lib/themes'

const themeIcons: Record<ThemeName, string> = {
  winterSunset: '🌅',
  rivendell: '🌲',
  hobbiton: '🏡',
  cherryBlossom: '🌸',
  northernLights: '🌌',
  mistyMountains: '⛰️',
  gentleRain: '🌧️',
  cosmos: '✨',
  candlelight: '🕯️',
  oceanTwilight: '🌊',
  quietSnow: '❄️',
  warmPeaceful: '☀️',
}

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, themeName, setTheme } = useThemeStore()

  const themeList = Object.entries(themes) as [ThemeName, typeof theme][]

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
        title="Switch theme"
      >
        {themeIcons[themeName]}
      </motion.button>

      {/* Theme Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute bottom-16 right-0 p-3 rounded-2xl min-w-[220px]"
            style={{
              background: theme.glass.bg,
              backdropFilter: `blur(${theme.glass.blur})`,
              border: `1px solid ${theme.glass.border}`,
            }}
          >
            <p className="text-xs mb-3 px-2" style={{ color: theme.text.muted }}>
              choose your room
            </p>

            {themeList.map(([name, t]) => (
              <motion.button
                key={name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onClick={() => {
                  setTheme(name)
                  setIsOpen(false)
                }}
                className="w-full p-3 rounded-xl mb-2 last:mb-0 flex items-center gap-3 text-left transition-all"
                style={{
                  background: themeName === name ? `${t.accent.primary}20` : 'transparent',
                  border: themeName === name ? `1px solid ${t.accent.primary}` : '1px solid transparent',
                }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${t.accent.warm}, ${t.accent.primary})`,
                  }}
                >
                  {themeIcons[name]}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: theme.text.muted }}>
                    {t.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
