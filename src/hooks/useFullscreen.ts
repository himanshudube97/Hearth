'use client'

import { useCallback, useEffect, useState } from 'react'
import { isTauri } from '@/lib/desktop/isTauri'

const PREF_KEY = 'hearth.fullscreenPreferred'

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

async function setTauriFullscreen(value: boolean) {
  // Lazy-import so the web bundle stays clean.
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().setFullscreen(value)
}

async function enterWebFullscreen() {
  const el = document.documentElement as FsElement
  if (typeof el.requestFullscreen === 'function') await el.requestFullscreen()
  else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen()
}

async function exitWebFullscreen() {
  const d = document as FsDocument
  if (typeof document.exitFullscreen === 'function') await document.exitFullscreen()
  else if (typeof d.webkitExitFullscreen === 'function') await d.webkitExitFullscreen()
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [supported, setSupported] = useState(false)

  // Mount: detect support, sync state, restore pref.
  useEffect(() => {
    if (isTauri()) {
      // On desktop the JS Fullscreen API may also work in the webview, but we
      // drive window-level fullscreen via Tauri. Treat as always supported.
      setSupported(true)
      const pref = sessionStorage.getItem(PREF_KEY) === 'true'
      if (pref) {
        void setTauriFullscreen(true).then(() => setIsFullscreen(true))
      }
      return
    }

    const el = document.documentElement as FsElement
    const has = typeof el.requestFullscreen === 'function'
      || typeof el.webkitRequestFullscreen === 'function'
    setSupported(has)
    if (!has) return

    const sync = () => setIsFullscreen(!!getFsElement())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)

    // Web: if pref is set and we're not in fullscreen, attach a one-shot
    // capture-phase pointerdown that re-enters on next user gesture.
    const pref = sessionStorage.getItem(PREF_KEY) === 'true'
    let onFirstGesture: ((e: PointerEvent) => void) | null = null
    if (pref && !getFsElement()) {
      onFirstGesture = () => {
        void enterWebFullscreen()
      }
      // Capture phase + once so it fires before normal handlers and removes
      // itself. We do NOT preventDefault — the click still does its job.
      document.addEventListener('pointerdown', onFirstGesture, { capture: true, once: true })
    }

    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
      if (onFirstGesture) document.removeEventListener('pointerdown', onFirstGesture, true)
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (isTauri()) {
        const next = !isFullscreen
        await setTauriFullscreen(next)
        setIsFullscreen(next)
        if (next) sessionStorage.setItem(PREF_KEY, 'true')
        else sessionStorage.removeItem(PREF_KEY)
        return
      }

      if (getFsElement()) {
        await exitWebFullscreen()
        sessionStorage.removeItem(PREF_KEY)
      } else {
        await enterWebFullscreen()
        sessionStorage.setItem(PREF_KEY, 'true')
      }
    } catch {
      // User-cancelled, or browser refused. Nothing to recover from.
    }
  }, [isFullscreen])

  return { isFullscreen, supported, toggle }
}
