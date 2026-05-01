'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { CottageFrame } from '../CottageFrame'
import { Logs } from '../Logs'
import { HearthFire } from '../HearthFire'
import { AmbientSparks } from '../AmbientSparks'
import { LetterWall } from '../LetterWall'

export interface HearthSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function HearthScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: HearthSceneProps) {
  const moodColor = (mood: number) =>
    [theme.moods[0], theme.moods[1], theme.moods[2], theme.moods[3], theme.moods[4]][mood] ??
    theme.accent.primary

  // Loading
  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          style={{
            color: theme.text.muted,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          stoking the hearth…
        </p>
      </motion.div>
    )
  }

  // Empty
  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ background: theme.bg.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SceneFrame />
        <motion.p
          className="relative z-10 mt-8 text-center"
          style={{ color: theme.text.muted, fontFamily: 'var(--font-serif)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          your hearth is waiting for its first memory
        </motion.p>
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
      <SceneFrame>
        <LetterWall
          memoryStars={memoryStars}
          theme={theme}
          onSelect={setSelectedStar}
        />
      </SceneFrame>

      {/* Subtle title — matches existing scenes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
      >
        <div className="flex items-center justify-center gap-3 md:gap-5 px-4">
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 14px ${theme.accent.warm})`,
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
              textShadow: `0 2px 18px ${theme.accent.warm}55`,
              lineHeight: 1.2,
            }}
          >
            press a memory to read it again
          </p>
          <motion.span
            style={{
              color: theme.accent.warm,
              filter: `drop-shadow(0 0 14px ${theme.accent.warm})`,
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
          {memoryStars.length} {memoryStars.length === 1 ? 'memory' : 'memories'} on the hearth tonight
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
        getMoodColor={moodColor}
      />
    </motion.div>
  )
}

// Composes the cottage + fire + sparks in a centered, responsive container.
// Wrapped so the loading/empty/main branches render the same scaffold.
function SceneFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Centered scene box: 80vw × 80vh on desktop, full bleed on mobile */}
      <div
        className="relative"
        style={{
          width: 'min(90vw, 720px)',
          aspectRatio: '1 / 1',
          maxHeight: '90vh',
        }}
      >
        <CottageFrame />

        {/* Inside-the-opening layer: opening occupies viewBox 130..270 horizontal, 240..380 vertical → ~35%–67% × ~60%–95% of the box */}
        <div
          className="absolute pointer-events-none"
          style={{ left: '32.5%', right: '32.5%', top: '60%', bottom: '5%' }}
        >
          <Logs />
          <HearthFire />
          <AmbientSparks />
        </div>

        {children}
      </div>
    </div>
  )
}
