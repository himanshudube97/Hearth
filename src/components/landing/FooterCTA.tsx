'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/store/theme'

export default function FooterCTA() {
  const { theme } = useThemeStore()

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: theme.accent.primary }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Decorative Emoji */}
        <motion.div
          className="text-4xl mb-8"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {theme.moodEmojis[4]}
        </motion.div>

        {/* Poetic Closing */}
        <motion.p
          className="text-2xl md:text-3xl font-serif italic mb-4"
          style={{ color: theme.text.primary }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          The page is patient.
        </motion.p>

        <motion.p
          className="text-lg mb-12"
          style={{ color: theme.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Your words are waiting. Your feelings matter. Begin when you're ready.
        </motion.p>

        {/* CTA Button with Heartbeat Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/write">
            <motion.button
              className="relative px-12 py-5 rounded-full text-xl font-medium overflow-hidden"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
                boxShadow: `0 0 60px ${theme.accent.primary}40`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Heartbeat Pulse */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: theme.accent.warm }}
                animate={{
                  scale: [1, 1.15, 1, 1.1, 1],
                  opacity: [0.4, 0, 0.4, 0, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="relative z-10">Start Your Journey</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Desktop nudge */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <Link
            href="/download"
            className="text-sm italic underline-offset-4 hover:underline"
            style={{ color: theme.text.muted }}
          >
            Also on desktop — Mac · Windows · Linux
          </Link>
        </motion.div>

        {/* Subtle Footer Text */}
        <motion.p
          className="mt-8 text-sm"
          style={{ color: theme.text.muted }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          Hearth — a meditative journal that listens
        </motion.p>
      </div>
    </section>
  )
}
