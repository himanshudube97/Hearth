'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { LetterRecipient } from './letterTypes'
import TuckedIn from './TuckedIn'
import { StrokeData } from '@/store/journal'

interface Props {
  recipient: LetterRecipient
  closeName: string
  onCloseNameChange: (s: string) => void
  closeEmail: string
  onCloseEmailChange: (s: string) => void
  bodyHtml: string
  onBodyChange: (html: string) => void
  signatureName: string
  photos?: string[]
  doodle?: StrokeData[]
  songUrl?: string | null
  onBack: () => void
  onSeal: () => void
  canSeal: boolean
  createdAt: Date
  sealing?: boolean
}

export default function LetterPaper(props: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'i wanted to tell you something…' }),
    ],
    content: props.bodyHtml,
    onUpdate: ({ editor }) => props.onBodyChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  const [showEmail, setShowEmail] = useState(props.closeEmail.length > 0)

  return (
    <motion.div
      className="
        relative mx-auto w-full max-w-3xl rounded-md bg-[var(--color-paper,#f4ead0)] p-10
        shadow-[0_4px_24px_rgba(70,50,30,0.18)]
      "
      style={{
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 2.1rem, rgba(80,60,40,0.18) 2.1rem, rgba(80,60,40,0.18) calc(2.1rem + 1px))',
        transformPerspective: 1200,
      }}
      animate={
        props.sealing
          ? { scale: 0.92, rotateX: 30, opacity: 0.6 }
          : { scale: 1, rotateX: 0, opacity: 1 }
      }
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
    >
      {/* Top-right stamp */}
      <div className="absolute right-6 top-6 text-right text-xs italic opacity-70">
        <div>{format(props.createdAt, "EEEE, MMM d · 'evening'")}</div>
        <div className="mt-1 inline-block border border-dashed border-[var(--color-accent,#c8742c)] px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent,#c8742c)]">
          hearth
        </div>
      </div>

      {/* Small-caps title */}
      <div className="mb-6 text-xs uppercase tracking-[0.3em] text-[var(--color-accent,#c8742c)]">
        a letter
      </div>

      {/* Salutation */}
      <div
        className="mb-4 text-3xl"
        style={{ fontFamily: 'var(--font-caveat), Caveat, cursive' }}
      >
        {props.recipient === 'future_me' ? (
          <>
            Dear <span className="underline decoration-dotted">future me</span>,
          </>
        ) : (
          <>
            Dear{' '}
            <input
              value={props.closeName}
              onChange={e => props.onCloseNameChange(e.target.value)}
              placeholder="…"
              className="border-b border-dotted border-[rgba(80,60,40,0.5)] bg-transparent text-3xl outline-none"
              style={{ fontFamily: 'var(--font-caveat), Caveat, cursive' }}
              size={Math.max(props.closeName.length, 6)}
            />
            ,
          </>
        )}
      </div>

      {/* Body editor */}
      <EditorContent
        editor={editor}
        style={{
          fontFamily: 'var(--font-caveat), Caveat, cursive',
          fontSize: '20px',
          lineHeight: '2.2rem',
          color: 'rgba(60,40,20,0.9)',
        }}
      />

      {/* Signature */}
      <div
        className="mt-8 text-2xl"
        style={{ fontFamily: 'var(--font-caveat), Caveat, cursive' }}
      >
        yours,{' '}
        <span className="underline decoration-dotted">{props.signatureName}</span>
      </div>

      {/* Optional email input for someone_close */}
      {props.recipient === 'someone_close' && (
        <div className="mt-4 text-xs">
          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="underline opacity-70"
            >
              + send to their email on the unlock date
            </button>
          ) : (
            <input
              type="email"
              value={props.closeEmail}
              onChange={e => props.onCloseEmailChange(e.target.value)}
              placeholder="email@example.com"
              className="rounded border border-[rgba(80,60,40,0.25)] bg-transparent px-2 py-1"
            />
          )}
        </div>
      )}

      {/* Tucked-in strip */}
      <TuckedIn
        photos={props.photos}
        doodle={props.doodle}
        songUrl={props.songUrl}
      />

      {/* Footer */}
      <div className="mt-10 flex items-center justify-between text-xs">
        <div className="italic opacity-60">— the end —</div>
        <div className="flex gap-2">
          <button
            onClick={props.onBack}
            className="rounded-full border border-[rgba(80,60,40,0.25)] px-4 py-2 hover:bg-[rgba(80,60,40,0.06)]"
          >
            ← back
          </button>
          <button
            onClick={props.onSeal}
            disabled={!props.canSeal}
            className="
              rounded-full bg-[var(--color-accent,#c8742c)] px-4 py-2 text-white shadow
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            fold &amp; seal ✦
          </button>
        </div>
      </div>
    </motion.div>
  )
}
