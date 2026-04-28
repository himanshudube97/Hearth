'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { MemoryModal } from './MemoryModal'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

// Deterministic placement derived from entry id so leaves stay put across renders
function deterministicPlacement(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const abs = Math.abs(hash)
  return {
    x: (abs % 80) + 10,                 // 10-90 vw
    y: ((abs >> 7) % 70) + 15,          // 15-85 vh
    rotate: ((abs >> 14) % 60) - 30,    // -30 to +30 deg
    isFlower: ((abs >> 21) % 8) === 0,  // ~1 in 8
  }
}

function PressedLeaf({
  color,
  stem,
  rotate,
  size = 40,
}: {
  color: string
  stem: string
  rotate: number
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 10 14"
      style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}
    >
      <path d="M5,1 C2,3 1,7 5,13 C9,7 8,3 5,1 Z" fill={color} opacity="0.85" />
      <line x1="5" y1="0.5" x2="5" y2="13" stroke={stem} strokeWidth="0.3" opacity="0.6" />
      <line x1="5" y1="6" x2="3" y2="9" stroke={stem} strokeWidth="0.2" opacity="0.5" />
      <line x1="5" y1="6" x2="7" y2="9" stroke={stem} strokeWidth="0.2" opacity="0.5" />
    </svg>
  )
}

function PressedFlower({
  color,
  rotate,
  size = 40,
}: {
  color: string
  rotate: number
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}
    >
      {[0, 60, 120, 180, 240, 300].map(a => (
        <ellipse
          key={a}
          cx="6"
          cy="3.5"
          rx="1.6"
          ry="2.5"
          fill={color}
          opacity="0.7"
          transform={`rotate(${a} 6 6)`}
        />
      ))}
      <circle cx="6" cy="6" r="1.2" fill={color} opacity="0.95" />
    </svg>
  )
}

export function GardenRenderer({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: GardenRendererProps) {
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

  // Compute deterministic placements once per memoryStars list
  const placements = useMemo(
    () =>
      memoryStars.map(star => ({
        star,
        placement: deterministicPlacement(star.entry.id),
      })),
    [memoryStars],
  )

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
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
            ✿
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            tending the garden...
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-3xl mb-4 opacity-50">✿</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            your garden is waiting for its first leaf — write something to begin
          </p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ background: theme.bg.gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Pressed leaves and flowers */}
      <div className="absolute inset-0">
        {placements.map(({ star, placement }) => {
          const color = getMoodColor(star.entry.mood)
          const stem = theme.accent.secondary

          return (
            <motion.div
              key={star.id}
              className="absolute cursor-pointer"
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.3 + star.delay,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                y: -4,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))',
                transition: { duration: 0.2 },
              }}
              onClick={() => setSelectedStar(star)}
            >
              {placement.isFlower ? (
                <PressedFlower color={color} rotate={placement.rotate} />
              ) : (
                <PressedLeaf color={color} stem={stem} rotate={placement.rotate} />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: theme.text.primary,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your garden
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {memoryStars.length} {memoryStars.length === 1 ? 'letter' : 'letters'} pressed
        </p>
      </motion.div>

      {/* Memory modal — shared with ConstellationRenderer */}
      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
    </motion.div>
  )
}
