'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { RoseSky } from '../rose/RoseSky'
import { GardenPath } from '../rose/GardenPath'
import { LowHedge } from '../rose/LowHedge'
import { Trellis } from '../rose/Trellis'
import { ScatteredFlora } from '../rose/ScatteredFlora'
import { RoseBlooms } from '../rose/RoseBlooms'
import { PetalDrift } from '../rose/PetalDrift'
import { RoseSVG } from '../rose/RoseSVG'
import { RoseBud } from '../rose/RoseBud'
import { AmbientDrift } from '../AmbientDrift'

export interface RoseGardenSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function RoseGardenScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: RoseGardenSceneProps) {
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
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <RoseSVG color="#F4B6B0" glow={theme.accent.warm} size={0.5} />
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            tending the rose garden…
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
          className="text-center relative z-10 px-6 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <RoseBud size={1.2} />
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            a quiet rose garden — write a memory and the first bloom appears
          </p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <RoseSky />
      <GardenPath />
      <LowHedge />
      <Trellis />
      <ScatteredFlora />
      <RoseBlooms
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        getMoodColor={getMoodColor}
      />
      <PetalDrift />
      <AmbientDrift theme={theme} creatures={['bee', 'bird']} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <div className="flex items-center justify-center gap-3 md:gap-5 px-4">
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 12px ${theme.accent.warm})`,
              fontSize: 'clamp(1rem, 2.4vw, 1.5rem)',
              display: 'inline-block',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1], rotate: [0, 12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦
          </motion.span>
          <p
            style={{
              color: theme.text.primary,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              letterSpacing: '0.015em',
              fontSize: 'clamp(1.125rem, 3vw, 1.875rem)',
              textShadow: `0 2px 14px ${theme.accent.warm}40`,
              lineHeight: 1.2,
            }}
          >
            press a bloom to reveal its memory
          </p>
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 12px ${theme.accent.warm})`,
              fontSize: 'clamp(1rem, 2.4vw, 1.5rem)',
              display: 'inline-block',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1], rotate: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            ✦
          </motion.span>
        </div>
        <p
          className="text-sm mt-3"
          style={{
            color: `${theme.text.muted}90`,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          your rose garden · {Math.min(memoryStars.length, 5)}{' '}
          {Math.min(memoryStars.length, 5) === 1 ? 'bloom' : 'blooms'}
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
    </motion.div>
  )
}
