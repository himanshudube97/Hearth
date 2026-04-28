'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { GlassDiaryColors } from '@/lib/glassDiaryColors'

interface RailEntry {
  id: string
  createdAt: string
}

interface DateTabRailProps {
  entries: RailEntry[]
  visibleSpread: number
  newEntrySpreadIdx: number
  onJumpToSpread: (idx: number) => void
  colors: GlassDiaryColors
}

const RAIL_WIDTH = 28
// Negative = push the rail outside the right page edge so the tabs sit
// clear of the dangling ribbon bookmark hangtag.
const TAB_INSET_RIGHT = -22
const TAB_GAP = 2

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function DateTabRailImpl({
  entries,
  visibleSpread,
  newEntrySpreadIdx,
  onJumpToSpread,
  colors,
}: DateTabRailProps) {
  // Map spread index -> entry. The flipbook renders entries reversed (oldest
  // first), so spread N corresponds to entries[entries.length - 1 - N].
  const isNewEntrySpread = visibleSpread === newEntrySpreadIdx
  const visibleEntry = !isNewEntrySpread
    ? entries[entries.length - 1 - visibleSpread]
    : null

  // Derive the "month in view" from the visible spread. New-entry spread =
  // today's month. Existing entry spread = that entry's month.
  const railDate = visibleEntry ? new Date(visibleEntry.createdAt) : new Date()
  const railYear = railDate.getFullYear()
  const railMonth = railDate.getMonth()
  const totalDays = daysInMonth(railDate)

  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()
  const todayDate = now.getDate()
  const todayIsThisMonth = todayYear === railYear && todayMonth === railMonth
  const activeDay = visibleEntry
    ? new Date(visibleEntry.createdAt).getDate()
    : todayIsThisMonth
    ? todayDate
    : null

  // Build day -> spread-index map for the visible month. If a day has
  // multiple entries, jump to the most recent.
  const daySpreadMap = new Map<number, number>()
  const bestTimes = new Map<number, number>()
  entries.forEach((e, i) => {
    const d = new Date(e.createdAt)
    if (d.getFullYear() !== railYear || d.getMonth() !== railMonth) return
    const day = d.getDate()
    const spreadIdx = entries.length - 1 - i
    const t = d.getTime()
    const prevTime = bestTimes.get(day)
    if (prevTime === undefined || t > prevTime) {
      daySpreadMap.set(day, spreadIdx)
      bestTimes.set(day, t)
    }
  })

  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  // Two paper tones, derived from the theme so the rail re-tints when the
  // theme changes. The cream is the page tone; the tan is the same tone with
  // a warm overlay (the "date" ink color is already a warm tint).
  const creamBg = colors.pageBgSolid
  const tanBg = `color-mix(in srgb, ${colors.pageBgSolid} 72%, ${colors.date} 28%)`

  return (
    <div
      className="absolute top-0 bottom-0 z-40 pointer-events-none"
      style={{
        right: `${TAB_INSET_RIGHT}px`,
        width: `${RAIL_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: '34px',
        paddingBottom: '34px',
      }}
    >
      {days.map((day) => {
        const spreadIdx = daySpreadMap.get(day)
        const hasEntry = spreadIdx !== undefined
        const isActive = day === activeDay
        const isToday = todayIsThisMonth && day === todayDate
        const isFuture = todayIsThisMonth && day > todayDate
        const isEmptyPast = !hasEntry && !isToday && !isFuture
        const isClickable = hasEntry || isToday

        // Alternate the paper tone purely for visual rhythm, like real
        // index tabs cut from two stocks of paper.
        const altTone = day % 2 === 0 ? tanBg : creamBg

        // Background priority: active > everything else. Otherwise alternate.
        const bg = isActive ? colors.ribbon : altTone

        // Text: cream on the brick-fill active tab, ink elsewhere.
        const textColor = isActive ? '#fffaf0' : colors.date

        // States that aren't "live entries" fade slightly. Active is always 1.
        let opacity = 1
        if (!isActive) {
          if (isFuture) opacity = 0.5
          else if (isEmptyPast) opacity = 0.7
        }

        // Bevel + edge cues. The active tab gets a stronger drop shadow so it
        // reads as raised; the rest get a soft inset highlight on top + a
        // gentle bottom shadow to feel like cut paper.
        const boxShadow = isActive
          ? '0 1px 4px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.18)'
          : 'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 1.5px rgba(0,0,0,0.12)'

        // A tiny notch on the left edge gives the tab its "page-ridge" feel.
        const leftEdge = `1px solid ${colors.pageBorder}`

        const handleClick = () => {
          if (!isClickable) return
          if (hasEntry && spreadIdx !== undefined) {
            onJumpToSpread(spreadIdx)
          } else if (isToday) {
            onJumpToSpread(newEntrySpreadIdx)
          }
        }

        const ariaLabel = isFuture
          ? `Day ${day} (future)`
          : hasEntry
          ? `Open entry for day ${day}`
          : isToday
          ? `Open today (day ${day})`
          : `Day ${day} — no entry`

        return (
          <motion.button
            key={day}
            type="button"
            disabled={!isClickable}
            onClick={handleClick}
            whileHover={isClickable ? { x: -3 } : undefined}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto"
            aria-label={ariaLabel}
            style={{
              flex: 1,
              marginBottom: `${TAB_GAP}px`,
              background: bg,
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: leftEdge,
              borderRight: 'none',
              borderTopLeftRadius: '5px',
              borderBottomLeftRadius: '5px',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              fontFamily:
                "'Courier New', 'Courier Prime', ui-monospace, monospace",
              fontSize: '9.5px',
              fontWeight: isActive ? 700 : 600,
              letterSpacing: '0.04em',
              color: textColor,
              opacity,
              cursor: isClickable ? 'pointer' : 'default',
              boxShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0 0 1px',
              textAlign: 'center',
              position: 'relative',
              transition:
                'background 200ms ease, color 200ms ease, opacity 200ms ease',
            }}
          >
            <span style={{ position: 'relative', lineHeight: 1 }}>
              {day}
              {/* Today marker (only when not the active spread) — a small
                  accent-color dot in the upper-right corner. */}
              {isToday && !isActive && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: '-5px',
                    top: '-2px',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: colors.ribbon,
                  }}
                />
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

const DateTabRail = memo(DateTabRailImpl)
export default DateTabRail
