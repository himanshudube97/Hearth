# Write Page Templates + Photo Collage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 3 switchable writing templates (Cozy Journal, Clean Minimal, Scrapbook) to `/write` with a photo collage feature in the Scrapbook template.

**Architecture:** `WritePage` keeps shared logic (save, mood, song, doodles). A Zustand store persists the selected template. Three template components wrap the Editor with different visual treatments. The Scrapbook template places a PhotoBlock beside the editor.

**Tech Stack:** React 19, Zustand (persist), Framer Motion, TipTap, existing PhotoSlot/CameraModal components.

---

### Task 1: Create writeTemplate Zustand store

**Files:**
- Create: `src/store/writeTemplate.ts`

**Step 1: Create the store**

```typescript
// src/store/writeTemplate.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WriteTemplateName = 'cozy' | 'minimal' | 'scrapbook'

interface WriteTemplateStore {
  template: WriteTemplateName
  setTemplate: (t: WriteTemplateName) => void
}

export const useWriteTemplateStore = create<WriteTemplateStore>()(
  persist(
    (set) => ({
      template: 'cozy',
      setTemplate: (template) => set({ template }),
    }),
    {
      name: 'hearth-write-template',
    }
  )
)
```

**Step 2: Verify no lint errors**

Run: `cd /Users/himanshut4d/Documents/Personal_projects/feel_good/heart_original_without_desk && npx tsc --noEmit src/store/writeTemplate.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/store/writeTemplate.ts
git commit -m "feat: add writeTemplate Zustand store"
```

---

### Task 2: Create TemplateSwitcher component

**Files:**
- Create: `src/components/write/TemplateSwitcher.tsx`

**Step 1: Create the component**

Three small icon buttons matching the existing action button style (w-10 h-10 rounded-full, glass bg/border). Icons: notebook (cozy), pen nib (minimal), scissors (scrapbook). Active icon highlighted with `theme.accent.warm`.

```typescript
// src/components/write/TemplateSwitcher.tsx
'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useWriteTemplateStore, WriteTemplateName } from '@/store/writeTemplate'

const templates: { name: WriteTemplateName; icon: string; title: string }[] = [
  { name: 'cozy', icon: '📓', title: 'Cozy Journal' },
  { name: 'minimal', icon: '✦', title: 'Clean Minimal' },
  { name: 'scrapbook', icon: '✂', title: 'Scrapbook' },
]

export default function TemplateSwitcher() {
  const { theme } = useThemeStore()
  const { template, setTemplate } = useWriteTemplateStore()

  return (
    <div className="flex gap-1 ml-2 pl-2" style={{ borderLeft: `1px solid ${theme.glass.border}` }}>
      {templates.map((t) => (
        <motion.button
          key={t.name}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={() => setTemplate(t.name)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{
            background: template === t.name ? `${theme.accent.warm}25` : 'transparent',
            border: template === t.name ? `1px solid ${theme.accent.warm}50` : '1px solid transparent',
            color: template === t.name ? theme.accent.warm : theme.text.muted,
            opacity: template === t.name ? 1 : 0.6,
          }}
          title={t.title}
        >
          {t.icon}
        </motion.button>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/write/TemplateSwitcher.tsx
git commit -m "feat: add TemplateSwitcher component"
```

---

### Task 3: Refactor Editor.tsx into a bare editor + keep current look as CozyTemplate

The current `Editor.tsx` mixes TipTap logic with the notebook visual styling (lines, corners, date, spine). Split it:

- `Editor.tsx` becomes a **bare TipTap wrapper** (just the editor, placeholder styles, no visual frame)
- `CozyTemplate.tsx` wraps Editor with the notebook styling (lines, corners, date, spine)

**Files:**
- Modify: `src/components/Editor.tsx` — strip visual frame, keep TipTap logic + placeholder styles
- Create: `src/components/write/CozyTemplate.tsx` — notebook frame wrapping `<Editor />`

**Step 1: Refactor Editor.tsx**

Strip out: spine (lines 98-109), corners (111-127), date header (129-143), margin line (147-154), ruled lines (156-170), paper texture (195-201). Keep only: TipTap setup, EditorContent, placeholder + prose styles.

The refactored `Editor.tsx` should expose `minHeight` as a prop (default `'200px'`) and accept a `className` on the wrapper for template customization. Remove the outer glass container — each template will provide its own frame.

```typescript
// src/components/Editor.tsx (refactored)
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
  minHeight?: string
  fontFamily?: string
  fontSize?: string
}

export default function Editor({
  prompt,
  value,
  onChange,
  minHeight = '200px',
  fontFamily = 'Georgia, Palatino, serif',
  fontSize = '16px',
}: EditorProps) {
  const { currentText: storeText, setCurrentText: setStoreText } = useJournalStore()
  const currentText = value !== undefined ? value : storeText
  const setCurrentText = onChange || setStoreText
  const { theme } = useThemeStore()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: prompt || 'Write freely...' }),
    ],
    content: currentText,
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none min-h-[${minHeight}]`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      setCurrentText(editor.getHTML())
    },
  })

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

  useEffect(() => {
    if (editor && currentText !== editor.getHTML()) {
      if (currentText === '' || currentText === '<p></p>') {
        editor.commands.clearContent()
      } else {
        editor.commands.setContent(currentText)
      }
    }
  }, [editor, currentText])

  return (
    <>
      <EditorContent
        editor={editor}
        style={{
          fontFamily,
          fontSize,
          lineHeight: 2,
          color: theme.text.primary,
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
        .ProseMirror:focus { outline: none; }
        .ProseMirror p { margin-bottom: 0; padding-bottom: 0; }
        .ProseMirror h1 { font-size: 1.5em; font-weight: 600; color: ${theme.text.primary}; line-height: 2; }
        .ProseMirror h2 { font-size: 1.25em; font-weight: 600; color: ${theme.text.primary}; line-height: 2; }
        .ProseMirror blockquote { border-left: 3px solid ${theme.accent.primary}; padding-left: 1em; margin-left: 0; color: ${theme.text.secondary}; font-style: italic; }
        .ProseMirror strong { color: ${theme.accent.warm}; }
        .ProseMirror em { color: ${theme.text.secondary}; }
      `}</style>
    </>
  )
}
```

**Step 2: Create CozyTemplate.tsx**

This is essentially the old Editor.tsx visual frame (glass bg, spine, corners, date, margin line, ruled lines, paper texture) wrapping the new bare `<Editor />`.

```typescript
// src/components/write/CozyTemplate.tsx
'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import Editor from '@/components/Editor'

interface CozyTemplateProps {
  prompt: string
}

export default function CozyTemplate({ prompt }: CozyTemplateProps) {
  const { theme } = useThemeStore()
  const lineHeight = 32

  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const now = new Date()
    setDateStr(now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }))
  }, [])

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.3), inset 2px 0 8px -4px rgba(0,0,0,0.2)',
      }}
    >
      {/* Notebook spine */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3"
        style={{
          background: `linear-gradient(to right, ${theme.accent.warm}15 0%, ${theme.accent.warm}08 50%, transparent 100%)`,
          borderRight: `1px solid ${theme.accent.warm}20`,
        }}
      />

      {/* Corner designs */}
      <svg className="absolute top-2 left-2 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" style={{ opacity: 0.3 }}>
        <path d="M0 8 Q0 0 8 0" fill="none" stroke={theme.accent.warm} strokeWidth="1.5" />
        <path d="M0 12 Q0 0 12 0" fill="none" stroke={theme.accent.warm} strokeWidth="0.8" />
      </svg>
      <svg className="absolute top-2 right-2 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" style={{ opacity: 0.3 }}>
        <path d="M20 8 Q20 0 12 0" fill="none" stroke={theme.accent.warm} strokeWidth="1.5" />
        <path d="M20 12 Q20 0 8 0" fill="none" stroke={theme.accent.warm} strokeWidth="0.8" />
      </svg>
      <svg className="absolute bottom-2 left-2 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" style={{ opacity: 0.3 }}>
        <path d="M0 12 Q0 20 8 20" fill="none" stroke={theme.accent.warm} strokeWidth="1.5" />
        <path d="M0 8 Q0 20 12 20" fill="none" stroke={theme.accent.warm} strokeWidth="0.8" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" style={{ opacity: 0.3 }}>
        <path d="M20 12 Q20 20 12 20" fill="none" stroke={theme.accent.warm} strokeWidth="1.5" />
        <path d="M20 8 Q20 20 8 20" fill="none" stroke={theme.accent.warm} strokeWidth="0.8" />
      </svg>

      {/* Date header */}
      {dateStr && (
        <div
          className="text-right pt-3 pr-6 pb-0"
          style={{
            fontFamily: 'Georgia, Palatino, serif',
            fontSize: '13px',
            fontStyle: 'italic',
            color: theme.text.muted,
            letterSpacing: '0.5px',
          }}
        >
          {dateStr}
        </div>
      )}

      {/* Main content area with margin line */}
      <div className="relative">
        {/* Left margin line */}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: '48px', background: `${theme.accent.warm}40` }} />

        {/* Ruled lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            left: '48px',
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${lineHeight - 1}px, ${theme.text.muted}15 ${lineHeight - 1}px, ${theme.text.muted}15 ${lineHeight}px)`,
            backgroundPosition: '0 23px',
          }}
        />

        {/* Editor wrapper */}
        <div
          className="overflow-y-auto relative"
          style={{ maxHeight: '600px', paddingLeft: '56px', paddingRight: '24px', paddingTop: '24px', paddingBottom: '24px' }}
        >
          <Editor prompt={prompt} minHeight="600px" />
        </div>
      </div>

      {/* Paper texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
```

**Step 3: Verify the app still works**

Run: `docker compose restart app` and check `/write` in browser — should look identical to before.

**Step 4: Commit**

```bash
git add src/components/Editor.tsx src/components/write/CozyTemplate.tsx
git commit -m "refactor: extract Editor into bare wrapper + CozyTemplate"
```

---

### Task 4: Create MinimalTemplate

**Files:**
- Create: `src/components/write/MinimalTemplate.tsx`

**Step 1: Create the component**

Clean, distraction-free. No lines, no corners, no spine. Thin border, large serif font, generous padding, date top-left.

```typescript
// src/components/write/MinimalTemplate.tsx
'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import Editor from '@/components/Editor'

interface MinimalTemplateProps {
  prompt: string
}

export default function MinimalTemplate({ prompt }: MinimalTemplateProps) {
  const { theme } = useThemeStore()

  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const now = new Date()
    setDateStr(now.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }))
  }, [])

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `${theme.glass.bg}`,
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      {/* Minimal date - top left */}
      {dateStr && (
        <div
          className="px-8 pt-6 pb-0"
          style={{
            fontSize: '12px',
            fontWeight: 300,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: theme.text.muted,
          }}
        >
          {dateStr}
        </div>
      )}

      {/* Editor - generous padding, larger font */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: '600px', padding: '24px 40px 40px 40px' }}
      >
        <Editor
          prompt={prompt}
          minHeight="500px"
          fontFamily="'Lora', Georgia, serif"
          fontSize="18px"
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/write/MinimalTemplate.tsx
git commit -m "feat: add MinimalTemplate for clean writing mode"
```

---

### Task 5: Create ScrapbookTemplate with photo collage

**Files:**
- Create: `src/components/write/ScrapbookTemplate.tsx`

**Step 1: Create the component**

Side-by-side layout: editor (~60%) on left, photo collage (~40%) on right. Uses existing `PhotoSlot` for 2 polaroid positions. Tape decoration SVGs on photos. Stacks on mobile.

```typescript
// src/components/write/ScrapbookTemplate.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import Editor from '@/components/Editor'
import PhotoSlot from '@/components/desk/PhotoSlot'
import CameraModal from '@/components/desk/CameraModal'

interface Photo {
  url: string
  rotation: number
  position: 1 | 2
  spread: number
}

interface ScrapbookTemplateProps {
  prompt: string
  photos: Photo[]
  onPhotoAdd: (position: 1 | 2, dataUrl: string) => void
}

export default function ScrapbookTemplate({ prompt, photos, onPhotoAdd }: ScrapbookTemplateProps) {
  const { theme } = useThemeStore()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraPosition, setCameraPosition] = useState<1 | 2>(1)

  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const now = new Date()
    setDateStr(now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    }))
  }, [])

  const photo1 = photos.find(p => p.position === 1) ?? null
  const photo2 = photos.find(p => p.position === 2) ?? null

  const handleFileAdd = useCallback((position: 1 | 2) => {
    return async (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) onPhotoAdd(position, dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }, [onPhotoAdd])

  const handleCameraOpen = useCallback((position: 1 | 2) => {
    return () => {
      setCameraPosition(position)
      setCameraOpen(true)
    }
  }, [])

  const handleCameraCapture = useCallback((dataUrl: string) => {
    onPhotoAdd(cameraPosition, dataUrl)
  }, [onPhotoAdd, cameraPosition])

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Editor side - 60% */}
        <div
          className="flex-1 md:flex-[3] rounded-2xl overflow-hidden relative"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {/* Date */}
          {dateStr && (
            <div
              className="px-6 pt-4 pb-0"
              style={{
                fontFamily: 'Georgia, Palatino, serif',
                fontSize: '13px',
                fontStyle: 'italic',
                color: theme.text.muted,
              }}
            >
              {dateStr}
            </div>
          )}

          <div
            className="overflow-y-auto"
            style={{ maxHeight: '600px', padding: '16px 24px 24px 24px' }}
          >
            <Editor prompt={prompt} minHeight="500px" />
          </div>
        </div>

        {/* Photo collage side - 40% */}
        <div className="md:flex-[2] flex flex-col gap-3">
          {/* Collage header */}
          <div
            className="text-center text-xs tracking-widest uppercase"
            style={{ color: theme.text.muted, letterSpacing: '2px' }}
          >
            memories
          </div>

          {/* Photo 1 - tilted left */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, rotate: -3 }}
            animate={{ opacity: 1, rotate: -3 }}
            transition={{ delay: 0.2 }}
          >
            {/* Tape decoration */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-16 h-5 rounded-sm"
              style={{
                background: `${theme.accent.warm}30`,
                border: `1px solid ${theme.accent.warm}20`,
                transform: 'translateX(-50%) rotate(2deg)',
              }}
            />
            <PhotoSlot
              photo={photo1}
              position={1}
              spread={1}
              onPhotoAdd={handleFileAdd(1)}
              onCameraCapture={handleCameraOpen(1)}
              disabled={!!photo1}
              className="w-full"
            />
          </motion.div>

          {/* Photo 2 - tilted right */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, rotate: 2 }}
            animate={{ opacity: 1, rotate: 2 }}
            transition={{ delay: 0.3 }}
          >
            {/* Tape decoration */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-16 h-5 rounded-sm"
              style={{
                background: `${theme.accent.warm}30`,
                border: `1px solid ${theme.accent.warm}20`,
                transform: 'translateX(-50%) rotate(-1deg)',
              }}
            />
            <PhotoSlot
              photo={photo2}
              position={2}
              spread={1}
              onPhotoAdd={handleFileAdd(2)}
              onCameraCapture={handleCameraOpen(2)}
              disabled={!!photo2}
              className="w-full"
            />
          </motion.div>
        </div>
      </div>

      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/write/ScrapbookTemplate.tsx
git commit -m "feat: add ScrapbookTemplate with photo collage"
```

---

### Task 6: Wire templates into WritePage

**Files:**
- Modify: `src/app/write/page.tsx`

**Step 1: Add imports and photo state**

At the top of `page.tsx`, add:

```typescript
import { useWriteTemplateStore } from '@/store/writeTemplate'
import TemplateSwitcher from '@/components/write/TemplateSwitcher'
import CozyTemplate from '@/components/write/CozyTemplate'
import MinimalTemplate from '@/components/write/MinimalTemplate'
import ScrapbookTemplate from '@/components/write/ScrapbookTemplate'
```

Inside the component, add photo state and read the template store:

```typescript
const { template } = useWriteTemplateStore()
const [currentPhotos, setCurrentPhotos] = useState<Array<{url: string, rotation: number, position: 1|2, spread: number}>>([])

const handlePhotoAdd = (position: 1 | 2, dataUrl: string) => {
  setCurrentPhotos(prev => {
    // Replace if same position already exists
    const filtered = prev.filter(p => p.position !== position)
    return [...filtered, {
      url: dataUrl,
      rotation: position === 1 ? -8 : 8,
      position,
      spread: 1,
    }]
  })
}
```

**Step 2: Replace the Editor section (lines 281-288)**

Replace:
```tsx
{/* Editor */}
<motion.div ...>
  <Editor prompt={prompt} />
</motion.div>
```

With:
```tsx
{/* Editor - Template Specific */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
  {template === 'cozy' && <CozyTemplate prompt={prompt} />}
  {template === 'minimal' && <MinimalTemplate prompt={prompt} />}
  {template === 'scrapbook' && (
    <ScrapbookTemplate prompt={prompt} photos={currentPhotos} onPhotoAdd={handlePhotoAdd} />
  )}
</motion.div>
```

**Step 3: Add TemplateSwitcher to action buttons (line 328, after the song button)**

Insert after the closing `</motion.button>` of the song button (line 328), still inside the `<div className="flex gap-2">`:

```tsx
          <TemplateSwitcher />
```

**Step 4: Add photos to save payload**

In `handleSaveEntry`, modify the `entryData` object (line 102-109) to include photos:

```typescript
const entryData = {
  text: currentText,
  mood: currentMood,
  song: currentSong || null,
  doodles: currentDoodleStrokes.length > 0
    ? [{ strokes: currentDoodleStrokes, positionInEntry: 0 }]
    : [],
  photos: currentPhotos.length > 0 ? currentPhotos : [],
}
```

And after a successful save (inside the `if (res.ok)` block, line 126), clear photos:

```typescript
setCurrentPhotos([])
```

**Step 5: Widen container for scrapbook mode**

Change the outer container (line 205) to use dynamic width:

```tsx
<div className={`mx-auto ${template === 'scrapbook' ? 'max-w-4xl' : 'max-w-[722px]'}`}>
```

This requires importing `template` from the store (already done in Step 1).

**Step 6: Verify the app works**

Run: `docker compose restart app` and test:
1. Default (cozy) should look identical to current
2. Switch to minimal — clean look, no notebook decorations
3. Switch to scrapbook — side-by-side with photo slots on right
4. Upload a photo in scrapbook mode
5. Save an entry — photos should be included in payload

**Step 7: Commit**

```bash
git add src/app/write/page.tsx
git commit -m "feat: wire templates + photo collage into write page"
```

---

### Task 7: Lint check and final polish

**Files:**
- Possibly modify: any file with lint errors

**Step 1: Run lint**

Run: `cd /Users/himanshut4d/Documents/Personal_projects/feel_good/heart_original_without_desk && npm run lint`

**Step 2: Fix any lint errors**

Address unused imports, missing deps, etc.

**Step 3: Visual polish check**

Open each template in the browser and verify:
- Cozy: notebook lines align, corners visible, date in top-right
- Minimal: clean, no visual artifacts, generous spacing
- Scrapbook: photos beside editor on desktop, stacked on mobile (resize browser)
- Template switcher: active state visible, icons clear

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: lint errors and polish template styles"
```
