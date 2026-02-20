'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { useJournalStore } from '@/store/journal'

interface EditorProps {
  prompt: string
  value?: string
  onChange?: (value: string) => void
}

export default function Editor({ prompt, value, onChange }: EditorProps) {
  // Use controlled mode if value/onChange provided, otherwise use global store
  const { currentText: storeText, setCurrentText: setStoreText } = useJournalStore()
  const currentText = value !== undefined ? value : storeText
  const setCurrentText = onChange || setStoreText
  const { theme } = useThemeStore()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: prompt || 'Write freely...',
      }),
    ],
    content: currentText,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setCurrentText(editor.getHTML())
    },
  })

  // Update placeholder when prompt changes
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions
        .filter((ext) => ext.name === 'placeholder')
        .forEach((ext) => {
          (ext.options as { placeholder: string }).placeholder = prompt
          editor.view.dispatch(editor.state.tr)
        })
    }
  }, [editor, prompt])

  // Sync editor content when currentText changes externally (reset or edit load)
  useEffect(() => {
    if (editor && currentText !== editor.getHTML()) {
      if (currentText === '' || currentText === '<p></p>') {
        editor.commands.clearContent()
      } else {
        // Load content for editing
        editor.commands.setContent(currentText)
      }
    }
  }, [editor, currentText])

  // Line height in pixels — must match EditorContent lineHeight (20px font * 2 = 40px)
  const lineHeight = 40

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
        boxShadow: `
          0 4px 24px -4px rgba(0, 0, 0, 0.3),
          inset 2px 0 8px -4px rgba(0, 0, 0, 0.2)
        `,
      }}
    >
      {/* Date header */}
      <div
        className="text-right pt-3 pr-6"
        style={{
          fontFamily: 'var(--font-caveat), cursive',
          fontSize: '16px',
          color: theme.text.muted,
          letterSpacing: '0.5px',
        }}
      >
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      {/* Notebook spine/binding effect */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3"
        style={{
          background: `linear-gradient(to right,
            ${theme.accent.warm}15 0%,
            ${theme.accent.warm}08 50%,
            transparent 100%
          )`,
          borderRight: `1px solid ${theme.accent.warm}20`,
        }}
      />

      {/* Left margin line (classic red/warm line) — full height */}
      <div
        className="absolute top-0 bottom-0 w-px"
        style={{
          left: '48px',
          background: `${theme.accent.warm}40`,
          zIndex: 1,
        }}
      />

      {/* Main content area */}
      <div className="relative">

        {/* Ruled lines background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            left: '48px',
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent ${lineHeight - 1}px,
              ${theme.text.muted}15 ${lineHeight - 1}px,
              ${theme.text.muted}15 ${lineHeight}px
            )`,
            backgroundPosition: '0 24px',
          }}
        />

        {/* Editor wrapper with padding for margin */}
        <div
          className="overflow-y-auto relative"
          style={{
            height: '60vh',
            paddingLeft: '56px',
            paddingRight: '24px',
            paddingTop: '24px',
            paddingBottom: '24px',
          }}
        >
          <EditorContent
            editor={editor}
            style={{
              fontFamily: 'var(--font-caveat), cursive',
              fontSize: '20px',
              lineHeight: 2,
              color: theme.text.primary,
            }}
          />
        </div>
      </div>

      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${theme.text.muted};
          font-style: italic;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror .ProseMirror-cursor,
        .ProseMirror > .ProseMirror-separator + .ProseMirror-trailingBreak {
          transform: rotate(8deg);
        }
        .ProseMirror {
          caret-color: ${theme.accent.warm};
        }
        .ProseMirror p {
          margin-bottom: 0;
          padding-bottom: 0;
          line-height: 40px;
        }
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 600;
          color: ${theme.text.primary};
          line-height: 2;
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          color: ${theme.text.primary};
          line-height: 2;
        }
        .ProseMirror blockquote {
          border-left: 3px solid ${theme.accent.primary};
          padding-left: 1em;
          margin-left: 0;
          color: ${theme.text.secondary};
          font-style: italic;
        }
        .ProseMirror strong {
          color: ${theme.accent.warm};
        }
        .ProseMirror em {
          color: ${theme.text.secondary};
        }
      `}</style>
    </div>
  )
}
