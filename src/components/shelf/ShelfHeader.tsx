// src/components/shelf/ShelfHeader.tsx
'use client'

import { useThemeStore } from '@/store/theme'

interface ShelfHeaderProps {
  selectedYear: number
  entriesThisYear: number
  totalEntries: number
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export default function ShelfHeader({
  selectedYear,
  entriesThisYear,
  totalEntries,
}: ShelfHeaderProps) {
  const { theme } = useThemeStore()

  const today = new Date()
  const monthSlash = `${pad(today.getMonth() + 1)}/${today.getFullYear() % 100}`

  return (
    <header className="text-center mb-8">
      <h1
        className="text-3xl mb-2"
        style={{
          color: theme.text.primary,
          fontFamily: 'Georgia, Palatino, serif',
          fontStyle: 'italic',
          fontWeight: 300,
        }}
      >
        your shelf
      </h1>
      <p
        className="text-[11px] tracking-[0.2em] uppercase"
        style={{ color: theme.text.muted }}
      >
        {monthSlash} · {entriesThisYear} entries this year · {totalEntries} in total
        {selectedYear !== today.getFullYear() && (
          <> · viewing {selectedYear}</>
        )}
      </p>
    </header>
  )
}
