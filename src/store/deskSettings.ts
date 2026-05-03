import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DeskSettingsStore {
  animationsEnabled: boolean
  setAnimationsEnabled: (value: boolean) => void
}

export const useDeskSettings = create<DeskSettingsStore>()(
  persist(
    (set) => ({
      animationsEnabled: true,
      setAnimationsEnabled: (value) => set({ animationsEnabled: value }),
    }),
    {
      name: 'hearth-desk-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
