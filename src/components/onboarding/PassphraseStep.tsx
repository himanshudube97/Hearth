// src/components/onboarding/PassphraseStep.tsx
'use client'

import { useState } from 'react'

export function PassphraseStep({ onComplete }: { onComplete: (pp: string) => void }) {
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)

  const tooShort = passphrase.length > 0 && passphrase.length < 8
  const mismatch = confirm.length > 0 && confirm !== passphrase
  const valid = passphrase.length >= 8 && passphrase === confirm

  return (
    <div>
      <h2 className="font-serif text-2xl mb-3">Choose your memorable phrase.</h2>
      <p className="text-sm opacity-70 mb-6 leading-relaxed">
        This is your daily key. Pick something only you would write — a
        sentence about your dog, a line of poetry, a phrase that means
        something to you. Aim for at least 8 characters.
      </p>

      <label className="block text-xs uppercase tracking-wider mb-2 opacity-60">
        Your phrase
      </label>
      <input
        type={show ? 'text' : 'password'}
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        placeholder="e.g. coffee with mira in the rain"
        className="w-full px-4 py-3 mb-3 border border-[#3d342a]/20 rounded-lg bg-white/50"
        autoFocus
      />

      <label className="block text-xs uppercase tracking-wider mb-2 opacity-60">
        Type it again to be sure
      </label>
      <input
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full px-4 py-3 mb-3 border border-[#3d342a]/20 rounded-lg bg-white/50"
      />

      <label className="text-sm flex items-center gap-2 mb-6 opacity-70">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
        />
        Show what I&apos;m typing
      </label>

      {tooShort && (
        <p className="text-sm text-amber-700 mb-3">
          Just a little longer — 8 characters at minimum.
        </p>
      )}
      {mismatch && (
        <p className="text-sm text-amber-700 mb-3">
          The two phrases don&apos;t match.
        </p>
      )}

      <p className="text-xs opacity-60 mb-6 italic leading-relaxed">
        Important: if you forget this phrase, we cannot reset it. Even we
        don&apos;t know what it is — that&apos;s how this works. You&apos;ll get a
        recovery key next as a backup.
      </p>

      <button
        disabled={!valid}
        onClick={() => onComplete(passphrase)}
        className="px-6 py-3 bg-[#3d342a] text-[#f6efe2] rounded-full disabled:opacity-30"
      >
        Continue
      </button>
    </div>
  )
}
