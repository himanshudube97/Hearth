'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function resend() {
    if (!email) return
    setErr(null)
    setSubmitting(true)
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErr(data.error || 'Failed to resend')
      return
    }
    setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Verify your email</h1>
        <p className="text-stone-600 text-sm mb-6">
          We sent you a code to confirm your email. Enter it on the login page,
          or request a new one below.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
        />
        <button
          onClick={resend}
          disabled={!email || sent || submitting}
          className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
        >
          {sent ? 'Sent — check your inbox' : submitting ? 'Sending…' : 'Resend verification code'}
        </button>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <Link
          href="/login"
          className="block text-center text-sm text-stone-500 mt-6 hover:text-stone-800"
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}
