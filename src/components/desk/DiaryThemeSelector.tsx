// src/components/desk/DiaryThemeSelector.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemeList, DiaryThemeName } from '@/lib/diaryThemes'

export function DiaryThemeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useThemeStore()
  const { currentDiaryTheme, setDiaryTheme } = useDiaryStore()

  return (
    <>
      {/* Trigger Button - positioned to the right of CursorPicker */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-24 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'rgba(40, 30, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.95 }}
        title="Change diary style"
      >
        <span className="text-2xl">📖</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 left-24 z-[120] p-6 rounded-2xl max-w-md"
              style={{
                background: theme.glass.bg,
                backdropFilter: `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
              }}
            >
              <h3 className="text-lg font-medium mb-4" style={{ color: theme.text.primary }}>
                Choose Diary Style
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {diaryThemeList.map((diaryTheme) => (
                  <motion.button
                    key={diaryTheme.id}
                    onClick={() => {
                      setDiaryTheme(diaryTheme.id as DiaryThemeName)
                      setIsOpen(false)
                    }}
                    className="relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
                    style={{
                      background: currentDiaryTheme === diaryTheme.id
                        ? `${theme.accent.primary}30`
                        : 'rgba(255,255,255,0.05)',
                      border: currentDiaryTheme === diaryTheme.id
                        ? `2px solid ${theme.accent.primary}`
                        : '2px solid transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Mini book preview */}
                    <div
                      className="w-12 h-16 rounded-sm shadow-md"
                      style={{
                        background: diaryTheme.cover.background,
                        border: `1px solid ${diaryTheme.cover.borderColor || 'transparent'}`,
                      }}
                    />
                    <span className="text-xs text-center" style={{ color: theme.text.secondary }}>
                      {diaryTheme.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-xs mt-4 text-center" style={{ color: theme.text.muted }}>
                Mix any diary style with any background theme
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
