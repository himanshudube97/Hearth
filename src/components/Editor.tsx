'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { useJournalStore } from '@/store/journal'

interface EditorProps {
  prompt: string
}

export default function Editor({ prompt }: EditorProps) {
  const { currentText, setCurrentText } = useJournalStore()
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
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px]',
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

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <div
        className="overflow-y-auto"
        style={{
          maxHeight: '400px',
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            fontFamily: 'Georgia, Palatino, serif',
            fontSize: '16px',
            lineHeight: 2,
            color: theme.text.primary,
          }}
        />
      </div>
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
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 600;
          color: ${theme.text.primary};
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          color: ${theme.text.primary};
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
