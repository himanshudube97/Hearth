'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface BirthdayBannerProps {
  nickname?: string
}

// Confetti particle
function Confetti({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#87CEEB', '#DDA0DD', '#98D8C8']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = 8 + Math.random() * 8
  const rotation = Math.random() * 360

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        left: `${x}%`,
        top: -20,
        width: size,
        height: size * 0.6,
        background: color,
        borderRadius: 2,
      }}
      initial={{ y: -20, rotate: rotation, opacity: 1 }}
      animate={{
        y: window.innerHeight + 50,
        rotate: rotation + 720,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        ease: 'easeIn',
      }}
    />
  )
}

// Balloon
function Balloon({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ left: `${x}%`, bottom: -100 }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -window.innerHeight - 200, opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 6 + Math.random() * 3,
        delay,
        ease: 'easeOut',
      }}
    >
      {/* Balloon body */}
      <div
        className="w-12 h-14 rounded-full relative"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
          boxShadow: `inset -4px -4px 8px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Shine */}
        <div
          className="absolute w-3 h-4 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.4)',
            top: '15%',
            left: '20%',
          }}
        />
        {/* Knot */}
        <div
          className="absolute w-3 h-3"
          style={{
            background: color,
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
        />
      </div>
      {/* String */}
      <div
        className="w-px h-20 mx-auto"
        style={{
          background: `linear-gradient(to bottom, ${color}88, transparent)`,
        }}
      />
    </motion.div>
  )
}

// Sparkle
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="fixed pointer-events-none text-2xl"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 1,
        delay,
        ease: 'easeOut',
      }}
    >
      ✨
    </motion.div>
  )
}

export default function BirthdayBanner({ nickname }: BirthdayBannerProps) {
  const { theme } = useThemeStore()
  const [showCelebration, setShowCelebration] = useState(false)
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number }[]>([])
  const [balloons, setBalloons] = useState<{ id: number; x: number; delay: number; color: string }[]>([])
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([])

  const triggerCelebration = () => {
    setShowCelebration(true)

    // Generate confetti
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }))
    setConfetti(newConfetti)

    // Generate balloons
    const balloonColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF69B4', '#87CEEB', '#DDA0DD']
    const newBalloons = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 1,
      color: balloonColors[i % balloonColors.length],
    }))
    setBalloons(newBalloons)

    // Generate sparkles
    const newSparkles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 60,
      delay: Math.random() * 2,
    }))
    setSparkles(newSparkles)

    // Clear after animation
    setTimeout(() => {
      setShowCelebration(false)
      setConfetti([])
      setBalloons([])
      setSparkles([])
    }, 8000)
  }

  const displayName = nickname || 'you'

  return (
    <>
      {/* Birthday Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <motion.button
          onClick={triggerCelebration}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 rounded-2xl text-center cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${theme.accent.warm}20, ${theme.accent.primary}20)`,
            border: `1px solid ${theme.accent.warm}40`,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-3xl mb-2"
          >
            🎂
          </motion.div>
          <h2
            className="text-lg font-medium mb-1"
            style={{ color: theme.text.primary }}
          >
            Happy Birthday, {displayName}!
          </h2>
          <p
            className="text-sm"
            style={{ color: theme.text.muted }}
          >
            tap to celebrate
          </p>
        </motion.button>
      </motion.div>

      {/* Celebration Animations */}
      <AnimatePresence>
        {showCelebration && (
          <>
            {/* Confetti */}
            {confetti.map((c) => (
              <Confetti key={`confetti-${c.id}`} delay={c.delay} x={c.x} />
            ))}

            {/* Balloons */}
            {balloons.map((b) => (
              <Balloon key={`balloon-${b.id}`} delay={b.delay} x={b.x} color={b.color} />
            ))}

            {/* Sparkles */}
            {sparkles.map((s) => (
              <Sparkle key={`sparkle-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
            ))}

            {/* Center message */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
              transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
            >
              <div
                className="text-6xl font-light px-8 py-4 rounded-2xl"
                style={{
                  background: `${theme.bg.secondary}ee`,
                  color: theme.accent.warm,
                  textShadow: `0 0 30px ${theme.accent.warm}`,
                }}
              >
                🎉 Happy Birthday! 🎉
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
