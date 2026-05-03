'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReminders } from '@/hooks/useReminders'

interface Props {
  /** Whether the user has already seen the prompt (server-side flag). */
  alreadyShown: boolean
}

export default function OptInCard({ alreadyShown }: Props) {
  const [visible, setVisible] = useState(false)
  const { pushSupported, subscribe } = useReminders()

  useEffect(() => {
    if (alreadyShown || !pushSupported) return
    const handler = () => setVisible(true)
    window.addEventListener('hearth:entry-saved', handler)
    return () => window.removeEventListener('hearth:entry-saved', handler)
  }, [alreadyShown, pushSupported])

  async function dismiss(action: 'yes-default' | 'yes-pick' | 'not-now') {
    setVisible(false)
    // Always mark prompt as shown so it doesn't re-appear
    fetch('/api/me/profile-flags', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reminderOptInPromptShownAt: new Date().toISOString() }),
    }).catch(() => {})

    if (action === 'yes-default' || action === 'yes-pick') {
      const result = await subscribe()
      if (!result.ok) {
        // Permission denied or other failure — silently swallow; user can retry from profile
        return
      }
      if (action === 'yes-pick') {
        // Send the user to profile to pick a time
        window.location.href = '/me#reminders'
      }
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-8 right-8 max-w-sm rounded-xl bg-white/95 backdrop-blur p-5 shadow-xl border border-stone-200 z-50"
          style={{ fontFamily: 'var(--font-serif, serif)' }}
        >
          <p className="text-stone-800 leading-relaxed">
            Want a gentle reminder in the evening? We can ping you sometime between
            7 and 10pm — or pick a time that fits your day.
          </p>
          <div className="flex gap-2 mt-4 text-sm">
            <button onClick={() => dismiss('yes-default')} className="px-3 py-1.5 rounded bg-stone-800 text-white">
              Surprise me
            </button>
            <button onClick={() => dismiss('yes-pick')} className="px-3 py-1.5 rounded border border-stone-400 text-stone-700">
              Pick a time
            </button>
            <button onClick={() => dismiss('not-now')} className="px-3 py-1.5 text-stone-500">
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
