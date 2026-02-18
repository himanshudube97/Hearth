import { create } from 'zustand'
import {
  loadMasterKeyLocally,
  storeMasterKeyLocally,
  clearMasterKeyLocally,
  hasMasterKeyLocally,
} from '@/lib/e2ee/crypto'
import type { E2EEKeyData } from '@/lib/e2ee/types'

interface E2EEState {
  // Status
  isEnabled: boolean
  isUnlocked: boolean
  masterKey: CryptoKey | null
  keyData: E2EEKeyData | null

  // UI state
  showSetupModal: boolean
  showUnlockModal: boolean
  showRecoveryModal: boolean

  // Loading
  loading: boolean
  initialized: boolean

  // Actions
  setEnabled: (enabled: boolean) => void
  setMasterKey: (key: CryptoKey | null) => void
  setKeyData: (data: E2EEKeyData | null) => void
  setShowSetupModal: (show: boolean) => void
  setShowUnlockModal: (show: boolean) => void
  setShowRecoveryModal: (show: boolean) => void
  setLoading: (loading: boolean) => void

  // Async actions
  storeMasterKey: (key: CryptoKey, persistent?: boolean) => Promise<void>
  loadMasterKey: () => Promise<CryptoKey | null>
  clearMasterKey: () => void
  initialize: () => Promise<void>
  fetchKeyData: () => Promise<E2EEKeyData | null>
}

export const useE2EEStore = create<E2EEState>((set, get) => ({
  // Initial state
  isEnabled: false,
  isUnlocked: false,
  masterKey: null,
  keyData: null,
  showSetupModal: false,
  showUnlockModal: false,
  showRecoveryModal: false,
  loading: false,
  initialized: false,

  // Setters
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setMasterKey: (key) => set({ masterKey: key, isUnlocked: key !== null }),
  setKeyData: (data) => set({ keyData: data }),
  setShowSetupModal: (show) => set({ showSetupModal: show }),
  setShowUnlockModal: (show) => set({ showUnlockModal: show }),
  setShowRecoveryModal: (show) => set({ showRecoveryModal: show }),
  setLoading: (loading) => set({ loading }),

  // Store master key in browser storage
  storeMasterKey: async (key, persistent = false) => {
    await storeMasterKeyLocally(key, persistent)
    set({ masterKey: key, isUnlocked: true })
  },

  // Load master key from browser storage
  loadMasterKey: async () => {
    const key = await loadMasterKeyLocally()
    if (key) {
      set({ masterKey: key, isUnlocked: true })
    }
    return key
  },

  // Clear master key from memory and storage
  clearMasterKey: () => {
    clearMasterKeyLocally()
    set({ masterKey: null, isUnlocked: false })
  },

  // Fetch E2EE key data from server
  fetchKeyData: async () => {
    try {
      const res = await fetch('/api/e2ee/keys')
      if (!res.ok) return null
      const data: E2EEKeyData = await res.json()
      set({ keyData: data, isEnabled: data.e2eeEnabled })
      return data
    } catch {
      return null
    }
  },

  // Initialize E2EE state on app load
  initialize: async () => {
    const state = get()
    if (state.initialized) return

    set({ loading: true })

    try {
      // Fetch E2EE status from server
      const keyData = await state.fetchKeyData()

      if (keyData?.e2eeEnabled) {
        // E2EE is enabled, try to load key from storage
        const hasLocalKey = hasMasterKeyLocally()

        if (hasLocalKey) {
          // Try to load the key
          const key = await state.loadMasterKey()
          if (key) {
            set({ isUnlocked: true })
          } else {
            // Key was invalid, need to unlock
            set({ showUnlockModal: true })
          }
        } else {
          // No local key, show unlock modal
          set({ showUnlockModal: true })
        }
      }

      set({ initialized: true })
    } catch (error) {
      console.error('Failed to initialize E2EE:', error)
    } finally {
      set({ loading: false })
    }
  },
}))
