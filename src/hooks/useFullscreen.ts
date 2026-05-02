'use client'

import { useCallback, useEffect, useState } from 'react'

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

function getFsElement(): Element | null {
  const d = document as FsDocument
  return document.fullscreenElement || d.webkitFullscreenElement || null
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  // iOS Safari has no Fullscreen API for the document. Detect support so the
  // affordance can hide cleanly instead of rendering a button that no-ops.
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const el = document.documentElement as FsElement
    const has = typeof el.requestFullscreen === 'function'
      || typeof el.webkitRequestFullscreen === 'function'
    setSupported(has)
    if (!has) return

    const sync = () => setIsFullscreen(!!getFsElement())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const toggle = useCallback(async () => {
    const el = document.documentElement as FsElement
    const d = document as FsDocument
    try {
      if (getFsElement()) {
        if (typeof document.exitFullscreen === 'function') await document.exitFullscreen()
        else if (typeof d.webkitExitFullscreen === 'function') await d.webkitExitFullscreen()
      } else {
        if (typeof el.requestFullscreen === 'function') await el.requestFullscreen()
        else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen()
      }
    } catch {
      // User-cancelled, or browser refused. Nothing to recover from.
    }
  }, [])

  return { isFullscreen, supported, toggle }
}
