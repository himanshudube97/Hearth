'use client'

import { MONTHS } from './listingHelpers'

interface Props {
  year: number
  monthIdx: number
  yearMin: number
  yearMax: number
  /** highest selectable month in the current year (0-11) */
  monthMaxForCurrentYear: number
  onYearChange: (y: number) => void
  onMonthChange: (m: number) => void
  /** "N new ✦" badge — rendered as a tag tied to the corner. Hidden when zero. */
  newCount?: number
}

/**
 * Brass plate engraved "memory chest" with two pickers (year / month).
 * Mirrors letters/inbox/PostboxControls in look + behavior.
 */
export default function ChestControls(p: Props) {
  const monthMax = p.year === p.yearMax ? p.monthMaxForCurrentYear : 11

  return (
    <>
      <div className="plate" onClick={e => e.stopPropagation()}>
        <div className="plate-engraving">memory chest</div>
        <div className="pill">
          <button className="arrow"
                  disabled={p.year <= p.yearMin}
                  onClick={() => p.onYearChange(p.year - 1)}>◁</button>
          <span className="pill-val">{p.year}</span>
          <button className="arrow"
                  disabled={p.year >= p.yearMax}
                  onClick={() => p.onYearChange(p.year + 1)}>▷</button>
        </div>
        <div className="pill">
          <button className="arrow"
                  disabled={p.monthIdx <= 0}
                  onClick={() => p.onMonthChange(p.monthIdx - 1)}>◁</button>
          <span className="pill-val">{MONTHS[p.monthIdx]}</span>
          <button className="arrow"
                  disabled={p.monthIdx >= monthMax}
                  onClick={() => p.onMonthChange(p.monthIdx + 1)}>▷</button>
        </div>
      </div>

      {p.newCount && p.newCount > 0 ? (
        <div className="tag" onClick={e => e.stopPropagation()}>
          {p.newCount} new ✦
        </div>
      ) : null}

      <style jsx>{`
        .plate {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          padding: 10px 12px 12px;
          background: linear-gradient(180deg, var(--brass-1) 0%, var(--brass-2) 45%, var(--brass-3) 100%);
          border-radius: 4px;
          box-shadow:
            inset 0 1px 0 rgba(255,235,180,0.6),
            inset 0 -2px 4px rgba(0,0,0,0.35),
            0 3px 6px rgba(0,0,0,0.35);
          z-index: 5;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .plate::before, .plate::after {
          content: '';
          position: absolute;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #f4d896 0%, #6a4a20 80%);
          top: 4px;
        }
        .plate::before { left: 4px; }
        .plate::after  { right: 4px; }
        .plate-engraving {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 11px;
          letter-spacing: 3px;
          text-align: center;
          color: rgba(50, 30, 10, 0.85);
          text-transform: lowercase;
          text-shadow: 0 1px 0 rgba(255,235,180,0.4);
          margin-bottom: 2px;
        }
        .pill {
          display: flex;
          align-items: stretch;
          background: linear-gradient(180deg,
            rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.30) 100%);
          border: 1px solid rgba(0,0,0,0.40);
          border-top-color: rgba(255,235,180,0.30);
          border-radius: 3px;
          height: 24px;
          overflow: hidden;
          box-shadow:
            inset 0 1px 2px rgba(0,0,0,0.45),
            0 1px 0 rgba(255,235,180,0.2);
        }
        .arrow {
          background: transparent;
          border: none;
          color: rgba(50, 30, 10, 0.55);
          cursor: pointer;
          font-size: 10px;
          padding: 0 8px;
          line-height: 1;
          user-select: none;
          transition: color .15s, background .15s;
        }
        .arrow:hover { color: #f4d896; background: rgba(0,0,0,0.10); }
        .arrow:disabled { color: rgba(50,30,10,0.20); cursor: not-allowed; }
        .pill-val {
          flex: 1;
          text-align: center;
          align-self: center;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          color: #f4d896;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-shadow: 0 -1px 0 rgba(0,0,0,0.55);
          padding: 0 4px;
        }

        .tag {
          position: absolute;
          top: -6px;
          right: -22px;
          padding: 8px 14px 10px;
          background: #fbe9c7;
          color: #5a3a18;
          font-family: 'Caveat', cursive;
          font-size: 16px;
          letter-spacing: 0.5px;
          transform: rotate(8deg);
          box-shadow:
            0 2px 6px rgba(0,0,0,0.18),
            inset 0 0 0 1px rgba(120, 80, 40, 0.15);
          border-radius: 2px;
          z-index: 6;
          clip-path: polygon(8% 0, 100% 0, 100% 100%, 8% 100%, 0 50%);
        }
        .tag::after {
          content: '';
          position: absolute;
          left: -16px;
          top: 50%;
          width: 18px;
          height: 1px;
          background: rgba(80, 50, 20, 0.6);
          transform: translateY(-50%) rotate(-12deg);
        }
      `}</style>
    </>
  )
}
