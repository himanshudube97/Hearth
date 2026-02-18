'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'

export default function DeskWindow() {
  const { theme } = useThemeStore()
  const { setActiveElement, setWindowActive } = useDeskStore()
  const router = useRouter()

  const handleClick = () => {
    setWindowActive(true)
    setActiveElement('window')
    // Navigate to constellation after animation
    setTimeout(() => {
      router.push('/constellation')
    }, 300)
  }

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setActiveElement('window')}
      onHoverEnd={() => setActiveElement(null)}
      className="relative cursor-pointer group"
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Window frame - outer */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: '180px',
          height: '140px',
          background: `linear-gradient(180deg,
            hsl(25, 25%, 28%) 0%,
            hsl(25, 20%, 22%) 100%
          )`,
          padding: '8px',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* Window inner frame */}
        <div
          className="relative w-full h-full rounded overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #080818 0%, #101025 100%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Window cross dividers */}
          <div
            className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2"
            style={{ background: 'hsl(25, 20%, 25%)' }}
          />
          <div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
            style={{ background: 'hsl(25, 20%, 25%)' }}
          />

          {/* Stars in each pane */}
          {[0, 1, 2, 3].map((pane) => {
            const col = pane % 2
            const row = Math.floor(pane / 2)
            return (
              <div
                key={pane}
                className="absolute overflow-hidden"
                style={{
                  left: col === 0 ? 0 : '50%',
                  top: row === 0 ? 0 : '50%',
                  width: '50%',
                  height: '50%',
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${1 + Math.random() * 2}px`,
                      height: `${1 + Math.random() * 2}px`,
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{
                      opacity: [0.2, 0.9, 0.2],
                      scale: [0.8, 1.3, 0.8],
                    }}
                    transition={{
                      duration: 1.5 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                    }}
                  />
                ))}
              </div>
            )
          })}

          {/* Nebula glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 40%,
                rgba(147, 112, 219, 0.15) 0%,
                transparent 50%
              ), radial-gradient(circle at 70% 60%,
                rgba(100, 149, 237, 0.1) 0%,
                transparent 40%
              )`,
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          {/* Glass reflection */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg,
                rgba(255,255,255,0.08) 0%,
                transparent 40%,
                transparent 100%
              )`,
            }}
          />

          {/* Starlight glow on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center,
                rgba(200, 220, 255, 0.15) 0%,
                transparent 70%
              )`,
            }}
          />
        </div>
      </div>

      {/* Window sill */}
      <div
        className="h-3 rounded-b-lg -mt-1 relative z-10"
        style={{
          background: `linear-gradient(180deg,
            hsl(25, 25%, 30%) 0%,
            hsl(25, 20%, 24%) 100%
          )`,
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Label on hover */}
      <motion.div
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: theme.text.muted }}
      >
        View Constellation
      </motion.div>

      {/* Soft glow from window */}
      <div
        className="absolute -bottom-4 left-4 right-4 h-8 rounded-full pointer-events-none"
        style={{
          background: 'rgba(100, 120, 180, 0.1)',
          filter: 'blur(10px)',
        }}
      />
    </motion.div>
  )
}
