import { create } from 'zustand'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  isPageTurning: boolean
  turnDirection: 'forward' | 'backward' | null
  turnPage: (direction: 'forward' | 'backward') => void
  finishPageTurn: () => void
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
}

export const useDeskStore = create<DeskStore>()((set, get) => ({
  currentSpread: 0,
  totalSpreads: 1,
  isPageTurning: false,
  turnDirection: null,

  turnPage: (direction) => {
    const { currentSpread, totalSpreads, isPageTurning } = get()
    if (isPageTurning) return
    if (direction === 'backward' && currentSpread <= 0) return
    if (direction === 'forward' && currentSpread >= totalSpreads) return
    set({ isPageTurning: true, turnDirection: direction })
  },

  finishPageTurn: () => set((state) => ({
    isPageTurning: false,
    turnDirection: null,
    currentSpread: state.turnDirection === 'forward'
      ? Math.min(state.currentSpread + 1, state.totalSpreads)
      : Math.max(0, state.currentSpread - 1),
  })),

  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
}))
