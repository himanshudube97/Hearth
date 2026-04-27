import { create } from 'zustand'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
}

export const useDeskStore = create<DeskStore>()((set) => ({
  currentSpread: 0,
  totalSpreads: 1,
  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
}))
