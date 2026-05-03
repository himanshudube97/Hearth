'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../../ConstellationRenderer'
import { MemoryModal } from '../../MemoryModal'
import { HarbourSky } from '../ocean/HarbourSky'
import { FaintStars } from '../ocean/FaintStars'
import { HorizonSilhouettes } from '../ocean/HorizonSilhouettes'
import { HorizonMist } from '../ocean/HorizonMist'
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
            style={{ width: 48, height: 38 }}
          >
            <svg viewBox="-24 -28 48 38" width="48" height="38">
              <line x1="0" y1="-3" x2="0" y2="-25" stroke="#A89878" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M 0 -25 L 5 -23.5 L 0 -22 Z" fill="#C28860" opacity="0.85" />
              <path d="M 0 -25 L 0 -3 L 13 -5 Z" fill="#FFFFFF" stroke="#D8C8A4" strokeWidth="0.4" strokeLinejoin="round" />
              <path d="M -20 9 L 20 9 L 16 -1 L 9 -7 L 3 -1 L 0 1 L -3 -1 L -9 -7 L -16 -1 Z" fill="#F8F0DC" stroke="#B8A878" strokeWidth="0.4" strokeLinejoin="round" />
              <path d="M -20 9 L 20 9 L 17 4 L -17 4 Z" fill="#D8C8A4" opacity="0.55" />
            </svg>
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
      <FaintStars />
      <HorizonSilhouettes />
      <HorizonMist />
      <WaterAndReflections />
      <Dock />
      <PaperBoats
        memoryStars={memoryStars}
        onSelect={setSelectedStar}
        glowColor={theme.accent.warm}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
      >
        <div className="flex items-center justify-center gap-3 md:gap-5 px-4">
          <motion.span
            style={{
              color: '#F8E8D0',
              filter: 'drop-shadow(0 0 12px #F8E8D0AA)',
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
              color: '#F8E8D0',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              letterSpacing: '0.015em',
              fontSize: 'clamp(1.125rem, 3vw, 1.875rem)',
              textShadow: '0 2px 16px rgba(248,232,208,0.35), 0 1px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.2,
            }}
          >
            press a paper boat to reveal its memory
          </p>
          <motion.span
            style={{
              color: '#F8E8D0',
              filter: 'drop-shadow(0 0 12px #F8E8D0AA)',
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
            color: '#F8E8D0CC',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          your harbour · {Math.min(memoryStars.length, 5)}{' '}
          {Math.min(memoryStars.length, 5) === 1 ? 'boat afloat' : 'boats afloat'}
        </p>
      </motion.div>

      <MemoryModal
        selectedStar={selectedStar}
        setSelectedStar={setSelectedStar}
        theme={theme}
      />
    </motion.div>
  )
}
