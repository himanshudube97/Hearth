import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  provider: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  fetchUser: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        set({ user: data.user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      set({ user: null })
      window.location.href = '/login'
    } catch {
      console.error('Logout failed')
    }
  },
}))
