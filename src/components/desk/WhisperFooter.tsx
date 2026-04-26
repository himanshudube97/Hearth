'use client'

import { useMemo } from 'react'
import { getRandomWhisper } from '@/lib/themes'

interface WhisperFooterProps {
  color: string
}

export default function WhisperFooter({ color }: WhisperFooterProps) {
  const whisper = useMemo(() => getRandomWhisper(), [])

  return (
    <div
      className="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-10"
      style={{
        color,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '12px',
        letterSpacing: '0.02em',
        opacity: 0.55,
      }}
    >
      &ldquo;{whisper}&rdquo;
    </div>
  )
}
