'use client'

import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import { ThemeName } from '@/lib/themes'
import Editor from '@/components/Editor'

export type Recipient = 'self' | 'friend'

// Postcard body cap. Large enough for a postcard's worth of writing, small enough to keep the
// page from needing a scrollbar at our standard size.
const POSTCARD_MAX_CHARS = 500
// Number of characters before the cap at which the gentle "running out of room" fade begins.
const POSTCARD_FADE_START = 50

const themeStamps: Record<ThemeName, { icon: string }> = {
  rivendell: { icon: '🌲' },
  hearth: { icon: '🔥' },
  paperSun: { icon: '☀️' },
  rose: { icon: '🌸' },
  sage: { icon: '🌿' },
  ocean: { icon: '🌊' },
  saffron: { icon: '🌼' },
  garden: { icon: '🌷' },
  postal: { icon: '✉️' },
  linen: { icon: '🕊️' },
  midnight: { icon: '✨' },
}

interface PostcardFrontProps {
  letterText: string
  onTextChange: (html: string) => void
  recipient: Recipient
  onRecipientChange: (r: Recipient) => void
  /** Friend's name, used to render "Dear Sarah," when present. */
  friendName?: string
}

export default function PostcardFront({
  letterText,
  onTextChange,
  recipient,
  onRecipientChange,
  friendName,
}: PostcardFrontProps) {
  const { theme, themeName } = useThemeStore()
  const colors = getGlassDiaryColors(theme)
  const stamp = themeStamps[themeName] || themeStamps.rivendell
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [charCount, setCharCount] = useState(0)

  // Compute the body fade. Stays at 1.0 until the user crosses (cap - fade-start), then drops
  // linearly toward 0.6 as they fill the remaining room. The hard cap on the editor itself
  // prevents going beyond it.
  const charsRemaining = Math.max(0, POSTCARD_MAX_CHARS - charCount)
  const fadeProgress = Math.min(1, Math.max(0, (POSTCARD_FADE_START - charsRemaining) / POSTCARD_FADE_START))
  const bodyOpacity = 1 - 0.4 * fadeProgress
  const showRemaining = charsRemaining <= POSTCARD_FADE_START

  // Click-outside to close the recipient picker.
  useEffect(() => {
    if (!pickerOpen) return
    const onDoc = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [pickerOpen])

  const recipientLabel =
    recipient === 'friend'
      ? (friendName?.trim() || 'a friend')
      : 'future me'

  return (
    <div
      className="postcard-front w-full h-full relative flex flex-col"
      style={{
        // Mirror .diary-page: blend the solid theme tint against transparent
        // by the user-controlled opacity %, so the gear's opacity slider
        // makes the postcard see-through just like the journal pages.
        background: `color-mix(in srgb, ${colors.pageBgSolid} var(--diary-page-opacity, 95%), transparent)`,
        backdropFilter: `blur(${colors.pageBlur})`,
        fontFamily: "var(--font-caveat), 'Caveat', cursive",
      }}
    >
      {/* Subtle accent stripe in place of the airmail bar */}
      <div
        className="h-2 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accent.warm}55, transparent)`,
        }}
      />

      {/* POST CARD header */}
      <div className="text-center py-2 shrink-0">
        <span
          className="text-lg tracking-[0.3em] font-semibold"
          style={{ color: colors.sectionLabel, fontFamily: "'Georgia', serif" }}
        >
          POST CARD
        </span>
      </div>

      {/* Full-width writing area */}
      <div className="flex-1 relative px-6 pb-0 min-h-0 overflow-hidden">
        {/* Ruled lines — 40px intervals to match ProseMirror line-height. The Y offset is
            tuned so each rule sits at the body text's baseline (the bottom of the lowercase
            x-height + descender area for 20px Caveat at 40px line-height). */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent, transparent 39px, ${colors.ruledLine} 39px, ${colors.ruledLine} 40px)`,
            backgroundPosition: '0 33px',
          }}
        />

        {/* Stamp watermark */}
        <div className="absolute top-2 right-4 z-20 opacity-40 pointer-events-none">
          <div
            className="w-16 h-20 border-2 flex flex-col items-center justify-center"
            style={{
              borderColor: theme.accent.warm,
              borderStyle: 'dashed',
            }}
          >
            <span className="text-xl">{stamp.icon}</span>
            <span
              className="text-[9px] mt-1 tracking-wider"
              style={{ color: theme.accent.warm, fontFamily: "'Georgia', serif" }}
            >
              HEARTH
            </span>
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Greeting line with inline recipient picker. The picker reads as
              part of the handwriting, with a dashed underline as a fill-in
              affordance. Click → small popover with the two recipient
              options. Stranger lands here in a future PR. */}
          <div
            className="shrink-0 flex items-baseline gap-1 pt-3 pb-2"
            style={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
              fontSize: '24px',
              color: colors.bodyText,
              lineHeight: '40px',
            }}
          >
            <span>Dear&nbsp;</span>
            <div ref={pickerRef} className="relative inline-block">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="inline-flex items-baseline gap-1 px-1 outline-none"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px dashed ${colors.sectionLabel}`,
                  color: colors.bodyText,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span>{recipientLabel}</span>
                <span style={{ fontSize: '14px', opacity: 0.6 }}>▾</span>
              </button>
              {pickerOpen && (
                <div
                  className="absolute top-full left-0 mt-1 z-30 rounded-lg overflow-hidden"
                  style={{
                    background: theme.glass.bg,
                    backdropFilter: `blur(${theme.glass.blur})`,
                    border: `1px solid ${theme.glass.border}`,
                    minWidth: '160px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                  }}
                >
                  {([
                    { value: 'self' as Recipient, label: 'Future Me' },
                    { value: 'friend' as Recipient, label: 'A Friend' },
                  ]).map((opt) => {
                    const selected = recipient === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onRecipientChange(opt.value)
                          setPickerOpen(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm"
                        style={{
                          background: selected ? `${theme.accent.warm}25` : 'transparent',
                          color: theme.text.primary,
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                  <div
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider"
                    style={{
                      color: theme.text.muted,
                      borderTop: `1px solid ${theme.glass.border}`,
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    A stranger — coming soon
                  </div>
                </div>
              )}
            </div>
            <span>,</span>
          </div>

          {/* Editor body */}
          <div
            className="flex-1 min-h-0 overflow-hidden"
            style={{
              opacity: bodyOpacity,
              transition: 'opacity 200ms ease-out',
            }}
          >
            <Editor
              prompt="..."
              value={letterText}
              onChange={onTextChange}
              bare
              flexible
              noScroll
              maxChars={POSTCARD_MAX_CHARS}
              onCharCountChange={setCharCount}
              customStyles={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontSize: '20px',
                color: colors.bodyText,
                lineHeight: '40px',
                background: 'transparent',
              }}
            />
          </div>
        </div>

        {/* Remaining-characters whisper. Only fades in once the user is in the last stretch,
            so the rest of the writing experience stays free of UI chrome. */}
        <div
          aria-live="polite"
          className="absolute bottom-1 right-3 z-20 pointer-events-none text-[11px] tracking-wider"
          style={{
            color: colors.prompt,
            fontFamily: "'Georgia', serif",
            opacity: showRemaining ? 0.7 : 0,
            transition: 'opacity 220ms ease-out',
          }}
        >
          {charsRemaining} left
        </div>
      </div>

      {/* end marker */}
      <div className="shrink-0 text-center pb-3 pt-1">
        <span
          className="text-xs tracking-[0.2em]"
          style={{ color: colors.prompt, fontFamily: "'Georgia', serif" }}
        >
          — the end —
        </span>
      </div>

      <style jsx global>{`
        .postcard-front .ProseMirror {
          overflow: hidden !important;
          max-height: 100% !important;
        }
      `}</style>
    </div>
  )
}
