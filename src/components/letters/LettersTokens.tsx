'use client'

import { useThemeStore } from '@/store/theme'
import { useMemo } from 'react'

/**
 * Injects CSS variables that the letters surfaces consume. Derived from
 * the active theme — keeps the demo's palette names but always tracks the
 * real theme. Mount once at the top of LettersPage.
 */
export default function LettersTokens() {
  const theme = useThemeStore(s => s.theme)
  const css = useMemo(() => {
    const a = theme.accent
    const t = theme.text
    return `:root {
      --bg-1: ${theme.bg.primary};
      --bg-2: ${theme.bg.secondary};
      --text-primary: ${t.primary};
      --text-secondary: ${t.secondary};
      --text-muted: ${t.muted};
      --accent-primary: ${a.primary};
      --accent-secondary: ${a.secondary};
      --accent-warm: ${a.warm};
      --accent-highlight: ${a.highlight};
      --paper-1: color-mix(in oklab, ${theme.bg.primary} 80%, white);
      --paper-2: ${theme.bg.secondary};
      --paper-album: color-mix(in oklab, ${theme.bg.secondary} 70%, ${theme.bg.primary});
      --shelf: ${theme.cover ?? a.secondary};
      --postbox-1: ${a.warm};
      --postbox-2: ${a.primary};
      --postbox-3: ${a.secondary};
    }`
  }, [theme])
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
