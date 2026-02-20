'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useJournalStore } from '@/store/journal'

export default function MoodPicker() {
  const { currentMood, setCurrentMood } = useJournalStore()
  const { theme } = useThemeStore()

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {theme.moodEmojis.map((emoji, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentMood(index)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all"
            style={{
              background: currentMood === index
                ? `${theme.moods[index as keyof typeof theme.moods]}40`
                : 'transparent',
              border: currentMood === index
                ? `2px solid ${theme.moods[index as keyof typeof theme.moods]}`
                : '2px solid transparent',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            title={theme.moodLabels[index]}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
