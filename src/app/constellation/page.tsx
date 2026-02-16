'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { Theme } from '@/lib/themes'
import { JournalEntry } from '@/store/journal'

const MAX_VISIBLE_MEMORIES = 7 // Random memories shown each visit

interface MemoryStar {
  id: string
  x: number
  y: number
  size: number
  entry: JournalEntry
  delay: number
}

function ShootingStars({ theme }: { theme: Theme }) {
  const [shootingStars, setShootingStars] = useState<{ id: number; x: number; y: number; angle: number; length: number }[]>([])

  useEffect(() => {
    const createShootingStar = () => {
      const star = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 40,
        angle: 25 + Math.random() * 20,
        length: 80 + Math.random() * 120,
      }
      setShootingStars(prev => [...prev, star])
      setTimeout(() => setShootingStars(prev => prev.filter(s => s.id !== star.id)), 1500)
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.75) createShootingStar()
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {shootingStars.map(star => (
        <motion.div
          key={star.id}
          className="absolute pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.length,
            height: 1,
            background: `linear-gradient(90deg, rgba(255,255,255,0.8), transparent)`,
            transform: `rotate(${star.angle}deg)`,
            transformOrigin: 'left center',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 0.6, 0], x: star.length }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

// Generate cosmos background stars - different layers for depth
function CosmosBackground({ theme }: { theme: Theme }) {
  const layers = useMemo(() => {
    // Layer 1: Distant tiny stars (slowest drift)
    const distant = Array.from({ length: 200 }, (_, i) => ({
      x: (i * 47 + 13) % 100,
      y: (i * 31 + 7) % 100,
      size: 1,
      opacity: 0.2 + ((i * 17) % 30) / 100,
      twinkle: i % 5 === 0,
    }))

    // Layer 2: Medium distance stars
    const medium = Array.from({ length: 50 }, (_, i) => ({
      x: (i * 73 + 29) % 100,
      y: (i * 59 + 41) % 100,
      size: 1.5,
      opacity: 0.3 + ((i * 23) % 25) / 100,
      twinkle: i % 3 === 0,
    }))

    // Layer 3: Slightly closer stars (fastest drift)
    const closer = Array.from({ length: 20 }, (_, i) => ({
      x: (i * 89 + 17) % 100,
      y: (i * 67 + 23) % 100,
      size: 2,
      opacity: 0.4 + ((i * 19) % 20) / 100,
      twinkle: true,
    }))

    return { distant, medium, closer }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Distant stars - slowest drift */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, 15, 0, -15, 0],
          y: [0, -10, 0, 10, 0],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {layers.distant.map((star, i) => (
          <motion.div
            key={`d-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: 'rgba(255, 255, 255, 1)',
              opacity: star.opacity,
            }}
            animate={star.twinkle ? {
              opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            } : undefined}
            transition={star.twinkle ? {
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          />
        ))}
      </motion.div>

      {/* Medium stars - medium drift */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, -20, 0, 20, 0],
          y: [0, 15, 0, -15, 0],
        }}
        transition={{
          duration: 90,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {layers.medium.map((star, i) => (
          <motion.div
            key={`m-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: 'rgba(255, 255, 255, 1)',
              opacity: star.opacity,
            }}
            animate={star.twinkle ? {
              opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            } : undefined}
            transition={star.twinkle ? {
              duration: 2.5 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          />
        ))}
      </motion.div>

      {/* Closer stars - slightly faster drift */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, 25, 0, -25, 0],
          y: [0, -20, 0, 20, 0],
        }}
        transition={{
          duration: 70,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {layers.closer.map((star, i) => (
          <motion.div
            key={`c-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: 'rgba(255, 255, 255, 1)',
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Subtle nebula glow - also drifts slowly */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          x: [0, 30, 0, -30, 0],
          y: [0, -20, 0, 20, 0],
        }}
        transition={{
          duration: 150,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            left: '10%',
            top: '20%',
            width: '30%',
            height: '30%',
            background: `radial-gradient(circle, ${theme.moods[4]}08 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            right: '15%',
            bottom: '30%',
            width: '25%',
            height: '25%',
            background: `radial-gradient(circle, ${theme.moods[2]}06 0%, transparent 70%)`,
          }}
        />
      </motion.div>
    </div>
  )
}

export default function ConstellationPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [memoryStars, setMemoryStars] = useState<MemoryStar[]>([])
  const [selectedStar, setSelectedStar] = useState<MemoryStar | null>(null)
  const [loading, setLoading] = useState(true)

  const { theme } = useThemeStore()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/entries')
      const data = await res.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Select random memories and position them
  useEffect(() => {
    if (entries.length === 0) return

    // Shuffle and pick random entries
    const shuffled = [...entries].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(MAX_VISIBLE_MEMORIES, entries.length))

    // Position them nicely spread across the screen
    const stars: MemoryStar[] = selected.map((entry, index) => {
      // Create a nice spread pattern
      const angle = (index / selected.length) * Math.PI * 2 + Math.random() * 0.5
      const radius = 25 + Math.random() * 20
      const centerX = 50
      const centerY = 50

      return {
        id: entry.id,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 15,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 15,
        size: 4 + Math.random() * 3,
        entry,
        delay: index * 0.3,
      }
    })

    setMemoryStars(stars)
  }, [entries])

  const getMoodColor = (mood: number) => {
    const colors = [
      theme.moods[0],
      theme.moods[1],
      theme.moods[2],
      theme.moods[3],
      theme.moods[4],
    ]
    return colors[mood] || theme.accent.primary
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="text-2xl mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: theme.text.muted }}
          >
            ✦
          </motion.div>
          <p style={{ color: theme.text.muted }}>gazing into the cosmos...</p>
        </motion.div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <CosmosBackground theme={theme} />
        <div className="text-center relative z-10">
          <div className="text-3xl mb-4 opacity-50">✦</div>
          <p style={{ color: theme.text.muted }}>
            your sky is waiting for its first star
          </p>
          <p className="text-sm mt-2" style={{ color: theme.text.muted }}>
            write something to begin
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: theme.bg.primary }}>
      {/* Deep space background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${theme.bg.secondary} 0%, ${theme.bg.primary} 50%, #000 100%)`,
        }}
      />

      {/* Cosmos stars */}
      <CosmosBackground theme={theme} />

      {/* Shooting stars */}
      <ShootingStars theme={theme} />

      {/* Your memory stars */}
      <div className="absolute inset-0">
        {memoryStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute cursor-pointer"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: star.delay, duration: 0.8, ease: 'easeOut' }}
            onClick={() => setSelectedStar(star)}
          >
            {/* Soft glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: star.size * 8,
                height: star.size * 8,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${getMoodColor(star.entry.mood)}25 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 3 + star.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Star core */}
            <motion.div
              className="relative rounded-full"
              style={{
                width: star.size * 2,
                height: star.size * 2,
                background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${getMoodColor(star.entry.mood)} 50%, ${getMoodColor(star.entry.mood)}80 100%)`,
                boxShadow: `0 0 ${star.size * 2}px ${getMoodColor(star.entry.mood)}60`,
              }}
              whileHover={{
                scale: 1.5,
                boxShadow: `0 0 ${star.size * 4}px ${getMoodColor(star.entry.mood)}`,
              }}
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                opacity: {
                  duration: 2 + star.delay * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Title - more subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p className="text-sm" style={{ color: `${theme.text.muted}80` }}>
          {memoryStars.length} {memoryStars.length === 1 ? 'memory' : 'memories'} surfaced tonight
        </p>
      </motion.div>

      {/* Refresh hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
        style={{ color: `${theme.text.muted}60` }}
      >
        refresh to discover different memories
      </motion.p>

      {/* Selected memory panel */}
      <AnimatePresence>
        {selectedStar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedStar(null)}
            />

            {/* Memory card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div
                className="rounded-2xl p-6 max-h-[70vh] overflow-y-auto"
                style={{
                  background: theme.glass.bg,
                  backdropFilter: `blur(${theme.glass.blur})`,
                  border: `1px solid ${theme.glass.border}`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: `${getMoodColor(selectedStar.entry.mood)}20` }}
                    >
                      {theme.moodEmojis[selectedStar.entry.mood]}
                    </span>
                    <div>
                      <p className="text-sm" style={{ color: theme.text.primary }}>
                        {format(new Date(selectedStar.entry.createdAt), 'EEEE')}
                      </p>
                      <p className="text-xs" style={{ color: theme.text.muted }}>
                        {format(new Date(selectedStar.entry.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStar(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ color: theme.text.muted }}
                  >
                    ×
                  </button>
                </div>

                {/* Content */}
                <div
                  className="prose prose-invert max-w-none"
                  style={{
                    fontFamily: 'Georgia, Palatino, serif',
                    fontSize: '15px',
                    lineHeight: 1.8,
                    color: theme.text.primary,
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedStar.entry.text }}
                />

                {/* Song */}
                {selectedStar.entry.song && (
                  <div
                    className="mt-4 p-3 rounded-xl flex items-center gap-2"
                    style={{ background: `${theme.accent.warm}10` }}
                  >
                    <span style={{ color: theme.accent.warm }}>♫</span>
                    <span className="text-sm" style={{ color: theme.text.secondary }}>
                      {selectedStar.entry.song}
                    </span>
                  </div>
                )}

                {/* Time ago */}
                <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                  {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'earlier today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}
