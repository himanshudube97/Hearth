'use client'

import { format } from 'date-fns'
import type { LetterRecipient } from '../letterTypes'

interface Props {
  recipient: LetterRecipient
  onRecipientChange: (r: LetterRecipient) => void
  closeName: string
  onCloseNameChange: (s: string) => void
  createdAt: Date
  onTurnOver: () => void
  onClose: () => void
}

export default function PostcardFront({
  recipient,
  onRecipientChange,
  closeName,
  onCloseNameChange,
  createdAt,
  onTurnOver,
  onClose,
}: Props) {
  const timeLabel = (() => {
    const h = createdAt.getHours()
    if (h < 6) return 'night'
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    if (h < 21) return 'evening'
    return 'night'
  })()

  return (
    <div
      className="face front"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 32px 24px',
        height: '100%',
        boxSizing: 'border-box',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        position: 'absolute',
        inset: 0,
        background: `
          repeating-linear-gradient(
            transparent, transparent 36px,
            rgba(120, 90, 50, 0.10) 36px, rgba(120, 90, 50, 0.10) 37px
          ),
          linear-gradient(160deg, var(--paper-1, #fff6f2) 0%, var(--paper-2, #fbe6dd) 100%)
        `,
        borderRadius: 8,
        border: '1px solid rgba(80, 55, 40, 0.16)',
        boxShadow: '0 20px 56px rgba(0,0,0,0.40), 0 4px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {/* Top row: salutation (left) + stamp/date (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: salutation at the top */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Recipient toggle */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'rgba(0,0,0,0.07)',
              padding: '4px',
              borderRadius: 999,
              alignSelf: 'flex-start',
            }}
          >
            {(['future_me', 'someone_close'] as LetterRecipient[]).map(r => (
              <button
                key={r}
                onClick={() => onRecipientChange(r)}
                style={{
                  padding: '5px 14px 6px',
                  borderRadius: 999,
                  border: 'none',
                  background: recipient === r ? 'var(--accent-primary, #9a4555)' : 'transparent',
                  color: recipient === r ? '#fff' : 'var(--text-secondary, #6a4048)',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 12,
                  letterSpacing: 0.4,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  boxShadow: recipient === r ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
                }}
              >
                {r === 'future_me' ? 'future me' : 'someone close'}
              </button>
            ))}
          </div>

          {/* Salutation — Dear [recipient], right under the toggle */}
          <div
            style={{
              fontFamily: 'Caveat, cursive',
              fontSize: 32,
              color: 'var(--text-primary, #3a2025)',
              lineHeight: 1.4,
            }}
          >
            Dear{' '}
            {recipient === 'future_me' ? (
              <span style={{ textDecoration: 'underline dotted', textUnderlineOffset: 4 }}>
                future me
              </span>
            ) : (
              <input
                value={closeName}
                placeholder="their name"
                onChange={e => onCloseNameChange(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1.5px dotted rgba(120, 90, 50, 0.55)',
                  outline: 'none',
                  fontFamily: 'Caveat, cursive',
                  fontSize: 32,
                  color: 'var(--text-primary, #3a2025)',
                  width: 200,
                  paddingBottom: 1,
                }}
              />
            )}
            ,
          </div>
        </div>

        {/* Date + stamp region */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Stamp */}
          <div
            style={{
              width: 64,
              height: 74,
              border: '2px dashed rgba(120, 90, 50, 0.45)',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'rgba(120, 90, 50, 0.04)',
            }}
          >
            <span
              style={{
                fontFamily: 'Caveat, cursive',
                fontSize: 18,
                color: 'var(--accent-primary, #9a4555)',
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 8,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                color: 'rgba(120, 90, 50, 0.55)',
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              HEARTH
            </span>
          </div>

          {/* Date */}
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--text-muted, #9a7078)',
              letterSpacing: 0.5,
            }}
          >
            {format(createdAt, "EEEE, MMM d")} · {timeLabel}
          </div>
        </div>
      </div>

      {/* Center area: hint text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 16 }}>
        <p
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--text-muted, #9a7078)',
            marginTop: 20,
            letterSpacing: 0.3,
          }}
        >
          turn it over to write your letter
        </p>
      </div>

      {/* Postmark decoration (center decorative line) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1,
          height: '60%',
          background: 'rgba(120, 90, 50, 0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: 16,
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: '7px 18px',
            borderRadius: 999,
            border: '1.5px solid rgba(120, 90, 50, 0.3)',
            background: 'transparent',
            color: 'var(--text-secondary, #6a4048)',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 13,
            letterSpacing: 0.4,
            cursor: 'pointer',
          }}
        >
          ← cancel
        </button>

        <button
          onClick={onTurnOver}
          style={{
            padding: '7px 22px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent-primary, #9a4555)',
            color: '#fff',
            fontFamily: 'Caveat, cursive',
            fontSize: 19,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            letterSpacing: 0.2,
          }}
        >
          turn over →
        </button>
      </div>
    </div>
  )
}
