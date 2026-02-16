import { create } from 'zustand'

export type ProfileKey =
  | 'nickname'
  | 'dateOfBirth'
  | 'lostHobby'
  | 'recharges'
  | 'smallJoy'
  | 'wantToReturn'
  | 'comfortThing'
  | 'friendDescription'

export type ProfileData = Partial<Record<ProfileKey, string>>

interface ProfileState {
  profile: ProfileData
  loading: boolean
  saving: boolean
  lastSaved: Date | null
  fetchProfile: () => Promise<void>
  updateField: (key: ProfileKey, value: string) => void
}

// Debounce timer for auto-save
let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: {},
  loading: true,
  saving: false,
  lastSaved: null,

  fetchProfile: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        set({ profile: data.profile || {}, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  updateField: (key: ProfileKey, value: string) => {
    // Update local state immediately
    const currentProfile = get().profile
    set({
      profile: { ...currentProfile, [key]: value },
    })

    // Clear existing timer
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    // Set new timer for debounced save (500ms)
    saveTimer = setTimeout(async () => {
      set({ saving: true })
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        })
        if (response.ok) {
          set({ saving: false, lastSaved: new Date() })
        } else {
          set({ saving: false })
        }
      } catch {
        set({ saving: false })
      }
    }, 500)
  },
}))
