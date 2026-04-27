'use client'

import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { useThemeStore } from '@/store/theme'
import { useSoundStore } from '@/store/sound'
import { ambientSources } from '@/lib/sounds'

const FADE_MS = 1200

// Browser autoplay note: ambientEnabled defaults to false. Flipping it
// happens via a user click in the settings panel, which counts as the
// user gesture browsers require before audio can start.
export function useAmbientSound() {
  const theme = useThemeStore((s) => s.theme)
  const ambientEnabled = useSoundStore((s) => s.ambientEnabled)
  const ambientVolume = useSoundStore((s) => s.ambientVolume)

  const currentRef = useRef<Howl | null>(null)
  const currentSrcRef = useRef<string | null>(null)

  useEffect(() => {
    const targetSrc = ambientEnabled ? ambientSources[theme.ambience] : null

    if (currentSrcRef.current === targetSrc) {
      if (currentRef.current && targetSrc) {
        currentRef.current.volume(ambientVolume)
      }
      return
    }

    const old = currentRef.current
    if (old) {
      old.fade(old.volume(), 0, FADE_MS)
      const oldRef = old
      setTimeout(() => {
        oldRef.stop()
        oldRef.unload()
      }, FADE_MS + 50)
    }

    if (!targetSrc) {
      currentRef.current = null
      currentSrcRef.current = null
      return
    }

    const next = new Howl({
      src: [targetSrc],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => {
        // Asset missing — silent no-op.
      },
    })
    next.play()
    next.fade(0, ambientVolume, FADE_MS)

    currentRef.current = next
    currentSrcRef.current = targetSrc
  }, [theme.ambience, ambientEnabled, ambientVolume])

  useEffect(() => {
    return () => {
      const cur = currentRef.current
      if (cur) {
        cur.stop()
        cur.unload()
      }
    }
  }, [])
}
