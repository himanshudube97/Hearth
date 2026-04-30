'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { useGardenParallax } from '../useGardenParallax'
import {
  SkyBand,
  Hills,
  DistantTrees,
  MidGrove,
  Wildflowers,
  ForegroundFrame,
  GroundBand,
} from '../gardenLayers'
import { AmbientDrift } from '../AmbientDrift'
import { LetterClothesline } from '../LetterClothesline'

export interface MeadowSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function MeadowScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: MeadowSceneProps) {
  const parallax = useGardenParallax()

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
      <SkyBand parallax={parallax} theme={theme} />
      <Hills parallax={parallax} theme={theme} />
      <DistantTrees parallax={parallax} theme={theme} />
      <MidGrove parallax={parallax} theme={theme} />
      <GroundBand theme={theme} />
      <Wildflowers parallax={parallax} theme={theme} />
      <LetterClothesline
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        theme={theme}
        getMoodColor={getMoodColor}
      />
      <AmbientDrift theme={theme} />
      <ForegroundFrame parallax={parallax} theme={theme} />

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
          {memoryStars.length}{' '}
          {memoryStars.length === 1 ? 'letter pressed' : 'letters pressed'}
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
