'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { themes, ThemeName } from '@/lib/themes'

export default function DeskCandle() {
  const { theme, themeName, setTheme } = useThemeStore()
  const { setActiveElement } = useDeskStore()
  const [showPicker, setShowPicker] = useState(false)

  const themeNames = Object.keys(themes) as ThemeName[]

  const handleCandleClick = () => {
    setShowPicker(!showPicker)
    setActiveElement('candle')
  }

  const handleThemeSelect = (name: ThemeName) => {
    setTheme(name)
    setShowPicker(false)
    setActiveElement(null)
  }

  return (
    <motion.div
      className="relative group"
      onHoverStart={() => setActiveElement('candle')}
      onHoverEnd={() => !showPicker && setActiveElement(null)}
    >
      {/* Candle */}
      <motion.div
        onClick={handleCandleClick}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Candle holder/base */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full"
          style={{
            background: `linear-gradient(180deg,
              hsl(35, 40%, 45%) 0%,
              hsl(30, 35%, 30%) 100%
            )`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        />

        {/* Candle body */}
        <div
          className="relative mx-auto"
          style={{
            width: '36px',
            height: '70px',
            background: `linear-gradient(180deg,
              #faf6ee 0%,
              #f0e8d8 30%,
              #e8dcc8 100%
            )`,
            borderRadius: '3px 3px 6px 6px',
            boxShadow: `
              inset -4px 0 8px rgba(0,0,0,0.08),
              inset 2px 0 4px rgba(255,255,255,0.5),
              4px 4px 12px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Wax drips */}
          <div
            className="absolute top-0 left-1 w-2.5 rounded-b-full"
            style={{
              height: '18px',
              background: 'linear-gradient(180deg, #f5efe5 0%, #e8dcc8 100%)',
            }}
          />
          <div
            className="absolute top-0 right-2 w-2 rounded-b-full"
            style={{
              height: '12px',
              background: 'linear-gradient(180deg, #f0e8d8 0%, #e0d4c0 100%)',
            }}
          />
          <div
            className="absolute top-0 left-4 w-1.5 rounded-b-full"
            style={{
              height: '8px',
              background: 'linear-gradient(180deg, #f8f4ec 0%, #e8dcc8 100%)',
            }}
          />

          {/* Subtle candle texture */}
          <div
            className="absolute inset-0 opacity-10 rounded"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                rgba(0,0,0,0.05) 2px,
                transparent 4px
              )`,
            }}
          />
        </div>

        {/* Wick */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-5 rounded"
          style={{
            background: 'linear-gradient(180deg, #1a1a1a 0%, #333 100%)',
          }}
        />

        {/* Flame container */}
        <motion.div
          className="absolute -top-12 left-1/2 -translate-x-1/2"
          animate={{
            scaleY: [1, 1.15, 0.95, 1.1, 1],
            scaleX: [1, 0.92, 1.05, 0.96, 1],
            rotate: [-1, 1, -2, 1, -1],
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        >
          {/* Outer flame glow */}
          <div
            className="absolute -inset-4 rounded-full"
            style={{
              background: `radial-gradient(circle,
                ${theme.accent.warm}30 0%,
                transparent 70%
              )`,
              filter: 'blur(8px)',
            }}
          />

          {/* Main flame */}
          <div
            className="relative w-4 h-8"
            style={{
              background: `linear-gradient(180deg,
                #fff8e0 0%,
                ${theme.accent.warm} 35%,
                #ff7b25 70%,
                #ff5500 100%
              )`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Inner flame (blue core) */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3"
            style={{
              background: 'linear-gradient(180deg, #88c0ff 0%, #4488ff 100%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              opacity: 0.7,
            }}
          />
        </motion.div>

        {/* Light cast on surface */}
        <motion.div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '120px',
            height: '60px',
            background: `radial-gradient(ellipse at center,
              ${theme.accent.warm}25 0%,
              ${theme.accent.warm}10 40%,
              transparent 70%
            )`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scaleX: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Theme picker popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-8 left-20 z-50"
          >
            <div
              className="p-4 rounded-2xl"
              style={{
                background: theme.glass.bg,
                backdropFilter: `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="text-xs uppercase tracking-wider mb-3 text-center"
                style={{ color: theme.text.muted }}
              >
                Choose Ambiance
              </div>
              <div className="grid grid-cols-4 gap-2">
                {themeNames.map((name) => (
                  <motion.button
                    key={name}
                    onClick={() => handleThemeSelect(name)}
                    className="relative w-9 h-9 rounded-full"
                    style={{
                      background: `linear-gradient(135deg,
                        ${themes[name].accent.warm} 0%,
                        ${themes[name].accent.primary} 100%
                      )`,
                      border: name === themeName
                        ? `2px solid ${theme.text.primary}`
                        : '2px solid transparent',
                      boxShadow: name === themeName
                        ? `0 0 12px ${themes[name].accent.warm}60`
                        : 'none',
                    }}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    title={themes[name].name}
                  >
                    {name === themeName && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: `2px solid ${theme.text.primary}`,
                        }}
                        layoutId="theme-selected"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label on hover */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: theme.text.muted }}
      >
        Change Theme
      </motion.div>
    </motion.div>
  )
}
