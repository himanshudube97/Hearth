'use client'

interface Props { count: number }

export default function NewLetterTag({ count }: Props) {
  return (
    <div className={`new-tag${count > 0 ? ' show' : ''}`} aria-hidden>
      <div className="string" />
      <div className="label">{count} new ✦</div>
      <style jsx>{`
        .new-tag {
          position: absolute; top: 134px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none; z-index: 5;
          opacity: 0; transition: opacity .4s ease;
        }
        .new-tag.show { opacity: 1; }
        .string { width: 1px; height: 16px; background: rgba(0,0,0,0.5); }
        .label {
          background: var(--accent-primary); color: #fff;
          padding: 3px 9px 4px; border-radius: 2px;
          font-family: 'Caveat', cursive; font-size: 13px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          transform: rotate(-3deg);
          border: 1px solid color-mix(in oklab, var(--accent-secondary) 60%, transparent);
          white-space: nowrap;
          animation: tagSway 4s ease-in-out infinite;
          transform-origin: top center;
        }
        @keyframes tagSway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  )
}
