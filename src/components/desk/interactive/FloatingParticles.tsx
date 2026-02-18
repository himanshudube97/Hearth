// src/components/desk/interactive/FloatingParticles.tsx
'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface FloatingParticlesProps {
  type: 'magical' | 'botanical' | 'stars'
  color: string
}

export function FloatingParticles({ type, color }: FloatingParticlesProps) {
  const particles = useMemo(() => {
    const count = type === 'stars' ? 15 : 8
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: type === 'stars' ? 1 + Math.random() * 2 : 3 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
    }))
  }, [type])

  const renderParticle = (p: typeof particles[0]) => {
    switch (type) {
      case 'magical':
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      case 'botanical':
        return (
          <motion.div
            key={p.id}
            className="absolute text-xs"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              color: color,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0, 0.6, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: p.duration * 1.5,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {['~', '*', '+', 'o'][p.id % 4]}
          </motion.div>
        )
      case 'stars':
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: color,
            }}
            animate={{
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5 + Math.random() * 2,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(renderParticle)}
    </div>
  )
}
