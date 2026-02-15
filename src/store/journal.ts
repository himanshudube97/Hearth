import { create } from 'zustand'

export interface JournalEntry {
  id: string
  text: string
  mood: number
  createdAt: string
  updatedAt: string
  song?: string
  tags: string[]
  doodles: Doodle[]
}

export interface Doodle {
  id: string
  strokes: StrokeData[]
  positionInEntry: number
}

export interface StrokeData {
  points: number[][]
  color: string
  size: number
}

interface JournalStore {
  entries: JournalEntry[]
  currentMood: number
  currentText: string
  currentSong: string
  isLoading: boolean
  activeTab: 'write' | 'timeline' | 'calendar'
  doodleMode: boolean
  currentDoodleStrokes: StrokeData[]

  setEntries: (entries: JournalEntry[]) => void
  addEntry: (entry: JournalEntry) => void
  setCurrentMood: (mood: number) => void
  setCurrentText: (text: string) => void
  setCurrentSong: (song: string) => void
  setIsLoading: (loading: boolean) => void
  setActiveTab: (tab: 'write' | 'timeline' | 'calendar') => void
  setDoodleMode: (mode: boolean) => void
  addDoodleStroke: (stroke: StrokeData) => void
  clearDoodleStrokes: () => void
  resetCurrentEntry: () => void
}

export const useJournalStore = create<JournalStore>((set) => ({
  entries: [],
  currentMood: 2,
  currentText: '',
  currentSong: '',
  isLoading: false,
  activeTab: 'write',
  doodleMode: false,
  currentDoodleStrokes: [],

  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  setCurrentMood: (mood) => set({ currentMood: mood }),
  setCurrentText: (text) => set({ currentText: text }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDoodleMode: (mode) => set({ doodleMode: mode }),
  addDoodleStroke: (stroke) => set((state) => ({
    currentDoodleStrokes: [...state.currentDoodleStrokes, stroke]
  })),
  clearDoodleStrokes: () => set({ currentDoodleStrokes: [] }),
  resetCurrentEntry: () => set({
    currentText: '',
    currentSong: '',
    currentMood: 2,
    currentDoodleStrokes: []
  }),
}))
