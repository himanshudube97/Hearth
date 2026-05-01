'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

/**
 * Standalone lamp for the letters inbox. Visually identical to the
 * constellation/garden LeftLamp (same SVG path data + halo layers),
 * but taller (580px) and without parallax.
 */
export default function Lamp() {
  const theme = useThemeStore(s => s.theme)
  return (
    <div className="relative w-[180px] h-[580px] pointer-events-none">
      {/* Outer halo glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '5%', width: 280, height: 280, marginLeft: -140,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}55 0%,
            ${theme.accent.warm}33 25%,
            ${theme.accent.warm}11 50%,
            transparent 75%)`,
          filter: 'blur(4px)',
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      {/* Inner halo glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '8%', width: 140, height: 140, marginLeft: -70,
          background: `radial-gradient(circle,
            ${theme.accent.highlight}88 0%,
            ${theme.accent.highlight}22 50%,
            transparent 75%)`,
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* Lamppost SVG — ported from src/components/constellation/garden/LeftLamp.tsx */}
      <svg
        viewBox="0 0 220 800"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          <linearGradient id="lamp-pole" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="48%" stopColor="#3a3530" />
            <stop offset="52%" stopColor="#3a3530" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id="lamp-glass" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={theme.accent.highlight} stopOpacity="1" />
            <stop offset="50%" stopColor={theme.accent.warm} stopOpacity="0.95" />
            <stop offset="100%" stopColor={theme.accent.warm} stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="lamp-bulb" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FFFCEC" stopOpacity="1" />
            <stop offset="40%" stopColor={theme.accent.highlight} stopOpacity="0.95" />
            <stop offset="100%" stopColor={theme.accent.warm} stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Base shadow */}
        <ellipse cx="110" cy="794" rx="50" ry="5" fill="#000" opacity="0.18" />
        {/* Base plates */}
        <rect x="92" y="780" width="36" height="14" fill="url(#lamp-pole)" />
        <rect x="86" y="772" width="48" height="10" fill="url(#lamp-pole)" />
        <rect x="98" y="760" width="24" height="14" fill="url(#lamp-pole)" />
        {/* Pole */}
        <rect x="106" y="180" width="8" height="582" fill="url(#lamp-pole)" />
        {/* Pole rings */}
        <rect x="100" y="600" width="20" height="6" fill="url(#lamp-pole)" />
        <rect x="100" y="400" width="20" height="6" fill="url(#lamp-pole)" />
        {/* Post cap collars */}
        <ellipse cx="110" cy="220" rx="11" ry="6" fill="url(#lamp-pole)" />
        <ellipse cx="110" cy="208" rx="14" ry="5" fill="url(#lamp-pole)" />

        {/* Arm brackets */}
        <path d="M110,180 Q86,170 80,150 M110,180 Q134,170 140,150" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="150" r="3" fill="#1a1a1a" />
        <circle cx="140" cy="150" r="3" fill="#1a1a1a" />

        {/* Arch detail */}
        <path d="M100,156 Q110,148 120,156" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lantern frame — bottom plate and roof */}
        <path d="M86,158 L86,166 L134,166 L134,158 Z" fill="#1a1a1a" />
        <path d="M82,158 L110,128 L138,158 Z" fill="#1a1a1a" />
        <rect x="108" y="120" width="4" height="8" fill="#1a1a1a" />
        <circle cx="110" cy="118" r="3" fill="#1a1a1a" />

        {/* Glass panels */}
        <path
          d="M86,166 L86,222 L96,234 L124,234 L134,222 L134,166 Z"
          fill="url(#lamp-glass)"
          stroke="#1a1a1a"
          strokeWidth="2.2"
        />
        {/* Panel dividers */}
        <line x1="100" y1="166" x2="100" y2="234" stroke="#1a1a1a" strokeWidth="1.4" opacity="0.85" />
        <line x1="120" y1="166" x2="120" y2="234" stroke="#1a1a1a" strokeWidth="1.4" opacity="0.85" />
        <line x1="86" y1="200" x2="134" y2="200" stroke="#1a1a1a" strokeWidth="1.2" opacity="0.7" />

        {/* Flickering bulb */}
        <motion.circle
          cx="110"
          cy="200"
          r="14"
          fill="url(#lamp-bulb)"
          animate={{
            opacity: [0.92, 1, 0.95, 1, 0.92],
            r: [13.5, 14.5, 14, 14.5, 13.5],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        <motion.circle
          cx="110"
          cy="198"
          r="5"
          fill="#FFFCEC"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />

        {/* Bottom cap */}
        <path d="M96,234 L102,244 L118,244 L124,234 Z" fill="#1a1a1a" />
        <circle cx="110" cy="248" r="3" fill="#1a1a1a" />
      </svg>
    </div>
  )
}
