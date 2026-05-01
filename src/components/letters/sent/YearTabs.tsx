'use client'

interface Props {
  years: number[]
  active: number
  countByYear: Record<number, number>
  onChange: (y: number) => void
}

export default function YearTabs({ years, active, countByYear, onChange }: Props) {
  return (
    <div className="year-tabs">
      {years.map(y => (
        <button
          key={y}
          className={`year-tab${y === active ? ' active' : ''}`}
          onClick={() => onChange(y)}
        >
          {y} <span className="yt-count">{countByYear[y] ?? 0}</span>
        </button>
      ))}
      <style jsx>{`
        .year-tabs {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin: 0 auto 14px;
          background: var(--paper-1);
          border: 1px solid var(--paper-2);
          padding: 5px;
          border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          z-index: 2;
          width: fit-content;
        }
        .year-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 7px 18px 8px;
          border-radius: 999px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background .25s, color .25s;
          white-space: nowrap;
        }
        .year-tab:hover { color: var(--text-primary); background: var(--paper-2); }
        .year-tab.active {
          background: var(--accent-primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .year-tab .yt-count {
          font-family: 'Caveat', cursive;
          font-size: 16px;
          margin-left: 6px;
          opacity: 0.85;
        }
      `}</style>
    </div>
  )
}
