'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import Diary from './Diary'

export default function DiarySection() {
  const { theme } = useThemeStore()

  return (
    <section
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-16"
      style={{
        background: theme.bg.gradient,
        color: theme.text.primary,
      }}
    >
      {/* Theme particle layer */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <Background bounded />
      </div>

      {/* Animated colored glow underneath the diary */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: '70vw',
          height: '70vw',
          maxWidth: 1100,
          maxHeight: 1100,
          background: `radial-gradient(circle, ${theme.accent.primary}55 0%, transparent 60%)`,
          filter: 'blur(80px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
        animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: '50vw',
          height: '50vw',
          maxWidth: 800,
          maxHeight: 800,
          background: `radial-gradient(circle, ${theme.accent.warm}66 0%, transparent 65%)`,
          filter: 'blur(70px)',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.12, 1], x: ['-50%', '-46%', '-50%'] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* The diary */}
      <div className="relative z-10 w-full">
        <Diary />
      </div>
    </section>
  )
}
