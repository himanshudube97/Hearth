'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGreeting, getRandomWhisper } from '@/lib/themes'
import { useThemeStore } from '@/store/theme'
import { useJournalStore } from '@/store/journal'
import { useProfileStore } from '@/store/profile'
import { useE2EE } from '@/hooks/useE2EE'
import { useSearchParams } from 'next/navigation'
import { useEntry } from '@/hooks/useEntries'
import MoodPicker from '@/components/MoodPicker'
import ExcalidrawCanvas from '@/components/ExcalidrawCanvas'

const FREEHAND_DRAFT_KEY = 'hearth_freehand_draft'

function extractCanvasPreview(elements: any[]): string {
  const textEls = elements.filter(
    (el: any) => el.type === 'text' && !el.isDeleted
  )
  const joined = textEls
    .map((el: any) => el.text)
    .join(' ')
    .trim()
  if (joined.length > 0) return joined.slice(0, 150)
  return '[Freehand canvas]'
}

export default function FreehandPage() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [greeting, setGreeting] = useState('')
  const [whisper, setWhisper] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const [draftData, setDraftData] = useState<any>(null)
  const [hasContent, setHasContent] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const { theme } = useThemeStore()
  const { currentMood, currentSong, setCurrentSong, resetCurrentEntry } =
    useJournalStore()
  const { profile, fetchProfile } = useProfileStore()
  const { encryptEntryData } = useE2EE()

  // Edit mode: ?edit=ENTRY_ID
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { entry: editEntry } = useEntry(editId)

  useEffect(() => {
    setGreeting(getGreeting())
    setWhisper(getRandomWhisper())
    fetchProfile()

    // Check for draft
    try {
      const draft = localStorage.getItem(FREEHAND_DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed?.elements?.length > 0) {
          setHasDraft(true)
          setDraftData(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [fetchProfile])

  // Load edit data into canvas when editEntry arrives
  useEffect(() => {
    if (editEntry?.canvasData && excalidrawAPI) {
      try {
        const data = JSON.parse(editEntry.canvasData)
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: data.appState,
        })
        if (data.files) {
          excalidrawAPI.addFiles(
            Object.values(data.files)
          )
        }
      } catch (e) {
        console.error('Failed to load canvas data:', e)
      }
    }
  }, [editEntry, excalidrawAPI])

  const nickname = profile.nickname
  const personalizedGreeting = nickname
    ? `${greeting}, ${nickname}`
    : greeting

  // Debounced auto-save to localStorage
  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        try {
          const draft = JSON.stringify({
            elements: [...elements],
            appState: {
              viewBackgroundColor:
                appState.viewBackgroundColor,
            },
            files,
          })
          localStorage.setItem(FREEHAND_DRAFT_KEY, draft)
        } catch { /* ignore quota errors */ }
      }, 1000)
    },
    []
  )

  const handleSave = async () => {
    if (!excalidrawAPI) return

    const elements = excalidrawAPI.getSceneElements()
    if (elements.length === 0) return

    setSaving(true)
    try {
      const appState = excalidrawAPI.getAppState()
      const files = excalidrawAPI.getFiles()

      // Filter files to only referenced ones
      const referencedFileIds = new Set(
        elements
          .filter((el: any) => el.type === 'image' && el.fileId)
          .map((el: any) => el.fileId)
      )
      const filteredFiles: Record<string, any> = {}
      for (const [id, file] of Object.entries(files)) {
        if (referencedFileIds.has(id))
          filteredFiles[id] = file
      }

      const canvasData = JSON.stringify({
        elements,
        appState: {
          viewBackgroundColor:
            appState.viewBackgroundColor,
        },
        files: filteredFiles,
      })

      const textPreview = extractCanvasPreview(elements)

      const entryData = {
        text: textPreview,
        canvasData,
        mood: currentMood,
        song: currentSong || null,
        entryType: 'canvas' as const,
      }

      const finalData = await encryptEntryData(entryData)

      const isEditing = !!editId
      const url = isEditing
        ? `/api/entries/${editId}`
        : '/api/entries'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      if (res.ok) {
        const messages = [
          'Your canvas is safe now',
          'Creativity preserved',
          'Drawn from the heart',
          'Saved, like a warm memory',
          'Your art found its home',
          'Held close, just for you',
          'A moment, captured',
        ]
        setSaveMessage(
          messages[Math.floor(Math.random() * messages.length)]
        )
        setSaved(true)
        localStorage.removeItem(FREEHAND_DRAFT_KEY)
        setHasDraft(false)
        resetCurrentEntry()
        if (!isEditing) excalidrawAPI.resetScene()
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        alert(`Failed to save: ${data.details || data.error}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert(`Error: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      const nonDeleted = elements.filter((el: any) => !el.isDeleted)
      setHasContent(nonDeleted.length > 0)
      handleCanvasChange(elements, appState, files)
    },
    [handleCanvasChange]
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-4"
      >
        <h1
          className="text-2xl font-light tracking-wide"
          style={{ color: theme.text.primary }}
        >
          {personalizedGreeting}
        </h1>
      </motion.div>

      {/* Whisper */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center text-sm italic mb-6"
        style={{ color: theme.text.muted }}
      >
        &ldquo;{whisper}&rdquo;
      </motion.p>

      {/* Mood Picker + Draft indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="flex items-center justify-between mb-4"
      >
        <MoodPicker />
        {hasDraft && !editId && (
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: `${theme.accent.warm}20`,
              color: theme.accent.warm,
            }}
          >
            Draft restored
          </span>
        )}
      </motion.div>

      {/* Canvas Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{
          height: '65vh',
          minHeight: '400px',
          maxHeight: '700px',
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
        }}
      >
        <ExcalidrawCanvas
          initialData={draftData || undefined}
          onApiReady={setExcalidrawAPI}
          onChange={handleChange}
        />
      </motion.div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-4">
        <input
          type="text"
          placeholder="paste a song link..."
          value={currentSong}
          onChange={(e) => setCurrentSong(e.target.value)}
          className="flex-1 mr-4 px-4 py-2 rounded-full text-sm bg-transparent outline-none"
          style={{
            border: `1px solid ${theme.glass.border}`,
            color: theme.text.primary,
          }}
        />

        <AnimatePresence>
          {hasContent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-full text-sm font-medium"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving
                ? 'Saving...'
                : editId
                  ? 'Update Canvas'
                  : 'Save Canvas'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Save Confirmation Overlay */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: `${theme.bg.primary}90` }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-full"
              style={{
                width: 300,
                height: 300,
                background: `radial-gradient(circle, ${theme.accent.warm}, transparent)`,
              }}
            />
            <div className="relative flex flex-col items-center gap-5">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `${theme.accent.primary}25`,
                  border: `2px solid ${theme.accent.primary}60`,
                }}
              >
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.accent.primary}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg font-light tracking-wide text-center"
                style={{ color: theme.text.primary }}
              >
                {saveMessage}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
