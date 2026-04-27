import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DeskSettingsStore {
  pageOpacity: number  // 0-100
  setPageOpacity: (value: number) => void
}

export const useDeskSettings = create<DeskSettingsStore>()(
  persist(
    (set) => ({
      pageOpacity: 95,
      setPageOpacity: (value) => set({ pageOpacity: Math.max(0, Math.min(100, value)) }),
    }),
    {
      name: 'hearth-desk-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
