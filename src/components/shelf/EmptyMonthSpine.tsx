// src/components/shelf/EmptyMonthSpine.tsx
'use client'

import { useThemeStore } from '@/store/theme'
import { monthLabel } from './shelfPalette'

interface EmptyMonthSpineProps {
  monthIndex: number
}

const SPINE_WIDTH = 56
const SPINE_HEIGHT = 280

export default function EmptyMonthSpine({ monthIndex }: EmptyMonthSpineProps) {
  const { theme } = useThemeStore()
  return (
    <div
      aria-hidden="true"
      title={`no entries in ${monthLabel(monthIndex)}`}
      style={{
        width: `${SPINE_WIDTH}px`,
        height: `${SPINE_HEIGHT}px`,
        background: theme.glass.bg,
        border: `1px dashed ${theme.glass.border}`,
        borderRadius: '3px',
        opacity: 0.35,
      }}
    />
  )
}
