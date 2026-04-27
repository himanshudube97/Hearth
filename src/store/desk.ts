import { create } from 'zustand'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  // In-memory draft text for the new-entry spread. Lives here (not in
  // BookSpread state) so typing doesn't re-render BookSpread → react-pageflip
  // would otherwise rebuild page DOM on every keystroke and kill focus.
  // No longer persisted — DB autosave is the source of truth.
  leftPageDraft: string
  rightPageDraft: string
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
  setLeftPageDraft: (updater: string | ((prev: string) => string)) => void
  setRightPageDraft: (updater: string | ((prev: string) => string)) => void
  setDrafts: (left: string, right: string) => void
  clearDrafts: () => void
}

export const useDeskStore = create<DeskStore>()((set) => ({
  currentSpread: 0,
  totalSpreads: 1,
  leftPageDraft: '',
  rightPageDraft: '',
  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
  setLeftPageDraft: (updater) => set((state) => ({
    leftPageDraft: typeof updater === 'function' ? updater(state.leftPageDraft) : updater,
  })),
  setRightPageDraft: (updater) => set((state) => ({
    rightPageDraft: typeof updater === 'function' ? updater(state.rightPageDraft) : updater,
  })),
  setDrafts: (left, right) => set({ leftPageDraft: left, rightPageDraft: right }),
  clearDrafts: () => set({ leftPageDraft: '', rightPageDraft: '' }),
}))
