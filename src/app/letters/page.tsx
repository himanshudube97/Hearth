// src/app/letters/page.tsx
'use client'

import { useState } from 'react'
import LettersNav from '@/components/letters/LettersNav'
import InboxView from '@/components/letters/inbox/InboxView'
import SentView from '@/components/letters/sent/SentView'
import type { LettersTab } from '@/components/letters/letterTypes'

export default function LettersPage() {
  const [tab, setTab] = useState<LettersTab>('inbox')
  const [newCount, setNewCount] = useState(0)

  return (
    <>
      <LettersNav active={tab} onChange={setTab} newCount={newCount} />
      {tab === 'inbox'
        ? <InboxView onUnreadCountChange={setNewCount} />
        : <SentView />}
    </>
  )
}
