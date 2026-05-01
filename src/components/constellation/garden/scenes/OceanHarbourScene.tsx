'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { HarbourSky } from '../ocean/HarbourSky'
import { HorizonSilhouettes } from '../ocean/HorizonSilhouettes'
import { WaterAndReflections } from '../ocean/WaterAndReflections'
import { Dock } from '../ocean/Dock'
import { PaperBoats } from '../ocean/PaperBoats'
import { PaperBoat } from '../ocean/PaperBoat'

export interface OceanHarbourSceneProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function OceanHarbourScene({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: OceanHarbourSceneProps) {
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
            animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 36, height: 22, position: 'relative' }}
          >
            {/* Mini boat for the loading state */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: 36,
                height: 10,
                background: 'linear-gradient(180deg, #F8F0DC 60%, #D8C8A4 100%)',
                clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 14,
                bottom: 9,
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '16px solid #F8F0DC',
              }}
            />
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            the harbour wakes…
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <HarbourSky />
        <WaterAndReflections />
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center flex flex-col items-center gap-4">
            {/* Single lone boat in the middle of the harbour */}
            <div style={{ position: 'relative', width: 120, height: 60 }}>
              <PaperBoat
                slotX={50}
                slotYFromBottom={20}
                tilt={0}
                scale={1.0}
                phaseOffset={0}
                glow={false}
                glowColor="#FFFFFF"
                delay={0.4}
                onClick={() => {}}
                ariaLabel="A single paper boat — the harbour is quiet"
              />
            </div>
            <p
              style={{
                color: '#F8E8D0',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              a quiet harbour — set your first boat afloat by writing a memory
            </p>
          </div>
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
      <HarbourSky />
      <HorizonSilhouettes />
      <WaterAndReflections />
      <Dock />
      <PaperBoats
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        getMoodColor={getMoodColor}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <p
          className="text-lg"
          style={{
            color: '#F8E8D0',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          your harbour
        </p>
        <p
          className="text-sm mt-1"
          style={{
            color: '#F8E8D0CC',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {Math.min(memoryStars.length, 7)}{' '}
          {Math.min(memoryStars.length, 7) === 1
            ? 'boat afloat'
            : 'boats afloat'}
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
