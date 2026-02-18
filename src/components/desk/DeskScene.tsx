'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import DeskBook from './DeskBook'
import { DiaryThemeSelector } from './DiaryThemeSelector'
import Background from '@/components/Background'
// Commented out - hiding these elements for cleaner UI
// import DeskWindow from './DeskWindow'
// import DeskDrawer from './DeskDrawer'
// import DeskCandle from './DeskCandle'

export default function DeskScene() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useThemeStore()
  // const { activeElement } = useDeskStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        perspective: '2000px',
      }}
    >
      {/* Theme background with particles - renders at z-5 */}
      <div className="absolute inset-0 z-[5]">
        <Background />
      </div>

      {/* Vignette overlay - very subtle to let background animations show */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Desk surface gradient - very subtle to let background animations show */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            ${theme.bg.secondary}15 40%,
            ${theme.bg.secondary}30 100%
          )`,
        }}
      />

      {/* Warm ambient light - centered, subtle glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: '15%',
          left: '35%',
          width: '30%',
          height: '35%',
          background: `radial-gradient(ellipse at center,
            ${theme.accent.warm}08 0%,
            transparent 70%
          )`,
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Window - HIDDEN
      <motion.div
        className="absolute z-20"
        style={{ top: '6%', left: '50%', transform: 'translateX(-50%)' }}
        animate={{
          scale: activeElement === 'window' ? 1.02 : 1,
          y: activeElement === 'window' ? -5 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <DeskWindow />
      </motion.div>
      */}

      {/* Book - center */}
      <motion.div
        className="absolute z-30"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DeskBook />
      </motion.div>

      {/* Candle - HIDDEN
      <motion.div
        className="absolute z-20"
        style={{ bottom: '18%', left: '8%' }}
        animate={{
          scale: activeElement === 'candle' ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <DeskCandle />
      </motion.div>
      */}

      {/* Drawer - HIDDEN
      <motion.div
        className="absolute z-20"
        style={{ bottom: '12%', right: '8%' }}
      >
        <DeskDrawer />
      </motion.div>
      */}

      {/* Floating dust particles - reduced count to not compete with background theme particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 1.5}px`,
              height: `${1 + Math.random() * 1.5}px`,
              background: `${theme.accent.warm}${Math.floor(20 + Math.random() * 30).toString(16)}`,
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: [0, -25 - Math.random() * 15, 0],
              x: [0, (Math.random() - 0.5) * 15, 0],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Diary Theme Selector */}
      <DiaryThemeSelector />
    </div>
  )
}
