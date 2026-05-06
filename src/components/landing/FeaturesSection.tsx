'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

type Feature = {
  numeral: string
  title: string
  description: string
  illustration: 'journal' | 'letters' | 'scrapbook' | 'memory'
}

const features: Feature[] = [
  {
    numeral: 'I',
    title: 'The page that listens',
    description:
      'Words, doodles, a song, a mood — left exactly where you set them down.',
    illustration: 'journal',
  },
  {
    numeral: 'II',
    title: 'Letters that wait',
    description:
      'Seal one to your future self, or to a friend. It returns when the time is right.',
    illustration: 'letters',
  },
  {
    numeral: 'III',
    title: 'Small things, kept',
    description:
      'A scrapbook for photographs, scraps, and quiet keepsakes you don’t want to lose.',
    illustration: 'scrapbook',
  },
  {
    numeral: 'IV',
    title: 'Where memory grows',
    description:
      'A constellation, a garden, a small firelight — your year takes shape as something you can wander through.',
    illustration: 'memory',
  },
]

export default function FeaturesSection() {
  const { theme } = useThemeStore()

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section heading — kept very quiet, like a chapter divider */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <motion.p
            className="text-xs uppercase tracking-[0.4em] mb-5"
            style={{ color: theme.text.muted }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Contents
          </motion.p>
          <h2
            className="font-serif italic text-3xl md:text-4xl"
            style={{ color: theme.text.primary }}
          >
            A small house for the days
          </h2>
          <motion.div
            className="mx-auto mt-8 h-px"
            style={{ background: theme.text.muted }}
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 64, opacity: 0.5 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Entries grid */}
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-20">
          {features.map((feature, index) => (
            <Entry key={feature.numeral} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Entry({ feature, index }: { feature: Feature; index: number }) {
  const { theme } = useThemeStore()

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -3 }}
      className="group relative cursor-default"
    >
      {/* Thin top rule that draws itself in on view */}
      <motion.div
        className="h-px mb-6"
        style={{ background: theme.text.muted }}
        initial={{ scaleX: 0, opacity: 0, transformOrigin: 'left' }}
        whileInView={{ scaleX: 1, opacity: 0.35 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: index * 0.15 + 0.2, ease: 'easeOut' }}
      />

      <div className="flex items-start gap-6">
        {/* Roman numeral — softly breathing */}
        <motion.span
          className="font-serif italic text-3xl md:text-4xl shrink-0 leading-none pt-1 select-none"
          style={{ color: theme.text.muted }}
          animate={{
            opacity: [0.55, 0.85, 0.55],
            y: [0, -1.5, 0],
          }}
          transition={{
            duration: 6 + index * 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.4,
          }}
        >
          {feature.numeral}
        </motion.span>

        <div className="flex-1 min-w-0">
          <h3
            className="font-serif italic text-xl md:text-2xl mb-3 leading-snug"
            style={{ color: theme.text.primary }}
          >
            {feature.title}
          </h3>

          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: theme.text.secondary }}
          >
            {feature.description}
          </p>

          {/* Illustration — drawn in once, then loops gently */}
          <motion.div
            className="mx-auto"
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 7 + index * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.3,
            }}
          >
            <Illustration kind={feature.illustration} />
          </motion.div>
        </div>
      </div>
    </motion.article>
  )
}

export function Illustration({ kind }: { kind: 'journal' | 'letters' | 'scrapbook' | 'memory' }) {
  const { theme } = useThemeStore()
  const stroke = theme.text.primary
  const accent = theme.accent.warm
  const accentSecondary = theme.accent.secondary

  if (kind === 'journal') {
    return (
      <svg
        viewBox="0 0 200 80"
        className="w-full max-w-55 h-20 mx-auto"
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
      >
        {/* Spine */}
        <motion.path
          d="M 100 20 V 70"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
        {/* Pages — gentle 'breathing' scale once drawn */}
        <motion.path
          d="M 30 22 Q 65 12 100 20 Q 135 12 170 22 L 170 70 Q 135 60 100 68 Q 65 60 30 70 Z"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4 }}
        />
        {/* Two lines of writing — fade in/out like ink appearing */}
        <motion.path
          d="M 110 38 Q 130 35 150 39"
          stroke={accent}
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />
        <motion.path
          d="M 110 48 Q 128 45 145 49"
          stroke={accent}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.7, 0.4, 0.7] }}
          transition={{
            pathLength: { duration: 0.8, delay: 1.4 },
            opacity: {
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 2,
            },
          }}
        />
      </svg>
    )
  }

  if (kind === 'letters') {
    return (
      <motion.svg
        viewBox="0 0 200 80"
        className="w-full max-w-55 h-20 mx-auto"
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
        // Envelope rocks gently
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.rect
          x="40"
          y="20"
          width="120"
          height="48"
          rx="2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        />
        <motion.path
          d="M 40 22 L 100 50 L 160 22"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
        />
        {/* Wax seal — soft pulse */}
        <motion.circle
          cx="100"
          cy="56"
          r="5"
          fill={accent}
          stroke="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 0.95, 0.7],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.6 },
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.6 },
          }}
        />
      </motion.svg>
    )
  }

  if (kind === 'scrapbook') {
    return (
      <svg
        viewBox="0 0 200 80"
        className="w-full max-w-55 h-20 mx-auto"
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
      >
        {/* Three scraps fade in one by one, then drift via the parent y-bob */}
        <motion.rect
          x="38"
          y="18"
          width="60"
          height="46"
          transform="rotate(-6 68 41)"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
        <motion.rect
          x="80"
          y="22"
          width="60"
          height="46"
          transform="rotate(3 110 45)"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.rect
          x="120"
          y="16"
          width="44"
          height="44"
          transform="rotate(-3 142 38)"
          stroke={accent}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />

        {/* Tiny pin / sticker */}
        <motion.circle
          cx="142"
          cy="20"
          r="2"
          fill={accentSecondary}
          stroke="none"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.8 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 1.4 }}
        />
      </svg>
    )
  }

  // memory — stars twinkle continuously
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-full max-w-55 h-20 mx-auto"
      fill="none"
      stroke={stroke}
      strokeWidth="1.2"
      strokeLinecap="round"
      style={{ opacity: 0.7 }}
    >
      <motion.path
        d="M 30 50 L 70 28 L 105 55 L 140 30 L 175 48"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6 }}
        strokeOpacity="0.4"
      />
      {[
        { cx: 30, cy: 50, delay: 0 },
        { cx: 70, cy: 28, delay: 0.4 },
        { cx: 105, cy: 55, delay: 0.8 },
        { cx: 140, cy: 30, delay: 1.2 },
        { cx: 175, cy: 48, delay: 1.6 },
      ].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.cx}
          cy={star.cy}
          r="3"
          fill={accent}
          stroke="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0.85, 1.15, 0.85],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            scale: {
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.6 + star.delay,
            },
            opacity: {
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.6 + star.delay,
            },
          }}
        />
      ))}
      {/* A tiny sprout — hint at 'garden' */}
      <motion.path
        d="M 105 70 Q 105 64 102 60 M 105 70 Q 105 64 108 60"
        stroke={accentSecondary}
        strokeWidth="1"
        strokeOpacity="0.7"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.8 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 2 }}
      />
    </svg>
  )
}
