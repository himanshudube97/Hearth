'use client'

interface Props { newCount: number }

export default function TopHint({ newCount }: Props) {
  return (
    <div
      className="absolute top-[76px] left-1/2 -translate-x-1/2 z-[9] text-center pointer-events-none"
      style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontStyle: 'italic',
        fontSize: 14,
        color: 'var(--text-secondary)',
        letterSpacing: 0.6,
        textShadow: '0 1px 2px rgba(255,255,255,0.5)',
      }}
    >
      {newCount > 0 && (
        <span
          className="new-badge"
          style={{
            display: 'inline-block', marginRight: 8,
            background: 'var(--accent-primary)', color: '#fff',
            fontStyle: 'normal',
            fontFamily: 'var(--font-caveat), Caveat, cursive',
            fontSize: 14, padding: '2px 10px 3px', borderRadius: 999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            verticalAlign: 'middle',
            animation: 'badgePulse 2.4s ease-in-out infinite',
          }}
        >
          {newCount} new
        </span>
      )}
      {newCount > 0
        ? 'click the postbox to reveal your letters'
        : 'click the postbox · pick a month with the arrows'}
      <style jsx>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 2px 6px rgba(0,0,0,0.18); }
          50%      { transform: scale(1.06); box-shadow: 0 4px 12px color-mix(in oklab, var(--accent-primary) 60%, transparent); }
        }
      `}</style>
    </div>
  )
}
