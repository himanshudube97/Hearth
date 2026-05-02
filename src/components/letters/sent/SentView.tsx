'use client'

import { useEffect, useState } from 'react'
import JarSentView from './JarSentView'
import type { SentStamp } from '../letterTypes'

export default function SentView() {
  const [stamps, setStamps] = useState<SentStamp[]>([])

  useEffect(() => {
    fetch('/api/letters/sent')
      .then(r => r.json())
      .then(d => setStamps(d.stamps || []))
      .catch(() => {})
  }, [])

  return <JarSentView stamps={stamps} />
}
