'use client'

import { useEffect, useState } from 'react'
import JarSentView from './JarSentView'
import type { SentStamp } from '../letterTypes'

export default function SentView() {
  const [stamps, setStamps] = useState<SentStamp[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/letters/sent')
      .then(r => r.json())
      .then(d => { if (!cancelled) setStamps(d.stamps || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return <JarSentView stamps={stamps} />
}
