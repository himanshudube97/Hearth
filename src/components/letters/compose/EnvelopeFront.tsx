'use client'

import type { LetterRecipient, UnlockChoice } from '../letterTypes'

interface Props {
  recipient: LetterRecipient
  onRecipientChange: (r: LetterRecipient) => void
  recipientName: string                    // display value: "future me" or user-typed name
  onRecipientNameChange: (s: string) => void
  unlock: UnlockChoice
  onUnlockChange: (u: UnlockChoice) => void
  onTurnOver: () => void
}

const UNLOCK_PILLS: { label: string; choice: UnlockChoice }[] = [
  { label: '1 month',  choice: { kind: '1_month' } },
  { label: '6 months', choice: { kind: '6_months' } },
  { label: '1 year',   choice: { kind: '1_year' } },
  { label: 'someday',  choice: { kind: 'someday', date: null } },
]

export default function EnvelopeFront(p: Props) {
  return (
    <div className="face front">
      <div className="label">addressing</div>
      <div className="recipient-toggle">
        <button
          className={p.recipient === 'future_me' ? 'active' : ''}
          onClick={() => p.onRecipientChange('future_me')}
        >
          future me
        </button>
        <button
          className={p.recipient === 'someone_close' ? 'active' : ''}
          onClick={() => p.onRecipientChange('someone_close')}
        >
          someone close
        </button>
      </div>

      <div className="to-line">
        Dear{' '}
        {p.recipient === 'future_me' ? (
          <span style={{ textDecoration: 'underline dotted' }}>future me</span>
        ) : (
          <input
            value={p.recipientName === 'future me' ? '' : p.recipientName}
            placeholder="their name"
            onChange={e => p.onRecipientNameChange(e.target.value)}
          />
        )}
        ,
      </div>

      <div className="stamp-large">
        <div>
          <strong>✦</strong>
          hearth<br />
          <em>sealed today</em>
        </div>
      </div>

      <div className="label" style={{ marginTop: 32 }}>opens · when</div>
      <div className="options">
        {UNLOCK_PILLS.map(({ label, choice }) => (
          <button
            key={label}
            className={`pill${p.unlock.kind === choice.kind ? ' active' : ''}`}
            onClick={() => p.onUnlockChange(choice)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="footer">
        <span className="hint">turn it over to write</span>
        <button className="btn-primary" onClick={p.onTurnOver}>turn over →</button>
      </div>
    </div>
  )
}
