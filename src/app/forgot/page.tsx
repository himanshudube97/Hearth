'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Reset your password</h1>
        {submitted ? (
          <p className="text-stone-600 text-sm">
            If an account exists for <strong>{email}</strong>, we sent a reset link.
            Check your inbox (and spam folder).
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="text-stone-600 text-sm mb-4">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
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
