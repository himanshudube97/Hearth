'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

const features = [
  {
    icon: '✎',
    title: 'Write Freely',
    description: 'A distraction-free space where your thoughts flow naturally. No pressure, no judgment — just you and the page.',
    demo: 'editor',
  },
  {
    icon: '✨',
    title: 'Track Your Emotions',
    description: 'Choose a mood that resonates with how you feel. Watch your emotional landscape unfold over time.',
    demo: 'moods',
  },
  {
    icon: '🎨',
    title: 'Doodle Your Thoughts',
    description: "Sometimes words aren't enough. Draw, sketch, and let your creativity speak.",
    demo: 'doodle',
  },
  {
    icon: '🎭',
    title: '10 Beautiful Themes',
    description: 'From misty mountains to cherry blossoms, find the ambience that matches your mood.',
    demo: 'themes',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

export default function FeaturesSection() {
  const { theme } = useThemeStore()

  return (
    <section className="py-24 px-6">
      <motion.div
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* Section Header */}
        <motion.div className="text-center mb-16" variants={cardVariants}>
          <h2
            className="text-3xl md:text-4xl font-serif mb-4"
            style={{ color: theme.text.primary }}
          >
            A sanctuary for your thoughts
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: theme.text.secondary }}
          >
            Every feature designed to help you reflect, express, and grow
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative p-8 rounded-2xl overflow-hidden"
              style={{
                background: theme.glass.bg,
                backdropFilter: `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
              }}
              whileHover={{
                y: -5,
                transition: { duration: 0.3 },
              }}
            >
              {/* Hover Glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at center, ${theme.accent.primary}10 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <motion.span
                  className="text-4xl block mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {feature.icon}
                </motion.span>

                {/* Title */}
                <h3
                  className="text-xl font-medium mb-3"
                  style={{ color: theme.text.primary }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className="mb-6"
                  style={{ color: theme.text.secondary }}
                >
                  {feature.description}
                </p>

                {/* Feature Demo */}
                <FeatureDemo type={feature.demo} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function FeatureDemo({ type }: { type: string }) {
  const { theme } = useThemeStore()

  if (type === 'editor') {
    return (
      <div
        className="p-4 rounded-xl"
        style={{
          background: `${theme.bg.primary}80`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <TypingDemo />
      </div>
    )
  }

  if (type === 'moods') {
    return (
      <div className="flex gap-3 justify-center">
        {theme.moodEmojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="text-2xl cursor-pointer"
            whileHover={{ scale: 1.3, y: -5 }}
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              y: { delay: i * 0.1, duration: 2, repeat: Infinity },
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    )
  }

  if (type === 'doodle') {
    return (
      <div
        className="h-20 rounded-xl overflow-hidden relative"
        style={{
          background: `${theme.bg.primary}80`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <DoodleDemo />
      </div>
    )
  }

  if (type === 'themes') {
    return (
      <div className="flex gap-2 justify-center">
        {['🌿', '❄️', '🌸', '🌌', '🕯️'].map((emoji, i) => (
          <motion.div
            key={i}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
            }}
            whileHover={{ scale: 1.2 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{
              rotate: { delay: i * 0.2, duration: 4, repeat: Infinity },
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

function TypingDemo() {
  const { theme } = useThemeStore()
  const text = "Today I feel grateful for..."

  return (
    <div className="font-serif" style={{ color: theme.text.secondary }}>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.05 }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ color: theme.accent.primary }}
        >
          |
        </motion.span>
      </motion.span>
    </div>
  )
}

function DoodleDemo() {
  const { theme } = useThemeStore()

  return (
    <svg className="w-full h-full" viewBox="0 0 200 80">
      <motion.path
        d="M 20 40 Q 50 20 80 40 T 140 40 T 180 30"
        fill="none"
        stroke={theme.accent.primary}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.8 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
      <motion.circle
        cx="60"
        cy="50"
        r="8"
        fill={theme.accent.warm}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.5 }}
      />
      <motion.circle
        cx="120"
        cy="35"
        r="5"
        fill={theme.accent.secondary}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.8, duration: 0.5 }}
      />
    </svg>
  )
}
