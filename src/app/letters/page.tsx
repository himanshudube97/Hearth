'use client'

import { useState } from 'react'
import LettersTokens from '@/components/letters/LettersTokens'
import LettersNav from '@/components/letters/LettersNav'
import InboxView from '@/components/letters/inbox/InboxView'
import SentView from '@/components/letters/sent/SentView'
import LightsView from '@/components/letters/lights/LightsView'
import type { LettersTab } from '@/components/letters/letterTypes'

export default function LettersPage() {
  const [tab, setTab] = useState<LettersTab>('inbox')
  const [newCount, setNewCount] = useState(0)

  return (
    <>
      <LettersTokens />
      <LettersNav active={tab} onChange={setTab} newCount={newCount} />
      {tab === 'inbox' && <InboxView onUnreadCountChange={setNewCount} />}
      {tab === 'sent' && <SentView />}
      {tab === 'lights' && <LightsView />}
    </>
  )
}
