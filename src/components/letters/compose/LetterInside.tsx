'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { format } from 'date-fns'
import type { LetterRecipient } from '../letterTypes'

interface Props {
  recipient: LetterRecipient
  recipientName: string
  signatureName: string
  body: string
  onBodyChange: (html: string) => void
  onBack: () => void
  onSeal: () => void
  canSeal: boolean
  sealing: boolean
  createdAt: Date
}

export default function LetterInside(p: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'i wanted to tell you something…' }),
    ],
    content: p.body,
    onUpdate: ({ editor }) => p.onBodyChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'body prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  return (
    <div className="face back">
      <div className="topline">
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.32em', fontSize: 11, fontStyle: 'normal' }}>
          a letter
        </span>
        <span>{format(p.createdAt, "EEEE, MMM d · 'evening'")}</span>
      </div>

      <div className="salutation">
        Dear{' '}
        <span style={{ textDecoration: 'underline dotted' }}>
          {p.recipient === 'future_me' ? 'future me' : p.recipientName}
        </span>
        ,
      </div>

      <EditorContent editor={editor} />

      <div className="signature">
        yours,{' '}
        <span style={{ textDecoration: 'underline dotted' }}>{p.signatureName}</span>
      </div>

      <div className="actions">
        <button className="btn-ghost" onClick={p.onBack}>← back to envelope</button>
        <button
          className="btn-primary"
          onClick={p.onSeal}
          disabled={!p.canSeal}
        >
          {p.sealing ? 'sealing…' : 'fold & seal ✦'}
        </button>
      </div>
    </div>
  )
}
