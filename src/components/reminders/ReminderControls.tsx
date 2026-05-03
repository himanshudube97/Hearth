'use client'

import { useEffect, useState } from 'react'
import { useReminders } from '@/hooks/useReminders'

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
}

export default function ReminderControls() {
  const { pushSupported, permission, subscribed, subscribe, unsubscribe, setReminderTime } = useReminders()
  const [reminderTime, setReminderTimeLocal] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/me/profile-flags')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile?.reminderTime) setReminderTimeLocal(data.profile.reminderTime)
      })
    fetch('/api/me/reminder-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPaused(Boolean(data?.paused)))
  }, [])

  if (!pushSupported) {
    if (isIosSafari()) {
      return (
        <section id="reminders" className="space-y-2">
          <h2 className="font-serif text-xl">Gentle reminders</h2>
          <p className="text-stone-600 text-sm">
            To get reminders on iPhone, install Hearth as a PWA: tap Share → Add to Home Screen,
            then open Hearth from your home screen and try again.
          </p>
        </section>
      )
    }
    return (
      <section id="reminders" className="space-y-2">
        <h2 className="font-serif text-xl">Gentle reminders</h2>
        <p className="text-stone-600 text-sm">Your browser doesn&apos;t support push notifications.</p>
      </section>
    )
  }

  async function handleEnable() {
    const result = await subscribe()
    if (!result.ok && result.error === 'denied') {
      alert('Notifications are blocked. Open your browser settings → Site settings to allow notifications for Hearth.')
    }
  }

  async function handleTime(value: string) {
    const time = value || null
    setReminderTimeLocal(time)
    await setReminderTime(time === null ? 'default' : { time })
  }

  return (
    <section id="reminders" className="space-y-4">
      <h2 className="font-serif text-xl">Gentle reminders</h2>

      {!subscribed && permission !== 'denied' && (
        <button onClick={handleEnable} className="px-4 py-2 rounded bg-stone-800 text-white">
          Enable nightly reminders
        </button>
      )}

      {!subscribed && permission === 'denied' && (
        <p className="text-stone-600 text-sm">
          Notifications are blocked for Hearth. To re-enable, open your browser&apos;s site settings.
        </p>
      )}

      {subscribed && (
        <>
          {paused && (
            <p className="text-amber-700 text-sm">
              Reminders are currently paused (no entries written for a week). Re-enable below to start again.
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm text-stone-700">When should we ping you?</label>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleTime('')}
                className={`px-3 py-1.5 rounded text-sm ${reminderTime === null ? 'bg-stone-800 text-white' : 'border border-stone-300'}`}
              >
                Surprise me (7–10pm)
              </button>
              <span className="text-stone-400">or</span>
              <input
                type="time"
                value={reminderTime ?? ''}
                onChange={(e) => handleTime(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                setTesting(true)
                try {
                  const res = await fetch('/api/push/test', { method: 'POST' })
                  if (!res.ok) alert('Test failed — check the console.')
                } finally {
                  setTesting(false)
                }
              }}
              disabled={testing}
              className="px-3 py-1.5 rounded border border-stone-400 text-sm"
            >
              {testing ? 'Sending...' : 'Send a test reminder'}
            </button>
            <button onClick={unsubscribe} className="px-3 py-1.5 rounded text-sm text-stone-500">
              Turn off
            </button>
          </div>
        </>
      )}
    </section>
  )
}
