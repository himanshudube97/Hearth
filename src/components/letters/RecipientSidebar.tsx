// src/components/letters/RecipientSidebar.tsx
'use client'

import { useState } from 'react'
import { LetterRecipient, UnlockChoice } from './letterTypes'

interface Props {
  recipient: LetterRecipient
  onRecipientChange: (r: LetterRecipient) => void
  unlock: UnlockChoice
  onUnlockChange: (u: UnlockChoice) => void
}

const TILES: Array<{
  key: LetterRecipient
  title: string
  subtitle: string
  glyph: string  // simple emoji/icon for now
}> = [
  { key: 'future_me',     title: 'future me',     subtitle: 'a year from now', glyph: '✦' },
  { key: 'someone_close', title: 'someone close', subtitle: 'you name them',   glyph: '✿' },
]

export default function RecipientSidebar({ recipient, onRecipientChange, unlock, onUnlockChange }: Props) {
  const [showPicker, setShowPicker] = useState(unlock.kind === 'someday')

  return (
    <aside className="w-72 shrink-0 px-6 py-8">
      <div className="mb-3 text-xs uppercase tracking-[0.2em] opacity-60">dear …</div>
      <div className="flex flex-col gap-3">
        {TILES.map(t => {
          const selected = recipient === t.key
          return (
            <button
              key={t.key}
              onClick={() => onRecipientChange(t.key)}
              className={`
                flex items-center gap-3 rounded-lg border p-3 text-left transition
                ${selected
                  ? 'border-[var(--color-accent,#c8742c)] bg-[rgba(200,116,44,0.12)]'
                  : 'border-[rgba(80,60,40,0.18)] hover:bg-[rgba(80,60,40,0.05)]'}
              `}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(80,60,40,0.08)] text-base">
                {t.glyph}
              </span>
              <span className="font-[var(--font-caveat),Caveat,cursive]">
                <span className="block text-lg leading-none">{t.title}</span>
                <span className="block text-xs opacity-70">{t.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-[rgba(80,60,40,0.25)] p-3 text-xs leading-relaxed italic opacity-75">
        Letters can be opened on a date, or left to be found by chance.
        <div className="mt-1">↳ choose when below</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(['1_month','6_months','1_year','someday'] as const).map(k => {
          const label = k === '1_month' ? '1 month' : k === '6_months' ? '6 months' : k === '1_year' ? '1 year' : 'someday'
          const selected = unlock.kind === k
          return (
            <button
              key={k}
              onClick={() => {
                if (k === 'someday') {
                  setShowPicker(true)
                  onUnlockChange({ kind: 'someday', date: unlock.kind === 'someday' ? unlock.date : null })
                } else {
                  setShowPicker(false)
                  onUnlockChange({ kind: k })
                }
              }}
              className={`
                rounded-md border px-3 py-1.5 text-xs transition
                ${selected
                  ? 'border-[var(--color-accent,#c8742c)] bg-[rgba(200,116,44,0.12)]'
                  : 'border-[rgba(80,60,40,0.2)] hover:bg-[rgba(80,60,40,0.05)]'}
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {showPicker && unlock.kind === 'someday' && (
        <div className="mt-3">
          <label className="block text-xs opacity-70 mb-1">pick a date</label>
          <input
            type="date"
            min={new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)}
            value={unlock.date ? unlock.date.toISOString().slice(0, 10) : ''}
            onChange={e => onUnlockChange({ kind: 'someday', date: e.target.value ? new Date(e.target.value) : null })}
            className="rounded-md border border-[rgba(80,60,40,0.25)] bg-transparent px-2 py-1 text-sm"
          />
        </div>
      )}
    </aside>
  )
}
