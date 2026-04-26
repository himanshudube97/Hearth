'use client'

import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface PageTurnProps {
  direction: 'forward' | 'backward'
  onComplete: () => void
}

export default function PageTurn({ direction, onComplete }: PageTurnProps) {
  const { theme } = useThemeStore()
  const controls = useAnimation()

  const pageColor = theme.glass.bg
  const pageColorDark = 'rgba(255,255,255,0.08)'

  useEffect(() => {
    const animate = async () => {
      // Animate the page turn
      await controls.start({
        rotateY: direction === 'forward' ? -180 : 180,
        transition: {
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        },
      })
      onComplete()
    }
    animate()
  }, [controls, direction, onComplete])

  return (
    <motion.div
      className="absolute inset-0 z-50"
      style={{
        perspective: '2500px',
        perspectiveOrigin: direction === 'forward' ? 'left center' : 'right center',
      }}
    >
      <motion.div
        className="absolute"
        style={{
          width: '50%',
          height: '100%',
          left: direction === 'forward' ? '50%' : '0',
          transformStyle: 'preserve-3d',
          transformOrigin: direction === 'forward' ? 'left center' : 'right center',
        }}
        initial={{ rotateY: 0 }}
        animate={controls}
      >
        {/* Front of page (visible initially) */}
        <div
          className="absolute inset-0 overflow-hidden rounded"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(${direction === 'forward' ? '90deg' : '270deg'},
              ${pageColor} 0%,
              ${pageColorDark} 100%
            )`,
            boxShadow: direction === 'forward'
              ? 'inset 8px 0 20px rgba(0,0,0,0.05), 6px 0 20px rgba(0,0,0,0.15)'
              : 'inset -8px 0 20px rgba(0,0,0,0.08), -6px 0 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Page texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Content placeholder */}
          <div className="p-8 h-full flex items-center justify-center">
            <div className="text-sm" style={{ color: 'rgba(100, 80, 60, 0.4)' }}>
              Turning page...
            </div>
          </div>
        </div>

        {/* Back of page (visible after flip) */}
        <div
          className="absolute inset-0 overflow-hidden rounded"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(${direction === 'forward' ? '270deg' : '90deg'},
              ${pageColor} 0%,
              ${pageColorDark} 100%
            )`,
            boxShadow: direction === 'forward'
              ? 'inset -8px 0 20px rgba(0,0,0,0.08)'
              : 'inset 8px 0 20px rgba(0,0,0,0.05)',
          }}
        >
          {/* Page texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Dynamic shadow during turn */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
            transformOrigin: 'left center',
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Shadow on the book surface during turn */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: direction === 'forward' ? '25%' : '25%',
          width: '50%',
          height: '100%',
          background: 'rgba(0,0,0,0.1)',
          filter: 'blur(20px)',
        }}
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{
          opacity: [0, 0.3, 0],
          scaleX: [0.5, 1, 0.5],
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
