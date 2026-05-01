'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { JournalEntry } from '@/store/journal'
import type { MemoryStar } from '@/components/constellation/ConstellationRenderer'
import { GardenRenderer } from '@/components/constellation/GardenRenderer'
import { FirelightRenderer } from '@/components/constellation/FirelightRenderer'

const MAX_VISIBLE_MEMORIES = 7 // Random memories shown each visit

export default function MemoryPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [memoryStars, setMemoryStars] = useState<MemoryStar[]>([])
  const [selectedStar, setSelectedStar] = useState<MemoryStar | null>(null)
  const [loading, setLoading] = useState(true)

  const { theme } = useThemeStore()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      // Fetch a larger batch for constellation view
      const res = await fetch('/api/entries?limit=50')
      const data = await res.json()
      // API now returns { entries: [...], pagination: {...} }
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Select random memories and position them
  useEffect(() => {
    if (entries.length === 0) return

    // Shuffle and pick random entries
    const shuffled = [...entries].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(MAX_VISIBLE_MEMORIES, entries.length))

    // Position them nicely spread across the screen
    const stars: MemoryStar[] = selected.map((entry, index) => {
      // Create a nice spread pattern
      const angle = (index / selected.length) * Math.PI * 2 + Math.random() * 0.5
      const radius = 25 + Math.random() * 20
      const centerX = 50
      const centerY = 50

      return {
        id: entry.id,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 15,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 15,
        size: 4 + Math.random() * 3,
        entry,
        delay: index * 0.4,
      }
    })

    setMemoryStars(stars)
  }, [entries])

  const Renderer = theme.mode === 'light' ? GardenRenderer : FirelightRenderer

  return (
    <Renderer
      loading={loading}
      entries={entries}
      memoryStars={memoryStars}
      selectedStar={selectedStar}
      setSelectedStar={setSelectedStar}
      theme={theme}
    />
  )
}
