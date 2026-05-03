'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickComebackLine } from '@/lib/comeback-messages'

interface Props { gapDays: number; onShown(): void }

export default function ComebackModal({ gapDays, onShown }: Props) {
  const [visible, setVisible] = useState(true)
  const [line] = useState(() => pickComebackLine('modal', gapDays))

  useEffect(() => {
    onShown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl px-10 py-12 max-w-md text-center shadow-2xl"
            style={{ fontFamily: 'var(--font-serif, serif)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl text-stone-800 leading-relaxed">{line}</p>
            <p className="text-sm text-stone-400 mt-6">tap anywhere to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
