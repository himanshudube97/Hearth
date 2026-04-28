'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Theme } from '@/lib/themes'
import { JournalEntry } from '@/store/journal'
import SongEmbed from '@/components/SongEmbed'

export interface MemoryStar {
  id: string
  x: number
  y: number
  size: number
  entry: JournalEntry
  delay: number
}

export interface ConstellationRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
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

function MemoryStarSVG({
  star,
  color,
  onClick,
}: {
  star: MemoryStar
  color: string
  onClick: () => void
}) {
  // SVG viewBox is -50..50; size scales the rendered pixels.
  const px = Math.round(star.size * 22)
  const uid = star.id

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: px,
        height: px,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 + star.delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      whileHover={{ scale: 1.3 }}
    >
      {/* Slow breathing pulse */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.06, 1], opacity: [0.92, 1, 0.92] }}
        transition={{
          duration: 3.2 + star.delay * 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="-50 -50 100 100"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <defs>
            {/* Soft outer halo */}
            <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="25%" stopColor={color} stopOpacity="0.18" />
              <stop offset="60%" stopColor={color} stopOpacity="0.04" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>

            {/* Inner bright bloom (white→color) */}
            <radialGradient id={`bloom-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="55%" stopColor={color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>

            {/* Diffraction spike — fades at both tips */}
            <linearGradient id={`spikeH-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="40%" stopColor={color} stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`spikeV-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="40%" stopColor={color} stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer halo */}
          <circle cx="0" cy="0" r="50" fill={`url(#halo-${uid})`} />

          {/* Diffraction spikes (4-point) — render below bloom so they tuck under it */}
          <motion.g
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 2.6 + star.delay * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <rect x="-46" y="-0.4" width="92" height="0.8" fill={`url(#spikeH-${uid})`} />
            <rect x="-0.4" y="-46" width="0.8" height="92" fill={`url(#spikeV-${uid})`} />
          </motion.g>

          {/* Inner bloom */}
          <circle cx="0" cy="0" r="14" fill={`url(#bloom-${uid})`} />

          {/* Hot pinpoint core */}
          <motion.circle
            cx="0"
            cy="0"
            r="2.2"
            fill="#ffffff"
            animate={{ r: [2.2, 2.6, 2.2] }}
            transition={{
              duration: 2 + star.delay * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
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

export function ConstellationRenderer({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: ConstellationRendererProps) {
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
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <CosmosBackground theme={theme} />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-50">✦</div>
          <p style={{ color: theme.text.muted }}>
            your sky is waiting for its first star
          </p>
          <p className="text-sm mt-2" style={{ color: theme.text.muted }}>
            write something to begin
          </p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ background: theme.bg.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Deep space background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${theme.bg.secondary} 0%, ${theme.bg.primary} 50%, #000 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Cosmos stars */}
      <CosmosBackground theme={theme} />

      {/* Shooting stars */}
      <ShootingStars theme={theme} />

      {/* Your memory stars */}
      <div className="absolute inset-0">
        {memoryStars.map((star) => (
          <MemoryStarSVG
            key={star.id}
            star={star}
            color={getMoodColor(star.entry.mood)}
            onClick={() => setSelectedStar(star)}
          />
        ))}
      </div>

      {/* Title - more subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
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
        transition={{ delay: 2.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
              {(() => {
                const isLetter = selectedStar.entry.entryType === 'letter' && selectedStar.entry.isSealed
                const isLetterToFriend = isLetter && !!selectedStar.entry.recipientEmail
                const moodColor = getMoodColor(selectedStar.entry.mood)

                if (isLetter) {
                  // Sealed letter card
                  return (
                    <div
                      className="rounded-2xl p-6"
                      style={{
                        background: `linear-gradient(135deg, ${theme.glass.bg} 0%, ${moodColor}10 100%)`,
                        backdropFilter: `blur(${theme.glass.blur})`,
                        border: `1px solid ${moodColor}30`,
                      }}
                    >
                      {/* Letter Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ background: `${moodColor}20` }}
                          >
                            ✉️
                          </span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                              {isLetterToFriend
                                ? `Letter to ${selectedStar.entry.recipientName || 'a friend'}`
                                : 'Letter to future self'}
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

                      {/* Sealed envelope */}
                      <div
                        className="relative rounded-xl p-6 text-center"
                        style={{
                          background: `${theme.bg.primary}60`,
                          border: `1px dashed ${moodColor}40`,
                        }}
                      >
                        <div className="text-4xl mb-3">🔒</div>
                        <p
                          className="text-sm italic"
                          style={{ color: theme.text.muted }}
                        >
                          {isLetterToFriend
                            ? `A sealed letter waiting to reach ${selectedStar.entry.recipientName || 'someone special'}...`
                            : 'A message from your past self, sealed until the right moment...'}
                        </p>

                        {selectedStar.entry.unlockDate && (
                          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.glass.border}` }}>
                            <p className="text-xs" style={{ color: theme.text.muted }}>
                              {new Date(selectedStar.entry.unlockDate) > new Date() ? (
                                <>⏳ Opens {format(new Date(selectedStar.entry.unlockDate), 'MMMM d, yyyy')}</>
                              ) : (
                                <>✨ {isLetterToFriend ? 'Delivered' : 'Ready to reveal'}</>
                              )}
                            </p>
                          </div>
                        )}

                        {selectedStar.entry.letterLocation && (
                          <p className="text-xs mt-3" style={{ color: theme.text.muted }}>
                            📍 Written from {selectedStar.entry.letterLocation}
                          </p>
                        )}
                      </div>

                      {/* Time ago */}
                      <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                        {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                      </p>
                    </div>
                  )
                }

                // Regular entry card
                return (
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
                          style={{ background: `${moodColor}20` }}
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
                      <div className="mt-4">
                        <SongEmbed url={selectedStar.entry.song} compact />
                      </div>
                    )}

                    {/* Time ago */}
                    <p className="mt-4 text-xs text-center" style={{ color: theme.text.muted }}>
                      {formatTimeAgo(new Date(selectedStar.entry.createdAt))}
                    </p>
                  </div>
                )
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
