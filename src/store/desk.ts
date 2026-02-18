import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeskElement = 'book' | 'window' | 'drawer' | 'candle' | null

interface DeskStore {
  // Book state
  isBookOpen: boolean
  currentSpread: number
  totalSpreads: number
  isPageTurning: boolean
  turnDirection: 'forward' | 'backward' | null

  // Scene state
  activeElement: DeskElement
  isDrawerOpen: boolean
  isWindowActive: boolean

  // Actions
  openBook: () => void
  closeBook: () => void
  turnPage: (direction: 'forward' | 'backward') => void
  finishPageTurn: () => void
  setActiveElement: (element: DeskElement) => void
  toggleDrawer: () => void
  setWindowActive: (active: boolean) => void
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
  openAtLatestSpread: (totalEntries: number) => void
}

export const useDeskStore = create<DeskStore>()(
  persist(
    (set, get) => ({
      isBookOpen: false,
      currentSpread: 0,
      totalSpreads: 1,
      isPageTurning: false,
      turnDirection: null,
      activeElement: null,
      isDrawerOpen: false,
      isWindowActive: false,

      openBook: () => set({ isBookOpen: true, activeElement: 'book' }),
      closeBook: () => set({ isBookOpen: false, activeElement: null }),

      turnPage: (direction) => {
        const { currentSpread, totalSpreads, isPageTurning } = get()
        if (isPageTurning) return

        // Can't go before spread 0
        if (direction === 'backward' && currentSpread <= 0) return
        // Can't go past the last spread (which is the "new entry" spread)
        if (direction === 'forward' && currentSpread >= totalSpreads) return

        set({
          isPageTurning: true,
          turnDirection: direction
        })
      },

      finishPageTurn: () => set((state) => ({
        isPageTurning: false,
        turnDirection: null,
        currentSpread: state.turnDirection === 'forward'
          ? Math.min(state.currentSpread + 1, state.totalSpreads)
          : Math.max(0, state.currentSpread - 1)
      })),

      setActiveElement: (element) => set({ activeElement: element }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setWindowActive: (active) => set({ isWindowActive: active }),
      goToSpread: (spread) => set({ currentSpread: spread }),
      setTotalSpreads: (total) => set({ totalSpreads: total }),

      // Open book directly at the latest spread (today's writing page)
      openAtLatestSpread: (totalEntries: number) => {
        // Each entry = 1 spread, plus 1 for "new entry" spread
        const latestSpread = totalEntries
        set({
          isBookOpen: true,
          activeElement: 'book',
          currentSpread: latestSpread,
          totalSpreads: latestSpread + 1
        })
      },
    }),
    {
      name: 'hearth-desk',
      partialize: (state) => ({
        // Only persist these fields
        isDrawerOpen: state.isDrawerOpen,
      }),
    }
  )
)
