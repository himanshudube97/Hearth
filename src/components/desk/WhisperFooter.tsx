'use client'

import { useMemo } from 'react'
import { getRandomWhisper } from '@/lib/themes'

interface WhisperFooterProps {
  color: string
}

export default function WhisperFooter({ color }: WhisperFooterProps) {
  const whisper = useMemo(() => getRandomWhisper(), [])

  return (
    <span
      style={{
        color,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '14px',
        letterSpacing: '0.03em',
        opacity: 0.9,
      }}
    >
      &ldquo;{whisper}&rdquo;
    </span>
  )
}
