'use client'

import { useEffect, useState } from 'react'
import { useReminders } from '@/hooks/useReminders'
import { useThemeStore } from '@/store/theme'

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
}

export default function ReminderControls() {
  const { theme } = useThemeStore()
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

  const heading = (
    <h2 className="font-serif text-xl" style={{ color: theme.text.primary }}>
      Gentle reminders
    </h2>
  )

  if (!pushSupported) {
    if (isIosSafari()) {
      return (
        <section id="reminders" className="space-y-2">
          {heading}
          <p className="text-sm" style={{ color: theme.text.secondary }}>
            To get reminders on iPhone, install Hearth as a PWA: tap Share → Add to Home Screen,
            then open Hearth from your home screen and try again.
          </p>
        </section>
      )
    }
    return (
      <section id="reminders" className="space-y-2">
        {heading}
        <p className="text-sm" style={{ color: theme.text.secondary }}>
          Your browser doesn&apos;t support push notifications.
        </p>
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
      {heading}

      {!subscribed && permission !== 'denied' && (
        <button
          onClick={handleEnable}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: theme.accent.primary, color: '#fff' }}
        >
          Enable nightly reminders
        </button>
      )}

      {!subscribed && permission === 'denied' && (
        <p className="text-sm" style={{ color: theme.text.secondary }}>
          Notifications are blocked for Hearth. To re-enable, open your browser&apos;s site settings.
        </p>
      )}

      {subscribed && (
        <>
          {paused && (
            <p className="text-sm italic" style={{ color: theme.text.secondary }}>
              Reminders are currently paused (no entries written for a week). Re-enable below to start again.
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm" style={{ color: theme.text.secondary }}>
              When should we ping you?
            </label>
            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={() => handleTime('')}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={
                  reminderTime === null
                    ? { background: theme.accent.primary, color: '#fff' }
                    : {
                        background: theme.glass.bg,
                        border: `1px solid ${theme.glass.border}`,
                        color: theme.text.secondary,
                      }
                }
              >
                Surprise me (7–10pm)
              </button>
              <span style={{ color: theme.text.muted }}>or</span>
              <input
                type="time"
                value={reminderTime ?? ''}
                onChange={(e) => handleTime(e.target.value)}
                className="px-2 py-1 rounded-lg text-sm bg-transparent"
                style={{
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.primary,
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
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
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: theme.text.secondary,
                opacity: testing ? 0.6 : 1,
              }}
            >
              {testing ? 'Sending...' : 'Send a test reminder'}
            </button>
            <button
              onClick={unsubscribe}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: theme.text.muted }}
            >
              Turn off
            </button>
          </div>
        </>
      )}
    </section>
  )
}
