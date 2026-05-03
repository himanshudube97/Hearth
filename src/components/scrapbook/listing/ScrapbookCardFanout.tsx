'use client'

import ScrapbookCard from './ScrapbookCard'
import {
  ScrapbookSummary,
  cardSizeForCount,
  MONTH_NAMES,
} from './listingHelpers'

interface Props {
  open: boolean
  books: ScrapbookSummary[]
  monthIdx: number
  activeId: string | null
  onCardClick: (id: string) => void
}

/**
 * Container for the cards that rise out of the chest into the empty area
 * above. Uses flex-wrap with a non-scrolling page contract: card size
 * shrinks at 13+ and 25+ counts so up to ~36 fit; above that the
 * container itself scrolls internally (the page never does).
 *
 * Empty state shows a handwritten "the chest is empty for [month]" line
 * inside the cards-area when chest is open.
 */
export default function ScrapbookCardFanout({
  open, books, monthIdx, activeId, onCardClick,
}: Props) {
  const size = cardSizeForCount(books.length)
  const isOpen = open
  const showEmpty = isOpen && books.length === 0

  return (
    <div className={`cards-area ${isOpen ? 'is-open' : ''} size-${size}`}>
      {showEmpty && (
        <div className="empty">
          the chest is empty for {MONTH_NAMES[monthIdx]}
        </div>
      )}
      {books.map((b, i) => (
        <ScrapbookCard
          key={b.id}
          book={b}
          index={i}
          total={books.length}
          size={size}
          active={activeId === b.id}
          onClick={() => onCardClick(b.id)}
        />
      ))}
      <style jsx>{`
        .cards-area {
          position: absolute;
          top: 100px;
          left: 60px;
          right: 60px;
          /* Stop just above the chest top (chest is 240px tall and the
             scene has 160px bottom padding, so chest top is ~400px from
             viewport bottom). 420px leaves a small breathing gap. */
          bottom: 420px;
          display: flex;
          flex-wrap: wrap;
          align-content: center;
          justify-content: center;
          gap: 22px 18px;
          padding: 20px;
          z-index: 4;
          pointer-events: none;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .cards-area.size-md { gap: 16px 14px; }
        .cards-area.size-sm { gap: 12px 10px; }
        .cards-area.is-open { pointer-events: auto; }

        /* Custom thin scrollbar for the rare case the area overflows. */
        .cards-area::-webkit-scrollbar { width: 6px; }
        .cards-area::-webkit-scrollbar-track { background: transparent; }
        .cards-area::-webkit-scrollbar-thumb {
          background: color-mix(in oklab, var(--brass-2) 70%, transparent);
          border-radius: 3px;
        }
        .cards-area::-webkit-scrollbar-thumb:hover {
          background: var(--brass-2);
        }

        .empty {
          font-family: 'Caveat', cursive;
          font-style: italic;
          font-size: 26px;
          color: var(--text-muted);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .5s ease .2s, transform .5s ease .2s;
        }
        .cards-area.is-open .empty {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
