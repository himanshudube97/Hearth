'use client'

import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import CollagePhoto from '@/components/CollagePhoto'
import SongEmbed from '@/components/SongEmbed'
import DoodleCanvas from '@/components/DoodleCanvas'
import SomedayDatePicker from './SomedayDatePicker'
import { format } from 'date-fns'
import type { StrokeData } from '@/store/journal'
import type { LetterRecipient, UnlockChoice } from '../letterTypes'

const CHAR_LIMIT = 800

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  recipient: LetterRecipient
  closeName: string
  body: string
  onBodyChange: (html: string) => void
  unlock: UnlockChoice
  onUnlockChange: (u: UnlockChoice) => void
  photos: [string | null, string | null]
  onPhotosChange: (photos: [string | null, string | null]) => void
  song: string | null
  onSongChange: (s: string | null) => void
  doodleStrokes: StrokeData[]
  onDoodleChange: (strokes: StrokeData[]) => void
  onBack: () => void
  onSeal: () => void
  canSeal: boolean
  sealing: boolean
}

const UNLOCK_PILLS: { label: string; kind: string }[] = [
  { label: '1 week',  kind: '1_week' },
  { label: '14 days', kind: '14_days' },
  { label: '1 month', kind: '1_month' },
  { label: 'someday', kind: 'someday' },
]

function unlockPillLabel(unlock: UnlockChoice): string {
  if (unlock.kind === 'someday' && unlock.date) {
    return format(unlock.date, 'MMM d, yyyy')
  }
  return 'someday'
}

export default function PostcardBack(p: Props) {
  const [songInput, setSongInput] = useState(p.song ?? '')
  const [songConfirmed, setSongConfirmed] = useState<string | null>(p.song)
  const [showDatePicker, setShowDatePicker] = useState(p.unlock.kind === 'someday')
  const somedayPillRef = useRef<HTMLButtonElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder: 'i wanted to tell you something…' }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
    ],
    content: p.body,
    onUpdate: ({ editor }) => p.onBodyChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'letter-body-editor focus:outline-none',
        style: [
          'font-family: Caveat, cursive',
          'font-size: 19px',
          'line-height: 36px',
          'color: var(--text-primary, #3a2025)',
          'overflow: hidden',
          'min-height: 0',
          'height: 100%',
          'max-height: 100%',
        ].join(';'),
      },
    },
  })

  const charCount = editor?.storage?.characterCount?.characters?.() ?? 0

  const handleSongSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = songInput.trim()
    if (trimmed) {
      setSongConfirmed(trimmed)
      p.onSongChange(trimmed)
    }
  }

  const handleSongClear = () => {
    setSongInput('')
    setSongConfirmed(null)
    p.onSongChange(null)
  }

  function handlePillClick(kind: string) {
    if (kind === 'someday') {
      setShowDatePicker(true)
      if (p.unlock.kind !== 'someday') {
        p.onUnlockChange({ kind: 'someday', date: null })
      }
    } else {
      setShowDatePicker(false)
      p.onUnlockChange({ kind: kind as '1_week' | '14_days' | '1_month' })
    }
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 28px 20px',
          height: '100%',
          boxSizing: 'border-box',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          position: 'absolute',
          inset: 0,
          transform: 'rotateY(180deg)',
          background: `
            repeating-linear-gradient(
              transparent, transparent 36px,
              rgba(120, 90, 50, 0.09) 36px, rgba(120, 90, 50, 0.09) 37px
            ),
            linear-gradient(160deg, var(--paper-1, #fff6f2) 0%, var(--paper-2, #fbe6dd) 100%)
          `,
          borderRadius: 8,
          border: '1px solid rgba(80, 55, 40, 0.16)',
          boxShadow: '0 20px 56px rgba(0,0,0,0.40), 0 4px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.55)',
          overflow: 'hidden',
        }}
      >
        {/* Two-column content area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* LEFT: writing column — no salutation, just lined editor */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRight: '1px solid rgba(120, 90, 50, 0.10)',
              paddingRight: 20,
            }}
          >
            {/* Editor on lined paper — overflow hidden, no scroll */}
            <div
              onClick={() => editor?.commands.focus()}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'text',
              }}
            >
              <EditorContent
                editor={editor}
                style={{
                  height: '100%',
                  overflow: 'hidden',
                }}
              />
            </div>

            {/* Character counter */}
            <div
              style={{
                flexShrink: 0,
                textAlign: 'right',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontStyle: 'italic',
                fontSize: 11,
                color: charCount >= CHAR_LIMIT
                  ? 'var(--accent-primary, #9a4555)'
                  : 'rgba(120, 90, 50, 0.45)',
                marginTop: 4,
              }}
            >
              {charCount}/{CHAR_LIMIT}
            </div>
          </div>

          {/* RIGHT: attachments column — CollagePhoto + SongEmbed + inline DoodleCanvas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflow: 'hidden',
            }}
          >
            {/* Photo slots — using CollagePhoto directly, 2 side by side */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 10,
                  letterSpacing: 2,
                  color: 'rgba(120, 90, 50, 0.5)',
                  textTransform: 'lowercase',
                  marginBottom: 6,
                }}
              >
                photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Wrap each CollagePhoto in a relative container so its absolute
                    positioning is anchored within the slot rather than the page */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/5',
                    overflow: 'hidden',
                    borderRadius: 6,
                    border: p.photos[0] ? 'none' : '1.5px dashed rgba(120, 90, 50, 0.28)',
                  }}
                >
                  <CollagePhoto
                    position="top-right"
                    photo={p.photos[0]}
                    onPhotoChange={url => p.onPhotosChange([url, p.photos[1]])}
                  />
                </div>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/5',
                    overflow: 'hidden',
                    borderRadius: 6,
                    border: p.photos[1] ? 'none' : '1.5px dashed rgba(120, 90, 50, 0.28)',
                  }}
                >
                  <CollagePhoto
                    position="bottom-left"
                    photo={p.photos[1]}
                    onPhotoChange={url => p.onPhotosChange([p.photos[0], url])}
                  />
                </div>
              </div>
            </div>

            {/* Song — using SongEmbed with full controls (not compact) */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 10,
                  letterSpacing: 2,
                  color: 'rgba(120, 90, 50, 0.5)',
                  textTransform: 'lowercase',
                  marginBottom: 6,
                }}
              >
                music
              </div>
              {songConfirmed ? (
                <div>
                  {/* Full SongEmbed — not compact */}
                  <SongEmbed url={songConfirmed} />
                  <button
                    onClick={handleSongClear}
                    style={{
                      marginTop: 4,
                      background: 'none',
                      border: 'none',
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 11,
                      color: 'rgba(120, 90, 50, 0.5)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSongSubmit} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="url"
                    placeholder="paste a song URL…"
                    value={songInput}
                    onChange={e => setSongInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(120, 90, 50, 0.06)',
                      border: '1px solid rgba(120, 90, 50, 0.22)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 12,
                      color: 'var(--text-primary, #3a2025)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--accent-primary, #9a4555)',
                      background: 'transparent',
                      color: 'var(--accent-primary, #9a4555)',
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    add
                  </button>
                </form>
              )}
            </div>

            {/* Doodle — inline DoodleCanvas, always visible on the card */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 10,
                  letterSpacing: 2,
                  color: 'rgba(120, 90, 50, 0.5)',
                  textTransform: 'lowercase',
                  marginBottom: 6,
                  flexShrink: 0,
                }}
              >
                doodle
              </div>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <DoodleCanvas
                  inline
                  initialStrokes={p.doodleStrokes}
                  onSave={(strokes) => p.onDoodleChange(strokes)}
                  onClose={() => {}}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: opens when + pills */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(120, 90, 50, 0.10)',
            paddingTop: 12,
            marginTop: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontStyle: 'italic',
                fontSize: 11,
                letterSpacing: 2,
                color: 'rgba(120, 90, 50, 0.5)',
                textTransform: 'lowercase',
                flexShrink: 0,
              }}
            >
              opens · when
            </span>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
              {UNLOCK_PILLS.map(({ label, kind }) => {
                const isActive = p.unlock.kind === kind
                const displayLabel = (kind === 'someday' && isActive)
                  ? unlockPillLabel(p.unlock)
                  : label

                return (
                  <button
                    key={kind}
                    ref={kind === 'someday' ? somedayPillRef : undefined}
                    onClick={() => handlePillClick(kind)}
                    style={{
                      padding: '5px 13px 6px',
                      borderRadius: 999,
                      border: '1.5px solid var(--accent-primary, #9a4555)',
                      background: isActive ? 'var(--accent-primary, #9a4555)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--accent-primary, #9a4555)',
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 12,
                      letterSpacing: 0.5,
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {displayLabel}
                  </button>
                )
              })}

              {/* Someday date picker popover */}
              {showDatePicker && p.unlock.kind === 'someday' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    right: 0,
                    zIndex: 50,
                  }}
                >
                  <SomedayDatePicker
                    selectedDate={p.unlock.date}
                    onSelect={(date) => {
                      p.onUnlockChange({ kind: 'someday', date })
                      setShowDatePicker(false)
                    }}
                    onClose={() => {
                      setShowDatePicker(false)
                      // If no date selected, revert to 1_week
                      if (p.unlock.kind !== 'someday' || !p.unlock.date) {
                        p.onUnlockChange({ kind: '1_week' })
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            marginTop: 8,
          }}
        >
          <button
            onClick={p.onBack}
            style={{
              padding: '7px 18px',
              borderRadius: 999,
              border: '1.5px solid rgba(120, 90, 50, 0.3)',
              background: 'transparent',
              color: 'var(--text-secondary, #6a4048)',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 13,
              letterSpacing: 0.4,
              cursor: 'pointer',
            }}
          >
            ← back
          </button>
          <button
            onClick={p.onSeal}
            disabled={!p.canSeal}
            style={{
              padding: '7px 22px 8px',
              borderRadius: 999,
              border: 'none',
              background: p.canSeal ? 'var(--accent-primary, #9a4555)' : 'rgba(120, 90, 50, 0.25)',
              color: p.canSeal ? '#fff' : 'rgba(120, 90, 50, 0.45)',
              fontFamily: 'Caveat, cursive',
              fontSize: 19,
              cursor: p.canSeal ? 'pointer' : 'not-allowed',
              boxShadow: p.canSeal ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
              letterSpacing: 0.2,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {p.sealing ? 'sealing…' : 'fold & seal ✦'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .letter-body-editor .ProseMirror {
          outline: none;
          height: 100%;
          overflow: hidden;
          font-family: Caveat, cursive;
          font-size: 19px;
          line-height: 36px;
          color: var(--text-primary, #3a2025);
        }
        .letter-body-editor .ProseMirror p {
          margin: 0;
        }
        .letter-body-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(120, 90, 50, 0.38);
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </>
  )
}
