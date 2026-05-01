import { create } from 'zustand'
import type { EntryStyle } from '@/lib/entry-style'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  // In-memory draft text for the new-entry spread. Lives here (not in
  // BookSpread state) so typing doesn't re-render BookSpread → react-pageflip
  // would otherwise rebuild page DOM on every keystroke and kill focus.
  // No longer persisted — DB autosave is the source of truth.
  leftPageDraft: string
  rightPageDraft: string
  // Per-entry style draft. Lives here for the same reason text drafts do:
  // changing it must not re-render BookSpread, which would tear down the
  // flipbook DOM and steal textarea focus.
  entryStyleDraft: EntryStyle
  // Autosave status lives here for the same reason as drafts: routing it
  // through BookSpread state would re-render the flipbook on every save
  // transition (idle → saving → saved) and steal focus from the textarea.
  // RightPage subscribes to this directly.
  autosaveStatus: AutosaveStatus
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
  setLeftPageDraft: (updater: string | ((prev: string) => string)) => void
  setRightPageDraft: (updater: string | ((prev: string) => string)) => void
  setDrafts: (left: string, right: string) => void
  setEntryStyleDraft: (next: EntryStyle) => void
  clearDrafts: () => void
  setAutosaveStatus: (status: AutosaveStatus) => void
}

export const useDeskStore = create<DeskStore>()((set) => ({
  currentSpread: 0,
  totalSpreads: 1,
  leftPageDraft: '',
  rightPageDraft: '',
  entryStyleDraft: {},
  autosaveStatus: 'idle',
  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
  setLeftPageDraft: (updater) => set((state) => ({
    leftPageDraft: typeof updater === 'function' ? updater(state.leftPageDraft) : updater,
  })),
  setRightPageDraft: (updater) => set((state) => ({
    rightPageDraft: typeof updater === 'function' ? updater(state.rightPageDraft) : updater,
  })),
  setDrafts: (left, right) => set({ leftPageDraft: left, rightPageDraft: right }),
  setEntryStyleDraft: (next) => set({ entryStyleDraft: next }),
  clearDrafts: () => set({ leftPageDraft: '', rightPageDraft: '', entryStyleDraft: {} }),
  setAutosaveStatus: (status) => set({ autosaveStatus: status }),
}))
