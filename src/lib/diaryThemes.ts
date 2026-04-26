// src/lib/diaryThemes.ts
//
// Previously held six diary themes. The glass diary is now the only theme,
// and its colors are derived from the active page theme via getGlassDiaryColors.
// This file remains as a thin compatibility shim so existing imports stay
// working during the migration; it will be deleted in Phase 8 once no
// callers remain.

export type DiaryThemeName = 'glass'

export interface DiaryTheme {
  id: DiaryThemeName
  name: string
}

export const glassTheme: DiaryTheme = {
  id: 'glass',
  name: 'Glass',
}

export const diaryThemes: Record<DiaryThemeName, DiaryTheme> = {
  glass: glassTheme,
}

export const diaryThemeList = [glassTheme]
