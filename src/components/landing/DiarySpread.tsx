// src/components/landing/DiarySpread.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { FeatureSpread, ThemesSpread } from './spreads'
import { Illustration } from './FeaturesSection'

const PLACEHOLDER_SRC = '/landing/diary/placeholder.svg'

export function DiarySpreadLeft({ spread }: { spread: FeatureSpread | ThemesSpread }) {
  return (
    <div className="h-full flex flex-col">
      <p className="font-serif italic text-3xl md:text-4xl leading-none mb-3" style={{ opacity: 0.4 }}>
        {spread.numeral}
      </p>
      <h3 className="font-serif italic text-2xl md:text-3xl mb-5 leading-snug">
        {spread.title}
      </h3>
      <p className="text-base leading-relaxed max-w-[36ch] mb-8" style={{ opacity: 0.85 }}>
        {spread.copy}
      </p>

      {'illustration' in spread && spread.illustration && (
        <div className="opacity-70 mb-auto">
          <Illustration kind={spread.illustration} />
        </div>
      )}

      <motion.p
        className="font-serif italic text-xs mt-auto"
        style={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {spread.marginalia}
      </motion.p>
    </div>
  )
}

export function DiarySpreadRight({ spread, spreadIndex }: { spread: FeatureSpread; spreadIndex: number }) {
  const tilt = spreadIndex % 2 === 0 ? 1.5 : -1.5
  const [errored, setErrored] = useState(false)
  // Reset the fallback flag whenever the spread's imagePath changes so each
  // spread gets a fresh chance to load its real screenshot.
  useEffect(() => {
    setErrored(false)
  }, [spread.imagePath])
  const src = errored ? PLACEHOLDER_SRC : spread.imagePath
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <motion.div
        className="relative bg-white p-3 pb-10"
        style={{
          boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)',
        }}
        animate={{ rotate: [tilt, tilt - 0.4, tilt], y: [0, -1.5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-[min(38vw,420px)] aspect-4/3 overflow-hidden">
          <Image
            key={spread.imagePath}
            src={src}
            alt={spread.imageAlt}
            fill
            sizes="(max-width: 768px) 80vw, 420px"
            className="object-cover"
            unoptimized
            onError={() => setErrored(true)}
          />
        </div>
      </motion.div>
      <p className="font-serif italic text-sm mt-4 opacity-60">
        {spread.caption}
      </p>
    </div>
  )
}
