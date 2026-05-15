'use client'

import { useEffect, useState } from 'react'
import { generateRecoveryKey } from '@/lib/e2ee/crypto'

export function RecoveryKeyStep({
  passphrase,
  onComplete,
}: {
  passphrase: string
  onComplete: (rk: string) => void
}) {
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setRecoveryKey(generateRecoveryKey())
  }, [])

  if (!recoveryKey) return <p>Generating your recovery key...</p>

  return (
    <div>
      <h2 className="font-serif text-2xl mb-3">Save your recovery key.</h2>
      <p className="text-sm opacity-70 mb-6 leading-relaxed">
        This is your only way back in if you ever forget your phrase. Save
        it somewhere safe — a password manager, a printed copy, an email to
        yourself. We don&apos;t keep a copy.
      </p>

      <div className="font-mono text-lg p-6 bg-white border border-[#3d342a]/20 rounded-lg mb-4 break-all select-all">
        {recoveryKey}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            navigator.clipboard.writeText(recoveryKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="px-4 py-2 border border-[#3d342a]/30 rounded-full text-sm"
        >
          {copied ? 'Copied' : 'Copy to clipboard'}
        </button>
        <button
          onClick={() => downloadRecoveryKey(recoveryKey)}
          className="px-4 py-2 border border-[#3d342a]/30 rounded-full text-sm"
        >
          Download as .txt
        </button>
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm leading-relaxed">
          I&apos;ve saved my recovery key somewhere I can find it again. I
          understand that if I lose both my phrase and this key, my data
          cannot be recovered.
        </span>
      </label>

      <button
        disabled={!acknowledged}
        onClick={() => onComplete(recoveryKey)}
        className="px-6 py-3 bg-[#3d342a] text-[#f6efe2] rounded-full disabled:opacity-30"
      >
        I&apos;ve saved it — continue
      </button>
    </div>
  )
}

function downloadRecoveryKey(key: string) {
  const blob = new Blob(
    [
      `Your Hearth recovery key:\n\n${key}\n\nKeep this safe. Together with your phrase, it's the only way back into your encrypted data.\n`,
    ],
    { type: 'text/plain' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hearth-recovery-key.txt'
  a.click()
  URL.revokeObjectURL(url)
}
