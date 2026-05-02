'use client'

import {
  ScrapbookSummary,
  bandColorForId,
  stickerForId,
  stickerGlyph,
  dateLabel,
  CardSize,
} from './listingHelpers'

interface Props {
  book: ScrapbookSummary
  index: number
  total: number
  size: CardSize
  active: boolean
  onClick: () => void
}

/**
 * One scrapbook card. Polaroid-ish paper rectangle with:
 *  - tape strip pinning the top
 *  - colored washi band w/ title
 *  - sticker glyph
 *  - handwritten date + small year
 *  - item count in the corner
 *
 * Three size tiers (lg / md / sm) chosen by ScrapbookCardFanout based on
 * how many cards the month has, so up to ~30+ fit in the viewport without
 * pushing the page into scroll.
 */
export default function ScrapbookCard({
  book, index, total, size, active, onClick,
}: Props) {
  const tilt = ((book.id.charCodeAt(book.id.length - 1) % 13) - 6) * 1.1
  const delayMs = Math.min(20 + index * (total > 12 ? 28 : 60), 1200)
  const sticker = stickerForId(book.id)
  const band = bandColorForId(book.id)
  const { day, monthShort, year } = dateLabel(book.createdAt)
  const displayTitle = book.title ?? `${monthShort} ${day}`

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`card size-${size} ${active ? 'is-active' : ''}`}
      style={{
        '--tilt': `${tilt}deg`,
        transitionDelay: `${delayMs}ms`,
      } as React.CSSProperties}
    >
      <div className="tape" />
      <div className="card-band" style={{ background: band }}>
        <span className="card-title">{displayTitle}</span>
      </div>
      <div className="card-sticker">{stickerGlyph(sticker)}</div>
      <div className="card-date">
        {monthShort} {day}
        <span className="card-year">{year}</span>
      </div>
      <div className="card-meta">
        {book.itemCount} {book.itemCount === 1 ? 'item' : 'items'}
      </div>

      <style jsx>{`
        .card {
          position: relative;
          flex: 0 0 96px;
          height: 124px;
          background:
            linear-gradient(180deg,
              color-mix(in oklab, var(--card-paper) 90%, white) 0%,
              var(--card-paper) 60%,
              color-mix(in oklab, var(--card-paper) 80%, var(--bg-2)) 100%);
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 3px;
          box-shadow:
            0 6px 14px rgba(0, 0, 0, 0.20),
            inset 0 0 0 1px color-mix(in oklab, var(--text-primary) 8%, transparent);
          opacity: 0;
          transform: translateY(180px) scale(0.4) rotate(0deg);
          transition:
            opacity .55s ease,
            transform .9s cubic-bezier(.3,1.2,.4,1),
            box-shadow .25s ease;
          will-change: transform, opacity;
        }
        .card.size-md { flex: 0 0 88px; height: 112px; }
        .card.size-sm { flex: 0 0 80px; height: 100px; }

        :global(.cards-area.is-open) .card {
          opacity: 1;
          transform: translateY(0) scale(1) rotate(var(--tilt));
        }
        :global(.cards-area.is-open) .card:hover {
          transform: translateY(-4px) scale(1.04) rotate(0deg);
          box-shadow: 0 12px 22px rgba(0, 0, 0, 0.28);
          z-index: 2;
        }
        :global(.cards-area.is-open) .card.is-active {
          transform: translateY(-10px) scale(1.10) rotate(0deg);
          box-shadow: 0 18px 28px rgba(0, 0, 0, 0.35);
          z-index: 5;
        }

        .tape {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          width: 56px;
          height: 14px;
          background:
            linear-gradient(180deg,
              color-mix(in oklab, var(--bg-1) 70%, white) 0%,
              color-mix(in oklab, var(--bg-2) 80%, white) 100%);
          opacity: 0.85;
          box-shadow: 0 1px 2px rgba(0,0,0,0.10);
        }

        .card-band {
          position: absolute;
          top: 14px;
          left: 6px;
          right: 6px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.20),
            inset 0 -1px 0 rgba(0,0,0,0.18);
        }
        .card.size-md .card-band { top: 12px; height: 16px; }
        .card.size-sm .card-band { top: 10px; height: 14px; }

        .card-title {
          font-family: 'Caveat', cursive;
          color: #f9efd8;
          font-size: 11px;
          letter-spacing: 0.3px;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          text-shadow: 0 1px 0 rgba(0,0,0,0.18);
        }
        .card.size-md .card-title { font-size: 10px; }
        .card.size-sm .card-title { font-size: 9px; }

        .card-sticker {
          position: absolute;
          top: 42px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 22px;
          line-height: 1;
          color: var(--text-secondary);
          opacity: 0.85;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15));
        }
        .card.size-md .card-sticker { top: 36px; font-size: 18px; }
        .card.size-sm .card-sticker { top: 30px; font-size: 16px; }

        .card-date {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 18px;
          font-family: 'Caveat', cursive;
          font-size: 18px;
          color: var(--text-primary);
          text-align: center;
          line-height: 1.05;
          letter-spacing: 0.3px;
        }
        .card.size-md .card-date { font-size: 16px; bottom: 16px; }
        .card.size-sm .card-date { font-size: 14px; bottom: 14px; }

        .card-year {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-top: -2px;
        }
        .card.size-sm .card-year { font-size: 9px; }

        .card-meta {
          position: absolute;
          right: 6px;
          bottom: 4px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.3px;
        }
        .card.size-sm .card-meta { font-size: 8px; }
      `}</style>
    </button>
  )
}
