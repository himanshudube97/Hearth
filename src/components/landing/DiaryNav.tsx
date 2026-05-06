// src/components/landing/DiaryNav.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

type Props = {
  total: number
  current: number
  canGoForward: boolean
  canGoBack: boolean
  isFlipping: boolean
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export default function DiaryNav({ total, current, canGoForward, canGoBack, isFlipping, onPrev, onNext, onJump }: Props) {
  const { theme } = useThemeStore()

  const baseBtn =
    'w-9 h-9 rounded-full flex items-center justify-center font-serif text-lg transition-opacity'

  return (
    <div className="mt-10 flex items-center justify-center gap-6 select-none">
      <button
        aria-label="Previous page"
        onClick={onPrev}
        disabled={!canGoBack || isFlipping}
        className={`${baseBtn} ${canGoBack && !isFlipping ? '' : 'opacity-30 cursor-not-allowed'}`}
        style={{
          background: `${theme.accent.warm}20`,
          color: theme.text.primary,
          border: `1px solid ${theme.text.muted}40`,
        }}
      >
        ‹
      </button>

      <div className="flex items-center gap-2" aria-label="Diary pages">
        {Array.from({ length: total }).map((_, i) => (
          <motion.button
            key={i}
            aria-label={`Page ${i + 1}`}
            aria-current={i === current ? 'page' : undefined}
            disabled={isFlipping || i === current}
            onClick={() => onJump(i)}
            className="rounded-full"
            initial={false}
            animate={{
              width: i === current ? 18 : 6,
              height: 6,
              opacity: i === current ? 1 : 0.4,
              backgroundColor: i === current ? theme.accent.primary : theme.text.muted,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ pointerEvents: isFlipping ? 'none' : 'auto' }}
          />
        ))}
      </div>

      <button
        aria-label="Next page"
        onClick={onNext}
        disabled={!canGoForward || isFlipping}
        className={`${baseBtn} ${canGoForward && !isFlipping ? '' : 'opacity-30 cursor-not-allowed'}`}
        style={{
          background: `${theme.accent.warm}20`,
          color: theme.text.primary,
          border: `1px solid ${theme.text.muted}40`,
        }}
      >
        ›
      </button>
    </div>
  )
}
