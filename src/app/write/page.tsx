'use client'

import { useEffect, useState } from 'react'
import { DeskScene } from '@/components/desk'
import OptInCard from '@/components/reminders/OptInCard'

export default function WritePage() {
  const [optInShown, setOptInShown] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/me/profile-flags')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setOptInShown(Boolean(data?.profile?.reminderOptInPromptShownAt))
      })
      .catch(() => setOptInShown(true)) // fail-closed: don't show if we can't determine
  }, [])

  return (
    <>
      <DeskScene />
      {optInShown === false && <OptInCard alreadyShown={false} />}
    </>
  )
}
