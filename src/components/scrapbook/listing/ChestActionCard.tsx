'use client'

interface Props {
  open: boolean
  count: number
  onCreate: () => void
  creating: boolean
}

/**
 * Left-side action card. Mirrors letters/inbox/WriteCard in vertical
 * placement and CTA styling. Title/hint text adapts to chest open state
 * and current month's count.
 */
export default function ChestActionCard({ open, count, onCreate, creating }: Props) {
  const hint = open
    ? (count === 0 ? 'this month is empty — start one' : 'pick a card · click to open the canvas')
    : (count === 0 ? 'no scrapbooks for this month — start one' : 'click the chest to lift the lid')

  const title = open
    ? 'inside the chest'
    : (count === 0 ? 'a quiet month' : 'open the chest')

  return (
    <div className="action">
      <div className="hint">
        <span className="hint-mark">✦</span>
        {hint}
      </div>
      <h1 className="action-title">{title}</h1>
      <p className="action-desc">
        scrapbooks gather here by the month they were made.
        <br />
        pick a date, lift the lid — your books are inside.
      </p>
      <button className="cta" onClick={onCreate} disabled={creating}>
        {creating ? 'creating…' : '+ new scrapbook →'}
      </button>

      <style jsx>{`
        .action {
          flex: 0 0 360px;
          /* Match WriteCard's mb-[60px] — lifts the action content above
             the row baseline so its button lines up with the chest middle. */
          margin-bottom: 60px;
        }
        .hint {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          color: var(--text-muted);
          letter-spacing: 0.4px;
          margin-bottom: 24px;
        }
        .hint-mark { color: var(--accent-warm); }
        .action-title {
          font-family: 'Caveat', cursive;
          font-size: 44px;
          font-weight: 500;
          line-height: 1;
          margin: 0 0 8px;
          color: var(--text-primary);
        }
        .action-desc {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 16px;
          line-height: 1.55;
          color: var(--text-secondary);
          margin: 0 0 30px;
          max-width: 320px;
        }
        .cta {
          appearance: none;
          border: 1px solid color-mix(in oklab, var(--text-primary) 22%, transparent);
          background: var(--text-primary);
          color: var(--bg-1);
          font-family: 'Caveat', cursive;
          font-size: 22px;
          padding: 12px 28px;
          border-radius: 999px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        }
        .cta:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
        }
        .cta:disabled { opacity: 0.6; cursor: wait; }
      `}</style>
    </div>
  )
}
