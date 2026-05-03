'use client'

import { useThemeStore } from '@/store/theme'
import { useMemo } from 'react'

/**
 * CSS variables for the scrapbook listing scene. Re-tints when the active
 * theme changes. Mirrors letters/LettersTokens.
 */
export default function ScrapbookTokens() {
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
      --card-paper: color-mix(in oklab, ${theme.bg.secondary} 80%, white);
      --chest-1: color-mix(in oklab, ${a.warm} 60%, #6f4a30);
      --chest-2: color-mix(in oklab, ${a.warm} 50%, #8a5e3a);
      --chest-3: color-mix(in oklab, ${a.warm} 70%, #a06a3a);
      --chest-4: color-mix(in oklab, ${a.warm} 40%, #5a3a26);
      --brass-1: #d4af6a;
      --brass-2: #b08a4a;
      --brass-3: #8a6a3a;
      --iron-1: #2a1f17;
      --iron-2: #15100b;
      --iron-3: #0a0805;
    }`
  }, [theme])
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
