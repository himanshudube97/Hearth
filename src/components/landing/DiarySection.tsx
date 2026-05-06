'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import Background from '@/components/Background'
import Diary from './Diary'

export default function DiarySection() {
  const { theme } = useThemeStore()

  return (
    <section
      className="relative overflow-hidden flex items-center justify-center px-6 py-24"
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

      {/* Desk surface: a horizon-line that suggests the book sits on something. */}
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{
          bottom: 0,
          height: '38%',
          background: `linear-gradient(180deg,
            transparent 0%,
            ${theme.accent.warm}10 22%,
            ${theme.accent.warm}26 60%,
            ${theme.accent.warm}33 100%)`,
          zIndex: 0,
        }}
      />
      {/* Faint horizon line — where the surface meets the air */}
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{
          bottom: '38%',
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${theme.accent.primary}55 30%, ${theme.accent.primary}66 50%, ${theme.accent.primary}55 70%, transparent 100%)`,
          opacity: 0.4,
          zIndex: 0,
        }}
      />
      {/* Cast shadow on the desk under the book */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          bottom: '20%',
          width: '52vw',
          maxWidth: 900,
          height: 80,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />

      {/* The diary */}
      <div className="relative z-10 w-full">
        <Diary />
      </div>
    </section>
  )
}
