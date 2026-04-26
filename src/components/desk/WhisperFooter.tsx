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
      className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-20"
      style={{
        color,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '14px',
        letterSpacing: '0.03em',
        opacity: 0.85,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
      }}
    >
      &ldquo;{whisper}&rdquo;
    </div>
  )
}
