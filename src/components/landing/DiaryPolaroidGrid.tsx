'use client'

import { themes, type ThemeName } from '@/lib/themes'
import DiaryThemePolaroid from './DiaryThemePolaroid'

type Props = {
  current: ThemeName
  hasOverridden: boolean
  onPick: (name: ThemeName) => void
  onReset: () => void
}

const ORDER: ThemeName[] = ['rivendell', 'hearth', 'rose', 'sage', 'ocean', 'postal', 'linen']
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1.5, -2.5]
const TAPE = [true, false, true, false, false, true, false]

export default function DiaryPolaroidGrid({ current, hasOverridden, onPick, onReset }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 max-w-[480px]">
        {ORDER.slice(0, 4).map((name, i) => (
          <DiaryThemePolaroid
            key={name}
            themeName={name}
            theme={themes[name]}
            active={current === name}
            rotation={ROTATIONS[i]}
            hasTape={TAPE[i]}
            onClick={() => onPick(name)}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 max-w-[360px] mt-3">
        {ORDER.slice(4).map((name, i) => (
          <DiaryThemePolaroid
            key={name}
            themeName={name}
            theme={themes[name]}
            active={current === name}
            rotation={ROTATIONS[i + 4]}
            hasTape={TAPE[i + 4]}
            onClick={() => onPick(name)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 font-serif italic text-xs underline-offset-4 hover:underline"
        style={{ opacity: hasOverridden ? 0.7 : 0, pointerEvents: hasOverridden ? 'auto' : 'none' }}
      >
        ← reset to my theme
      </button>
    </div>
  )
}
