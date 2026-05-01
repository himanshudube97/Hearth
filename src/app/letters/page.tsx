'use client'

import { useState } from 'react'
import SealedLetterList from '@/components/letters/SealedLetterList'
import LetterWriteView from '@/components/letters/LetterWriteView'

type Surface = 'list' | 'write'

export default function LettersPage() {
  const [surface, setSurface] = useState<Surface>('list')
  const [refreshKey, setRefreshKey] = useState(0)

  if (surface === 'list') {
    return (
      <SealedLetterList
        key={refreshKey}
        onWriteClick={() => setSurface('write')}
      />
    )
  }

  return (
    <LetterWriteView
      onBack={() => setSurface('list')}
      onSealed={() => {
        setRefreshKey(k => k + 1)
        setSurface('list')
      }}
    />
  )
}
