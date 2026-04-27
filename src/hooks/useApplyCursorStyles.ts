'use client'

import { useEffect } from 'react'
import { useCursorStore } from '@/store/cursor'

/**
 * Injects the active cursor's CSS into document.head. Runs whenever the
 * cursor changes. Lives outside the cursor picker UI so the cursor still
 * applies on pages that don't render the picker.
 */
export function useApplyCursorStyles() {
  const cursor = useCursorStore((s) => s.cursor)

  useEffect(() => {
    const STYLE_ID = 'custom-cursor-styles'
    document.getElementById(STYLE_ID)?.remove()

    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      body {
        cursor: ${cursor.default} ${cursor.hotspot.x} ${cursor.hotspot.y}, auto !important;
      }
      a, button, [role="button"], input[type="submit"], input[type="button"], .cursor-pointer {
        cursor: ${cursor.pointer} ${cursor.pointerHotspot.x} ${cursor.pointerHotspot.y}, pointer !important;
      }
      input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"] {
        cursor: ${cursor.text} ${cursor.textHotspot.x} ${cursor.textHotspot.y}, text !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [cursor])
}
