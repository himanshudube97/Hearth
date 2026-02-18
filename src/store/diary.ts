// src/store/diary.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DiaryThemeName } from '@/lib/diaryThemes'

interface DiaryStore {
  currentDiaryTheme: DiaryThemeName
  setDiaryTheme: (theme: DiaryThemeName) => void
}

export const useDiaryStore = create<DiaryStore>()(
  persist(
    (set) => ({
      currentDiaryTheme: 'glass',
      setDiaryTheme: (theme) => set({ currentDiaryTheme: theme }),
    }),
    {
      name: 'hearth-diary-theme',
    }
  )
)
