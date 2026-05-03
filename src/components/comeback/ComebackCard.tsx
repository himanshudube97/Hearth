'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackCard({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('card', gapDays))

  useEffect(() => {
    onShown()
    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.6 }}
          onClick={() => setVisible(false)}
          className="fixed top-12 left-1/2 -translate-x-1/2 cursor-pointer z-40"
          style={{ fontFamily: 'var(--font-serif, serif)' }}
        >
          <div className="rounded-full bg-white/90 backdrop-blur px-5 py-2 shadow-lg border border-stone-200 text-stone-800">
            {line}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
