'use client'

import { useThemeStore } from '@/store/theme'
import { ThemeName } from '@/lib/themes'
import Editor from '@/components/Editor'

const themeStamps: Record<ThemeName, { icon: string; color: string }> = {
  rivendell: { icon: '🍃', color: '#5E8B5A' },
  hobbiton: { icon: '🌻', color: '#60B060' },
  winterSunset: { icon: '❄️', color: '#E8945A' },
  cherryBlossom: { icon: '🌸', color: '#D4839A' },
  northernLights: { icon: '✨', color: '#64B5C6' },
  mistyMountains: { icon: '⛰️', color: '#7B8FA8' },
  gentleRain: { icon: '🌧️', color: '#6A9EC0' },
  cosmos: { icon: '🌟', color: '#9B7EC8' },
  candlelight: { icon: '🕯️', color: '#D4A574' },
  oceanTwilight: { icon: '🌊', color: '#5A9EA0' },
  quietSnow: { icon: '❄️', color: '#8BA8C4' },
}

interface PostcardFrontProps {
  letterText: string
  onTextChange: (html: string) => void
  recipientType: 'self' | 'friend'
}

export default function PostcardFront({ letterText, onTextChange, recipientType }: PostcardFrontProps) {
  const { themeName } = useThemeStore()
  const stamp = themeStamps[themeName] || themeStamps.rivendell

  return (
    <div
      className="postcard-front w-full h-full relative flex flex-col"
      style={{
        background: '#f5f0e6',
        fontFamily: "var(--font-caveat), 'Caveat', cursive",
      }}
    >
      {/* Air mail stripe */}
      <div
        className="h-3 w-full shrink-0"
        style={{
          background: 'repeating-linear-gradient(135deg, #c62828 0px, #c62828 8px, #fff 8px, #fff 12px, #1565c0 12px, #1565c0 20px, #fff 20px, #fff 24px)',
        }}
      />

      {/* POST CARD header */}
      <div className="text-center py-2 shrink-0">
        <span
          className="text-lg tracking-[0.3em] font-semibold"
          style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}
        >
          POST CARD
        </span>
      </div>

      {/* Full-width writing area */}
      <div className="flex-1 relative px-6 pb-0 min-h-0 overflow-hidden">
        {/* Ruled lines background — 40px intervals to match ProseMirror line-height */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #d4c5a0 39px, #d4c5a0 40px)',
            backgroundPosition: '0 12px',
            opacity: 0.5,
          }}
        />

        {/* Stamp watermark — top-right corner */}
        <div className="absolute top-2 right-4 z-20 opacity-30 pointer-events-none">
          <div
            className="w-16 h-20 border-2 flex flex-col items-center justify-center"
            style={{
              borderColor: stamp.color,
              borderStyle: 'dashed',
            }}
          >
            <span className="text-xl">{stamp.icon}</span>
            <span
              className="text-[9px] mt-1 tracking-wider"
              style={{ color: stamp.color, fontFamily: "'Georgia', serif" }}
            >
              HEARTH
            </span>
          </div>
        </div>

        {/* TipTap editor — full width, no scroll */}
        <div className="relative z-10 h-full overflow-hidden">
          <Editor
            prompt={
              recipientType === 'self'
                ? 'Dear future me...'
                : 'Dear friend...'
            }
            value={letterText}
            onChange={onTextChange}
            bare
            flexible
            noScroll
            customStyles={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
              fontSize: '20px',
              color: '#3d2c1a',
              lineHeight: '40px',
              background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* "the end" at bottom */}
      <div className="shrink-0 text-center pb-3 pt-1">
        <span
          className="text-xs tracking-[0.2em]"
          style={{ color: '#c4a26560', fontFamily: "'Georgia', serif" }}
        >
          — the end —
        </span>
      </div>

      {/* Override ProseMirror scroll within the postcard */}
      <style jsx global>{`
        .postcard-front .ProseMirror {
          overflow: hidden !important;
          max-height: 100% !important;
        }
      `}</style>
    </div>
  )
}
