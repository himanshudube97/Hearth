import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DeskSettingsStore {
  pageOpacity: number  // 0-100
  animationsEnabled: boolean
  setPageOpacity: (value: number) => void
  setAnimationsEnabled: (value: boolean) => void
}

export const useDeskSettings = create<DeskSettingsStore>()(
  persist(
    (set) => ({
      pageOpacity: 95,
      animationsEnabled: true,
      setPageOpacity: (value) => set({ pageOpacity: Math.max(0, Math.min(100, value)) }),
      setAnimationsEnabled: (value) => set({ animationsEnabled: value }),
    }),
    {
      name: 'hearth-desk-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
