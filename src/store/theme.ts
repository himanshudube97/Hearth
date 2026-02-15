import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { themes, Theme, ThemeName } from '@/lib/themes'

interface ThemeStore {
  themeName: ThemeName
  theme: Theme
  setTheme: (name: ThemeName) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeName: 'winterSunset',
      theme: themes.winterSunset,
      setTheme: (name: ThemeName) => set({
        themeName: name,
        theme: themes[name]
      }),
    }),
    {
      name: 'hearth-theme',
    }
  )
)
