// src/hooks/useMediaQuery.ts
'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * React hook that tracks a CSS media query match.
 * Returns false during SSR (safe default).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Returns the current layout mode based on viewport width.
 * - 'mobile': < 1024px — simple form layout
 * - 'tablet': 1024-1399px — scaled book spread
 * - 'desktop': >= 1400px — full book spread
 */
export function useLayoutMode(): 'mobile' | 'tablet' | 'desktop' {
  const isDesktop = useMediaQuery('(min-width: 1400px)')
  const isTablet = useMediaQuery('(min-width: 1024px)')

  if (isDesktop) return 'desktop'
  if (isTablet) return 'tablet'
  return 'mobile'
}
