'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErr(data.error || 'Reset failed')
      return
    }
    router.push('/login?reset=success')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Set a new password</h1>
        <p className="text-stone-600 text-sm mb-4">
          Choose a password you&apos;ll remember. Minimum 8 characters.
        </p>
        <form onSubmit={onSubmit}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
          />
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </main>
  )
}
