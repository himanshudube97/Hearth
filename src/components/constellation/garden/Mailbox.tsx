'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
import type { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '../ConstellationRenderer'

interface MailboxProps {
  entries: JournalEntry[]
  visibleIds: Set<string>
  theme: Theme
  onPick: (star: MemoryStar) => void
}

/**
 * Wooden mailbox in the lower-right of the garden. Click it: it shakes,
 * door fades to reveal the interior, a folded letter floats up + scales
 * toward center, then the parent receives a randomly-picked archive
 * memory and opens the modal.
 */
export function Mailbox({ entries, visibleIds, theme, onPick }: MailboxProps) {
  const [isOpening, setIsOpening] = useState(false)

  const wood = theme.text.muted
  const woodDark = theme.text.secondary
  const woodLight = `${theme.text.muted}cc`
  const brass = theme.accent.warm
  const flagColor = theme.accent.primary
  const leafColor = theme.accent.primary
  const flowerColor = theme.accent.highlight

  const pickRandomArchive = (): JournalEntry | null => {
    if (entries.length === 0) return null
    const pool = entries.filter(e => !visibleIds.has(e.id))
    const source = pool.length > 0 ? pool : entries
    return source[Math.floor(Math.random() * source.length)] ?? null
  }

  const handleClick = () => {
    if (isOpening) return
    if (entries.length === 0) return
    setIsOpening(true)

    setTimeout(() => {
      const picked = pickRandomArchive()
      if (picked) {
        onPick({
          id: `mailbox-${picked.id}`,
          x: 50,
          y: 50,
          size: 5,
          entry: picked,
          delay: 0,
        })
      }
    }, 700)

    setTimeout(() => setIsOpening(false), 1100)
  }

  return (
    <div
      className="absolute"
      style={{
        right: '16%',
        bottom: '11%',
        width: 150,
        height: 210,
      }}
    >
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label="Open the mailbox to surface a memory"
        className="relative w-full h-full cursor-pointer focus:outline-none"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
        whileHover={isOpening ? undefined : { y: -2 }}
        animate={
          isOpening
            ? { rotate: [0, -4, 4, -3, 3, -1.5, 0] }
            : { rotate: 0 }
        }
        transition={
          isOpening
            ? { duration: 0.5, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      >
        {/* Soft hover glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 60% 45%, ${brass}33 0%, transparent 65%)`,
            filter: 'blur(16px)',
          }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          animate={isOpening ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4 }}
        />

        <svg
          viewBox="0 0 160 220"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Wood-grain gradient */}
            <linearGradient id="post-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={woodDark} />
              <stop offset="40%" stopColor={wood} />
              <stop offset="60%" stopColor={woodLight} />
              <stop offset="100%" stopColor={woodDark} />
            </linearGradient>
            {/* Box-side gradient for soft 3D */}
            <linearGradient id="box-side" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`${wood}f0`} />
              <stop offset="55%" stopColor={`${woodDark}d8`} />
              <stop offset="100%" stopColor={`${woodDark}ee`} />
            </linearGradient>
            <radialGradient id="box-front-light" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ------- Grass tuft at base ------- */}
          <g opacity="0.55">
            {Array.from({ length: 14 }, (_, i) => {
              const x = 50 + i * 5 + ((i * 3) % 4)
              const h = 10 + ((i * 7) % 10)
              const lean = ((i * 5) % 6) - 3
              return (
                <path
                  key={i}
                  d={`M${x},218 Q${x + lean / 2},${218 - h / 2} ${x + lean},${218 - h} Q${x + lean - 0.5},${218 - h / 2} ${x - 0.5},218 Z`}
                  fill={leafColor}
                />
              )
            })}
          </g>

          {/* ------- Post ------- */}
          {/* Shadow on ground */}
          <ellipse cx="80" cy="218" rx="34" ry="4" fill="#000" opacity="0.13" />

          {/* Post body */}
          <rect x="70" y="125" width="20" height="92" fill="url(#post-wood)" rx="2" />
          {/* Post grain lines */}
          <line x1="74" y1="130" x2="74" y2="215" stroke={woodDark} strokeWidth="0.4" opacity="0.4" />
          <line x1="86" y1="130" x2="86" y2="215" stroke={woodDark} strokeWidth="0.4" opacity="0.4" />

          {/* Climbing vine on post */}
          <g>
            <path
              d="M70,210 Q66,195 72,180 Q80,166 70,152 Q66,142 76,130"
              stroke={leafColor}
              strokeWidth="1.4"
              fill="none"
              opacity="0.75"
            />
            {/* Vine leaves */}
            <ellipse cx="68" cy="200" rx="3" ry="5" fill={leafColor} opacity="0.85" transform="rotate(-30 68 200)" />
            <ellipse cx="74" cy="186" rx="3" ry="5" fill={leafColor} opacity="0.85" transform="rotate(20 74 186)" />
            <ellipse cx="68" cy="172" rx="3" ry="5" fill={leafColor} opacity="0.85" transform="rotate(-35 68 172)" />
            <ellipse cx="76" cy="158" rx="3" ry="5" fill={leafColor} opacity="0.85" transform="rotate(25 76 158)" />
            {/* Tiny vine flower */}
            <g transform="translate(70,148)">
              {[0, 72, 144, 216, 288].map(a => (
                <ellipse key={a} cx="0" cy="-2.5" rx="1.5" ry="2.3" fill={flowerColor} opacity="0.9" transform={`rotate(${a})`} />
              ))}
              <circle cx="0" cy="0" r="0.9" fill={brass} />
            </g>
          </g>

          {/* ------- Mailbox body ------- */}
          {/* Main rounded-top tunnel shape, side view facing slightly to viewer */}
          <g>
            {/* Base "tunnel" silhouette (back) */}
            <path
              d="M22,80
                 L22,124
                 L138,124
                 L138,80
                 Q138,38 80,38
                 Q22,38 22,80 Z"
              fill="url(#box-side)"
            />
            {/* Subtle horizontal seam at base */}
            <line x1="22" y1="124" x2="138" y2="124" stroke={woodDark} strokeWidth="0.8" opacity="0.7" />

            {/* Front face (a rounded rectangle on the left, where door lives) */}
            <path
              d="M22,80
                 L22,124
                 L40,124
                 L40,80
                 Q40,38 31,38
                 Q22,38 22,80 Z"
              fill={`${woodDark}f5`}
            />
            {/* Front face highlight */}
            <path
              d="M24,80
                 L24,120
                 L38,120
                 L38,80
                 Q38,40 31,40
                 Q24,40 24,80 Z"
              fill="url(#box-front-light)"
            />

            {/* Letter slot (top of body) */}
            <rect x="62" y="48" width="56" height="3.5" rx="1.5" fill={woodDark} opacity="0.7" />
            <rect x="62" y="48" width="56" height="1" rx="0.5" fill="#000" opacity="0.4" />

            {/* House numbers / decoration on side */}
            <g opacity="0.6">
              <circle cx="78" cy="100" r="1.3" fill={brass} />
              <circle cx="86" cy="100" r="1.3" fill={brass} />
              <circle cx="94" cy="100" r="1.3" fill={brass} />
            </g>

            {/* Brass trim along bottom edge */}
            <rect x="22" y="121" width="116" height="2" fill={brass} opacity="0.55" />
            {/* Top highlight rim */}
            <path
              d="M28,55 Q28,42 50,42"
              stroke="#ffffff"
              strokeWidth="1.1"
              fill="none"
              opacity="0.18"
            />
          </g>

          {/* Interior shadow (visible once door opens) */}
          <motion.ellipse
            cx="31"
            cy="82"
            rx="14"
            ry="32"
            fill={woodDark}
            initial={{ opacity: 0 }}
            animate={isOpening ? { opacity: 0.85 } : { opacity: 0 }}
            transition={isOpening ? { duration: 0.18, delay: 0.5 } : { duration: 0.25 }}
          />

          {/* Door — circular face on the front-left of the body */}
          <motion.g
            animate={isOpening ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
            style={{ transformOrigin: '31px 82px' }}
            transition={
              isOpening
                ? { duration: 0.32, delay: 0.45, ease: 'easeOut' }
                : { duration: 0.2 }
            }
          >
            {/* Door plate */}
            <ellipse cx="31" cy="82" rx="14" ry="32" fill={brass} />
            <ellipse cx="31" cy="82" rx="14" ry="32" fill="#ffffff" opacity="0.10" />
            <ellipse cx="31" cy="82" rx="11.5" ry="29" fill="none" stroke={woodDark} strokeWidth="0.6" opacity="0.55" />
            {/* Hinges */}
            <rect x="44" y="58" width="2.5" height="6" fill={woodDark} opacity="0.7" rx="0.6" />
            <rect x="44" y="100" width="2.5" height="6" fill={woodDark} opacity="0.7" rx="0.6" />
            {/* Knob */}
            <circle cx="22" cy="82" r="1.6" fill={woodDark} />
            <circle cx="22" cy="82" r="1" fill={brass} opacity="0.85" />
          </motion.g>

          {/* Flag (right side) */}
          <motion.g
            style={{ transformOrigin: '138px 92px' }}
            animate={
              isOpening
                ? { rotate: [0, -85, -85, 0] }
                : { rotate: [0, -3, 0, 2, 0] }
            }
            transition={
              isOpening
                ? { duration: 1.0, ease: 'easeOut', times: [0, 0.2, 0.85, 1] }
                : { duration: 6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }
            }
          >
            <line x1="138" y1="92" x2="138" y2="58" stroke={woodDark} strokeWidth="1.6" />
            <path d="M138,58 L156,64 L138,70 Z" fill={flagColor} />
            <path d="M138,58 L156,64 L138,70 Z" fill="#ffffff" opacity="0.12" />
          </motion.g>
        </svg>

        {/* Flying letter */}
        <AnimatePresence>
          {isOpening && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: 16,
                top: 64,
                width: 30,
                height: 22,
              }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{
                x: [0, -120, -260],
                y: [0, -180, -320],
                scale: [0.4, 1.4, 2.6],
                opacity: [0, 1, 0],
                rotate: [-8, 14, 6],
              }}
              transition={{
                duration: 0.95,
                delay: 0.55,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.6, 1],
              }}
            >
              <svg viewBox="0 0 30 22" width="100%" height="100%">
                <rect x="1" y="1" width="28" height="20" rx="1.8" fill="#FFFFFF" stroke={woodDark} strokeWidth="0.6" />
                <path d="M1,2 L15,13 L29,2" stroke={woodDark} strokeWidth="0.6" fill="none" />
                <path d="M1,20 L12,12 M29,20 L18,12" stroke={woodDark} strokeWidth="0.5" fill="none" opacity="0.6" />
                <circle cx="15" cy="15" r="2.2" fill={brass} opacity="0.85" />
                <circle cx="15" cy="15" r="2.2" fill="#ffffff" opacity="0.18" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
