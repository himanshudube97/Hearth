'use client'

import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from './ConstellationRenderer'
import { MemoryModal } from './MemoryModal'
import { useGardenParallax } from './garden/useGardenParallax'
import {
  DuskSky,
  StarField,
  CloudDrift,
  FarVillage,
  DistantVillage,
  NearVillage,
  CurvedPath,
  PaperPlanes,
  EnvelopeBalloon,
  GroundLine,
} from './garden/PostalSky'
import { LampLetterbox } from './garden/LampLetterbox'
import { LeftLamp } from './garden/LeftLamp'
import { Bunting } from './garden/Bunting'
import {
  SkyBand,
  Hills,
  DistantTrees,
  MidGrove,
  Wildflowers,
  ForegroundFrame,
  GroundBand,
} from './garden/gardenLayers'
import { AmbientDrift } from './garden/AmbientDrift'
import { LetterClothesline } from './garden/LetterClothesline'

export interface GardenRendererProps {
  loading: boolean
  entries: JournalEntry[]
  memoryStars: MemoryStar[]
  selectedStar: MemoryStar | null
  setSelectedStar: (s: MemoryStar | null) => void
  theme: Theme
}

export function GardenRenderer({
  loading,
  entries,
  memoryStars,
  selectedStar,
  setSelectedStar,
  theme,
}: GardenRendererProps) {
  const parallax = useGardenParallax()
  const isPostal = theme.ambience === 'postal'

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
            {isPostal ? '✦' : '✿'}
          </motion.div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            {isPostal ? 'sorting the evening post…' : 'tending the garden...'}
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
          <div className="text-3xl mb-4 opacity-50">{isPostal ? '✉' : '✿'}</div>
          <p
            style={{
              color: theme.text.muted,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            {isPostal
              ? "the post hasn't arrived yet — write something and the first letter will fly in"
              : 'your garden is waiting for its first leaf — write something to begin'}
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
      {isPostal ? (
        <>
          {/* Dusk sky — gradient + sun glow + horizon haze */}
          <DuskSky parallax={parallax} theme={theme} />

          {/* Twinkling stars / dust scattered in the upper sky */}
          <StarField parallax={parallax} theme={theme} />

          {/* Sticker-style clouds at four parallax depths */}
          <CloudDrift parallax={parallax} theme={theme} />

          {/* Far hazy village silhouette behind the main row */}
          <FarVillage parallax={parallax} theme={theme} />

          {/* Mid-distance town silhouette with twinkling windows */}
          <DistantVillage parallax={parallax} theme={theme} />

          {/* Closer foreground building row with chimneys + smoke */}
          <NearVillage parallax={parallax} theme={theme} />

          {/* Paper planes drifting across the sky */}
          <PaperPlanes parallax={parallax} theme={theme} />

          {/* Envelope-balloon bobbing at upper-right */}
          <EnvelopeBalloon parallax={parallax} theme={theme} />

          {/* Curved path leading toward the horizon with perspective lamps */}
          <CurvedPath parallax={parallax} theme={theme} />

          {/* Soft ink-line ground band */}
          <GroundLine theme={theme} />

          {/* Mirror lamppost on the left (no postbox) */}
          <LeftLamp theme={theme} parallax={parallax} />

          {/* Colorful triangle bunting strung between the two lamp tops */}
          <Bunting parallax={parallax} />

          {/* Foreground lamppost with letterbox in front of its pole */}
          <LampLetterbox theme={theme} parallax={parallax} />
        </>
      ) : (
        <>
          {/* Sky atmosphere */}
          <SkyBand parallax={parallax} theme={theme} />

          {/* Watercolor mountains */}
          <Hills parallax={parallax} theme={theme} />

          {/* Distant tree silhouettes along the horizon */}
          <DistantTrees parallax={parallax} theme={theme} />

          {/* Mid-distance grove of trees & shrubs */}
          <MidGrove parallax={parallax} theme={theme} />

          {/* Ground band (grass) */}
          <GroundBand theme={theme} />

          {/* Wildflowers scattered across the meadow */}
          <Wildflowers parallax={parallax} theme={theme} />

          {/* Letter clothesline — primary memory display, hangs across mid-scene */}
          <LetterClothesline
            memoryStars={memoryStars}
            onSelect={setSelectedStar}
            theme={theme}
            getMoodColor={getMoodColor}
          />

          {/* Ambient creatures (butterflies, bee, bird) */}
          <AmbientDrift theme={theme} />

          {/* Foreground frame — large plants in corners (parallax inversion) */}
          <ForegroundFrame parallax={parallax} theme={theme} />
        </>
      )}

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
          {isPostal ? 'evening post' : 'your garden'}
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
          {isPostal
            ? memoryStars.length === 1
              ? 'letter on the wind'
              : 'letters on the wind'
            : memoryStars.length === 1
              ? 'letter pressed'
              : 'letters pressed'}
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
