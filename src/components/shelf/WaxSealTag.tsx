// src/components/shelf/WaxSealTag.tsx
'use client'

import { motion } from 'framer-motion'

interface WaxSealTagProps {
  year: number
  status: 'in progress' | 'archive'
  // Length of the thread connecting the tag down from above (px). The tag
  // dangles below this thread.
  threadLength?: number
}

export default function WaxSealTag({
  year,
  status,
  threadLength = 36,
}: WaxSealTagProps) {
  return (
    <div className="flex flex-col items-center select-none" aria-hidden="true">
      {/* String / thread descending from above */}
      <div
        style={{
          width: 1,
          height: threadLength,
          background:
            'linear-gradient(180deg, rgba(40,25,12,0) 0%, rgba(40,25,12,0.55) 18%, rgba(40,25,12,0.7) 100%)',
        }}
      />
      {/* Tag, gently swaying */}
      <motion.div
        style={{ transformOrigin: '50% 0%' }}
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Pin / grommet at top */}
        <div
          className="relative mx-auto"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, #4a3a22 0%, #1f1408 70%, #0a0500 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 1px rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        />
        {/* Tag body */}
        <div
          style={{
            marginTop: -4,
            width: 124,
            paddingTop: 14,
            paddingBottom: 12,
            paddingLeft: 18,
            paddingRight: 18,
            background:
              'linear-gradient(180deg, #f4ead0 0%, #ecdfb8 100%)',
            backgroundImage:
              'radial-gradient(circle at 30% 40%, rgba(120,90,40,0.04) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 65%, rgba(120,90,40,0.05) 0 1px, transparent 1.5px), linear-gradient(180deg, #f4ead0 0%, #ecdfb8 100%)',
            backgroundSize: '6px 6px, 7px 7px, auto',
            borderRadius: '4px 4px 6px 6px',
            border: '0.5px solid rgba(80, 55, 25, 0.25)',
            boxShadow:
              '0 6px 14px rgba(60, 40, 15, 0.25), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.05)',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          {/* Punched hole at the top (where the pin goes through) */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'rgba(60, 40, 15, 0.55)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)',
            }}
          />
          <div
            style={{
              fontFamily: 'Georgia, Palatino, serif',
              fontStyle: 'italic',
              fontSize: 17,
              color: '#3a2510',
              letterSpacing: '0.01em',
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {year}
          </div>
          <div
            style={{
              fontFamily: 'Georgia, Palatino, serif',
              fontSize: 8,
              color: '#5a3f1e',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            {status}
          </div>

          {/* Wax seal at bottom-right */}
          <WaxSeal />
        </div>
      </motion.div>
    </div>
  )
}

function WaxSeal() {
  return (
    <div
      style={{
        position: 'absolute',
        right: -10,
        bottom: -12,
        width: 26,
        height: 26,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 26 26">
        <defs>
          <radialGradient id="wax-grad" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#d65c4a" />
            <stop offset="55%" stopColor="#9c2e22" />
            <stop offset="100%" stopColor="#4a1408" />
          </radialGradient>
        </defs>
        {/* Irregular blob silhouette */}
        <path
          d="M13 1.5 C18 2 23 4.5 24 9 C25.5 14 22 18 18.5 21 C16 23.5 13.5 24.8 11 24 C7 23 3 21 1.8 16 C0.6 11 3 6 7 3.2 C9 1.8 11 1.2 13 1.5 Z"
          fill="url(#wax-grad)"
          stroke="#3a0d04"
          strokeWidth="0.4"
        />
        {/* Drip */}
        <path
          d="M22 17 C23.5 19 23 22 21 22 C20 22 19.5 20 20 18 Z"
          fill="url(#wax-grad)"
          opacity="0.95"
        />
        {/* Glossy highlight */}
        <ellipse cx="9" cy="8" rx="3.5" ry="2" fill="rgba(255,255,255,0.28)" />
        {/* Embossed initial */}
        <text
          x="13"
          y="16"
          textAnchor="middle"
          fontFamily="Georgia, Palatino, serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="11"
          fill="#f4d8b8"
          style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.4))' }}
        >
          H
        </text>
      </svg>
    </div>
  )
}
