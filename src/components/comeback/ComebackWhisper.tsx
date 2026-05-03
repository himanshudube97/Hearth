'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackWhisper({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('whisper', gapDays))

  useEffect(() => {
    onShown()
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 italic text-stone-600 pointer-events-none z-40"
          style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: '1.5rem' }}
        >
          {line}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
