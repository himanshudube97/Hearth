'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useE2EEStore } from '@/store/e2ee'

export default function BackfillToast() {
  const { theme } = useThemeStore()
  const { backfillProgress } = useE2EEStore()
  const visible = backfillProgress.status === 'running' || backfillProgress.status === 'done'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={backfillProgress.status}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-40 px-4 py-3 rounded-xl text-sm shadow-lg max-w-xs"
          style={{
            background: theme.bg.primary,
            color: theme.text.primary,
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {backfillProgress.status === 'running' && (
            <>
              Migrating your journal… {backfillProgress.migrated}
              {backfillProgress.total > 0 ? ` / ${backfillProgress.total}` : ''}
            </>
          )}
          {backfillProgress.status === 'done' && <>Your journal is now end-to-end encrypted ✓</>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
