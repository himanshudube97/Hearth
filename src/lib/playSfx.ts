import { Howl } from 'howler'
import { sfxSources, type SfxName } from '@/lib/sounds'
import { useSoundStore } from '@/store/sound'

const cache: Partial<Record<SfxName, Howl>> = {}

export function playSfx(name: SfxName) {
  if (typeof window === 'undefined') return

  const { uiSoundsEnabled, ambientVolume } = useSoundStore.getState()
  if (!uiSoundsEnabled) return

  let howl = cache[name]
  if (!howl) {
    howl = new Howl({
      src: [sfxSources[name]],
      volume: 0.5,
      preload: true,
      onloaderror: () => {
        // Asset missing — degrade silently so the app keeps working before
        // sound files are dropped in.
      },
    })
    cache[name] = howl
  }

  howl.volume(Math.max(0.2, ambientVolume * 1.5))
  howl.play()
}
