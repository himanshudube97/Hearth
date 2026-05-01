// src/app/letters/write/page.tsx
'use client'

import LettersTokens from '@/components/letters/LettersTokens'
import ComposeView from '@/components/letters/compose/ComposeView'

export default function LettersWritePage() {
  return (
    <>
      <LettersTokens />
      <ComposeView />
    </>
  )
}
