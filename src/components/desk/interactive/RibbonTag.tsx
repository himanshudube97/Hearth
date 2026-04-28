'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { format } from 'date-fns'
import { GlassDiaryColors } from '@/lib/glassDiaryColors'

interface RibbonTagProps {
  date: Date
  colors: GlassDiaryColors
}

const TAG_WIDTH = 48
const TAG_HEIGHT = 74
// Position relative to the RibbonBookmark coordinate space.
// Ribbon (90) + clasp (26) = 116; anchor a bit above that so the tag's
// brass grommet visually hooks through the clasp's bottom ring.
const TAG_TOP = 106

export default function RibbonTag({ date, colors }: RibbonTagProps) {
  const reduceMotion = useReducedMotion()
  const weekday = format(date, 'EEE').toUpperCase()
  const monthDay = format(date, 'MMM d')

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        top: `${TAG_TOP}px`,
        left: '50%',
        width: `${TAG_WIDTH}px`,
        height: `${TAG_HEIGHT}px`,
        marginLeft: `${-TAG_WIDTH / 2}px`,
        transformOrigin: 'top center',
      }}
      initial={{ rotate: 0 }}
      animate={{ rotate: 0 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              rotate: [0, 4, -5, 3, -2, 0],
              transition: { duration: 0.6, ease: 'easeInOut' },
            }
      }
      title={format(date, 'EEEE, MMM d, yyyy')}
    >
      {/* Tag body — capsule/oval, soft sage tint, with depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '999px',
          background: `linear-gradient(180deg,
            ${colors.pageBgSolid} 0%,
            ${colors.pageBorder} 100%
          )`,
          border: `1px solid ${colors.photoBorder}`,
          boxShadow: [
            '0 6px 12px rgba(0,0,0,0.22)',
            '0 2px 4px rgba(0,0,0,0.12)',
            'inset 0 1px 0 rgba(255,255,255,0.35)',
            'inset 0 -1px 0 rgba(0,0,0,0.10)',
          ].join(', '),
        }}
      />

      {/* Brass grommet at the top — eyelet that the clasp's lower ring hooks through */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        style={{
          position: 'absolute',
          top: '4px',
          left: '50%',
          marginLeft: '-5px',
        }}
      >
        <defs>
          <radialGradient id="grommetGrad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#E0BF8E" />
            <stop offset="55%" stopColor="#A8854E" />
            <stop offset="100%" stopColor="#5E4828" />
          </radialGradient>
        </defs>
        <circle cx="5" cy="5" r="4.2" fill="url(#grommetGrad)" />
        <circle cx="5" cy="5" r="2" fill="rgba(0,0,0,0.55)" />
      </svg>

      {/* Tag text — centered, sits below the grommet */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: 0,
          right: 0,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontSize: '8px',
            letterSpacing: '0.18em',
            color: colors.sectionLabel,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            fontWeight: 600,
          }}
        >
          {weekday}
        </div>
        <div
          style={{
            marginTop: '4px',
            fontSize: '11px',
            fontStyle: 'italic',
            color: colors.date,
            fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
          }}
        >
          {monthDay}
        </div>
      </div>
    </motion.div>
  )
}
