// src/components/shelf/Shelf.tsx
'use client'

import BookSpine from './BookSpine'
import EmptyMonthSpine from './EmptyMonthSpine'

export interface ShelfMonth {
  monthIndex: number   // 0..11
  entryCount: number   // 0 means render an EmptyMonthSpine
}

interface ShelfProps {
  year: number
  months: ShelfMonth[] // length 12, in calendar order
  onMonthClick: (monthIndex: number) => void
  pulledMonthIndex: number | null
}

const PLANK_HEIGHT = 14
const PLANK_GRAIN =
  'repeating-linear-gradient(90deg, #5a3a22 0 6px, #4d3119 6px 7px, #5a3a22 7px 14px)'

export default function Shelf({
  year,
  months,
  onMonthClick,
  pulledMonthIndex,
}: ShelfProps) {
  return (
    <div className="relative">
      {/* Desktop: horizontal row. Mobile: vertical stack with rotated spines. */}
      <div
        className={[
          'flex gap-3',
          // Desktop: spines stand upright on a horizontal plank.
          'md:flex-row md:items-end md:justify-center',
          // Mobile: spines lie on their sides, stacked vertically.
          'flex-col items-center',
        ].join(' ')}
      >
        {months.map((m) => {
          if (m.entryCount === 0) {
            return (
              <div key={m.monthIndex} className="md:rotate-0 -rotate-90 md:transform-none">
                <EmptyMonthSpine monthIndex={m.monthIndex} />
              </div>
            )
          }
          return (
            <div key={m.monthIndex} className="md:rotate-0 -rotate-90 md:transform-none">
              <BookSpine
                year={year}
                monthIndex={m.monthIndex}
                entryCount={m.entryCount}
                onClick={() => onMonthClick(m.monthIndex)}
                hidden={pulledMonthIndex === m.monthIndex}
              />
            </div>
          )
        })}
      </div>

      {/* Wooden plank — desktop is a horizontal bar under the row; mobile is a
          vertical bar to the left of the stack. */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute left-0 right-0"
        style={{
          bottom: `-${PLANK_HEIGHT + 4}px`,
          height: `${PLANK_HEIGHT}px`,
          background: PLANK_GRAIN,
          borderRadius: '2px',
          boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
        }}
      />
      <div
        aria-hidden="true"
        className="md:hidden absolute top-0 bottom-0"
        style={{
          left: `-${PLANK_HEIGHT + 4}px`,
          width: `${PLANK_HEIGHT}px`,
          background: PLANK_GRAIN,
          borderRadius: '2px',
          boxShadow: '6px 0 12px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  )
}
